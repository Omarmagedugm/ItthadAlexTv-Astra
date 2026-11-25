import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminApp } from './firebaseAdmin.js';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'mbasic.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'www.fb.watch',
  'fb.com',
  'www.fb.com',
  'l.facebook.com',
]);

const ALLOWED_THUMBNAIL_HOST_SUFFIXES = [
  'fbcdn.net',
  'facebook.com',
  'fbsbx.com',
  'img.youtube.com',
  'i.ytimg.com',
];

const MAX_INPUT_LENGTH = 2048;
const MAX_REDIRECT_HOPS = 5;
const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512 * 1024; // 512 KB
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024; // 4 MB

function extractUrlFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.includes('<iframe') || trimmed.includes('<embed') || trimmed.includes('<video')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1].replace(/&amp;/g, '&').trim();
    }
  }
  return trimmed;
}

function isIpLiteral(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '');
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;
  if (h.includes(':')) return true; // IPv6
  return false;
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.+$/, '');
}

type VideoProvider = 'youtube' | 'facebook';

interface ValidatedVideoUrl {
  url: URL;
  provider: VideoProvider;
}

function validateAllowedVideoUrl(rawUrl: string): ValidatedVideoUrl | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.username !== '' || parsed.password !== '') return null;
  if (parsed.port !== '' && parsed.port !== '80' && parsed.port !== '443') return null;

  const host = normalizeHost(parsed.hostname);
  if (!host || isIpLiteral(host)) return null;

  if (YOUTUBE_HOSTS.has(host)) {
    return { url: parsed, provider: 'youtube' };
  }
  if (FACEBOOK_HOSTS.has(host)) {
    return { url: parsed, provider: 'facebook' };
  }
  return null;
}

function validateThumbnailUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username !== '' || parsed.password !== '') return null;
  if (parsed.port !== '' && parsed.port !== '443') return null;

  const host = normalizeHost(parsed.hostname);
  if (!host || isIpLiteral(host)) return null;

  const isAllowedHost = ALLOWED_THUMBNAIL_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
  if (!isAllowedHost) return null;

  // Exclude generic Facebook static placeholder icons
  const fullLower = parsed.href.toLowerCase();
  if (
    host === 'static.xx.fbcdn.net' ||
    fullLower.includes('/rsrc.php/') ||
    fullLower.includes('fb_icon') ||
    fullLower.includes('facebook_logo')
  ) {
    return null;
  }

  return parsed.href;
}

function extractYouTubeVideoId(url: URL): string | null {
  const host = normalizeHost(url.hostname);
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const seg = url.pathname.split('/').filter(Boolean)[0];
    if (seg && /^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
  }

  const vParam = url.searchParams.get('v');
  if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

  const pathMatch = url.pathname.match(/^\/(?:embed|shorts|live|v|e)\/([a-zA-Z0-9_-]{11})/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  return null;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function resolveBestYouTubeThumbnail(videoId: string): Promise<string> {
  const candidates = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (let i = 0; i < candidates.length - 1; i++) {
    try {
      const res = await fetchWithTimeout(candidates[i], { method: 'HEAD', redirect: 'manual' }, 3500);
      if (res.ok) {
        return candidates[i];
      }
    } catch {
      // Fall through to next resolution
    }
  }

  return candidates[candidates.length - 1];
}

async function readResponseTextCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = maxBytes - total;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        total += remaining;
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // ignore cancel errors
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

async function readResponseBufferCapped(response: Response, maxBytes: number): Promise<Buffer | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

function decodeExtractedUrl(raw: string): string {
  return raw
    .replace(/\\u0025/gi, '%')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u003d/gi, '=')
    .replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/gi, '&')
    .replace(/&#38;/g, '&')
    .trim();
}

function extractFacebookThumbnailFromHtml(html: string): string | null {
  const candidates: string[] = [];

  // 1. Standard meta tags (og:image / twitter:image in either attribute order)
  const metaTagRegex = /<meta\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = metaTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];
    const isOgOrTwitterImage =
      /(?:property|name)\s*=\s*["'](?:og:image|og:image:secure_url|twitter:image|twitter:image:src)["']/i.test(tag);
    if (!isOgOrTwitterImage) continue;

    const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1]) {
      candidates.push(decodeExtractedUrl(contentMatch[1]));
    }
  }

  // 2. Embedded Facebook JSON thumbnail fields
  const jsonPatterns = [
    /"preferred_thumbnail"\s*:\s*\{\s*"image"\s*:\s*\{\s*"uri"\s*:\s*"(https?:[^"]+)"/gi,
    /"thumbnailImage"\s*:\s*\{\s*"uri"\s*:\s*"(https?:[^"]+)"/gi,
    /"previewImage"\s*:\s*"(https?:[^"]+)"/gi,
    /"thumbnail_url"\s*:\s*"(https?:[^"]+)"/gi,
    /"poster"\s*:\s*"(https?:[^"]+)"/gi,
  ];

  for (const regex of jsonPatterns) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      if (m[1]) {
        candidates.push(decodeExtractedUrl(m[1]));
      }
    }
  }

  for (const candidate of candidates) {
    const validated = validateThumbnailUrl(candidate);
    if (validated) return validated;
  }

  return null;
}

async function fetchFacebookHtmlSafely(
  initialUrl: URL,
  userAgent: string
): Promise<string | null> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const res = await fetchWithTimeout(
      currentUrl.href,
      {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
      },
      FETCH_TIMEOUT_MS
    );

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location || hop === MAX_REDIRECT_HOPS) return null;

      let nextUrlStr: string;
      try {
        nextUrlStr = new URL(location, currentUrl).href;
      } catch {
        return null;
      }

      const validatedNext = validateAllowedVideoUrl(nextUrlStr);
      if (!validatedNext || validatedNext.provider !== 'facebook') {
        return null;
      }
      currentUrl = validatedNext.url;
      continue;
    }

    if (!res.ok) return null;

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    return await readResponseTextCapped(res, MAX_HTML_BYTES);
  }

  return null;
}

async function tryMirrorThumbnailToCloudinary(fbThumbUrl: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  try {
    let currentUrl = fbThumbUrl;
    let imageRes: Response | null = null;

    for (let hop = 0; hop <= 2; hop++) {
      const validated = validateThumbnailUrl(currentUrl);
      if (!validated) return null;

      const res = await fetchWithTimeout(
        validated,
        {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; IttihadAlexTV/1.0)',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        },
        5000
      );

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc || hop === 2) return null;
        currentUrl = new URL(loc, validated).href;
        continue;
      }

      imageRes = res;
      break;
    }

    if (!imageRes || !imageRes.ok) return null;

    const contentType = (imageRes.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) return null;

    const buffer = await readResponseBufferCapped(imageRes, MAX_THUMBNAIL_BYTES);
    if (!buffer || buffer.length < 256) return null;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5500);
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'video-thumbnails',
          resource_type: 'image',
          format: 'jpg',
          quality: 'auto:good',
        },
        (err, result) => {
          clearTimeout(timeout);
          if (err || !result?.secure_url) {
            resolve(null);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      stream.end(buffer);
    });
  } catch {
    return null;
  }
}

async function resolveFacebookThumbnail(url: URL): Promise<{ thumbnailUrl: string; mirrored: boolean } | null> {
  // Unwrap Facebook plugin embed URL (?href=...)
  let targetUrl = url;
  if (url.pathname.toLowerCase().includes('/plugins/video.php')) {
    const hrefParam = url.searchParams.get('href');
    if (hrefParam) {
      const inner = validateAllowedVideoUrl(hrefParam);
      if (inner && inner.provider === 'facebook') {
        targetUrl = inner.url;
      }
    }
  }

  // Upgrade http -> https for Facebook fetch
  if (targetUrl.protocol === 'http:') {
    targetUrl = new URL(targetUrl.href.replace(/^http:/i, 'https:'));
  }

  const userAgents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  ];

  for (const ua of userAgents) {
    try {
      const html = await fetchFacebookHtmlSafely(targetUrl, ua);
      if (!html) continue;

      const thumb = extractFacebookThumbnailFromHtml(html);
      if (thumb) {
        const mirroredUrl = await tryMirrorThumbnailToCloudinary(thumb);
        return {
          thumbnailUrl: mirroredUrl || thumb,
          mirrored: Boolean(mirroredUrl),
        };
      }
    } catch {
      // Try next UA
    }
  }

  return null;
}

async function verifyBearerToken(req: any): Promise<boolean> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length > 8192) return false;

  try {
    const app = getAdminApp();
    const checkRevoked = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    await admin.auth(app).verifyIdToken(token, checkRevoked);
    return true;
  } catch {
    return false;
  }
}

export async function videoThumbnailHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'الطريقة غير مدعومة' });
  }

  const authenticated = await verifyBearerToken(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'مطلوب تسجيل دخول صالح لاستخراج الصورة المصغرة' });
  }

  const rawParam = req.query?.url;
  if (typeof rawParam !== 'string' || !rawParam.trim() || rawParam.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: 'رابط الفيديو مطلوب ويجب أن يكون صالحاً' });
  }

  const extracted = extractUrlFromInput(rawParam);
  const validated = validateAllowedVideoUrl(extracted);
  if (!validated) {
    return res.status(400).json({ error: 'يُسمح فقط بروابط فيديوهات YouTube و Facebook الصالحة' });
  }

  try {
    if (validated.provider === 'youtube') {
      const videoId = extractYouTubeVideoId(validated.url);
      if (!videoId) {
        return res.status(400).json({ error: 'تعذر استخراج معرف فيديو يوتيوب من الرابط' });
      }
      const thumbnailUrl = await resolveBestYouTubeThumbnail(videoId);
      return res.status(200).json({
        success: true,
        provider: 'youtube',
        videoId,
        thumbnailUrl,
      });
    }

    const fbResult = await resolveFacebookThumbnail(validated.url);
    if (!fbResult) {
      return res.status(404).json({
        error: 'تعذر استخراج الصورة المصغرة من رابط فيسبوك (قد يكون الفيديو خاصاً أو محمياً)',
      });
    }

    return res.status(200).json({
      success: true,
      provider: 'facebook',
      thumbnailUrl: fbResult.thumbnailUrl,
      mirrored: fbResult.mirrored,
    });
  } catch {
    return res.status(502).json({
      error: 'حدث خطأ أثناء جلب الصورة المصغرة للفيديو، يرجى المحاولة مجدداً',
    });
  }
}

export default videoThumbnailHandler;
