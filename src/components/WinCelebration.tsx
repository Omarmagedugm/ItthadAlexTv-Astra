import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, PartyPopper, Crown } from 'lucide-react';
import confetti from '../lib/confetti';
import { SafeImage } from './SafeImage';

interface WinCelebrationProps {
  show: boolean;
  onComplete: () => void;
  match: {
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    homeLogo?: string;
    awayLogo?: string;
    sport?: string;
  };
}

export default function WinCelebration({ show, onComplete, match }: WinCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const duration = 7 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#fbbf24', '#ffffff', '#f59e0b', '#10b981'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#fbbf24', '#ffffff', '#f59e0b', '#10b981'] });
      }, 250);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 8000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [show, onComplete]);

  return createPortal(
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-labelledby="win-celebration-title" dir="rtl"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden p-3 sm:p-6 pointer-events-auto"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(69,26,3,0.88),rgba(23,10,2,0.96))] backdrop-blur-md" />

          <button
            onClick={() => { setIsVisible(false); onComplete(); }}
            style={{ top: 'max(12px, env(safe-area-inset-top))', right: 'max(12px, env(safe-area-inset-right))' }}
            className="ds-control fixed z-50 p-3 bg-white/10 hover:bg-white/25 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all pointer-events-auto"
            title="إغلاق" aria-label="إغلاق رسالة الفوز"
          >
            <X size={24} />
          </button>

          <motion.div
            initial={{ scale: 0.6, y: 80, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="relative flex flex-col items-center max-w-md w-full min-w-0 max-h-[calc(100dvh-24px)] overflow-y-auto py-12 sm:py-16"
          >
            <div className="relative mb-[-30px] z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 p-[3px] shadow-[0_20px_60px_rgba(245,158,11,0.5)]"
              >
                <div className="ds-content-card rounded-3xl bg-[#1c1204] p-5 flex items-center justify-center">
                  <Crown className="h-16 w-16 text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]" strokeWidth={2.2} />
                </div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-3xl border-2 border-amber-400"
              />
            </div>

            <div className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-5 pb-7 pt-14 text-center shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <motion.div
                animate={{ x: ["120%", "-160%"] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 0.8 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent skew-x-[-12deg]"
              />

              <div className="relative w-full min-w-0">
                <motion.h2
                  id="win-celebration-title"
                  initial={{ scale: 0.4, rotate: -5, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 14 }}
                  style={{ fontSize: 'clamp(1.8rem, 8vw, 2.75rem)' }}
                  className="ds-content-heading bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-400 bg-clip-text font-black uppercase text-transparent drop-shadow-[0_8px_24px_rgba(245,158,11,0.4)]"
                >
                  سيد البلد فاز!
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-1.5"
                >
                  <PartyPopper size={16} className="shrink-0 text-amber-300" />
                  <span className="text-sm font-bold text-amber-100 sm:text-base">مبروك لنادي الاتحاد السكندري</span>
                  <PartyPopper size={16} className="shrink-0 text-amber-300" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 w-full min-w-0"
                >
                  <div className="flex w-full min-w-0 flex-col items-center rounded-2xl border border-white/15 bg-black/45 px-3 py-5 ring-1 ring-white/10 sm:px-6">
                    <div className="relative grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                      <div className="flex min-w-0 flex-col items-center gap-2">
                        <div className="ds-content-card h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-2 shadow-inner sm:h-16 sm:w-16">
                          <SafeImage teamName={match.homeTeam} src={match.homeLogo} className="h-full w-full object-contain drop-shadow-md" alt={match.homeTeam} />
                        </div>
                        <span className="w-full break-words text-[11px] font-bold text-white/80 sm:text-xs">{match.homeTeam}</span>
                      </div>

                      <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-3">
                        <motion.span
                          key={match.homeScore}
                          initial={{ scale: 1.8, color: "#fbbf24" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          transition={{ duration: 0.6 }}
                          style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}
                          className="font-black leading-none tabular-nums drop-shadow-sm"
                        >
                          {match.homeScore}
                        </motion.span>
                        <span className="text-xl font-bold text-white/30 sm:text-2xl">-</span>
                        <motion.span
                          key={match.awayScore}
                          initial={{ scale: 1.8, color: "#fbbf24" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          transition={{ duration: 0.6 }}
                          style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}
                          className="font-black leading-none tabular-nums drop-shadow-sm"
                        >
                          {match.awayScore}
                        </motion.span>
                      </div>

                      <div className="flex min-w-0 flex-col items-center gap-2">
                        <div className="ds-content-card h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-2 shadow-inner sm:h-16 sm:w-16">
                          <SafeImage teamName={match.awayTeam} src={match.awayLogo} className="h-full w-full object-contain drop-shadow-md" alt={match.awayTeam} />
                        </div>
                        <span className="w-full break-words text-[11px] font-bold text-white/80 sm:text-xs">{match.awayTeam}</span>
                      </div>
                    </div>

                    <div className="mt-6 w-full border-t border-white/10 pt-4 text-center">
                      <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-amber-300/70">
                        {match.sport === 'basketball' ? 'كرة السلة' : 'كرة القـدم'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
}
