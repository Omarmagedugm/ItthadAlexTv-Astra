import React, { useCallback, useEffect, useState } from 'react';
import {
  Share2,
  ExternalLink,
  RefreshCw,
  Calendar,
  Globe,
  CheckCircle2,
  Copy,
  Flame,
  ArrowLeft,
  Image as ImageIcon,
  AlertCircle,
  Newspaper,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { getOptimizedImage } from '../lib/cloudinary';
import {
  FACEBOOK_PAGE_URL,
  FACEBOOK_POSTS_API_ENDPOINT,
  FACEBOOK_POSTS_LIMIT,
  FACEBOOK_USERNAME,
  type FacebookPost,
  type FacebookPostsResponse,
} from '../lib/socialConfig';

function getSafeExternalUrl(rawUrl: string | undefined, fallback: string): string {
  if (!rawUrl) return fallback;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Fallback below
  }
  return fallback;
}

function formatArabicDate(isoDate: string): { primary: string; full: string } {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return { primary: '', full: '' };
  }

  const full = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return { primary: full, full };
  }
  if (diffMinutes < 2) {
    return { primary: 'الآن', full };
  }
  if (diffMinutes < 60) {
    return { primary: `منذ ${diffMinutes} دقيقة`, full };
  }
  if (diffHours < 24) {
    if (diffHours === 1) return { primary: 'منذ ساعة', full };
    if (diffHours === 2) return { primary: 'منذ ساعتين', full };
    return { primary: `منذ ${diffHours} ساعات`, full };
  }
  if (diffDays === 1) {
    return { primary: 'منذ يوم', full };
  }
  if (diffDays === 2) {
    return { primary: 'منذ يومين', full };
  }
  if (diffDays <= 7) {
    return { primary: `منذ ${diffDays} أيام`, full };
  }

  const shortDate = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return { primary: shortDate, full };
}

function PostSkeletonCard({ withImage }: { withImage: boolean }) {
  return (
    <div
      className="bg-[#0B3D2E] border border-[#1a5c46] rounded-2xl overflow-hidden flex flex-col"
      aria-hidden="true"
    >
      <div className="p-4 flex items-center gap-3 border-b border-[#16523e]">
        <div className="skeleton animate-pulse w-10 h-10 rounded-xl bg-[#14523f] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton animate-pulse h-3.5 w-36 rounded bg-[#14523f]" />
          <div className="skeleton animate-pulse h-2.5 w-24 rounded bg-[#14523f]" />
        </div>
      </div>
      {withImage && (
        <div className="skeleton animate-pulse w-full aspect-[16/10] bg-[#14523f]" />
      )}
      <div className="p-5 space-y-2.5 flex-1">
        <div className="skeleton animate-pulse h-3.5 w-full rounded bg-[#14523f]" />
        <div className="skeleton animate-pulse h-3.5 w-11/12 rounded bg-[#14523f]" />
        <div className="skeleton animate-pulse h-3.5 w-3/4 rounded bg-[#14523f]" />
      </div>
      <div className="px-5 py-3.5 border-t border-[#16523e] flex items-center justify-between">
        <div className="skeleton animate-pulse h-3 w-28 rounded bg-[#14523f]" />
        <div className="skeleton animate-pulse h-3 w-16 rounded bg-[#14523f]" />
      </div>
    </div>
  );
}

export default function SocialMedia() {
  const { appSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'channels'>('timeline');
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fbUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.facebook || (appSettings as any)?.facebookPageUrl,
    FACEBOOK_PAGE_URL
  );
  const logoSrc = getOptimizedImage(appSettings?.appLogo, 160) || '/icon.png';

  const loadPosts = useCallback(async (signal?: AbortSignal) => {
    setFeedLoading(true);
    setFeedError(null);
    setFailedImages({});

    try {
      const url = `${FACEBOOK_POSTS_API_ENDPOINT}?limit=${FACEBOOK_POSTS_LIMIT}&t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
        signal,
      });

      const payload: FacebookPostsResponse | null = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          payload?.message ||
          'تعذّر تحميل أحدث منشورات فيسبوك حالياً. يمكنك المحاولة مرة أخرى أو فتح الصفحة مباشرة.';
        throw new Error(errorMsg);
      }

      const items = Array.isArray(payload?.posts) ? payload.posts : [];
      setPosts(items);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setFeedError(
        err?.message ||
          'تعذّر تحميل أحدث منشورات فيسبوك حالياً. يمكنك المحاولة مرة أخرى أو فتح الصفحة مباشرة.'
      );
      setPosts([]);
    } finally {
      if (!signal?.aborted) {
        setFeedLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'timeline') return;
    const controller = new AbortController();
    loadPosts(controller.signal);
    return () => controller.abort();
  }, [activeTab, refreshCounter, loadPosts]);

  const youtubeUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.youtube,
    'https://youtube.com/@itthadalexchannel'
  );
  const instagramUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.instagram,
    'https://instagram.com/itthadalexchannel'
  );
  const tiktokUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.tiktok,
    'https://tiktok.com/@itthadalexchannel'
  );
  const twitterUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.twitter,
    'https://x.com/itthadalexchannel'
  );
  const whatsappUrl = getSafeExternalUrl(
    (appSettings as any)?.socialLinks?.whatsapp,
    'https://wa.me/itthadalexchannel'
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fbUrl);
      setCopied(true);
      toast.success('تم نسخ رابط صفحة الفيسبوك');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('تعذر نسخ الرابط');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'صفحة قناة الاتحاد السكندري الرسمية على فيسبوك',
          text: 'تابع أحدث أخبار وتغطيات قناة الاتحاد السكندري عبر الصفحة الرسمية',
          url: fbUrl,
        });
      } catch {
        // User cancelled native share
      }
    } else {
      handleCopyLink();
    }
  };

  const socialChannels = [
    {
      name: 'صفحة فيسبوك الرسمية',
      handle: `@${FACEBOOK_USERNAME}`,
      url: fbUrl,
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      badge: 'الصفحة المعتمدة',
      active: true,
    },
    {
      name: 'قناة اليوتيوب الرسمية',
      handle: `@${FACEBOOK_USERNAME}`,
      url: youtubeUrl,
      bgColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      badge: 'فيديوهات وملخصات',
      active: true,
    },
    {
      name: 'حساب إنستجرام الرسمي',
      handle: `@${FACEBOOK_USERNAME}`,
      url: instagramUrl,
      bgColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      badge: 'صور وتصاميم حصرية',
      active: true,
    },
    {
      name: 'حساب تيك توك الرسمي',
      handle: `@${FACEBOOK_USERNAME}`,
      url: tiktokUrl,
      bgColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.96-4.49V8.65a8.28 8.28 0 0 0 4.81 1.51V6.69z" />
        </svg>
      ),
      badge: 'مقاطع وتغطيات سريعة',
      active: true,
    },
    {
      name: 'حساب إكس (تويتر سابقاً)',
      handle: `@${FACEBOOK_USERNAME}`,
      url: twitterUrl,
      bgColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      badge: 'أخبار وتغريدات عاجلة',
      active: true,
    },
    {
      name: 'حساب واتساب الرسمي للدردشة',
      handle: `@${FACEBOOK_USERNAME}`,
      url: whatsappUrl,
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
      ),
      badge: 'دردشة وتواصل مباشر',
      active: true,
    },
  ];

  return (
    <div className="ds-biz-page pb-24" dir="rtl">
      {/* Header Toolbar: Page identity and primary actions */}
      <div className="ds-toolbar flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative w-16 h-16 rounded-xl border-2 border-[var(--ds-line)] bg-[var(--ds-surface)] p-1.5 flex items-center justify-center shrink-0">
            <img
              src={logoSrc}
              alt="قناة الاتحاد السكندري"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="ds-page-heading truncate !mb-0 font-bold">سوشيال ميديا</h1>
              <CheckCircle2 size={17} className="text-[#2d78d0] font-bold shrink-0" />
            </div>
            <p className="text-xs text-[var(--ds-muted)] font-bold w-[127px]" dir="ltr">
              @{FACEBOOK_USERNAME}
            </p>
            <p className="text-[11px] text-[var(--ds-muted)] font-bold leading-snug">
              أحدث منشورات وتغطيات الصفحة الرسمية لقناة الاتحاد السكندري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 max-sm:w-full max-sm:[&>*]:flex-1 max-sm:[&>*]:justify-center">
          <button
            type="button"
            onClick={handleShare}
            className="ds-primary-button flex items-center gap-1.5"
            aria-label="مشاركة الصفحة"
          >
            <Share2 size={15} />
            <span>مشاركة</span>
          </button>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-control flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[12px] font-bold text-[var(--ds-text)] hover:border-[#0B3D2E] dark:hover:border-[#c5e589]/60 transition-colors"
          >
            <ExternalLink size={15} />
            <span>صفحة فيسبوك</span>
          </a>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="ds-toolbar">
        <div className="ds-segmented w-full" role="tablist" aria-label="أقسام سوشيال ميديا">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 justify-center ${activeTab === 'timeline' ? 'is-active' : ''}`}
          >
            <Flame size={15} />
            <span>منشورات فيسبوك</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'channels'}
            onClick={() => setActiveTab('channels')}
            className={`flex-1 justify-center ${activeTab === 'channels' ? 'is-active' : ''}`}
          >
            <Globe size={15} />
            <span>كل المنصات</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {activeTab === 'timeline' ? (
          <div className="space-y-5">
            {/* Feed Status & Quick Controls Bar */}
            <div className="bg-[#0B3D2E] text-white border border-[#1a5c46] rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#14523f] text-[#c5e589] flex items-center justify-center shrink-0">
                  <Newspaper size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white" role="status">
                    {feedLoading
                      ? 'جاري تحميل أحدث منشورات الصفحة...'
                      : feedError
                      ? 'تعذّر تحديث المنشورات'
                      : posts.length > 0
                      ? `أحدث ${posts.length} منشور من الصفحة الرسمية`
                      : 'لا توجد منشورات متاحة حالياً'}
                  </p>
                  <p className="text-[11px] text-[#a9d1bf] mt-0.5">
                    يتم تحديث المنشورات تلقائياً مع كل زيارة للصفحة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ds-control inline-flex items-center gap-1.5 rounded-lg border border-[#1f6a52] bg-[#104c39] hover:bg-[#155d46] px-3 py-1.5 text-[11px] font-bold text-[#e2f3eb] transition-colors"
                >
                  <Copy size={12} />
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshCounter((prev) => prev + 1)}
                  disabled={feedLoading}
                  className="ds-control inline-flex items-center gap-1.5 rounded-lg bg-[#c5e589] hover:bg-[#b7db74] text-[#0B3D2E] px-3.5 py-1.5 text-[11px] font-extrabold transition-colors disabled:opacity-70"
                >
                  <RefreshCw size={13} className={feedLoading ? 'animate-spin' : ''} />
                  <span>تحديث</span>
                </button>
              </div>
            </div>

            {/* Loading Skeleton Grid */}
            {feedLoading ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                aria-busy="true"
                aria-label="جاري تحميل منشورات فيسبوك"
              >
                <PostSkeletonCard withImage={true} />
                <PostSkeletonCard withImage={true} />
                <PostSkeletonCard withImage={false} />
                <PostSkeletonCard withImage={true} />
              </div>
            ) : feedError ? (
              /* Friendly Error State */
              <div className="bg-[#0B3D2E] text-white border border-[#1a5c46] rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#14523f] text-[#c5e589] flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="text-base font-extrabold text-white">
                    تعذّر تحميل منشورات فيسبوك
                  </h2>
                  <p className="text-xs text-[#b7d9ca] leading-relaxed">
                    {feedError}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRefreshCounter((prev) => prev + 1)}
                    className="ds-control inline-flex items-center gap-2 rounded-xl bg-[#c5e589] hover:bg-[#b7db74] text-[#0B3D2E] px-5 py-2.5 text-xs font-extrabold transition-colors"
                  >
                    <RefreshCw size={14} />
                    <span>إعادة المحاولة</span>
                  </button>
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ds-control inline-flex items-center gap-2 rounded-xl border border-[#246f57] bg-[#114e3b] hover:bg-[#165e48] text-white px-5 py-2.5 text-xs font-bold transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>فتح صفحة فيسبوك الرسمية</span>
                  </a>
                </div>
              </div>
            ) : posts.length === 0 ? (
              /* Friendly Empty State */
              <div className="bg-[#0B3D2E] text-white border border-[#1a5c46] rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#14523f] text-[#c5e589] flex items-center justify-center">
                  <Newspaper size={28} />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="text-base font-extrabold text-white">
                    لا توجد منشورات للعرض حالياً
                  </h2>
                  <p className="text-xs text-[#b7d9ca] leading-relaxed">
                    تابع صفحتنا الرسمية على فيسبوك لمشاهدة أحدث الأخبار والصور والتغطيات المباشرة لنادي الاتحاد السكندري.
                  </p>
                </div>
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-control inline-flex items-center gap-2 rounded-xl bg-[#c5e589] hover:bg-[#b7db74] text-[#0B3D2E] px-5 py-2.5 text-xs font-extrabold transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>زيارة الصفحة على فيسبوك</span>
                </a>
              </div>
            ) : (
              /* Native Posts Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {posts.map((post) => {
                  const postText = (post.message || post.story || '').trim();
                  const hasImage = Boolean(post.full_picture && !failedImages[post.id]);
                  const isImageOnly = hasImage && !postText;
                  const isTextOnly = !hasImage && Boolean(postText);
                  const formattedDate = formatArabicDate(post.created_time);
                  const postLink = getSafeExternalUrl(post.permalink_url, fbUrl);

                  return (
                    <a
                      key={post.id}
                      href={postLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-[#0B3D2E] text-white border border-[#1a5c46] hover:border-[#c5e589]/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5e589]"
                    >
                      {/* Card Header */}
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3 border-b border-[#16523e]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#07291f] border border-[#1f654e] p-1 flex items-center justify-center shrink-0">
                            <img
                              src={logoSrc}
                              alt=""
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-white truncate">
                                قناة الاتحاد السكندري
                              </span>
                              <CheckCircle2 size={13} className="text-[#c5e589] shrink-0" />
                            </div>
                            {formattedDate.primary && (
                              <time
                                dateTime={post.created_time}
                                title={formattedDate.full}
                                className="flex items-center gap-1 text-[11px] text-[#9ec9b6] font-medium mt-0.5"
                              >
                                <Calendar size={11} className="shrink-0" />
                                <span>{formattedDate.primary}</span>
                              </time>
                            )}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#12513e] text-[#c5e589] border border-[#1d6b53] shrink-0">
                          {isImageOnly ? (
                            <>
                              <ImageIcon size={11} />
                              <span>صورة</span>
                            </>
                          ) : (
                            <span>فيسبوك</span>
                          )}
                        </span>
                      </div>

                      {/* Optional Post Image */}
                      {hasImage && post.full_picture && (
                        <div
                          className={`relative w-full bg-[#07291f] overflow-hidden ${
                            isImageOnly ? 'aspect-[4/3]' : 'aspect-[16/10]'
                          }`}
                        >
                          <img
                            src={post.full_picture}
                            alt={postText ? postText.slice(0, 90) : 'منشور مصوّر من قناة الاتحاد السكندري'}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [post.id]: true }))
                            }
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}

                      {/* Post Body */}
                      <div className={`p-5 flex-1 flex flex-col ${isTextOnly ? 'justify-center' : ''}`}>
                        {postText ? (
                          <p
                            className={`whitespace-pre-line break-words text-[#eef7f3] ${
                              isTextOnly
                                ? 'text-[14.5px] leading-8 font-medium border-r-2 border-[#c5e589]/80 pr-4 line-clamp-7'
                                : 'text-[13.5px] leading-7 font-medium line-clamp-5'
                            }`}
                          >
                            {postText}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-[#b7d9ca] font-bold">
                            <ImageIcon size={15} className="text-[#c5e589] shrink-0" />
                            <span>منشور مصوّر من الصفحة الرسمية — اضغط للعرض على فيسبوك</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-3.5 bg-[#083225] border-t border-[#16523e] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#9ec9b6] font-medium truncate">
                          {formattedDate.full || 'الصفحة الرسمية'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#c5e589] group-hover:text-white transition-colors shrink-0">
                          <span>{isImageOnly ? 'عرض على فيسبوك' : 'اقرأ المزيد'}</span>
                          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Bottom Callout to Visit Official Facebook Page */}
            <div className="bg-[#0B3D2E] text-white border border-[#1a5c46] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#14523f] text-[#c5e589] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">
                    هل تريد التفاعل مباشرة بالتعليقات والإعجابات؟
                  </p>
                  <p className="text-[11px] text-[#a9d1bf] mt-0.5">
                    افتح الصفحة الرسمية لقناة الاتحاد السكندري مباشرة في فيسبوك
                  </p>
                </div>
              </div>

              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-control inline-flex items-center gap-1.5 rounded-xl bg-[#c5e589] hover:bg-[#b7db74] text-[#0B3D2E] px-4 py-2 text-xs font-extrabold transition-colors shrink-0"
              >
                <span>فتح الصفحة</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ) : (
          /* All Official Channels Directory Tab */
          <div className="space-y-3">
            <div>
              <h2 className="ds-section-title" style={{ marginBottom: 8 }}>
                منصات التواصل الرسمية لقناة الاتحاد السكندري
              </h2>
              <p className="text-[12px] text-[var(--ds-muted)] leading-relaxed" style={{ marginBottom: 16 }}>
                تابع جميع حسابات القناة الرسمية للحصول على أحدث الأخبار والتغطيات الحصرية.
              </p>
            </div>

            <div className="ds-biz-list">
              {socialChannels.map((channel, idx) => (
                <a
                  key={idx}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-biz-row"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 [&_svg]:w-5 [&_svg]:h-5 ${channel.bgColor} transition-transform group-hover:scale-105`}
                    >
                      {channel.icon}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-[var(--ds-text)] truncate">
                          {channel.name}
                        </h3>
                        {channel.active && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 shrink-0">
                            نشط
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--ds-muted)] font-bold" dir="ltr">
                        {channel.handle}
                      </p>
                      <p className="text-[11px] text-[var(--ds-muted)] font-bold">
                        {channel.badge}
                      </p>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-lg border border-[var(--ds-line)] bg-[var(--ds-surface)] flex items-center justify-center text-[var(--ds-muted)] group-hover:text-[var(--ds-brand)] transition-colors shrink-0">
                    <ExternalLink size={16} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
