import { escapeHtml } from './htmlSafety';

export const PUBLIC_PAGE_METADATA: Record<string, { title: string; description: string }> = {
  '/news': { title: 'أخبار الاتحاد السكندري', description: 'تابع أخبار نادي الاتحاد السكندري وآخر مستجدات زعيم الثغر.' },
  '/matches': { title: 'مباريات الاتحاد السكندري', description: 'مواعيد ونتائج مباريات الاتحاد السكندري في مختلف البطولات.' },
  '/media': { title: 'صور وفيديوهات الاتحاد السكندري', description: 'مكتبة صور وفيديوهات نادي الاتحاد السكندري وجماهير زعيم الثغر.' },
  '/history': { title: 'تاريخ الاتحاد السكندري', description: 'تعرف على تاريخ نادي الاتحاد السكندري وإنجازاته ورموزه.' },
  '/privacy': { title: 'سياسة الخصوصية', description: 'سياسة الخصوصية واستخدام البيانات في تطبيق قناة الاتحاد السكندري.' },
  '/privacy-policy': { title: 'سياسة الخصوصية', description: 'سياسة الخصوصية وشروط الاستخدام لتطبيق قناة الاتحاد السكندري.' },
  '/terms': { title: 'شروط الاستخدام', description: 'شروط استخدام تطبيق وموقع قناة الاتحاد السكندري.' },
};

export function injectPageMetadata(html: string, pathname: string): string {
  const page = PUBLIC_PAGE_METADATA[pathname];
  if (!page) return html;
  const title = escapeHtml(`${page.title} | قناة الاتحاد السكندري`);
  const description = escapeHtml(page.description);
  const canonicalPath = pathname === '/privacy' ? '/privacy-policy' : pathname;
  const url = escapeHtml(`https://itthadalextv.com${canonicalPath}`);
  const tags = `<meta name="description" content="${description}">\n<link rel="canonical" href="${url}">\n<meta property="og:title" content="${title}">\n<meta property="og:description" content="${description}">\n<meta property="og:url" content="${url}">\n<meta property="og:type" content="website">\n<meta property="og:image" content="https://itthadalextv.com/icon.png">\n<meta name="twitter:title" content="${title}">\n<meta name="twitter:description" content="${description}">\n<meta name="twitter:image" content="https://itthadalextv.com/icon.png">`;
  return html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:(?:title|description|url|type|image)|twitter:(?:title|description|image))["'][^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`)
    .replace(/<\/head>/i, () => `${tags}\n</head>`);
}
