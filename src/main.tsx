import { hasInstalledApp, rememberAppInstalled, isStandaloneApp } from './lib/pwaInstallation';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/confetti';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    deferredPwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

if (isStandaloneApp()) rememberAppInstalled();

// Capture this before lazy-loaded UI mounts so the install prompt is not missed.
window.addEventListener('beforeinstallprompt', (event: Event) => {
  event.preventDefault();
  if (hasInstalledApp()) return;
  window.deferredPwaInstallPrompt = event as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event('pwa-install-available'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPwaInstallPrompt = undefined;
  rememberAppInstalled();
});

// Activate published updates automatically, without a notification or confirmation.
// Workbox only requests a reload after a new worker activates.
let updateReloadStarted = false;
registerSW({
  onNeedReload() {
    if (updateReloadStarted) return;
    updateReloadStarted = true;
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use');
  },
});

try {
  console.log('Application initialization started');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e) {
  console.error('CRITICAL BOOT ERROR:', e);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">فشل تشغيل التطبيق. يرجى إعادة المحاولة أو التواصل مع الدعم.</div>`;
}
