import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Share2, ArrowRight, Rss, Edit2, PenTool, Newspaper, Heart } from 'lucide-react';
import { getOptimizedImage } from '../lib/cloudinary';
import toast from 'react-hot-toast';
import VideoEmbedWidget from '../components/widgets/VideoEmbedWidget';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getNewsCanonicalUrl, 
  updateClientSEO, 
  buildNewsArticleSchema, 
  buildBreadcrumbSchema,
  slugifyArabic 
} from '../lib/seo';
import { NewsItem } from '../store';

export default function NewsDetail() {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { news, profile } = useAppStore();

  const [fetchedArticle, setFetchedArticle] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearchedFirestore, setHasSearchedFirestore] = useState<boolean>(false);

  // 1. Resolve article from store or fetchedArticle
  const article = useMemo(() => {
    if (!id) return null;
    const cleanId = id.trim();

    // Check direct ID in store
    const directMatch = news.find(n => n.id === cleanId);
    if (directMatch) return directMatch;

    // Check if ID starts with store news ID (e.g. /news/uuid-title-slug)
    const prefixMatch = news.find(n => cleanId.startsWith(n.id) || (n.id.length > 8 && cleanId.includes(n.id)));
    if (prefixMatch) return prefixMatch;

    // Check slug match in store (Arabic title in path)
    const targetSlug = slugifyArabic(slug || cleanId);
    if (targetSlug) {
      const slugMatch = news.find(n => {
        const titleSlug = slugifyArabic(n.title);
        return titleSlug === targetSlug || titleSlug.includes(targetSlug) || targetSlug.includes(titleSlug);
      });
      if (slugMatch) return slugMatch;
    }

    // Check decoded title directly
    try {
      const decodedParam = decodeURIComponent(cleanId);
      const titleMatch = news.find(n => n.title.trim() === decodedParam.trim());
      if (titleMatch) return titleMatch;
    } catch (_) {}

    return fetchedArticle;
  }, [id, slug, news, fetchedArticle]);

  // 2. Fetch directly from Firestore if not in store (e.g. direct landing from Google Search)
  useEffect(() => {
    if (article || !id || hasSearchedFirestore) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadFromFirestore() {
      try {
        const cleanId = (id || '').trim();
        // A. Direct doc lookup
        const docRef = doc(db, 'news', cleanId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          const item: NewsItem = {
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            image: data.image || '',
            date: data.date || data.createdAt || new Date().toISOString(),
            type: data.type || 'manual',
            newsType: data.newsType || 'news',
            category: data.category || '',
            summary: data.summary || '',
            author: data.author || '',
            editorName: data.editorName || '',
            rssUrl: data.rssUrl || '',
            rssSource: data.rssSource || '',
            videoUrl: data.videoUrl || '',
            videoType: data.videoType || 'auto',
            tagIds: data.tagIds || [],
            views: data.views || 0,
            createdAt: data.createdAt || data.date
          };
          setFetchedArticle(item);
          setIsLoading(false);
          setHasSearchedFirestore(true);
          return;
        }

        // B. If not found by direct ID, search recent news to match slug or title
        const targetSlug = slugifyArabic(slug || cleanId);
        const q = query(collection(db, 'news'), limit(50));
        const snap = await getDocs(q);

        if (isMounted) {
          let foundItem: NewsItem | null = null;
          snap.forEach((d) => {
            if (foundItem) return;
            const data = d.data();
            const dTitle = data.title || '';
            const titleSlug = slugifyArabic(dTitle);
            if (titleSlug === targetSlug || d.id === cleanId || cleanId.startsWith(d.id)) {
              foundItem = {
                id: d.id,
                title: dTitle,
                content: data.content || '',
                image: data.image || '',
                date: data.date || data.createdAt || new Date().toISOString(),
                type: data.type || 'manual',
                newsType: data.newsType || 'news',
                category: data.category || '',
                summary: data.summary || '',
                author: data.author || '',
                editorName: data.editorName || '',
                rssUrl: data.rssUrl || '',
                rssSource: data.rssSource || '',
                videoUrl: data.videoUrl || '',
                videoType: data.videoType || 'auto',
                tagIds: data.tagIds || [],
                views: data.views || 0,
                createdAt: data.createdAt || data.date
              };
            }
          });

          if (foundItem) {
            setFetchedArticle(foundItem);
          }
        }
      } catch (err) {
        console.warn('[NewsDetail] Error fetching article from Firestore:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasSearchedFirestore(true);
        }
      }
    }

    loadFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [id, slug, article, hasSearchedFirestore]);

  // 3. Permanent Canonical Redirection & Unified URL enforcement
  useEffect(() => {
    if (!article) return;

    const canonicalPath = `/news/${article.id}`;
    const currentPath = location.pathname;

    // If accessed via an alternative route, slug, or trailing slash, permanently redirect to canonical
    if (currentPath !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [article, location.pathname, navigate]);

  // 4. Update Client-Side Head (Title, Description, Canonical URL, Open Graph, Schema.org)
  useEffect(() => {
    if (!article) return;

    const canonicalUrl = getNewsCanonicalUrl(article.id);
    const imageUrl = getOptimizedImage(article.image, 1200);
    const description = article.summary || article.content?.slice(0, 160) || 'تطبيق قناة الاتحاد السكندري - زعيم الثغر';

    updateClientSEO({
      title: article.title,
      description,
      canonicalUrl,
      imageUrl,
      type: 'article',
      publishedTime: article.date || article.createdAt,
      modifiedTime: article.createdAt || article.date,
      author: article.newsType === 'article' 
        ? (article.author || article.editorName || 'كاتب ومحلل رياضي') 
        : (article.author || 'المحرر الصحفي'),
      section: article.category || 'أخبار النادي',
      structuredData: [
        buildNewsArticleSchema(article),
        buildBreadcrumbSchema([
          { name: 'الرئيسية', url: '/' },
          { name: 'الأخبار', url: '/news' },
          { name: article.title, url: canonicalUrl }
        ])
      ]
    });

    return () => {
      // Restore default SEO on page leave
      updateClientSEO({
        title: 'قناة الاتحاد السكندري',
        description: 'تطبيق قناة الاتحاد السكندري - زعيم الثغر وسيد البلد',
        canonicalUrl: '/',
        imageUrl: '/icon.png',
        type: 'website'
      });
    };
  }, [article]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh] bg-background-light dark:bg-background-dark">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-400 animate-pulse">جاري تحميل الخبر...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background-light dark:bg-background-dark min-h-screen">
        <h1 className="ds-content-heading text-2xl font-bold mb-4">الخبر أو المقال غير موجود</h1>
        <Link to="/news" className="bg-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
          <ArrowRight size={20} />
          العودة للأخبار والمقالات
        </Link>
      </div>
    );
  }

  const isArticleType = article.newsType === 'article';

  const handleShare = async () => {
    const canonicalUrl = getNewsCanonicalUrl(article.id);
    const shareTitle = article.title;
    const shareText = article.summary || article.content?.slice(0, 120) || article.title;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}\n\n${shareText}`,
          url: canonicalUrl
        });
      } catch (e) {
        // user aborted share
      }
    } else {
      navigator.clipboard?.writeText(canonicalUrl);
      toast.success(isArticleType ? 'تم نسخ رابط المقال بنجاح' : 'تم نسخ رابط الخبر بنجاح');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  } as const;

  return (
    <div className="relative flex-1 flex flex-col bg-background-light dark:bg-background-dark min-h-screen pb-32 overflow-x-hidden">
      {/* Sub-bar Actions & Breadcrumb */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/news', { replace: true });
            }
          }}
          className="ds-control flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-card-dark text-slate-700 dark:text-slate-200 border border-border-light dark:border-border-dark text-xs font-bold shadow-sm hover:border-primary transition-all pressable"
        >
          <ArrowRight size={16} />
          <span>العودة للأخبار</span>
        </button>

        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin', { state: { editCategory: 'news', editId: article.id } })}
              className="ds-control p-2.5 rounded-lg bg-primary text-white shadow-sm hover:bg-primary-dark transition-all pressable border border-primary/20"
              title="تعديل الخبر"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button 
            onClick={handleShare}
            className="ds-control p-2.5 rounded-lg bg-white dark:bg-card-dark text-slate-700 dark:text-slate-200 hover:text-primary border border-border-light dark:border-border-dark shadow-sm transition-all pressable"
            title="مشاركة الخبر"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 px-4 max-w-4xl mx-auto w-full pt-2"
      >
        <motion.div variants={itemVariants} className="ds-content-card bg-white dark:bg-card-dark rounded-xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark">
          {/* Full Professional Image Container */}
          <div className="w-full bg-black/5 dark:bg-black/40 relative flex items-center justify-center min-h-[250px] max-h-[55vh]">
            {/* Blurred background for contrast */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
              style={{ backgroundImage: `url('${getOptimizedImage(article.image, 50)}')` }}
            />
            {/* Main Full Image */}
            <img 
              src={getOptimizedImage(article.image, 800)} 
              alt={article.title} 
              className="relative z-10 w-full h-full max-h-[55vh] object-contain drop-shadow-sm" 
              loading="eager"
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
            
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3 text-[12px] font-bold uppercase tracking-wider text-white drop-shadow-md flex-wrap">
              {isArticleType ? (
                <span className="px-3 py-1 bg-amber-500 text-white rounded-lg backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <PenTool size={11} />
                  <span>مقال رأي وتحليل</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-primary/90 text-white rounded-lg backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <Newspaper size={11} />
                  <span>{article.category || 'أخبار النادي'}</span>
                </span>
              )}
              {isArticleType && article.category && (
                <span className="px-3 py-1 bg-black/50 text-white rounded-lg backdrop-blur-md">
                  {article.category}
                </span>
              )}
              <span className="flex items-center gap-1 opacity-90 text-xs">
                {formatDistanceToNow(new Date(article.date), { locale: ar, addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h1 className="ds-content-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-snug mb-4">{article.title}</h1>
            
            {(article.tagIds && article.tagIds.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                 {article.tagIds.map(tagId => {
                   const tagObj = useAppStore.getState().newsTags?.find(t => t.id === tagId);
                   if (!tagObj) return null;
                   return (
                     <span key={tagObj.id} className="text-[12px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm" style={{ backgroundColor: tagObj.color }}>
                       {tagObj.name}
                     </span>
                   );
                 })}
              </div>
            )}

            {/* Author / Journalist Attribution */}
            <div className="flex items-center justify-between py-4 border-y border-border-light dark:border-border-dark mb-6">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  isArticleType 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                   {isArticleType ? <PenTool size={18} /> : <span className="material-symbols-outlined !text-[20px]">person</span>}
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <span>{isArticleType ? `بقلم: ${article.author || article.editorName || 'كاتب ومحلل رياضي'}` : (article.author || (article as any).source || (article as any).rssSource || 'الموقع الرسمي')}</span>
                   </p>
                   <p className="text-[11px] text-slate-500 font-bold">
                     {isArticleType 
                       ? (article.editorName || 'مقال وتحليل رياضي - منصة الاتحاد') 
                       : (article.editorName && article.editorName !== 'محرر صحفي' && article.editorName !== 'المركز الإعلامي'
                           ? `محرر الخبر: ${article.editorName}`
                           : 'مصدر الخبر')}
                   </p>
                </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
                <div className="flex items-center gap-1">
                   <Heart size={15} />
                   <span className="text-xs font-bold">124</span>
                </div>
             </div>
          </div>

            <div className="prose dark:prose-invert max-w-none">
              {article.videoUrl && article.videoUrl.trim() !== '' && (
                <div className="mb-6 rounded-lg md:rounded-xl overflow-hidden shadow-sm not-prose">
                  <VideoEmbedWidget 
                    videoUrl={article.videoUrl} 
                    videoType={article.videoType || 'auto'}
                    title={article.title}
                    subtitle={isArticleType ? 'فيديو مرفق بالمقال' : 'فيديو مرفق بالخبر'}
                    aspectRatio="16/9"
                  />
                </div>
              )}

              <div className={`text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap ${
                isArticleType ? 'font-serif md:text-lg leading-loose md:leading-loose text-slate-800 dark:text-slate-200' : ''
              }`}>
                {article.content || (isArticleType ? 'لا يوجد نص متاح لهذا المقال في الوقت الحالي.' : 'لا يوجد محتوى متاح لهذا الخبر في الوقت الحالي.')}
              </div>
            {article.type === 'rss' && (
               <div className="mt-8 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                     <Rss size={18} />
                     <span className="text-sm font-bold">مصدر خارجي</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">هذا الخبر تم جلبه عبر خدمة RSS، لمزيد من التفاصيل يمكنك زيارة المصدر الأصلي.</p>
                  <a 
                    href={article.rssUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors"
                  >
                    عرض المصدر الأصلي
                  </a>
               </div>
            )}
          </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
