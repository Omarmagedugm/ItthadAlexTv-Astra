import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { onIdTokenChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Trophy, RefreshCw, UserCheck, Flame } from 'lucide-react';
import { auth, db } from '../../lib/firebase';

type Entry = {
  id: string;
  name: string;
  score: number;
  character?: string;
};

const number = new Intl.NumberFormat('ar-EG');
const PAGE_SIZE = 10;

const CHARACTERS: Record<string, string> = {
  adel: 'عادل شكل',
  gamal: 'جمال الدولي',
  hamido: 'حميدو'
};

export default function GameLeaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [uid, setUid] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);
  const [errorCode, setErrorCode] = useState('');

  // Keep track of auth session changes
  useEffect(() => {
    return onIdTokenChanged(auth, user => {
      setUid(user?.uid ?? null);
    });
  }, []);

  // Online reconnection trigger
  useEffect(() => {
    const reconnect = () => setRetry(value => value + 1);
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, []);

  // Fetch leaderboard entries in real-time
  useEffect(() => {
    setState('loading');
    setErrorCode('');
    let active = true;

    const timeout = window.setTimeout(() => {
      if (!active) return;
      setErrorCode('unavailable');
      setState('error');
    }, 15000);

    const q = query(
      collection(db, 'users'),
      where('stats.ittihadawyScore', '>=', 1),
      orderBy('stats.ittihadawyScore', 'desc'),
      limit(visibleCount + 1)
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      snapshot => {
        if (!active) return;
        if (snapshot.empty && snapshot.metadata.fromCache) return;
        window.clearTimeout(timeout);

        setHasMore(snapshot.docs.length > visibleCount);

        const loaded = snapshot.docs.slice(0, visibleCount).map(item => {
          const data = item.data();
          const stats = data.stats || {};
          const rawScore = Number(stats.ittihadawyScore ?? data.ittihadawyScore ?? 0);
          const score = Math.floor(rawScore);

          // Auto-heal decimal scores for currently logged-in user in Firestore
          if (uid && item.id === uid && typeof stats.ittihadawyScore === 'number' && !Number.isInteger(stats.ittihadawyScore)) {
            updateDoc(doc(db, 'users', uid), {
              'stats.ittihadawyScore': score,
              'stats.ittihadawyDistance': Math.floor(Number(stats.ittihadawyDistance || 0))
            }).catch(() => {});
          }

          return {
            id: item.id,
            name: data.name || data.displayName || data.username || 'عضو الاتحاد',
            score,
            character: String(stats.ittihadawyCharacter || data.ittihadawyCharacter || '')
          };
        }).filter(item => !isNaN(item.score) && item.score >= 1);

        setEntries(loaded);
        setState('ready');
      },
      error => {
        if (!active) return;
        window.clearTimeout(timeout);
        console.warn('[GameLeaderboard] Read failed:', error.code);
        setErrorCode(error.code);
        setState('error');
      }
    );

    return () => {
      active = false;
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [retry, visibleCount]);

  const userEntryIndex = uid ? entries.findIndex(e => e.id === uid) : -1;
  const userEntry = userEntryIndex >= 0 ? entries[userEntryIndex] : null;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-card-dark"
      aria-labelledby="game-ranking-title"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Trophy size={24} />
          </span>
          <div>
            <h2 id="game-ranking-title" className="text-lg font-black text-slate-900 dark:text-white">
              أعلى أرقام اتحاداوي
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              قائمة ترتيب المتنافسين حسب أعلى سكور · من نقطة واحدة وحتى الصدارة
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Flame size={14} className="text-amber-500" />
            <span>{number.format(entries.length)} متنافسين مسجلين</span>
          </span>
        )}
      </div>

      {/* Guest Callout */}
      {!uid && (
        <div className="bg-emerald-50/70 px-5 py-3 text-xs text-slate-700 dark:bg-emerald-950/20 dark:text-slate-300">
          💡 <Link to="/auth" className="font-bold text-emerald-700 underline dark:text-emerald-400">سجّل دخولك بحسابك</Link> عشان نتيجتك تتسجل باسمك وتظهر في قائمة الترتيب.
        </div>
      )}

      {/* Personal user status badge if in list */}
      {userEntry && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck size={18} />
            <span className="text-xs font-bold">
              ترتيبك الحالي: <strong className="text-sm font-black underline">المركز {number.format(userEntryIndex + 1)}</strong>
            </span>
          </div>
          <div className="text-left font-bold">
            <span className="text-base tabular-nums">{number.format(userEntry.score)}</span>
            <span className="mr-1 text-xs font-normal opacity-90">نقطة</span>
          </div>
        </div>
      )}

      {/* Body List */}
      <div className="p-4 sm:p-5" aria-live="polite">
        {state === 'loading' && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <RefreshCw size={24} className="animate-spin text-emerald-600" />
            <p className="mt-3 text-sm text-slate-500">جاري تحميل قائمة أعلى أرقام اتحاداوي…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">
              {errorCode === 'permission-denied'
                ? 'تعذّر السماح بعرض الترتيب. تأكد من تحديث القواعد.'
                : errorCode === 'unavailable'
                ? 'الاتصال بقاعدة البيانات استغرق وقتاً طويلاً. تأكد من اتصال الإنترنت.'
                : 'تعذّر تحميل الترتيب حالياً.'}
            </p>
            <button
              type="button"
              onClick={() => setRetry(v => v + 1)}
              className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-500/20"
            >
              <RefreshCw size={15} />
              إعادة المحاولة
            </button>
          </div>
        )}

        {state === 'ready' && entries.length === 0 && (
          <div className="py-12 text-center">
            <span className="text-4xl">🎮</span>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white">الصدارة مستنياك!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              العب أول جولة وسجّل سكور من نقطة واحدة عشان تكون أول اسم هنا.
            </p>
          </div>
        )}

        {/* Real Open List */}
        {entries.length > 0 && (
          <ol className="divide-y divide-slate-100 dark:divide-white/5">
            {entries.map((entry, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isCurrentUser = entry.id === uid;

              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3.5 py-3 transition ${
                    isCurrentUser ? 'rounded-2xl bg-emerald-500/10 px-3 ring-1 ring-emerald-500/30' : 'px-2'
                  }`}
                >
                  {/* Rank Symbol */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                      isFirst
                        ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300'
                        : isSecond
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : isThird
                        ? 'bg-amber-700/15 text-amber-800 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                    }`}
                  >
                    {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : number.format(index + 1)}
                  </div>

                  {/* Player Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {entry.name}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          أنت
                        </span>
                      )}
                    </div>
                    {entry.character && CHARACTERS[entry.character] && (
                      <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                        بشخصية {CHARACTERS[entry.character]}
                      </span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-left">
                    <span className="block text-base font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                      {number.format(entry.score)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">نقطة</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Load More Button */}
        {hasMore && state !== 'error' && (
          <button
            type="button"
            disabled={state === 'loading'}
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {state === 'loading' ? (
              <>
                <RefreshCw size={14} className="animate-spin text-emerald-600" />
                <span>جاري تحميل المزيد من المتنافسين…</span>
              </>
            ) : (
              <span>المزيد من المتنافسين (حتى نقطة واحدة) ←</span>
            )}
          </button>
        )}
      </div>
    </section>
  );
}

