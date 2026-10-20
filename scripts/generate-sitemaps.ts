import fs from 'fs';
import path from 'path';
import { generateSitemapXml, generateNewsSitemapXml } from '../server/sitemapHandler.ts';

async function run() {
  console.log('[Build SEO] Generating fresh sitemaps...');
  try {
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const sitemapXml = await generateSitemapXml();
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
    console.log('[Build SEO] ✅ Generated public/sitemap.xml successfully.');

    const newsSitemapXml = await generateNewsSitemapXml();
    fs.writeFileSync(path.join(publicDir, 'news-sitemap.xml'), newsSitemapXml, 'utf8');
    console.log('[Build SEO] ✅ Generated public/news-sitemap.xml successfully.');
  } catch (err) {
    console.error('[Build SEO] ⚠️ Warning: Failed to pre-generate static sitemaps at build time:', err);
    // Do not fail build if network is unavailable during build
  }
}

run();
