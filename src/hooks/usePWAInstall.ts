import { useCallback, useEffect, useState } from 'react';
import {
  type BeforeInstallPromptEvent,
  type InstallDevice,
  clearInstalledApp,
  detectInstallDevice,
  isInAppBrowser,
  isStandaloneApp,
  openInstallPrompt,
  rememberAppInstalled,
} from '../lib/pwaInstallation';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.deferredPwaInstallPrompt ?? null : null
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneApp());
  const [device, setDevice] = useState<InstallDevice>(() => detectInstallDevice());
  const [inAppBrowser, setInAppBrowser] = useState<boolean>(() => isInAppBrowser());

  useEffect(() => {
    setDevice(detectInstallDevice());
    setInAppBrowser(isInAppBrowser());
    setIsStandalone(isStandaloneApp());
    if (window.deferredPwaInstallPrompt) {
      setDeferredPrompt(window.deferredPwaInstallPrompt);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isStandaloneApp()) return;
      clearInstalledApp();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.deferredPwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleInstallAvailable = () => {
      if (window.deferredPwaInstallPrompt && !isStandaloneApp()) {
        setDeferredPrompt(window.deferredPwaInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.deferredPwaInstallPrompt = undefined;
      setDeferredPrompt(null);
      setIsStandalone(true);
      rememberAppInstalled();
    };

    const syncStandalone = () => {
      const standalone = isStandaloneApp();
      setIsStandalone(standalone);
      if (standalone) {
        rememberAppInstalled();
      }
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addEventListener?.('change', syncStandalone);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', syncStandalone);

    return () => {
      standaloneQuery.removeEventListener?.('change', syncStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', syncStandalone);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = deferredPrompt || window.deferredPwaInstallPrompt;
    if (!promptEvent) {
      openInstallPrompt();
      return 'unavailable';
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.deferredPwaInstallPrompt = undefined;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        rememberAppInstalled();
        return 'accepted';
      }
      return 'dismissed';
    } catch (error) {
      console.error('[PWA] Could not open the install prompt:', error);
      openInstallPrompt();
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const canShowInstallButton = !isStandalone && (Boolean(deferredPrompt) || device === 'android' || device === 'ios');

  return {
    deferredPrompt,
    isInstallable: Boolean(deferredPrompt),
    isStandalone,
    device,
    isAndroid: device === 'android',
    isIOS: device === 'ios',
    inAppBrowser,
    canShowInstallButton,
    install,
    openInstallPrompt,
  };
}
