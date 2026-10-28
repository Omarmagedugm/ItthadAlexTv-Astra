import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSitemapXml } from '../server/sitemapHandler.js';

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
    // 1. Serve pre-generated static sitemap if available (fastest & 100% resilient)
    const currentDir = getCurrentDir();
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'sitemap.xml'),
      path.join(process.cwd(), 'public', 'sitemap.xml'),
      path.join(currentDir, '..', 'dist', 'sitemap.xml'),
      path.join(currentDir, '..', 'public', 'sitemap.xml'),
      path.join(currentDir, 'sitemap.xml')
    ];

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          if (content && content.includes('<urlset')) {
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
            return res.status(200).send(content);
          }
        }
      } catch (_) {}
    }

    // 2. Dynamic generation fallback
    try {
      const xml = await generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(xml);
    } catch (dynamicErr: any) {
      console.warn('[Vercel API] Dynamic sitemap generation failed:', dynamicErr?.message || dynamicErr);
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://itthadalextv.com/</loc><changefreq>always</changefreq><priority>1.0</priority></url></urlset>');
  } catch (error: any) {
    console.error('[Vercel API] Sitemap generation error:', error?.message || error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://itthadalextv.com/</loc><changefreq>always</changefreq><priority>1.0</priority></url></urlset>');
  }
}
