import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';

interface AppPreloaderProps {
  fullScreen?: boolean;
}

export default function AppPreloader({ fullScreen = true }: AppPreloaderProps) {
  const appLogo = useAppStore(state => state.appSettings.headerLogoLight || state.appSettings.appLogo || '/icon.png');
  useEffect(() => {
    if (!fullScreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullScreen]);

  const splash = <div className={`app-splash ${fullScreen ? 'app-splash--fullscreen' : 'app-splash--inline'}`} role="status" aria-live="polite" aria-busy="true" dir="rtl">
    <div className="app-splash-brand"><div className="app-splash-halo" aria-hidden="true"/><img src={appLogo} alt="قناة الاتحاد" width="128" height="128" fetchPriority="high" decoding="sync" onError={event => { event.currentTarget.src = '/icon.png'; }}/></div>
    <div className="app-splash-progress" aria-hidden="true"><span/></div>
    <span className="app-splash-label">جاري التحميل</span>
  </div>;
  return fullScreen ? createPortal(splash, document.body) : splash;
}
