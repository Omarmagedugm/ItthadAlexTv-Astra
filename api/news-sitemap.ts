import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateNewsSitemapXml } from '../server/sitemapHandler.js';

function getCurrentDir(): string {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
  } catch (_) {}
  try {
    if (typeof import.meta?.url === 'string') return path.dirname(fileURLToPath(import.meta.url));
  } catch (_) {}
  return process.cwd();
}

export default async function handler(req: any, res: any) {
  try {
    // 1. Serve pre-generated static news sitemap if available
    const currentDir = getCurrentDir();
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'news-sitemap.xml'),
      path.join(process.cwd(), 'public', 'news-sitemap.xml'),
      path.join(currentDir, '..', 'dist', 'news-sitemap.xml'),
      path.join(currentDir, '..', 'public', 'news-sitemap.xml'),
      path.join(currentDir, 'news-sitemap.xml')
    ];

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          if (content && content.includes('<urlset')) {
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600');
            return res.status(200).send(content);
          }
        }
      } catch (_) {}
    }

    // 2. Dynamic generation fallback
    try {
      const xml = await generateNewsSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600');
      return res.status(200).send(xml);
    } catch (dynamicErr: any) {
      console.warn('[Vercel API] Dynamic news sitemap generation failed:', dynamicErr?.message || dynamicErr);
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>');
  } catch (error: any) {
    console.error('[Vercel API] News sitemap generation error:', error?.message || error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>');
  }
}
