import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink, 
  Sparkles, 
  Info, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Compass, 
  Award,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function Game() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRestart = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const characters = [
    {
      name: 'عادل شكل',
      title: 'كبير مشجعي الثغر',
      ability: '٦ إلا تلت ♬',
      desc: 'زمارة إسكندرانية حماسية بصوت قوي تعطّل المطاردة وتفتح لك طريق الهروب.',
      avatar: '/games/ittihadawy/references/adel-horn.png',
      badge: 'القدرة: تجميد المطاردة',
      color: 'from-emerald-700 to-green-900',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      name: 'جمال الدولي',
      title: 'عاشق الأخضر',
      ability: 'المبخرة ♨',
      desc: 'دخان أخضر كثيف بالبخور الإسكندراني يشتّت المطاردة ويساعد على المناورة.',
      avatar: '/games/ittihadawy/references/image(1).png',
      badge: 'القدرة: دخان التمويه',
      color: 'from-amber-700 to-yellow-900',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  ];

  const landmarks = [
    {
      title: 'استاد الإسكندرية التاريخي',
      desc: 'أقدم ملاعب إفريقيا وأبراج الإضاءة العريقة التي شهدت تتويجات زعيم الثغر.',
      img: '/games/ittihadawy/references/aep_2012.jpg'
    },
    {
      title: 'مقر النادي بالشاطبي',
      desc: 'قلب النادي النابض والذكريات التاريخية في أعرق أحياء المدينة الساحلية.',
      img: '/games/ittihadawy/references/image(2).png'
    },
    {
      title: 'المدرجات والمنصة الرئيسية',
      desc: 'أمواج الجماهير الخضراء وأهازيج سيد البلد التي تهز المدرجات.',
      img: '/games/ittihadawy/references/aep_2014.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark pb-24 pt-2" dir="rtl">
      <SEOHead 
        title="لعبة اتحاداوي — حكايات زعيم الثغر"
        description="العب لعبة اتحاداوي ثلاثية الأبعاد واهرب في شوارع ومعالم الإسكندرية مع عادل شكل وجمال الدولي واكتشف معالم النادي التاريخية."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Breadcrumb & Navigation helper */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-primary dark:text-emerald-400 font-bold">لعبة اتحاداوي 🎮</span>
          </div>
          <Link 
            to="/games/ittihadawy/index.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary dark:text-emerald-400 hover:underline"
          >
            <span>فتح في نافذة كاملة</span>
            <ExternalLink size={14} />
          </Link>
        </div>

        {/* Hero Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#073628] via-[#094d3a] to-[#04241b] text-white p-5 sm:p-7 shadow-lg border border-emerald-600/30">
          <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/15">
                <Gamepad2 size={15} />
                <span>لعبة النادي الرسمية التفاعلية</span>
                <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">جديد</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                لعبة اتحاداوي — حكايات زعيم الثغر
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-medium">
                اختار شخصيتك المفضلة واستخدم قدراتها الخاصة في مطاردات شوارع الإسكندرية ومعالم نادي الاتحاد السكندري العريقة!
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span>{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                title="إعادة بدء اللعبة"
              >
                <RotateCcw size={16} />
                <span>إعادة التشغيل</span>
              </button>

              <a
                href="/games/ittihadawy/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95"
              >
                <ExternalLink size={16} />
                <span>شاشة مستقلة</span>
              </a>
            </div>
          </div>
        </div>

        {/* Game Iframe Stage */}
        <div 
          ref={containerRef}
          className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-emerald-600/30 shadow-2xl transition-all ${
            isFullscreen ? 'fixed inset-0 z-[99999] rounded-none border-none h-screen' : 'aspect-[16/10] sm:aspect-[16/9] min-h-[460px] max-h-[720px]'
          }`}
        >
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#072418] text-white">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                <Gamepad2 size={32} className="text-emerald-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold">جاري تحميل لعبة اتحاداوي…</p>
                <p className="text-xs text-emerald-300/70">استعد للركض في شوارع الإسكندرية 🟢</p>
              </div>
            </div>
          )}

          {/* Floating bar inside fullscreen */}
          {isFullscreen && (
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 text-white hover:text-amber-300 transition-colors"
                title="إعادة التشغيل"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 text-white hover:text-rose-400 transition-colors"
                title="الخروج من ملء الشاشة"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            ref={iframeRef}
            src="/games/ittihadawy/index.html"
            title="لعبة اتحاداوي — حكايات زعيم الثغر"
            className="w-full h-full border-none select-none bg-slate-950"
            allow="autoplay; fullscreen; accelerometer; gyroscope"
            loading="eager"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Game Features & Character Guide */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">شخصيات وقدرات اللعبة</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">اختر شخصيتك داخل اللعبة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map((char, index) => (
              <motion.div
                key={char.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark p-5 border border-slate-200 dark:border-border-dark shadow-sm flex items-start gap-4"
              >
                <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/40 shadow-md">
                  <img 
                    src={char.avatar} 
                    alt={char.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/games/ittihadawy/references/ittihad-crest.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{char.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${char.badgeColor}`}>
                      {char.badge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{char.title} • مهارة {char.ability}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{char.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How to play card */}
        <div className="rounded-2xl bg-white dark:bg-card-dark p-5 sm:p-6 border border-slate-200 dark:border-border-dark shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Info size={18} className="text-primary dark:text-emerald-400" />
            <h3 className="text-base font-bold">تعليمات وأزرار التحكم</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>💻</span> على أجهزة الكمبيوتر (Keyboard):
              </p>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li><strong className="text-slate-800 dark:text-white">الأسهم (← / →):</strong> التحرك يميناً ويساراً في الشوارع.</li>
                <li><strong className="text-slate-800 dark:text-white">السهم لأعلى (↑) أو W:</strong> القفز فوق الحواجز.</li>
                <li><strong className="text-slate-800 dark:text-white">السهم لأسفل (↓) أو S:</strong> الزحف وتفادي العوائق العالية.</li>
                <li><strong className="text-slate-800 dark:text-white">مسافة (Space):</strong> تفعيل المهارة الخاصة للشخصية.</li>
              </ul>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>📱</span> على الموبايل والتابلت (Touch):
              </p>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li><strong className="text-slate-800 dark:text-white">السحب لأعلى (Swipe Up):</strong> القفز السريع.</li>
                <li><strong className="text-slate-800 dark:text-white">السحب لأسفل (Swipe Down):</strong> التدحرج والزحف.</li>
                <li><strong className="text-slate-800 dark:text-white">السحب يميناً ويساراً:</strong> تغيير المسار بسلاسة.</li>
                <li><strong className="text-slate-800 dark:text-white">زر المهارة:</strong> الضغط على أيقونة المهارة المدمجة في الشاشة.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Alexandria Landmarks in the Game */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-primary dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">معالم زعيم الثغر في اللعبة</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {landmarks.map(land => (
              <div 
                key={land.title}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm"
              >
                <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                  <img 
                    src={land.img} 
                    alt={land.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{land.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{land.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
