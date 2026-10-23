import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, ArrowRight, Trophy, Zap, Move } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import SEOHead from '../components/SEOHead';
import GameLeaderboard from '../components/game/GameLeaderboard';
import { auth, db } from '../lib/firebase';

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Direct game listener: guarantees any score made by an authenticated member is saved instantly
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data) return;

      if (data.type === 'ittihadawy:run-end' && data.result) {
        const user = auth.currentUser;
        if (!user) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'ittihadawy:account', status: 'guest', id: data.id },
            window.location.origin
          );
          return;
        }

        const result = data.result;
        if (typeof result.score !== 'number' || result.score < 1) return;

        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ittihadawy:account', status: 'saving', id: data.id },
          window.location.origin
        );

        let saved = false;
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const currentStats = snap.data()?.stats || {};
            const existingScore = Number(currentStats.ittihadawyScore ?? 0);
            if (result.score > existingScore) {
              await updateDoc(userRef, {
                'stats.ittihadawyScore': result.score,
                'stats.ittihadawyDistance': result.distance || 0,
                'stats.ittihadawyCharacter': result.character || 'gamal'
              });
            }
            saved = true;
          }
        } catch (directErr) {
          console.warn('[GamePage] Direct update error, saving via server endpoint:', directErr);
          try {
            const token = await user.getIdToken();
            const res = await fetch('/api/game/record-score', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ result })
            });
            if (res.ok) {
              saved = true;
            }
          } catch (serverErr) {
            console.warn('[GamePage] Server record score also failed:', serverErr);
          }
        }

        if (saved) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'ittihadawy:account', status: 'saved', id: data.id },
            window.location.origin
          );
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-4 dark:bg-background-dark" dir="rtl">
      <SEOHead
        title="لعبة اتحاداوي — قناة الاتحاد"
        description="اختار شخصيتك، العب ونافس أعضاء قناة الاتحاد على أعلى سكور."
      />

      {/* Fullscreen Game Experience */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-black">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950 px-4 text-white">
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} className="text-emerald-400" />
              <span className="text-xs font-bold sm:text-sm">لعبة اتحاداوي · شاشة كاملة</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600/30 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-600/50"
            >
              <span>العودة للترتيب</span>
              <ArrowRight size={14} className="rotate-180" />
            </button>
          </div>
          <div className="relative h-[calc(100vh-3rem)] w-full flex-1 bg-black">
            <iframe
              ref={iframeRef}
              src="/games/ittihadawy/index.html"
              title="لعبة اتحاداوي"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600"
          >
            <ArrowRight size={15} />
            العودة للتطبيق
          </Link>
        </div>

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-500/20 dark:bg-card-dark sm:p-8">
          <div className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">من المدرج للمنافسة</span>
              <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">اتحاداوي</h1>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-300">
                اختار نجمك، اجمع النقاط وعدّي العوائق. كل جولة فرصة جديدة ترفع اسمك في ترتيب الأعضاء.
              </p>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:h-20 sm:w-20">
              <Gamepad2 className="h-9 w-9" />
            </span>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="relative flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[.99]"
            >
              <Play size={20} fill="currentColor" />
              <span>يلا نلعب الآن</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span>٣ شخصيات</span>
            <span>٣٧ منطقة</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Trophy size={14} />
              سكور باسمك في الترتيب
            </span>
          </div>
        </section>

        {/* Real-time Game Leaderboard: Displays top 10 + Load More down to 1 point */}
        <GameLeaderboard />

        {/* How to Play Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-card-dark">
          <h2 className="font-bold text-slate-900 dark:text-white">اختار طريقتك في اللعب</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['عادل شكل', 'زمارة ٦ إلا تلت', 'adel-horn.png'],
              ['جمال الدولي', 'المبخرة', 'gamal-avatar.jpg'],
              ['حميدو', 'أبو جلمبو', 'hamido.png'],
            ].map(([name, ability, image]) => (
              <div key={name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <img
                  src={`/games/ittihadawy/references/${image}`}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{name}</h3>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{ability}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:grid-cols-2">
            <p className="flex items-start gap-2">
              <Move size={17} className="mt-1 shrink-0" />
              اسحب على الموبايل، أو استخدم الأسهم على الكمبيوتر للحركة والقفز والتزحلق.
            </p>
            <p className="flex items-start gap-2">
              <Zap size={17} className="mt-1 shrink-0" />
              زر E لقدرة الشخصية، وعلامة البرق بتديك سرعة وحماية مؤقتة.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
