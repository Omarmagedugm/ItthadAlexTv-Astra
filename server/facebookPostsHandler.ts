import {
  FACEBOOK_GRAPH_API_VERSION,
  FACEBOOK_PAGE_ID,
  FACEBOOK_PAGE_URL,
  FACEBOOK_POSTS_FIELDS,
  FACEBOOK_POSTS_LIMIT,
  type FacebookPost,
} from '../src/lib/socialConfig.js';

const ALLOWED_PERMALINK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'mbasic.facebook.com',
  'fb.watch',
  'www.fb.watch',
  'fb.com',
  'www.fb.com',
]);

const FETCH_TIMEOUT_MS = 10000;

function sanitizeHttpsUrl(rawUrl: unknown, allowFacebookOnly = false): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return undefined;
    if (allowFacebookOnly) {
      const host = parsed.hostname.toLowerCase();
      if (!ALLOWED_PERMALINK_HOSTS.has(host)) return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function sanitizePost(raw: any): FacebookPost | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const createdTime = typeof raw.created_time === 'string' ? raw.created_time.trim() : '';
  if (!id || !createdTime) return null;

  const message = typeof raw.message === 'string' ? raw.message.trim() : undefined;
  const story = typeof raw.story === 'string' ? raw.story.trim() : undefined;
  const fullPicture = sanitizeHttpsUrl(raw.full_picture, false);
  const permalinkUrl = sanitizeHttpsUrl(raw.permalink_url, true) || FACEBOOK_PAGE_URL;

  if (!message && !story && !fullPicture) {
    return null;
  }

  return {
    id,
    ...(message ? { message } : {}),
    ...(story ? { story } : {}),
    created_time: createdTime,
    ...(fullPicture ? { full_picture: fullPicture } : {}),
    permalink_url: permalinkUrl,
  };
}

export default async function facebookPostsHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Method not allowed' });
  }

  const pageId = (process.env.FACEBOOK_PAGE_ID || FACEBOOK_PAGE_ID).trim();
  if (!/^\d{5,30}$/.test(pageId)) {
    return res.status(500).json({
      error: 'invalid_page_id',
      message: 'معرّف صفحة فيسبوك غير صالح في إعدادات الخادم.',
    });
  }

  const accessToken = (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    return res.status(503).json({
      error: 'missing_token',
      message: 'رمز وصول صفحة فيسبوك غير مضبوط في متغيرات البيئة على الخادم.',
    });
  }

  const rawLimit = Number(req.query?.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(25, Math.max(1, Math.floor(rawLimit)))
    : FACEBOOK_POSTS_LIMIT;

  const graphUrl = new URL(`https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${pageId}/posts`);
  graphUrl.searchParams.set('fields', FACEBOOK_POSTS_FIELDS);
  graphUrl.searchParams.set('limit', String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(graphUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      let fbErrorCode: number | undefined;
      try {
        const errPayload = await response.json();
        fbErrorCode = errPayload?.error?.code;
      } catch {
        // Ignore non-JSON upstream error bodies
      }
      console.warn(`[FacebookPosts] Graph API returned HTTP ${response.status}${fbErrorCode ? ` (code ${fbErrorCode})` : ''}`);
      return res.status(502).json({
        error: 'facebook_api_error',
        message: 'تعذّر جلب أحدث منشورات فيسبوك حالياً. يمكنك المحاولة مرة أخرى أو زيارة الصفحة مباشرة.',
      });
    }

    const payload = await response.json();
    const rawItems = Array.isArray(payload?.data) ? payload.data : [];
    const posts = rawItems
      .map(sanitizePost)
      .filter((item: FacebookPost | null): item is FacebookPost => item !== null);

    return res.status(200).json({
      posts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    console.warn(`[FacebookPosts] Fetch ${isTimeout ? 'timed out' : 'failed'}`);
    return res.status(502).json({
      error: isTimeout ? 'upstream_timeout' : 'upstream_network_error',
      message: isTimeout
        ? 'استغرق الاتصال بخدمة فيسبوك وقتاً أطول من المعتاد. يرجى إعادة المحاولة.'
        : 'تعذّر الاتصال بخدمة فيسبوك حالياً. يرجى التحقق من الاتصال والمحاولة لاحقاً.',
    });
  } finally {
    clearTimeout(timeout);
  }
}
