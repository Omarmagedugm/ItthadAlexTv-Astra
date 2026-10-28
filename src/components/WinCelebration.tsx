import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, PartyPopper } from 'lucide-react';
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
      // Trigger massive confetti
      const duration = 7 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
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
          <div className="absolute inset-0 bg-green-950/60 backdrop-blur-md" />
          
          <button 
            onClick={() => { setIsVisible(false); onComplete(); }}
            style={{ top: 'max(12px, env(safe-area-inset-top))', right: 'max(12px, env(safe-area-inset-right))' }}
            className="ds-control fixed z-50 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all pointer-events-auto"
            title="إغلاق" aria-label="إغلاق رسالة الفوز"
          >
            <X size={24} />
          </button>
          
          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex flex-col items-center max-w-md w-full min-w-0 max-h-[calc(100dvh-24px)] overflow-y-auto py-12 sm:py-16"
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="bg-gradient-to-br from-yellow-300 to-yellow-600 p-6 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.5)] border-4 border-white/30"
              >
                <Trophy className="w-16 h-16 text-white drop-shadow-md" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl"
              />
            </div>

            <div className="text-center w-full min-w-0">
              <h2 id="win-celebration-title" style={{ fontSize: 'clamp(1.5rem, 7vw, 2.25rem)' }} className="ds-content-heading font-bold text-white uppercase drop-shadow-sm mb-2">
                سيد البلد فاز!
              </h2>
              <div className="text-yellow-400 font-bold text-sm sm:text-lg flex items-center justify-center gap-1.5 mb-5">
                <PartyPopper size={18} className="shrink-0" />
                <span>مبروك لنادي الاتحاد السكندري</span>
                <PartyPopper size={18} className="shrink-0" />
              </div>
              
              <div className="mt-5 w-full">
                <div className="flex w-full min-w-0 flex-col items-center bg-black/80 backdrop-blur-3xl px-3 py-5 sm:px-6 rounded-xl border border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50" />
                  
                  <div className="relative grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="ds-content-card w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-lg p-2 border border-white/10 shadow-inner">
                        <SafeImage teamName={match.homeTeam} src={match.homeLogo} className="w-full h-full object-contain drop-shadow-md" alt={match.homeTeam} />
                      </div>
                      <span className="text-white font-bold text-[11px] sm:text-xs w-full break-words">{match.homeTeam}</span>
                    </div>
                    
                    <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-3">
                      <span style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)' }} className="font-bold text-white tabular-nums leading-none drop-shadow-sm">
                        {match.homeScore}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-white/30">:</span>
                      <span style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)' }} className="font-bold text-white tabular-nums leading-none drop-shadow-sm">
                        {match.awayScore}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="ds-content-card w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-lg p-2 border border-white/10 shadow-inner">
                        <SafeImage teamName={match.awayTeam} src={match.awayLogo} className="w-full h-full object-contain drop-shadow-md" alt={match.awayTeam} />
                      </div>
                      <span className="text-white font-bold text-[11px] sm:text-xs w-full break-words">{match.awayTeam}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 w-full text-center">
                    <span className="text-white/40 text-[12px] font-bold uppercase tracking-[0.2em]">
                      {match.sport === 'basketball' ? 'كرة السلة' : 'كرة القـدم'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
}
