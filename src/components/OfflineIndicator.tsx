import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WifiOff, Wifi, X } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
      setShowReconnected(false);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowReconnected(true);
      reconnectTimer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  if (typeof document === 'undefined') return null;
  if (isOnline && !showReconnected) return null;
  if (!isOnline && dismissed) return null;

  const content = (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className="fixed inset-x-3 z-[9990] flex justify-center pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
          isOnline
            ? 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'
            : 'border-amber-400/40 bg-[#0b291d]/95 text-amber-100'
        }`}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
        )}
        <span>
          {isOnline
            ? 'تمت استعادة الاتصال بالإنترنت'
            : 'أنت غير متصل بالإنترنت — يتم عرض المحتوى المحفوظ'}
        </span>
        {!isOnline && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="إغلاق التنبيه"
            className="mr-1 rounded-full p-0.5 text-amber-200/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
