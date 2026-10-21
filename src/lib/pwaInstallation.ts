const INSTALL_KEY = 'ittihad-pwa-installed';
let installedInMemory = false;

export function isStandaloneApp(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function hasInstalledApp(): boolean {
  if (installedInMemory || isStandaloneApp()) return true;
  try { return localStorage.getItem(INSTALL_KEY) === 'true'; }
  catch { return false; }
}

export function rememberAppInstalled(): void {
  if (installedInMemory) return;
  installedInMemory = true;
  try { localStorage.setItem(INSTALL_KEY, 'true'); } catch {}
  window.dispatchEvent(new Event('pwa-install-state-changed'));
}

export { INSTALL_KEY };
