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

export const SITE_ORIGIN = 'https://itthadalextv.com';
export const PUBLICATION_NAME = 'قناة الاتحاد السكندري';

export interface SitemapArticle {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  date: string;
  createdAt?: string;
  category?: string;
}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0026252792',
  apiKey: 'AIzaSyAjn3P2UUYwSiPtCP-UQUQ-rm5c9y4ymFU',
  firestoreDatabaseId: 'ai-studio-6c80a8df-a84d-4bf3-9327-6de27bc8c8c6'
};

let cachedFirebaseConfig: any = null;

function getFirebaseConfig() {
  if (cachedFirebaseConfig) return cachedFirebaseConfig;

  const envApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const envProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
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

/**
 * Escapes characters for XML compliance and strips control characters & HTML tags.
 */
export function cleanXmlText(str: string): string {
  if (!str) return '';
  return str
    // Strip XML 1.0 invalid control characters (ASCII 0-8, 11-12, 14-31, 127)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip HTML markup
    .replace(/<[^>]*>/g, '')
    // Replace non-breaking spaces
    .replace(/&nbsp;/g, ' ')
    // Escape standard XML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .trim();
}

/**
 * Formats a date string into standard W3C ISO 8601 format: YYYY-MM-DDThh:mm:ssZ
 */
export function formatW3CDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  } catch (_) {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}

// In-memory cache for Firestore news (5 minutes TTL)
let memoryNewsCache: { timestamp: number; articles: SitemapArticle[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches published news articles directly from Firestore via REST API.
 */
export async function fetchPublishedNewsForSitemap(): Promise<SitemapArticle[]> {
  const now = Date.now();
  if (memoryNewsCache && (now - memoryNewsCache.timestamp < CACHE_TTL_MS) && memoryNewsCache.articles.length > 0) {
    return memoryNewsCache.articles;
  }

  const config = getFirebaseConfig();
  if (!config.projectId || !config.apiKey) {
    console.error('[Sitemap] ❌ Missing Firebase credentials for Firestore query (projectId/apiKey)');
    if (memoryNewsCache) return memoryNewsCache.articles;
    throw new Error('Firebase credentials not configured for sitemap fetching');
  }

  const dbId = config.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents:runQuery?key=${config.apiKey}`;
  
  const queryBody = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'news' }],
      limit: 1000
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(queryBody)
      },
      timeout: 8000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            const errMsg = `[Sitemap] Firestore API returned status ${res.statusCode}: ${raw.slice(0, 300)}`;
            console.error(errMsg);
            if (memoryNewsCache && memoryNewsCache.articles.length > 0) {
              return resolve(memoryNewsCache.articles);
            }
            return reject(new Error(errMsg));
          }

          const list = JSON.parse(raw);
          if (!Array.isArray(list)) {
            console.warn('[Sitemap] Unexpected Firestore response format:', raw.slice(0, 200));
            if (memoryNewsCache) return resolve(memoryNewsCache.articles);
            return resolve([]);
          }

          const articles: SitemapArticle[] = [];
          for (const item of list) {
            if (!item.document) continue;
            const doc = item.document;
            const fields = doc.fields || {};

            // Exclude drafts or unpublished if explicit flag is set
            if (fields.draft?.booleanValue === true || fields.published?.booleanValue === false) {
              continue;
            }

            const docPath = doc.name || '';
            const docId = docPath.split('/').pop() || fields.id?.stringValue || '';
            const title = fields.title?.stringValue || '';
            if (!docId || !title.trim()) continue;

            const dateStr = fields.date?.stringValue || fields.createdAt?.stringValue || doc.createTime || '';
            const image = fields.image?.stringValue || '';
            const summary = fields.summary?.stringValue || fields.content?.stringValue?.slice(0, 160) || '';
            const category = fields.category?.stringValue || 'أخبار النادي';

            articles.push({
              id: docId,
              title: title.trim(),
              summary,
              image,
              date: dateStr,
              createdAt: fields.createdAt?.stringValue || doc.createTime,
              category
            });
          }

          // Sort descending by date (most recent first)
          articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          memoryNewsCache = { timestamp: now, articles };
          console.log(`[Sitemap] ✅ Successfully loaded ${articles.length} published articles from Firestore`);
          resolve(articles);
        } catch (e: any) {
          console.error('[Sitemap] ❌ Failed to parse Firestore response:', e.message);
          if (memoryNewsCache && memoryNewsCache.articles.length > 0) {
            return resolve(memoryNewsCache.articles);
          }
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Sitemap] ❌ Request network error:', err.message);
      if (memoryNewsCache && memoryNewsCache.articles.length > 0) {
        return resolve(memoryNewsCache.articles);
      }
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[Sitemap] ❌ Request timeout to Firestore API');
      if (memoryNewsCache && memoryNewsCache.articles.length > 0) {
        return resolve(memoryNewsCache.articles);
      }
      reject(new Error('Timeout fetching news from Firestore'));
    });

    req.write(queryBody);
    req.end();
  });
}

/**
 * Generates the full dynamic sitemap.xml according to standard Sitemap Protocol 0.9.
 */
export async function generateSitemapXml(): Promise<string> {
  const articles = await fetchPublishedNewsForSitemap();
  const latestNewsDate = articles.length > 0 && articles[0].date ? formatW3CDate(articles[0].date) : formatW3CDate();

  // Core public indexable pages on the website
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'hourly', lastmod: latestNewsDate },
    { path: '/news', priority: '0.9', changefreq: 'hourly', lastmod: latestNewsDate },
    { path: '/matches', priority: '0.8', changefreq: 'daily', lastmod: latestNewsDate },
    { path: '/media', priority: '0.8', changefreq: 'daily', lastmod: latestNewsDate },
    { path: '/live', priority: '0.8', changefreq: 'hourly', lastmod: latestNewsDate },
    { path: '/history', priority: '0.7', changefreq: 'monthly', lastmod: '2026-09-01T00:00:00Z' },
    { path: '/fanzone', priority: '0.7', changefreq: 'daily', lastmod: latestNewsDate },
    { path: '/club-members', priority: '0.6', changefreq: 'weekly', lastmod: latestNewsDate },
    { path: '/discounts', priority: '0.6', changefreq: 'weekly', lastmod: latestNewsDate },
    { path: '/business', priority: '0.6', changefreq: 'weekly', lastmod: latestNewsDate },
    { path: '/world-fans', priority: '0.6', changefreq: 'weekly', lastmod: latestNewsDate },
    { path: '/services', priority: '0.6', changefreq: 'weekly', lastmod: latestNewsDate },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'monthly', lastmod: '2026-08-01T00:00:00Z' },
    { path: '/terms', priority: '0.3', changefreq: 'monthly', lastmod: '2026-08-01T00:00:00Z' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Static Pages
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_ORIGIN}${page.path}</loc>\n`;
    xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 2. Published News (Canonical URLs: https://itthadalextv.com/news/[id])
  for (const article of articles) {
    const cleanId = encodeURIComponent(article.id.trim());
    const loc = `${SITE_ORIGIN}/news/${cleanId}`;
    const isoDate = formatW3CDate(article.date || article.createdAt);

    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${isoDate}</lastmod>\n`;
    xml += `    <changefreq>never</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;

    if (article.image) {
      let imgUrl = article.image.trim();
      if (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://')) {
        imgUrl = `${SITE_ORIGIN}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
      }
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${cleanXmlText(imgUrl)}</image:loc>\n`;
      xml += `      <image:title>${cleanXmlText(article.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Generates the Google News sitemap.xml strictly compliant with Google News guidelines:
 * - Articles published in the last 48 hours ONLY
 * - Real original publication date
 * - Valid Google News namespace
 * - Valid empty urlset if no articles published in the last 48 hours (no older fallbacks)
 */
export async function generateNewsSitemapXml(): Promise<string> {
  const allArticles = await fetchPublishedNewsForSitemap();
  const now = Date.now();
  const twoDaysAgo = now - 48 * 60 * 60 * 1000;

  // Filter strictly for articles published in the last 48 hours
  const recentArticles = allArticles.filter(a => {
    if (!a.date) return false;
    const t = new Date(a.date).getTime();
    return !isNaN(t) && t >= twoDaysAgo && t <= (now + 5 * 60 * 1000); // Allow slight clock drift
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

  for (const article of recentArticles) {
    const cleanId = encodeURIComponent(article.id.trim());
    const loc = `${SITE_ORIGIN}/news/${cleanId}`;
    const pubDate = formatW3CDate(article.date);
    const cleanTitle = cleanXmlText(article.title);

    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <news:news>\n`;
    xml += `      <news:publication>\n`;
    xml += `        <news:name>${cleanXmlText(PUBLICATION_NAME)}</news:name>\n`;
    xml += `        <news:language>ar</news:language>\n`;
    xml += `      </news:publication>\n`;
    xml += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
    xml += `      <news:title>${cleanTitle}</news:title>\n`;
    xml += `    </news:news>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}
