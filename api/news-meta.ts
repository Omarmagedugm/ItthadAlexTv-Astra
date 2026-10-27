import { escapeHtml, serializeJsonLd } from '../server/htmlSafety';
export { escapeHtml, serializeJsonLd } from '../server/htmlSafety';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

function getCurrentDir(): string {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
  } catch (_) {}
  try {
    if (typeof import.meta?.url === 'string') return path.dirname(fileURLToPath(import.meta.url));
  } catch (_) {}
  return process.cwd();
}

export interface NewsMeta {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  date?: string;
  author?: string;
  category?: string;
  newsType?: string;
}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0026252792',
  apiKey: 'AIzaSyAjn3P2UUYwSiPtCP-UQUQ-rm5c9y4ymFU',
  firestoreDatabaseId: 'ai-studio-6c80a8df-a84d-4bf3-9327-6de27bc8c8c6'
};

let cachedFirebaseConfig: any = null;

function getFirebaseConfig() {
  if (cachedFirebaseConfig) return cachedFirebaseConfig;

  const envProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const envApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const envDbId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID;

  if (envProjectId && envApiKey) {
    cachedFirebaseConfig = {
      projectId: envProjectId,
      apiKey: envApiKey,
      firestoreDatabaseId: envDbId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId
    };
    return cachedFirebaseConfig;
  }

  const currentDir = getCurrentDir();
  const possibleConfigPaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(currentDir, 'firebase-applet-config.json'),
    path.join(currentDir, '..', 'firebase-applet-config.json')
  ];

  for (const configPath of possibleConfigPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (parsed.projectId && parsed.apiKey) {
          cachedFirebaseConfig = parsed;
          return cachedFirebaseConfig;
        }
      }
    } catch (_) {}
  }

  cachedFirebaseConfig = DEFAULT_FIREBASE_CONFIG;
  return cachedFirebaseConfig;
}

export type FetchNewsResult =
  | { status: 'found'; meta: NewsMeta }
  | { status: 'not_found' }
  | { status: 'upstream_error'; error: string };

export async function fetchNewsMetadata(id: string): Promise<FetchNewsResult> {
  const config = getFirebaseConfig();
  if (!config.projectId || !config.apiKey) {
    return { status: 'upstream_error', error: 'Missing Firebase configuration' };
  }
  const dbId = config.firestoreDatabaseId || '(default)';
  const cleanId = id.trim();
  const docUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/news/${encodeURIComponent(cleanId)}?key=${config.apiKey}`;

  return new Promise((resolve) => {
    const req = https.get(docUrl, { timeout: 3500 }, (res) => {
      if (res.statusCode === 404) {
        return resolve({ status: 'not_found' });
      }
      if (res.statusCode !== 200) {
        return resolve({ status: 'upstream_error', error: `Upstream HTTP ${res.statusCode}` });
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const fields = json.fields || {};
          const title = fields.title?.stringValue || '';
          if (!title.trim()) {
            return resolve({ status: 'not_found' });
          }
          const summary = fields.summary?.stringValue || fields.content?.stringValue?.slice(0, 160) || '';
          const image = fields.image?.stringValue || '';
          const date = fields.date?.stringValue || fields.createdAt?.stringValue || json.createTime || '';
          const author = fields.author?.stringValue || fields.editorName?.stringValue || '';
          const category = fields.category?.stringValue || 'أخبار النادي';
          const newsType = fields.newsType?.stringValue || 'news';
          resolve({
            status: 'found',
            meta: { id: cleanId, title: title.trim(), summary, image, date, author, category, newsType }
          });
        } catch (e: any) {
          resolve({ status: 'upstream_error', error: 'Invalid JSON response from upstream' });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 'upstream_error', error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'upstream_error', error: 'Timeout fetching from Firestore' });
    });
  });
}

export function injectNotFoundMetaTags(html: string): string {
  const notFoundTitle = 'الخبر غير موجود | قناة الاتحاد السكندري';
  const notFoundDesc = 'عذراً، هذا الخبر أو المقال غير موجود أو تم حذفه من المنصة.';
  let result = html;

  // 1. Replace <title>
  result = result.replace(/<title>.*?<\/title>/i, () => `<title>${notFoundTitle}</title>`);

  // 2. Robots meta: strictly noindex, nofollow for missing articles
  if (result.includes('name="robots"')) {
    result = result.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="robots" content="noindex, nofollow" />`);
  } else {
    result = result.replace('</head>', () => `  <meta name="robots" content="noindex, nofollow" />\n  </head>`);
  }

  // 3. Remove canonical link (missing page should not specify a canonical URL)
  result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');

  // 4. Update meta description
  if (result.includes('name="description"')) {
    result = result.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="description" content="${notFoundDesc}" />`);
  } else {
    result = result.replace('</head>', () => `  <meta name="description" content="${notFoundDesc}" />\n  </head>`);
  }

  // 5. Update OpenGraph tags
  result = result.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:title" content="${notFoundTitle}" />`);
  result = result.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:description" content="${notFoundDesc}" />`);

  // 6. Update Twitter tags
  result = result.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:title" content="${notFoundTitle}" />`);
  result = result.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:description" content="${notFoundDesc}" />`);

  // 7. Strip any NewsArticle JSON-LD schema
  result = result.replace(/<script\s+type="application\/ld\+json">[\s\S]*?"NewsArticle"[\s\S]*?<\/script>/gi, '');

  return result;
}

export function injectNewsMetaTags(html: string, meta: NewsMeta, canonicalUrl?: string): string {
  if (!meta.title && !meta.image) return html;

  const siteOrigin = 'https://itthadalextv.com';
  const siteName = 'قناة الاتحاد السكندري';
  const title = meta.title || siteName;
  const desc = meta.summary || 'تطبيق قناة الاتحاد السكندري - زعيم الثغر وسيد البلد';
  let image = meta.image || '/icon.png';

  // If relative image, ensure absolute URL
  if (image && !image.startsWith('http')) {
    image = `${siteOrigin}${image.startsWith('/') ? '' : '/'}${image}`;
  }

  const effectiveCanonical = canonicalUrl || `${siteOrigin}/news/${encodeURIComponent(meta.id)}`;

  let result = html;

  // 1. Replace <title>
  result = result.replace(/<title>.*?<\/title>/i, () => `<title>${escapeHtml(title)} | ${siteName}</title>`);

  // 2. Inject or replace canonical link
  if (result.includes('rel="canonical"')) {
    result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, () => `<link rel="canonical" href="${escapeHtml(effectiveCanonical)}" />`);
  } else {
    result = result.replace('</head>', () => `  <link rel="canonical" href="${escapeHtml(effectiveCanonical)}" />\n  </head>`);
  }

  // 3. Meta description
  if (result.includes('name="description"')) {
    result = result.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="description" content="${escapeHtml(desc)}" />`);
  } else {
    result = result.replace('</head>', () => `  <meta name="description" content="${escapeHtml(desc)}" />\n  </head>`);
  }

  // 4. OpenGraph tags
  const ogTags = [
    { prop: 'og:title', val: title },
    { prop: 'og:description', val: desc },
    { prop: 'og:url', val: effectiveCanonical },
    { prop: 'og:image', val: image },
    { prop: 'og:image:secure_url', val: image },
    { prop: 'og:type', val: 'article' },
    { prop: 'og:site_name', val: siteName },
    { prop: 'og:locale', val: 'ar_EG' }
  ];

  for (const tag of ogTags) {
    const regex = new RegExp(`<meta\\s+property="${tag.prop}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
    if (result.match(regex)) {
      result = result.replace(regex, () => `<meta property="${tag.prop}" content="${escapeHtml(tag.val)}" />`);
    } else {
      result = result.replace('</head>', () => `  <meta property="${tag.prop}" content="${escapeHtml(tag.val)}" />\n  </head>`);
    }
  }

  // 5. Twitter tags
  const twitterTags = [
    { name: 'twitter:card', val: 'summary_large_image' },
    { name: 'twitter:title', val: title },
    { name: 'twitter:description', val: desc },
    { name: 'twitter:image', val: image }
  ];

  for (const tag of twitterTags) {
    const regex = new RegExp(`<meta\\s+name="${tag.name}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
    if (result.match(regex)) {
      result = result.replace(regex, () => `<meta name="${tag.name}" content="${escapeHtml(tag.val)}" />`);
    } else {
      result = result.replace('</head>', () => `  <meta name="${tag.name}" content="${escapeHtml(tag.val)}" />\n  </head>`);
    }
  }

  // 6. Schema.org NewsArticle JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": effectiveCanonical
    },
    "headline": title,
    "description": desc,
    "image": [image],
    "datePublished": meta.date || new Date().toISOString(),
    "dateModified": meta.date || new Date().toISOString(),
    "author": {
      "@type": meta.newsType === 'article' ? "Person" : "Organization",
      "name": meta.author || "المحرر الصحفي",
      "url": siteOrigin
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteOrigin}/icon.png`,
        "width": 512,
        "height": 512
      }
    },
    "articleSection": meta.category || "أخبار النادي"
  };

  const schemaTag = `\n  <script type="application/ld+json">\n${serializeJsonLd(schema)}\n  </script>\n`;
  result = result.replace('</head>', () => `${schemaTag}</head>`);

  return result;
}

let cachedIndexHtml: string = '';

function getIndexHtml(): string {
  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }

  const currentDir = getCurrentDir();
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.join(currentDir, '..', 'dist', 'index.html'),
    path.join(currentDir, '..', 'index.html'),
    path.join(currentDir, 'dist', 'index.html'),
    path.join(currentDir, 'index.html')
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        if (content && content.includes('<html')) {
          cachedIndexHtml = content;
          return content;
        }
      }
    } catch (readErr: any) {
      console.warn(`[news-meta] Could not read index.html at "${p}":`, readErr?.message || readErr);
    }
  }

  console.error('[news-meta] Critical: index.html not found in any candidate path. Checked paths:', possiblePaths, 'process.cwd():', process.cwd());
  return '';
}

export default async function handler(req: any, res: any) {
  try {
    // 1. Extract ID and optional slug from query params, forwarded headers, or URL
    let id = '';
    let slug = '';

    if (req.query?.id && typeof req.query.id === 'string') {
      id = decodeURIComponent(req.query.id).trim();
      if (req.query.slug && typeof req.query.slug === 'string') {
        slug = decodeURIComponent(req.query.slug).trim();
      }
    }

    const rawUrl = (req.headers?.['x-forwarded-uri'] as string) || 
                   (req.headers?.['x-matched-path'] as string) || 
                   req.url || '';

    if (!id && rawUrl) {
      const cleanPath = rawUrl.split('?')[0];
      const match = cleanPath.match(/\/news\/([^/?#]+)(?:\/([^/?#]+))?/);
      if (match) {
        id = decodeURIComponent(match[1]).trim();
        slug = match[2] ? decodeURIComponent(match[2]).trim() : '';
      }
    }

    // 2. Canonical 301 redirect for alternative slugs or trailing slashes
    const cleanPath = rawUrl.split('?')[0];
    if (id && (slug || (cleanPath.length > 6 && cleanPath.endsWith('/')))) {
      const canonicalTarget = `/news/${encodeURIComponent(id)}`;
      res.setHeader('Location', canonicalTarget);
      return res.status(301).end();
    }

    // 3. Load base HTML template
    let html = getIndexHtml();

    if (!html) {
      console.error('[news-meta] dist/index.html is missing on disk for news request:', id || '(root)');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(500).send('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>قناة الاتحاد السكندري</title></head><body>حدث خطأ في تحميل الصفحة</body></html>');
    }

    // If accessed as generic /news without an ID, serve base app
    if (!id) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      return res.status(200).send(html);
    }

    // 4. Fetch dynamic news article metadata from Firestore
    try {
      const fetchResult = await fetchNewsMetadata(id);

      if (fetchResult.status === 'found') {
        const canonicalUrl = `https://itthadalextv.com/news/${encodeURIComponent(fetchResult.meta.id)}`;
        const enrichedHtml = injectNewsMetaTags(html, fetchResult.meta, canonicalUrl);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        return res.status(200).send(enrichedHtml);
      }

      if (fetchResult.status === 'not_found') {
        console.warn(`[news-meta] Article not found in Firestore for ID: "${id}"`);
        const notFoundHtml = injectNotFoundMetaTags(html);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
        return res.status(404).send(notFoundHtml);
      }

      // Upstream Error: Log without masking, serve base SPA shell with no-cache so client-side hydration can try directly
      console.error(`[news-meta] Upstream Firestore error fetching news "${id}":`, fetchResult.error);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(html);

    } catch (fetchErr: any) {
      console.error(`[news-meta] Unexpected error during metadata lookup for "${id}":`, fetchErr?.message || fetchErr);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(html);
    }
  } catch (err: any) {
    console.error('[news-meta] Unhandled root exception in handler:', err);
    try {
      const fallbackHtml = getIndexHtml();
      if (fallbackHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(fallbackHtml);
      }
    } catch (_) {}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>قناة الاتحاد السكندري</title></head><body>حدث خطأ في معالجة الطلب</body></html>');
  }
}
