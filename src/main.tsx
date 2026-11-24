import { clearInstalledApp, rememberAppInstalled, isStandaloneApp, type BeforeInstallPromptEvent } from './lib/pwaInstallation';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/confetti';
import { registerSW } from 'virtual:pwa-register';

declare global {
  interface Window {
    deferredPwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

if (isStandaloneApp()) rememberAppInstalled();

// Capture this before lazy-loaded UI mounts so the install prompt is not missed.
window.addEventListener('beforeinstallprompt', (event: Event) => {
  event.preventDefault();
  if (isStandaloneApp()) return;
  // Browser firing beforeinstallprompt proves the app is not currently installed.
  clearInstalledApp();
  window.deferredPwaInstallPrompt = event as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event('pwa-install-available'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPwaInstallPrompt = undefined;
  rememberAppInstalled();
});

// Register immediately so the offline app shell is installed right away on mobile Safari.
// Updates must not reload an active session.
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use');
  },
  onRegisterError(error) {
    console.warn('[PWA] Service Worker registration error:', error);
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
