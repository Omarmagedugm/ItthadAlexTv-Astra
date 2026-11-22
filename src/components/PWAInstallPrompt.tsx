import { createPortal } from 'react-dom';
import {
  INSTALL_KEY,
  type BeforeInstallPromptEvent,
  type InstallDevice,
  clearInstalledApp,
  detectInstallDevice,
  hasInstalledApp,
  isInAppBrowser,
  isStandaloneApp,
  rememberAppInstalled,
} from '../lib/pwaInstallation';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, PlusSquare, X, Smartphone, Monitor } from 'lucide-react';

declare global {
  interface Window {
    deferredPwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

const PWAInstallPrompt: React.FC = () => {
  const [device, setDevice] = useState<InstallDevice>(() => detectInstallDevice());
  const [inAppBrowser, setInAppBrowser] = useState<boolean>(() => isInAppBrowser());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.deferredPwaInstallPrompt ?? null : null
  );
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneApp());
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    if (isStandaloneApp()) {
      rememberAppInstalled();
      setIsStandalone(true);
      return;
    }

    const detectedDevice = detectInstallDevice();
    setDevice(detectedDevice);
    setInAppBrowser(isInAppBrowser());

    if (window.deferredPwaInstallPrompt) {
      clearInstalledApp();
      setDeferredPrompt(window.deferredPwaInstallPrompt);
    }

    let cancelled = false;
    const showTimer = window.setTimeout(() => {
      if (
        !cancelled &&
        !isStandaloneApp() &&
        !hasInstalledApp() &&
        (detectedDevice === 'android' || detectedDevice === 'ios' || Boolean(window.deferredPwaInstallPrompt))
      ) {
        setVisible(true);
      }
    }, 2500);

    const handleInstallAvailable = () => {
      if (!isStandaloneApp() && window.deferredPwaInstallPrompt) {
        setDeferredPrompt(window.deferredPwaInstallPrompt);
        setShowManualInstructions(false);
        setVisible(true);
      }
    };

    const handleOpenInstallPrompt = () => {
      if (isStandaloneApp()) return;
      clearInstalledApp();
      if (window.deferredPwaInstallPrompt) {
        setDeferredPrompt(window.deferredPwaInstallPrompt);
        setShowManualInstructions(false);
      } else {
        setShowManualInstructions(detectedDevice !== 'ios');
      }
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setVisible(false);
      setDeferredPrompt(null);
      window.deferredPwaInstallPrompt = undefined;
      rememberAppInstalled();
    };

    const syncInstallation = () => {
      if (isStandaloneApp()) {
        rememberAppInstalled();
        setIsStandalone(true);
        setVisible(false);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === INSTALL_KEY || event.key === null) syncInstallation();
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addEventListener?.('change', syncInstallation);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncInstallation);
    window.addEventListener('pwa-install-state-changed', syncInstallation);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-open-install-prompt', handleOpenInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      standaloneQuery.removeEventListener?.('change', syncInstallation);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncInstallation);
      window.removeEventListener('pwa-install-state-changed', syncInstallation);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-open-install-prompt', handleOpenInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isStandaloneApp()) {
      setIsStandalone(true);
      setVisible(false);
      return;
    }

    const promptEvent = deferredPrompt || window.deferredPwaInstallPrompt;
    if (!promptEvent) {
      setShowManualInstructions(true);
      return;
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.deferredPwaInstallPrompt = undefined;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        rememberAppInstalled();
        setVisible(false);
      } else {
        setShowManualInstructions(true);
      }
    } catch (error) {
      console.error('[PWA] Could not open the install prompt:', error);
      setShowManualInstructions(true);
    }
  };

  const handleMarkInstalled = () => {
    rememberAppInstalled();
    setVisible(false);
  };

  if (isStandalone) return null;

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
      ? 'اضغط على الزر لتثبيت التطبيق مباشرة على جهازك.'
      : inAppBrowser
        ? 'افتح الرابط في متصفح Chrome ثم اختر «تثبيت التطبيق».'
        : 'اضغط «تثبيت الآن» أو من قائمة المتصفح (⋮) اختر «تثبيت التطبيق».';

  const content = (
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
          <div className="ds-content-card solid-install-card bg-white dark:bg-[#072418] rounded-xl p-5 shadow-2xl border-2 border-slate-200 dark:border-emerald-600/40">
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

            {!isIOS && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="ds-control mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
              >
                <Download size={17} />
                تثبيت التطبيق الآن
              </button>
            )}

            <button type="button" onClick={handleMarkInstalled} className="mt-3 w-full text-center text-xs text-slate-500 underline">
              التطبيق مثبت بالفعل
            </button>

            {!isIOS && showManualInstructions && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-6 font-bold text-slate-600 dark:border-emerald-600/20 dark:bg-[#0b3322] dark:text-slate-200">
                {device === 'android'
                  ? inAppBrowser
                    ? 'أنت تتصفح من داخل تطبيق آخر. اضغط على (⋮) أعلى الشاشة واختر «فتح في Chrome»، ثم اضغط (⋮) واختر «تثبيت التطبيق».'
                    : 'من متصفح Chrome اضغط على القائمة (⋮) أعلى المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'
                  : 'من Chrome أو Edge افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إنشاء اختصار».'}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

export default PWAInstallPrompt;

