import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Android/Chrome logic
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay to show it
      setTimeout(() => setShowAndroidPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowAndroidPrompt(false);
      setShowIosPrompt(false);
      setDeferredPrompt(null);
    });

    // iOS logic
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIos && isSafari && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowIosPrompt(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
    }
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {/* Android/Chrome Prompt */}
      {showAndroidPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[999] sm:max-w-md sm:mx-auto standalone:hidden"
        >
          <div className="ds-content-card solid-install-card bg-white dark:bg-[#072418] rounded-xl p-5 shadow-sm border-2 border-slate-200 dark:border-emerald-600/40 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                   <Smartphone size={24} />
                </div>
                <div>
                   <h3 className="ds-content-heading text-sm font-bold text-slate-800 dark:text-white">تثبيت قناة الاتحاد</h3>
                   <p className="text-[12px] font-bold text-slate-500">تصفح أسرع وبدون إنترنت</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={handleInstallClick}
                  className="ds-control bg-primary text-white px-5 py-2.5 rounded-xl text-[11px] font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  تثبيت الآن
                </button>
                <button 
                  onClick={() => setShowAndroidPrompt(false)}
                  className="ds-control p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
             </div>
          </div>
        </motion.div>
      )}

      {/* iOS Safari Prompt */}
      {showIosPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[999] sm:max-w-md sm:mx-auto standalone:hidden"
        >
          <div className="ds-content-card solid-install-card bg-white dark:bg-[#072418] rounded-xl p-6 shadow-sm border-2 border-slate-200 dark:border-emerald-600/40 relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <Smartphone size={24} />
                   </div>
                   <div>
                      <h3 className="ds-content-heading text-sm font-bold text-slate-800 dark:text-white">أضف قناة الاتحاد لهاتفك</h3>
                      <p className="text-[12px] font-bold text-slate-500">تجربة تطبيق كاملة على iPhone</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowIosPrompt(false)}
                  className="ds-control p-1 text-slate-400"
                >
                  <X size={16} />
                </button>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#0b3322] p-3 rounded-lg border border-slate-200/60 dark:border-emerald-600/20">
                   <div className="ds-content-card w-7 h-7 bg-white dark:bg-[#072418] rounded-lg flex items-center justify-center shadow-sm">
                      <Share size={14} className="text-blue-500" />
                   </div>
                   <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">1. اضغط على زر "مشاركة" في Safari</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#0b3322] p-3 rounded-lg border border-slate-200/60 dark:border-emerald-600/20">
                   <div className="ds-content-card w-7 h-7 bg-white dark:bg-[#072418] rounded-lg flex items-center justify-center shadow-sm">
                      <PlusSquare size={14} className="text-slate-700 dark:text-white" />
                   </div>
                   <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">2. اختر "إضافة لقائمة الشاشة الرئيسية"</p>
                </div>
             </div>

             <div className="mt-4 flex flex-col items-center gap-2">
                <div className="animate-bounce">
                   <div className="w-1 h-4 bg-primary rounded-full"></div>
                   <div className="w-3 h-3 border-r-4 border-b-4 border-primary rotate-45 -mt-2"></div>
                </div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">تطبيق سريع وبسيط</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
