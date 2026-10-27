import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { onIdTokenChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Skull, RefreshCw, UserCheck, Flame, Crosshair } from 'lucide-react';
import { auth, db } from '../../lib/firebase';

type ZombieEntry = {
  id: string;
  name: string;
  score: number;
  kills?: number;
  character?: string;
};

const number = new Intl.NumberFormat('ar-EG');
const PAGE_SIZE = 10;

const CHARACTERS: Record<string, string> = {
  adel: 'عادل شكل',
  gamal: 'جمال الدولي',
  hamido: 'حميدو',
  lazo: 'اللازو',
  islam: 'إسلام الفار'
};

export default function ZombieLeaderboard() {
  const [entries, setEntries] = useState<ZombieEntry[]>([]);
  const [uid, setUid] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    return onIdTokenChanged(auth, user => {
      setUid(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    const reconnect = () => setRetry(value => value + 1);
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, []);

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
      where('stats.ittihadawyZombieScore', '>=', 1),
      orderBy('stats.ittihadawyZombieScore', 'desc'),
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
          const rawScore = Number(stats.ittihadawyZombieScore ?? data.ittihadawyZombieScore ?? 0);
          const score = Math.floor(rawScore);
          const rawKills = Number(stats.ittihadawyZombieKills ?? data.ittihadawyZombieKills ?? 0);
          const kills = Math.max(0, Math.floor(rawKills));

          if (uid && item.id === uid && typeof stats.ittihadawyZombieScore === 'number' && !Number.isInteger(stats.ittihadawyZombieScore)) {
            updateDoc(doc(db, 'users', uid), {
              'stats.ittihadawyZombieScore': score,
              'stats.ittihadawyZombieDistance': Math.floor(Number(stats.ittihadawyZombieDistance || 0))
            }).catch(() => {});
          }

          return {
            id: item.id,
            name: data.name || data.displayName || data.username || 'عضو الاتحاد',
            score,
            kills,
            character: String(stats.ittihadawyZombieCharacter || stats.ittihadawyCharacter || '')
          };
        }).filter(item => !isNaN(item.score) && item.score >= 1);

        setEntries(loaded);
        setState('ready');
      },
      error => {
        if (!active) return;
        window.clearTimeout(timeout);
        console.warn('[ZombieLeaderboard] Read failed:', error.code);
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
      className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-sm dark:border-rose-500/20 dark:bg-card-dark"
      aria-labelledby="zombie-ranking-title"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-100 bg-gradient-to-l from-rose-500/5 via-transparent to-transparent p-5 dark:border-white/10 dark:from-rose-500/10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <Skull size={24} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="zombie-ranking-title" className="text-lg font-black text-slate-900 dark:text-white">
                متصدرو وضع الزومبي
              </h2>
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                البقاء للأقوى 🧟
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              أعلى سكور في معارك الزومبي بشوارع إسكندرية المحطمة.
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <Flame size={14} className="text-rose-500" />
            <span>{number.format(entries.length)} صائد زومبي</span>
          </span>
        )}
      </div>

      {/* Guest Callout */}
      {!uid && (
        <div className="bg-rose-50/70 px-5 py-3 text-xs text-slate-700 dark:bg-rose-950/20 dark:text-slate-300">
          🧟 <Link to="/auth" className="font-bold text-rose-700 underline dark:text-rose-400">سجّل دخولك بحسابك</Link> عشان نتيجتك في وضع الزومبي تتسجل باسمك في الصدارة.
        </div>
      )}

      {/* Personal user status badge if in list */}
      {userEntry && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-rose-600 px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck size={18} />
            <span className="text-xs font-bold">
              ترتيبك في وضع الزومبي: <strong className="text-sm font-black underline">المركز {number.format(userEntryIndex + 1)}</strong>
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
            <RefreshCw size={24} className="animate-spin text-rose-600" />
            <p className="mt-3 text-sm text-slate-500">جاري تحميل متصدري وضع الزومبي…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">
              {errorCode === 'permission-denied'
                ? 'تعذّر السماح بعرض ترتيب الزومبي.'
                : errorCode === 'unavailable'
                ? 'الاتصال بقاعدة البيانات استغرق وقتاً طويلاً. تأكد من اتصال الإنترنت.'
                : 'تعذّر تحميل ترتيب وضع الزومبي حالياً.'}
            </p>
            <button
              type="button"
              onClick={() => setRetry(v => v + 1)}
              className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-500/20"
            >
              <RefreshCw size={15} />
              إعادة المحاولة
            </button>
          </div>
        )}

        {state === 'ready' && entries.length === 0 && (
          <div className="py-10 text-center">
            <span className="text-4xl">🧟‍♂️</span>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white">كن أول بطل في وضع الزومبي!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              افتح اللعبة واختر &quot;وضع الزومبي&quot; من القائمة عشان تسجل اسمك في صدارة صائدي الزومبي.
            </p>
          </div>
        )}

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
                    isCurrentUser ? 'rounded-2xl bg-rose-500/10 px-3 ring-1 ring-rose-500/30' : 'px-2'
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {entry.name}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          أنت
                        </span>
                      )}
                      {typeof entry.kills === 'number' && entry.kills > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <Crosshair size={11} />
                          {number.format(entry.kills)} زومبي
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
                    <span className="block text-base font-black tabular-nums text-rose-600 dark:text-rose-400">
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
                <RefreshCw size={14} className="animate-spin text-rose-600" />
                <span>جاري تحميل المزيد من صائدي الزومبي…</span>
              </>
            ) : (
              <span>المزيد من أبطال وضع الزومبي ←</span>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
