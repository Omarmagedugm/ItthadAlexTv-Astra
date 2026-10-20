/**
 * Comprehensive SEO and Canonical URL Management for Ithad Alex TV (قناة الاتحاد السكندري)
 */

export const SITE_ORIGIN = 'https://itthadalextv.com';
export const SITE_NAME = 'قناة الاتحاد السكندري';
export const DEFAULT_DESCRIPTION = 'تطبيق قناة الاتحاد السكندري - زعيم الثغر وسيد البلد، كل ما يخص نادي الاتحاد السكندري وجماهيره';
export const DEFAULT_OG_IMAGE = 'https://itthadalextv.com/icon.png';

/**
 * Normalizes an Arabic string into a URL slug, or cleans it for comparison.
 */
export function slugifyArabic(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alefs
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Remove special characters, keep Arabic letters, numbers, Latin letters
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s-]/g, '')
    // Replace whitespace and underscores with a single hyphen
    .replace(/[\s_]+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Builds the strictly canonical URL for any path.
 * Strips tracking query parameters, hashes, trailing slashes.
 */
export function buildCanonicalUrl(pathOrUrl: string): string {
  try {
    let cleanPath = pathOrUrl.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      const parsed = new URL(cleanPath);
      cleanPath = parsed.pathname;
    }

    // Strip hash and query
    cleanPath = cleanPath.split('?')[0].split('#')[0];

    // Remove trailing slash unless it's root
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    return `${SITE_ORIGIN}${cleanPath}`;
  } catch (_) {
    return `${SITE_ORIGIN}/`;
  }
}

/**
 * Specifically returns the canonical URL for a news article ID.
 * Example: https://itthadalextv.com/news/6b394298-b373-4b67-9022-3b36363e77ca
 */
export function getNewsCanonicalUrl(articleId: string): string {
  const cleanId = encodeURIComponent(articleId.trim());
  return `${SITE_ORIGIN}/news/${cleanId}`;
}

export interface SEOMetadata {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
}

/**
 * Dynamically updates client-side Head tags (canonical, Open Graph, Twitter, JSON-LD schema).
 */
export function updateClientSEO(meta: SEOMetadata) {
  if (typeof document === 'undefined') return;

  const title = meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} - زعيم الثغر وسيد البلد`;
  const description = meta.description || DEFAULT_DESCRIPTION;
  const canonicalUrl = meta.canonicalUrl ? buildCanonicalUrl(meta.canonicalUrl) : buildCanonicalUrl(window.location.pathname);
  let imageUrl = meta.imageUrl || DEFAULT_OG_IMAGE;

  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${SITE_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // 1. Update Title
  document.title = title;

  // 2. Helper to set/create meta element
  const setMeta = (selector: string, attrName: string, attrVal: string, content: string) => {
    let tag = document.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrVal);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // 3. Update or create Canonical link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // 4. Update Meta Description
  setMeta('meta[name="description"]', 'name', 'description', description);

  // 5. Open Graph tags
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
  setMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', imageUrl);
  setMeta('meta[property="og:type"]', 'property', 'og:type', meta.type || 'website');
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
  setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'ar_EG');

  // 6. Twitter tags
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

  // 7. Article specific tags
  if (meta.type === 'article') {
    if (meta.publishedTime) {
      setMeta('meta[property="article:published_time"]', 'property', 'article:published_time', meta.publishedTime);
    }
    if (meta.modifiedTime) {
      setMeta('meta[property="article:modified_time"]', 'property', 'article:modified_time', meta.modifiedTime);
    }
    if (meta.author) {
      setMeta('meta[property="article:author"]', 'property', 'article:author', meta.author);
    }
    if (meta.section) {
      setMeta('meta[property="article:section"]', 'property', 'article:section', meta.section);
    }
  }

  // 8. Robots meta
  if (meta.noindex) {
    setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
  } else {
    setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }

  // 9. Structured Data (JSON-LD)
  if (meta.structuredData) {
    let scriptTag = document.getElementById('app-structured-data') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'app-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(meta.structuredData);
  }
}

/**
 * Builds Schema.org NewsArticle JSON-LD for news articles.
 */
export function buildNewsArticleSchema(article: {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  image?: string;
  date?: string;
  createdAt?: string;
  author?: string;
  editorName?: string;
  category?: string;
  newsType?: string;
}) {
  const canonicalUrl = getNewsCanonicalUrl(article.id);
  const headline = article.title;
  const description = article.summary || article.content?.slice(0, 160) || headline;
  let imageUrl = article.image || DEFAULT_OG_IMAGE;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${SITE_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  const datePublished = article.date || article.createdAt || new Date().toISOString();
  const dateModified = article.createdAt || article.date || datePublished;
  const authorName = article.newsType === 'article' 
    ? (article.author || article.editorName || 'كاتب ومحلل رياضي') 
    : (article.author || 'المحرر الصحفي');

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": headline,
    "description": description,
    "image": [imageUrl],
    "datePublished": datePublished,
    "dateModified": dateModified,
    "author": {
      "@type": article.newsType === 'article' ? "Person" : "Organization",
      "name": authorName,
      "url": SITE_ORIGIN
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_ORIGIN}/icon.png`,
        "width": 512,
        "height": 512
      }
    },
    "articleSection": article.category || "أخبار النادي",
    "inLanguage": "ar"
  };
}

/**
 * Builds BreadcrumbList schema.
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_ORIGIN}${item.url}`
    }))
  };
}

/**
 * Builds Website + Organization schema for home page.
 */
export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_ORIGIN}/#website`,
        "url": `${SITE_ORIGIN}/`,
        "name": SITE_NAME,
        "description": DEFAULT_DESCRIPTION,
        "inLanguage": "ar"
      },
      {
        "@type": "SportsTeam",
        "@id": `${SITE_ORIGIN}/#organization`,
        "name": "نادي الاتحاد السكندري",
        "alternateName": ["Ittihad Alexandria SC", "زعيم الثغر", "سيد البلد"],
        "url": `${SITE_ORIGIN}/`,
        "logo": `${SITE_ORIGIN}/icon.png`
      }
    ]
  };
}
