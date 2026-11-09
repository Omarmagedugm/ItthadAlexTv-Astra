import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function OfflineLiveGate({children}: {children: React.ReactNode}) {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (online) return <>{children}</>;
  return <section dir="rtl" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
    <WifiOff size={44} className="text-slate-400" />
    <h1 className="text-xl font-bold">البث المباشر محتاج إنترنت</h1>
    <p className="text-sm text-slate-500">تقدر تقرأ الأخبار المحفوظة وتشوف نتائج المباريات اللي اتخزنت قبل كده.</p>
    <Link className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white" to="/offline-reads">الأخبار المحفوظة</Link>
  </section>;
}
