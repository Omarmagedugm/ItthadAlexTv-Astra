const INSTALL_KEY = 'ittihad-pwa-installed';
let installedInMemory = false;

export type InstallDevice = 'android' | 'ios' | 'desktop';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    || document.referrer.includes('android-app://');
}

export function detectInstallDevice(): InstallDevice {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Line\/|TikTok|BytedanceWebview|WhatsApp|Snapchat|Twitter|MicroMessenger|wv\)/i.test(ua);
}

export function hasInstalledApp(): boolean {
  if (installedInMemory || isStandaloneApp()) return true;
  try { return localStorage.getItem(INSTALL_KEY) === 'true'; }
  catch { return false; }
}

export function rememberAppInstalled(): void {
  installedInMemory = true;
  try { localStorage.setItem(INSTALL_KEY, 'true'); } catch {}
  window.dispatchEvent(new Event('pwa-install-state-changed'));
}

export function clearInstalledApp(): void {
  installedInMemory = false;
  try { localStorage.removeItem(INSTALL_KEY); } catch {}
  window.dispatchEvent(new Event('pwa-install-state-changed'));
}

export function openInstallPrompt(): void {
  window.dispatchEvent(new Event('pwa-open-install-prompt'));
}

export { INSTALL_KEY };

