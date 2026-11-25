import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap } from 'lucide-react';
import confetti from '../lib/confetti';
import { SafeImage } from './SafeImage';

interface GoalCelebrationProps {
  show: boolean;
  onComplete: () => void;
  teamName: string;
  match?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    homeLogo?: string;
    awayLogo?: string;
  };
}

export default function GoalCelebration({ show, onComplete, teamName, match }: GoalCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#10b981', '#ffffff', '#059669', '#fbbf24']
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#10b981', '#ffffff', '#059669', '#fbbf24']
        });
      }, 250);

      const timer = setTimeout(() => {
        onComplete();
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,78,59,0.85),rgba(2,20,15,0.95))] backdrop-blur-md" />

          <button
            onClick={() => { setIsVisible(false); onComplete(); }}
            className="ds-control absolute top-8 right-8 z-50 p-3 bg-white/10 hover:bg-white/25 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all pointer-events-auto"
            title="إغلاق الاحتفال"
            aria-label="إغلاق الاحتفال"
          >
            <X size={24} />
          </button>

          <motion.div
            initial={{ scale: 0.6, y: 80, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="relative flex flex-col items-center w-full max-w-md px-4"
          >
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="relative z-10 mb-[-28px]"
            >
              <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-[3px] shadow-[0_20px_60px_rgba(16,185,129,0.45)]">
                <div className="ds-content-card rounded-3xl bg-white p-5 flex items-center justify-center">
                  <Zap size={64} strokeWidth={2.5} className="text-emerald-500 fill-emerald-500" />
                </div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-3xl border-2 border-emerald-400"
              />
            </motion.div>

            <div className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl pt-12 pb-7 px-5 text-center">
              <motion.div
                animate={{ x: ["120%", "-160%"] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "linear", repeatDelay: 0.6 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-12deg]"
              />

              <div className="relative">
                <motion.h1
                  initial={{ scale: 0.4, rotate: -6, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 14 }}
                  className="bg-gradient-to-b from-white via-emerald-100 to-emerald-300 bg-clip-text text-6xl font-black italic tracking-tighter text-transparent drop-shadow-[0_8px_24px_rgba(16,185,129,0.4)] sm:text-7xl"
                >
                  GOOOOAL!
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1.5"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-lg font-bold tracking-wide text-emerald-100">
                    {teamName} سجل!
                  </span>
                </motion.div>

                {match && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mx-auto mt-7 flex max-w-xs items-center justify-between rounded-2xl border border-white/15 bg-black/45 px-5 py-4 ring-1 ring-white/10"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="ds-content-card flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 p-2">
                        <SafeImage teamName={match.homeTeam} src={match.homeLogo} className="h-full w-full object-contain drop-shadow-md" alt={match.homeTeam} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.span
                        key={match.homeScore}
                        initial={{ scale: 1.8, color: "#34d399" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-black tabular-nums"
                      >
                        {match.homeScore}
                      </motion.span>
                      <span className="text-2xl font-bold text-white/30">-</span>
                      <motion.span
                        key={match.awayScore}
                        initial={{ scale: 1.8, color: "#34d399" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-black tabular-nums"
                      >
                        {match.awayScore}
                      </motion.span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="ds-content-card flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 p-2">
                        <SafeImage teamName={match.awayTeam} src={match.awayLogo} className="h-full w-full object-contain drop-shadow-md" alt={match.awayTeam} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(16,185,129,0)",
                  "0 0 120px 60px rgba(16,185,129,0.25)",
                  "0 0 0px 0px rgba(16,185,129,0)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="h-1 w-1 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
