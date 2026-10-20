import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, PlusSquare, X, Smartphone, Monitor } from 'lucide-react';

type InstallDevice = 'android' | 'ios' | 'desktop';

const detectInstallDevice = (): InstallDevice => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

const PWAInstallPrompt: React.FC = () => {
  const [device, setDevice] = useState<InstallDevice>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone);
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    setDevice(detectInstallDevice());
    const showTimer = window.setTimeout(() => setVisible(true), 3000);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as any);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (isInstalled) return null;

  const isIOS = device === 'ios';
  const canInstallNow = Boolean(deferredPrompt);
  const title = isIOS
    ? 'أضف قناة الاتحاد إلى جهازك'
    : device === 'android'
      ? 'ثبّت تطبيق قناة الاتحاد'
      : 'ثبّت قناة الاتحاد على الكمبيوتر';
  const subtitle = isIOS
    ? 'افتح قائمة المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».'
    : canInstallNow
      ? 'وصول أسرع إلى أخبار ومباريات زعيم الثغر.'
      : device === 'android'
        ? 'من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'
        : 'من قائمة المتصفح اختر «تثبيت التطبيق» أو «إنشاء اختصار».';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[999] sm:max-w-md sm:mx-auto standalone:hidden"
          role="dialog"
          aria-label="تثبيت تطبيق قناة الاتحاد"
          dir="rtl"
        >
          <div className="ds-content-card solid-install-card bg-white dark:bg-[#072418] rounded-xl p-5 shadow-sm border-2 border-slate-200 dark:border-emerald-600/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  {device === 'desktop' ? <Monitor size={23} /> : <Smartphone size={23} />}
                </div>
                <div>
                  <h3 className="ds-content-heading text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
                  <p className="mt-1 text-[12px] leading-5 font-bold text-slate-500 dark:text-slate-300">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="إغلاق رسالة التثبيت"
                className="ds-control p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-100 p-3 dark:border-emerald-600/20 dark:bg-[#0b3322]">
                <div className="ds-content-card flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-[#072418]">
                  <Share size={15} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span>مشاركة</span><span>←</span><PlusSquare size={15} /><span>إضافة إلى الشاشة الرئيسية</span>
                </div>
              </div>
            )}

            {canInstallNow && !isIOS && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="ds-control mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
              >
                <Download size={17} />
                تثبيت الآن
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
