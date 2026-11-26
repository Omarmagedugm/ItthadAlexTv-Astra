import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  ExternalLink, 
  RefreshCw, 
  MessageSquare, 
  Calendar, 
  ThumbsUp, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Radio, 
  Tv, 
  Flame,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { getOptimizedImage } from '../lib/cloudinary';

const DEFAULT_FB_PAGE = 'https://www.facebook.com/itthadalexchannel';
const FB_USERNAME = 'itthadalexchannel';
const FB_PAGE_PLUGIN_SRC = 'https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v23.0';

declare global {
  interface Window {
    FB?: {
      init?: (options: { appId?: string; xfbml: boolean; version: string }) => void;
      XFBML?: {
        parse?: (node?: HTMLElement | null, callback?: () => void) => void;
      };
    };
    fbAsyncInit?: () => void;
  }
}

export default function SocialMedia() {
  const { appSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'channels'>('timeline');
  const [copied, setCopied] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const feedContainer = useRef<HTMLDivElement>(null);

  const fbUrl = (appSettings as any)?.socialLinks?.facebook || (appSettings as any)?.facebookPageUrl || DEFAULT_FB_PAGE;

  useEffect(() => {
    if (activeTab === 'channels') return;

    let active = true;
    setFeedLoading(true);
    setFeedError(false);

    const finishLoading = () => {
      if (active) setFeedLoading(false);
    };

    const initFbPlugin = () => {
      if (!active) return;
      try {
        if (window.FB?.init) {
          window.FB.init({ appId: '1239815761212492', xfbml: true, version: 'v23.0' });
        }
        const target = feedContainer.current;
        if (target && window.FB?.XFBML?.parse) {
          window.FB.XFBML.parse(target, finishLoading);
        } else {
          finishLoading();
        }
      } catch {
        finishLoading();
      }
    };

    window.fbAsyncInit = () => {
      window.FB?.init?.({ appId: '1239815761212492', xfbml: true, version: 'v23.0' });
      if (active && feedContainer.current) {
        initFbPlugin();
      }
    };

    const timeout = window.setTimeout(finishLoading, 10000);

    let cleanupExisting: (() => void) | undefined;
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src^="https://connect.facebook.net"]`
    );

    if (existingScript) {
      if (window.FB?.init) {
        initFbPlugin();
      } else {
        const onLoad = () => initFbPlugin();
        const onError = () => {
          if (active) {
            setFeedLoading(false);
            setFeedError(true);
          }
        };
        existingScript.addEventListener('load', onLoad);
        existingScript.addEventListener('error', onError);
        cleanupExisting = () => {
          existingScript.removeEventListener('load', onLoad);
          existingScript.removeEventListener('error', onError);
        };
      }
    } else {
      const script = document.createElement('script');
      script.src = FB_PAGE_PLUGIN_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => initFbPlugin();
      script.onerror = () => {
        if (active) {
          setFeedLoading(false);
          setFeedError(true);
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      active = false;
      window.clearTimeout(timeout);
      cleanupExisting?.();
    };
  }, [activeTab, feedVersion]);

  const youtubeUrl = (appSettings as any)?.socialLinks?.youtube || 'https://youtube.com/@itthadalexchannel';
  const instagramUrl = (appSettings as any)?.socialLinks?.instagram || 'https://instagram.com/itthadalexchannel';
  const tiktokUrl = (appSettings as any)?.socialLinks?.tiktok || 'https://tiktok.com/@itthadalexchannel';
  const twitterUrl = (appSettings as any)?.socialLinks?.twitter || 'https://x.com/itthadalexchannel';
  const whatsappUrl = (appSettings as any)?.socialLinks?.whatsapp || 'https://wa.me/itthadalexchannel';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fbUrl);
      setCopied(true);
      toast.success('تم نسخ رابط صفحة الفيسبوك');
    } catch { toast.error('تعذر نسخ الرابط'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'صفحة قناة الاتحاد السكندري الرسمية على فيسبوك',
          text: 'تابع أحدث أخبار وتغطيات قناة الاتحاد السكندري عبر الصفحة الرسمية',
          url: fbUrl,
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  // Official Channel Social Links - All customizable from Admin Dashboard
  const socialChannels = [
    {
      name: 'صفحة فيسبوك الرسمية',
      handle: '@itthadalexchannel',
      url: fbUrl,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      badge: 'الصفحة المعتمدة',
      active: true,
    },
    {
      name: 'قناة اليوتيوب الرسمية',
      handle: '@itthadalexchannel',
      url: youtubeUrl,
      color: 'from-red-600 to-red-700',
      bgColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      badge: 'فيديوهات وملخصات',
      active: true,
    },
    {
      name: 'حساب إنستجرام الرسمي',
      handle: '@itthadalexchannel',
      url: instagramUrl,
      color: 'from-pink-600 to-purple-600',
      bgColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      badge: 'صور وتصاميم حصرية',
      active: true,
    },
    {
      name: 'حساب تيك توك الرسمي',
      handle: '@itthadalexchannel',
      url: tiktokUrl,
      color: 'from-slate-900 to-slate-800',
      bgColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.96-4.49V8.65a8.28 8.28 0 0 0 4.81 1.51V6.69z"/>
        </svg>
      ),
      badge: 'مقاطع وتغطيات سريعة',
      active: true,
    },
    {
      name: 'حساب إكس (تويتر سابقاً)',
      handle: '@itthadalexchannel',
      url: twitterUrl,
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      badge: 'أخبار وتغريدات عاجلة',
      active: true,
    },
    {
      name: 'حساب واتساب الرسمي للدردشة',
      handle: '@itthadalexchannel',
      url: whatsappUrl,
      color: 'from-emerald-600 to-green-600',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
      ),
      badge: 'دردشة وتواصل مباشر',
      active: true,
    }
  ];

  return (
    <div className="ds-biz-page pb-24">
      {/* Toolbar: channel identity and actions */}
      <div className="ds-toolbar flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative w-16 h-16 rounded-xl border-2 border-[var(--ds-line)] bg-[var(--ds-surface)] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={getOptimizedImage(appSettings?.appLogo, 160) || '/icon.png'}
              alt="قناة الاتحاد السكندري"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="ds-page-heading truncate">سوشيال ميديا</h1>
              <CheckCircle2 size={17} className="text-blue-500 shrink-0 fill-blue-500/15" />
            </div>
            <p className="text-xs text-[var(--ds-muted)] font-bold" dir="ltr">@{FB_USERNAME}</p>
            <p className="text-[11px] text-[var(--ds-muted)] font-bold leading-snug">الصفحة الرسمية لتغطية أخبار زعيم الثغر</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 max-sm:w-full max-sm:[&>*]:flex-1 max-sm:[&>*]:justify-center">
          <button onClick={handleShare} className="ds-primary-button flex items-center gap-1.5" aria-label="مشاركة الصفحة">
            <Share2 size={15} />
            <span>مشاركة</span>
          </button>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-control flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[12px] font-bold text-[var(--ds-text)] hover:border-blue-400/60 transition-colors"
          >
            <ExternalLink size={15} />
            <span>فيسبوك</span>
          </a>
        </div>
      </div>
      {/* Section tabs */}
      <div className="ds-toolbar">
        <div className="ds-segmented w-full" role="tablist" aria-label="أقسام سوشيال ميديا">
          <button
            role="tab"
            aria-pressed={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 justify-center ${activeTab === 'timeline' ? 'is-active' : ''}`}
          >
            <Flame size={15} />
            <span>منشورات فيسبوك</span>
          </button>
          <button
            role="tab"
            aria-pressed={activeTab === 'channels'}
            onClick={() => setActiveTab('channels')}
            className={`flex-1 justify-center ${activeTab === 'channels' ? 'is-active' : ''}`}
          >
            <Globe size={15} />
            <span>كل المنصات</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {activeTab !== 'channels' ? (
          <div className="flex flex-col items-center">
            {/* Embed Container */}
            <div className="ds-content-card w-full bg-white dark:bg-card-dark rounded-xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-border-dark p-2 flex flex-col items-center min-w-0">
              
              {/* Quick Bar Above Frame */}
              <div className="w-full flex items-center justify-between gap-2 px-3 py-2.5 mb-2 border-b border-[var(--ds-line)]">
                <div className="flex items-center gap-1.5 text-[var(--ds-muted)] font-bold text-xs">
                  <ThumbsUp size={14} className="text-blue-500 shrink-0" />
                  <span role="status">{feedLoading ? 'جاري تحميل منشورات فيسبوك…' : 'منشورات الصفحة الرسمية'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="ds-control flex items-center gap-1 text-[11px] font-bold text-[var(--ds-muted)] hover:text-[var(--ds-brand)] transition-colors"
                  >
                    <Copy size={12} />
                    <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedVersion(version => version + 1)}
                    className="ds-control inline-flex items-center gap-1 rounded-lg border border-[var(--ds-line)] px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-[var(--ds-text)]"
                  >
                    <RefreshCw size={13} className={feedLoading ? 'animate-spin' : ''} />
                    <span>إعادة تحميل</span>
                  </button>
                </div>
              </div>
              <div
                ref={feedContainer}
                className="w-full overflow-hidden rounded-lg min-h-[260px] flex justify-center"
                aria-busy={feedLoading}
              >
                {feedError ? (
                  <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-slate-200">
                    <p className="text-sm font-bold">تعذّر تحميل منشورات فيسبوك</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                      تحقق من اتصالك بالإنترنت أو عطّل مانع الإعلانات وأعد المحاولة، أو افتح الصفحة مباشرة على فيسبوك.
                    </p>
                    <a
                      href={fbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      <span>فتح الصفحة على فيسبوك</span>
                    </a>
                  </div>
                ) : (
                  <>
                    <div id="fb-root" />
                    <div
                      key={feedVersion}
                      className="fb-page"
                      data-href={fbUrl || DEFAULT_FB_PAGE}
                      data-show-posts="true"
                      data-width="500"
                      data-height="650"
                      data-small-header="false"
                      data-adapt-container-width="true"
                      data-hide-cover="false"
                      data-show-facepile="false"
                    />
                  </>
                )}
              </div>
              <p className="w-full px-2 pt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                لو لم تظهر المنشورات فوراً، جرّب الضغط على إعادة تحميل أو افتح الصفحة الرسمية مباشرة من الزر بالأسفل.
              </p>

              {/* Bottom Helpful Callout */}
              <div className="w-full mt-3 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      هل تريد التفاعل مباشرة بالتعليقات والإعجابات؟
                    </p>
                    <p className="text-[11px] font-bold text-[var(--ds-muted)] mt-0.5">
                      يمكنك فتح الصفحة في تطبيق فيسبوك بضغطة زر
                    </p>
                  </div>
                </div>

                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <span>فتح التطبيق</span>
                  <ArrowRight size={12} className="rotate-180" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* All Channels Directory Tab */
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
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 [&_svg]:w-5 [&_svg]:h-5 ${channel.bgColor} transition-transform group-hover:scale-105`}>
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
