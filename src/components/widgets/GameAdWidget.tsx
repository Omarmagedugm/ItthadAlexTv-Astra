import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Play, 
  Sparkles, 
  Trophy, 
  Smartphone, 
  ExternalLink,
  ChevronLeft,
  Flame
} from 'lucide-react';
import { useAppStore } from '../../store';

interface GameAdWidgetProps {
  title?: string;
  className?: string;
}

export default function GameAdWidget({ title, className = '' }: GameAdWidgetProps) {
  const navigate = useNavigate();
  const { sectionFlags } = useAppStore();

  if (sectionFlags?.game === false) {
    return null;
  }

  const handleOpenStandalone = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open('/games/ittihadawy/index.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04241b] via-[#074d39] to-[#0c6b4e] dark:from-[#021811] dark:via-[#053b2b] dark:to-[#084e38] text-white p-5 sm:p-7 shadow-xl border border-emerald-500/40 group cursor-pointer ${className}`}
      onClick={() => navigate('/game')}
      dir="rtl"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-105 pointer-events-none"
        style={{ backgroundImage: `url('/games/ittihadawy/references/aep_2012.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Game Info & Badges */}
        <div className="space-y-3.5 max-w-xl text-right">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/15">
              <Gamepad2 size={15} />
              <span>لعبة النادي الرسمية</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-sm animate-pulse">
              <Sparkles size={11} className="fill-slate-950" />
              <span>جديد 3D</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              ⚡ مجاناً بدون تحميل
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight flex items-center gap-2 flex-wrap">
              <span>{title || "لعبة اتحاداوي — حكايات زعيم الثغر"}</span>
              <span className="text-amber-400 text-lg sm:text-xl">🎮</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200/90 font-medium leading-relaxed">
              عِش مغامرة الركض ثلاثية الأبعاد في شوارع ومعالم الإسكندرية الخضراء! تفادَ الحواجز، اجمع كؤوس وشعارات الاتحاد، وسجل أعلى سكور.
            </p>
          </div>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-200 font-semibold">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10">
              <Trophy size={13} className="text-amber-400" />
              <span>تحدي النقاط</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10">
              <Smartphone size={13} className="text-emerald-400" />
              <span>للموبايل والكمبيوتر</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10">
              <Flame size={13} className="text-rose-400" />
              <span>أهازيج جماهيرية</span>
            </div>
          </div>
        </div>

        {/* Right Side: CTA Action Buttons */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {/* Main Action Button */}
          <Link
            to="/game"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all group-hover:scale-105"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center">
              <Play size={14} className="fill-amber-400 ml-0.5" />
            </div>
            <span>العب الآن</span>
            <ChevronLeft size={16} />
          </Link>

          {/* Standalone Button */}
          <button
            type="button"
            onClick={handleOpenStandalone}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold transition-all active:scale-95"
            title="فتح اللعبة في نافذة مستقلة كاملة"
          >
            <ExternalLink size={13} />
            <span>شاشة مستقلة</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
