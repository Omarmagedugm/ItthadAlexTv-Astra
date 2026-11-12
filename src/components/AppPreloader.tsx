import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';

interface AppPreloaderProps {
  fullScreen?: boolean;
}

export function isPreloaderDisabled(appSettings?: any): boolean {
  if (appSettings?.disablePreloader === false || appSettings?.preloaderEnabled === true) {
    return false;
  }
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('ittihad-disable-preloader') === '0') {
      return false;
    }
  } catch {}
  return true;
}

export default function AppPreloader({ fullScreen = true }: AppPreloaderProps) {
  const appSettings = useAppStore(state => state.appSettings);
  const disabled = isPreloaderDisabled(appSettings);

  useEffect(() => {
    if (!fullScreen || disabled) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullScreen, disabled]);

  if (disabled) return null;

  const splash = <div className={`app-splash ${fullScreen ? 'app-splash--fullscreen' : 'app-splash--inline'}`} role="status" aria-live="polite" aria-busy="true" dir="rtl">
    <div className="app-splash-brand"><div className="app-splash-halo" aria-hidden="true"/><img src="/icon.png" alt="قناة الاتحاد" width="128" height="128" fetchPriority="high" decoding="sync"/></div>
    <div className="app-splash-progress" aria-hidden="true"><span/></div>
    <span className="app-splash-label">جاري التحميل</span>
  </div>;
  return fullScreen ? createPortal(splash, document.body) : splash;
}

