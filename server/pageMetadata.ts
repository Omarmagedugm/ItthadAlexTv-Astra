import { escapeHtml, serializeJsonLd } from './htmlSafety';

export interface PublicPageMetaEntry {
  title: string;
  description: string;
  pageType?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  canonicalPath?: string;
}

export const PUBLIC_PAGE_METADATA: Record<string, PublicPageMetaEntry> = {
  '/news': {
    title: 'أخبار الاتحاد السكندري العاجلة والحصرية',
    description: 'تابع أحدث أخبار نادي الاتحاد السكندري في كرة القدم وكرة السلة وكافة الألعاب الرياضية، وتحليلات ومقالات حصرية عن زعيم الثغر لحظة بلحظة.',
    pageType: 'CollectionPage'
  },
  '/matches': {
    title: 'جدول مباريات ونتائج الاتحاد السكندري',
    description: 'تعرف على مواعيد ونتائج مباريات نادي الاتحاد السكندري القادمة والسابقة في الدوري والكأس ودوري السلة بتحديث فوري وتفاصيل شاملة.',
    pageType: 'CollectionPage'
  },
  '/media': {
    title: 'المركز الإعلامي – صور وفيديوهات الاتحاد السكندري',
    description: 'شاهد أهداف وملخصات مباريات الاتحاد السكندري وألبومات الصور الحصرية من التدريبات والمباريات ومدرجات جماهير زعيم الثغر.',
    pageType: 'CollectionPage'
  },
  '/live': {
    title: 'البث المباشر لمباريات وبرامج الاتحاد السكندري',
    description: 'شاهد البث المباشر لمباريات كرة القدم وكرة السلة وبرامج قناة الاتحاد السكندري والتغطيات الحصرية لحظة بلحظة بجودة عالية.',
    pageType: 'WebPage'
  },
  '/history': {
    title: 'تاريخ وبطولات نادي الاتحاد السكندري منذ 1906',
    description: 'استكشف تاريخ نادي الاتحاد السكندري العريق منذ عام 1906، سجل البطولات والألقاب في القدم والسلة، الخط الزمني والملاعب التاريخية.',
    pageType: 'AboutPage'
  },
  '/fanzone': {
    title: 'مدرج جماهير الاتحاد السكندري – التوقعات والتفاعل',
    description: 'شارك في مدرج جماهير سيد البلد، توقع نتائج مباريات الاتحاد السكندري، تفاعل في الاستفتاءات وتصدّر قائمة المشجعين.',
    pageType: 'CollectionPage'
  },
  '/club-members': {
    title: 'بوابة أعضاء نادي الاتحاد السكندري',
    description: 'الخدمات والإعلانات والرحلات والخصومات الحصرية المخصصة لأعضاء نادي الاتحاد السكندري وعائلاتهم في فرعي الشاطبي وسموحة.',
    pageType: 'WebPage'
  },
  '/discounts': {
    title: 'عروض وخصومات جماهير وأعضاء الاتحاد السكندري',
    description: 'اكتشف أحدث العروض والخصومات الحصرية المقدمة لجماهير وأعضاء نادي الاتحاد السكندري في الإسكندرية ومختلف المحافظات.',
    pageType: 'CollectionPage'
  },
  '/business': {
    title: 'دليل أعمال الاتحداوية – مشروعات وخدمات الجماهير',
    description: 'تصفح دليل أعمال ومشروعات مشجعي نادي الاتحاد السكندري وادعم الأنشطة التجارية والخدمات المقدمة من أبناء زعيم الثغر.',
    pageType: 'CollectionPage'
  },
  '/world-fans': {
    title: 'رابطة مشجعي الاتحاد السكندري حول العالم',
    description: 'تواصل مع روابط ومجموعات مشجعي نادي الاتحاد السكندري في مصر والدول العربية وجميع أنحاء العالم.',
    pageType: 'CollectionPage'
  },
  '/services': {
    title: 'الخدمات العامة لجماهير الاتحاد السكندري',
    description: 'باقة من الخدمات المجتمعية والتعليمية والمبادرات الموجهة لجماهير نادي الاتحاد السكندري وأبناء الإسكندرية.',
    pageType: 'WebPage'
  },
  '/library': {
    title: 'مكتبة نادي الاتحاد السكندري – الأناشيد والكتب والأرشيف',
    description: 'استمع لأناشيد وأهازيج جماهير الاتحاد السكندري وتصفح الكتب والوثائق والأرشيف الثقافي والتاريخي لنادي سيد البلد.',
    pageType: 'CollectionPage'
  },
  '/social': {
    title: 'الصفحة الرسمية لقناة الاتحاد السكندري – آخر المنشورات',
    description: 'تابع أحدث منشورات وتغطيات الصفحة الرسمية لقناة الاتحاد السكندري وحسابات النادي على مواقع التواصل الاجتماعي.',
    pageType: 'CollectionPage'
  },
  '/store': {
    title: 'متجر جماهير الاتحاد السكندري',
    description: 'تصفح منتجات وتيشيرتات وإكسسوارات جماهير نادي الاتحاد السكندري الرسمية بأفضل جودة.',
    pageType: 'CollectionPage'
  },
  '/game': {
    title: 'لعبة الاتحداوي – مغامرة سيد البلد التفاعلية',
    description: 'العب واستمتع بلعبة الاتحداوي الرسمية في شوارع الإسكندرية ونافس جماهير زعيم الثغر على أعلى النقاط.',
    pageType: 'WebPage'
  },
  '/privacy': {
    title: 'سياسة الخصوصية',
    description: 'سياسة الخصوصية وحماية البيانات الشخصية لمستخدمي موقع وتطبيق قناة الاتحاد السكندري.',
    canonicalPath: '/privacy-policy'
  },
  '/privacy-policy': {
    title: 'سياسة الخصوصية',
    description: 'سياسة الخصوصية وحماية البيانات الشخصية لمستخدمي موقع وتطبيق قناة الاتحاد السكندري.'
  },
  '/terms': {
    title: 'شروط الاستخدام والخدمة',
    description: 'الشروط والأحكام المنظمة لاستخدام موقع وتطبيق وخدمات قناة الاتحاد السكندري.'
  },
  '/data-deletion': {
    title: 'حذف بيانات المستخدم',
    description: 'تعليمات وطلب حذف حسابك وبياناتك الشخصية من موقع وتطبيق قناة الاتحاد السكندري.'
  }
};

export function injectPageMetadata(html: string, pathname: string): string {
  const page = PUBLIC_PAGE_METADATA[pathname];
  if (!page) return html;
  const siteOrigin = 'https://itthadalextv.com';
  const siteName = 'قناة الاتحاد السكندري';
  const fullTitle = `${page.title} | ${siteName}`;
  const title = escapeHtml(fullTitle);
  const description = escapeHtml(page.description);
  const canonicalPath = page.canonicalPath || pathname;
  const url = escapeHtml(`${siteOrigin}${canonicalPath}`);
  const ogImage = `${siteOrigin}/icon.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': page.pageType || 'WebPage',
        '@id': `${siteOrigin}${canonicalPath}#webpage`,
        url: `${siteOrigin}${canonicalPath}`,
        name: fullTitle,
        description: page.description,
        inLanguage: 'ar-EG',
        isPartOf: { '@id': `${siteOrigin}/#website` }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteOrigin}${canonicalPath}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${siteOrigin}/` },
          { '@type': 'ListItem', position: 2, name: page.title, item: `${siteOrigin}${canonicalPath}` }
        ]
      }
    ]
  };

  const tags = [
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:locale" content="ar_EG" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:secure_url" content="${ogImage}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${title}" />`,
    `<script id="app-structured-data" type="application/ld+json">${serializeJsonLd(schema)}</script>`
  ].join('\n    ');

  return html
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:(?:title|description|url|type|site_name|locale|image|image:secure_url|image:alt)|twitter:(?:card|title|description|image|image:alt))["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*id=["']app-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`)
    .replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}
