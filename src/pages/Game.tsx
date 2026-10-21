import React from 'react';
import { 
  Gamepad2, 
  Play, 
  Sparkles, 
  Trophy, 
  Smartphone, 
  Monitor, 
  ExternalLink,
  ArrowRight,
  Radio,
  Flame,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function Game() {
  const navigate = useNavigate();
  const gameUrl = '/games/ittihadawy/index.html';

  const handleStartGame = () => {
    // Open the game in full window / standalone
    window.location.href = gameUrl;
  };

  const handleOpenStandalone = () => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark pb-24 pt-3" dir="rtl">
      <SEOHead 
        title="لعبة اتحاداوي — حكايات زعيم الثغر"
        description="العب الآن لعبة اتحاداوي ثلاثية الأبعاد التفاعلية في شوارع الإسكندرية. اهرب واجمع الكؤوس والشعارات الخضراء وعِش أجواء سيد البلد."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Navigation & Back to App Bar */}
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span>الرئيسية</span>
            </Link>
            <span>/</span>
            <span className="text-primary dark:text-emerald-400 font-bold">لعبة اتحاداوي 🎮</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-surface-dark hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-300/60 dark:border-white/10 active:scale-95"
            title="العودة للصفحة الرئيسية للتطبيق"
          >
            <ArrowRight size={14} />
            <span>العودة للتطبيق</span>
          </button>
        </div>

        {/* Hero Card & Start Game Action */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 p-6 sm:p-10 shadow-2xl text-white">
          {/* Background Glows & Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles size={13} className="text-amber-400" />
                <span>إصدار ثلاثي الأبعاد 3D</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Trophy size={13} />
                <span>زعيم الثغر • سيد البلد</span>
              </span>
            </div>

            {/* Icon + Title */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 shadow-xl shadow-emerald-500/30 mb-2">
                <Gamepad2 size={42} className="animate-pulse" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                لعبة اتحاداوي — حكايات زعيم الثغر
              </h1>

              <p className="text-xs sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
                عِش حماس شوارع الإسكندرية ومعالمها التاريخية! اركض، راوغ وتفادَ العوائق، واجمع الكؤوس والشعارات الخضراء لحصد أعلى نقاط لجماهير سيد البلد.
              </p>
            </div>

            {/* PRIMARY START GAME BUTTON (زر شاشة مستقلة وهو زر البدء) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full sm:flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-base sm:text-lg font-black shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={22} fill="currentColor" />
                <span>ابدأ اللعب الآن</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStandalone}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                title="فتح اللعبة في نافذة جديدة مستقلة"
              >
                <ExternalLink size={17} />
                <span className="whitespace-nowrap">نافذة جديدة</span>
              </button>
            </div>

            {/* Halftime quick alert banner */}
            <div className="w-full max-w-md p-3 rounded-2xl bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-right">
                <Radio size={16} className="text-red-400 animate-pulse shrink-0" />
                <span>بث الماتش شغال؟ العب واستمتع بين الشوطين</span>
              </div>
              <Link
                to="/live"
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold text-[11px] shrink-0 transition-colors"
              >
                البث المباشر ←
              </Link>
            </div>
          </div>
        </div>

        {/* Game Explanation & Controls (شرح اللعبة وأزرار التحكم) */}
        <div className="rounded-3xl bg-white dark:bg-card-dark p-6 sm:p-8 border border-slate-200 dark:border-border-dark shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white border-b border-slate-100 dark:border-border-dark/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
              <Gamepad2 size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">طريقة اللعب وأزرار التحكم</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                قواعد اللعبة البسيطة وطريقة اللعب على الموبايل والكمبيوتر
              </p>
            </div>
          </div>

          {/* Story & Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-surface-dark border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Trophy size={18} />
                <span>اجمع الكؤوس والشعارات</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                التقط كؤوس النادي والشعارات الخضراء المنتشرة على المسار لزيادة رصيدك ومضاعفة نقاطك.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-surface-dark border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <Flame size={18} />
                <span>تفادَ الحواجز والمطاردة</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                اقفز فوق الحواجز أو ازحف تحتها، وحافظ على مسافة آمنة من المطاردة السريعة خلفك.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-surface-dark border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <Clock size={18} />
                <span>العب بين الشوطين</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                مثالية لقضاء وقت ممتع خلال استراحة الـ 15 دقيقة بين شوطي مباريات نادي الاتحاد.
              </p>
            </div>
          </div>

          {/* Quick Character Abilities Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-red-500/10 border border-slate-200/80 dark:border-border-dark space-y-2.5">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>أبطال زعيم الثغر في اللعبة:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-card-dark border border-emerald-500/30 flex items-center gap-2">
                <span className="text-base">♬</span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">عادل شكل</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">قدرة «٦ إلا تلت»</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-card-dark border border-amber-500/30 flex items-center gap-2">
                <span className="text-base">♨</span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">جمال الدولي</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">قدرة «المبخرة»</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-card-dark border border-red-500/30 flex items-center gap-2">
                <span className="text-base">🦀</span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">حميدو البرنس</span>
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">قدرة «أبو جلمبو»</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: PC & Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Keyboard Controls */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Monitor size={18} className="text-primary dark:text-emerald-400" />
                <span>الكمبيوتر واللابتوب (لوحة المفاتيح)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>التحرك يميناً ويساراً</span>
                  <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    ← → أو A / D
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>القفز فوق الحواجز</span>
                  <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    ↑ أو W
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>الزحف وتفادي العوائق</span>
                  <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    ↓ أو S
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>تفعيل القدرة الخاصة</span>
                  <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    المسافة (Space)
                  </span>
                </li>
              </ul>
            </div>

            {/* Mobile / Touch Controls */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Smartphone size={18} className="text-amber-500" />
                <span>الهواتف والأجهزة اللوحية (لمس / Touch)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>تغيير مسار الركض</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    سحب يميناً أو يساراً (Swipe)
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>القفز السريع</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    سحب لأعلى (Swipe Up)
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>التدحرج والزحف</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    سحب لأسفل (Swipe Down)
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200/60 dark:border-border-dark">
                  <span>استخدام القدرة</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                    زر القدرة على الشاشة
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Call to Action and Return to App */}
          <div className="pt-4 border-t border-slate-100 dark:border-border-dark/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowRight size={14} />
              <span>العودة للصفحة الرئيسية للتطبيق</span>
            </button>

            <button
              type="button"
              onClick={handleStartGame}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play size={14} fill="currentColor" />
              <span>ابدأ اللعبة الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
