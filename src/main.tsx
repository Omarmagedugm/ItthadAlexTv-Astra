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

// Capture this before lazy-loaded UI mounts so the install prompt is not missed.
window.addEventListener('beforeinstallprompt', (event: Event) => {
  event.preventDefault();
  window.deferredPwaInstallPrompt = event as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event('pwa-install-available'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPwaInstallPrompt = undefined;
});

// Handle service worker registration safely in background
registerSW({
  onNeedRefresh() {
    console.log('[PWA] New background service worker available.');
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
