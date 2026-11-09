import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { getIdbItem } from '../lib/idbCache';

export default function OfflineStatusBar() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(null);
  useEffect(() => {
    const refresh = () => setOnline(navigator.onLine);
    window.addEventListener('offline', refresh);
    window.addEventListener('online', refresh);
    void getIdbItem<number>('lastPublicSync').then(setLastSync);
    return () => { window.removeEventListener('offline', refresh); window.removeEventListener('online', refresh); };
  }, []);
  if (online) return null;
  return <div role="status" aria-live="polite" dir="rtl" className="sticky top-0 z-[90] flex flex-wrap items-center justify-center gap-2 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
    <WifiOff size={16} aria-hidden="true" /> بتتصفح النسخة المحفوظة بدون نت
    {lastSync && <span className="font-normal">• آخر مزامنة: {new Date(lastSync).toLocaleString('ar-EG')}</span>}
  </div>;
}
