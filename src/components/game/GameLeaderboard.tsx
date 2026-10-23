import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Trophy, RefreshCw } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
type Entry = { id: string; name: string; score: number };
const number = new Intl.NumberFormat('ar-EG');
const PAGE_SIZE = 10;
export default function GameLeaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => onAuthStateChanged(auth, user => setUid(user?.uid ?? null)), []);
  useEffect(() => {
    setState('loading');
    // Keep one live, ordered prefix so score changes cannot duplicate or skip ranks.
    return onSnapshot(query(collection(db, 'users'), where('stats.ittihadawyScore', '>=', 1), orderBy('stats.ittihadawyScore', 'desc'), limit(visibleCount + 1)), snapshot => {
      setHasMore(snapshot.docs.length > visibleCount);
      setEntries(snapshot.docs.slice(0, visibleCount).map(item => {
        const data = item.data();
        return { id: item.id, name: data.name || data.displayName || 'عضو الاتحاد', score: data.stats.ittihadawyScore };
      }).filter(item => Number.isSafeInteger(item.score) && item.score >= 1));
      setState('ready');
    }, () => setState('error'));
  }, [retry, visibleCount]);
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-card-dark" aria-labelledby="game-ranking">
    <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-white/10"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-600 dark:text-amber-400"><Trophy size={22}/></span><div><h2 id="game-ranking" className="text-lg font-bold text-slate-900 dark:text-white">أعلى أرقام اتحاداوي</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">أفضل نتيجة لكل عضو · الترتيب حسب السكور</p></div></div>
    {!uid && <p className="px-5 pt-4 text-sm text-slate-600 dark:text-slate-300"><Link to="/auth" className="font-bold text-emerald-600 dark:text-emerald-400">سجّل دخولك</Link> عشان نتيجتك تتحفظ باسمك وتنافس الأعضاء.</p>}
    <div className="p-3 sm:p-5" aria-live="polite">
      {state === 'loading' && entries.length === 0 && <p className="py-8 text-center text-sm text-slate-500">جاري تحميل الترتيب…</p>}
      {state === 'error' && <div className="py-6 text-center"><p className="text-sm text-slate-500">تعذّر تحميل الترتيب الآن.</p><button onClick={() => setRetry(value => value + 1)} className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600"><RefreshCw size={15}/>إعادة المحاولة</button></div>}
      {state === 'ready' && entries.length === 0 && <p className="py-8 text-center text-sm text-slate-500">الصدارة مستنياك! العب أول جولة وسجّل اسمك هنا.</p>}
      {entries.length > 0 && <ol className="space-y-2">{entries.map((entry, index) => <li key={entry.id} className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${entry.id === uid ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-slate-50 dark:bg-white/5'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index < 3 ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'text-slate-500'}`}>{number.format(index + 1)}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.name}{entry.id === uid && <span className="mr-2 text-xs text-emerald-600">أنت</span>}</span><span className="shrink-0 text-left"><strong className="block text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{number.format(entry.score)}</strong><small className="text-[10px] text-slate-500">نقطة</small></span></li>)}</ol>}
      {hasMore && state !== 'error' && <button type="button" disabled={state === 'loading'} onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="mt-4 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-60 dark:text-emerald-300">{state === 'loading' ? <><RefreshCw size={15} className="animate-spin"/>جاري تحميل المزيد…</> : 'المزيد'}</button>}
    </div>
  </section>;
}
