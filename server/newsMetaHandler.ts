import { escapeHtml, serializeJsonLd } from './htmlSafety';
import fs from 'fs';
import path from 'path';
import https from 'https';

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

let cachedConfig: any = null;
function getFirebaseConfig() {
  if (!cachedConfig) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (_) {}
    }
    if (!cachedConfig || !cachedConfig.apiKey) {
      cachedConfig = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId
      };
    }
  }
  return cachedConfig;
}

export async function fetchNewsMetadata(id: string): Promise<NewsMeta | null> {
  const config = getFirebaseConfig();
  if (!config.projectId || !config.apiKey) return null;
  const dbId = config.firestoreDatabaseId || '(default)';
  const cleanId = id.trim();
  const docUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/news/${encodeURIComponent(cleanId)}?key=${config.apiKey}`;

  return new Promise((resolve) => {
    const req = https.get(docUrl, { timeout: 3500 }, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const fields = json.fields || {};
          const title = fields.title?.stringValue || '';
          const summary = fields.summary?.stringValue || fields.content?.stringValue?.slice(0, 160) || '';
          const image = fields.image?.stringValue || '';
          const date = fields.date?.stringValue || fields.createdAt?.stringValue || json.createTime || '';
          const author = fields.author?.stringValue || fields.editorName?.stringValue || '';
          const category = fields.category?.stringValue || 'أخبار النادي';
          const newsType = fields.newsType?.stringValue || 'news';
          resolve({ id: cleanId, title, summary, image, date, author, category, newsType });
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
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
