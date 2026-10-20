import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AppPreloaderProps {
  fullScreen?: boolean;
}

export default function AppPreloader({ fullScreen = true }: AppPreloaderProps) {
  useEffect(() => {
    if (!fullScreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullScreen]);

  const splash = <div className={`app-splash ${fullScreen ? 'app-splash--fullscreen' : 'app-splash--inline'}`} role="status" aria-live="polite" aria-busy="true" dir="rtl">
    <div className="app-splash-brand"><div className="app-splash-halo" aria-hidden="true"/><img src="/icon.png" alt="قناة الاتحاد" width="128" height="128" fetchPriority="high" decoding="sync"/></div>
    <div className="app-splash-progress" aria-hidden="true"><span/></div>
    <span className="app-splash-label">جاري التحميل</span>
  </div>;
  return fullScreen ? createPortal(splash, document.body) : splash;
}
