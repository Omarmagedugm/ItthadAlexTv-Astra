import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, ArrowRight, Trophy, Zap, Move, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, runTransaction } from 'firebase/firestore';
import SEOHead from '../components/SEOHead';
import GameLeaderboard from '../components/game/GameLeaderboard';
import { auth, db } from '../lib/firebase';
import { improvedGameStats, validGameResult } from '../lib/gameScores';

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestResultRef = useRef<{ score: number; distance: number; character: string } | null>(null);

  const saveScoreForUser = async (result: { score: number; distance?: number; character?: string }, requestId?: string) => {
    const normalized = {
      score: Number.isFinite(result?.score) ? Math.floor(result.score) : -1,
      distance: Number.isFinite(result?.distance) ? Math.floor(result.distance!) : 0,
      character: result?.character || 'gamal'
    };
    if (!validGameResult(normalized) || normalized.score < 1) return false;

    let user = auth.currentUser;
    if (!user) {
      try {
        await auth.authStateReady();
        user = auth.currentUser;
      } catch (_) {}
    }

    if (!user) {
      console.warn('[GamePage] No authenticated member to record score for.');
      if (requestId) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ittihadawy:account', status: 'guest', id: requestId },
          '*'
        );
      }
      return false;
    }

    if (requestId) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ittihadawy:account', status: 'saving', id: requestId },
        '*'
      );
    }

    let saved = false;
    try {
      const userRef = doc(db, 'users', user.uid);
      await runTransaction(db, async transaction => {
        const profile = await transaction.get(userRef);
        if (!profile.exists()) throw new Error('Member profile missing');
        const update = improvedGameStats(profile.data()?.stats || {}, normalized);
        if (update) transaction.update(userRef, update);
      });
      saved = true;
      console.info(`[GamePage] Confirmed score ${normalized.score} for user ${user.uid}`);
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
          body: JSON.stringify({ result: normalized })
        });
        if (res.ok) {
          saved = true;
          console.info(`[GamePage] Server endpoint successfully saved score ${normalized.score}`);
        }
      } catch (serverErr) {
        console.warn('[GamePage] Server record score also failed:', serverErr);
      }
    }

    if (requestId) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ittihadawy:account', status: saved ? 'saved' : 'error', id: requestId },
        '*'
      );
    }

    return saved;
  };

  const handleExitGame = async () => {
    // If player achieved any score in this run, save it immediately before leaving
    const pendingScore = latestResultRef.current;
    if (pendingScore && typeof pendingScore.score === 'number' && pendingScore.score >= 1) {
      await saveScoreForUser(pendingScore);
    }
    setIsPlaying(false);
  };

  // Direct game listener: guarantees any score made by an authenticated member is saved instantly
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data) return;

      if (data.type === 'ittihadawy:live-progress' && data.result) {
        if (typeof data.result.score === 'number' && data.result.score >= 1) {
          latestResultRef.current = data.result;
        }
        return;
      }

      if (data.type === 'ittihadawy:close' || data.type === 'ittihadawy:exit') {
        await handleExitGame();
        return;
      }

      if (data.type === 'ittihadawy:run-end' && data.result) {
        latestResultRef.current = data.result;
        await saveScoreForUser(data.result, data.id);
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
        <div className="fixed inset-0 z-[100] h-[100dvh] w-screen bg-black">
          <iframe
            ref={iframeRef}
            src="/games/ittihadawy/index.html"
            title="لعبة اتحاداوي"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          />

          {/* Floating Back Arrow Button - Rendered AFTER iframe with z-[99999] so it is ALWAYS visible and clickable */}
          <button
            type="button"
            onClick={handleExitGame}
            aria-label="الرجوع للتطبيق"
            title="الرجوع للتطبيق"
            className="fixed top-3.5 left-3.5 z-[99999] flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-2xl backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-90 border border-white/30 cursor-pointer pointer-events-auto"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-card-dark" aria-label="الرجوع للتطبيق"><ArrowRight size={18}/></Link>
          <span>منطقة الألعاب</span><span className="text-emerald-600">/ اتحاداوي</span>
        </div>
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-emerald-800/20 bg-gradient-to-br from-[#062d25] via-[#07543f] to-[#0b7650] text-white shadow-xl shadow-emerald-950/10">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-7rem] right-[42%] h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute left-6 top-6 hidden rotate-6 gap-2 sm:flex">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-lime-200 shadow-lg backdrop-blur"><Trophy size={25}/></span>
            <span className="mt-8 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-emerald-100 shadow-lg backdrop-blur"><Zap size={20}/></span>
          </div>
          <div className="grid">
            <div className="relative z-10 p-5 sm:p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-100/10 px-3.5 py-2 text-xs font-semibold text-[#e1f5b5] shadow-sm backdrop-blur"><Sparkles size={15}/>اللعبة الرسمية لجمهور الاتحاد</span>
              <h1 className="mt-4 text-4xl font-black sm:text-5xl">اتحاداوي<span className="text-[#cee991]">.</span></h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-emerald-50/80 sm:text-base">من قلب المدرج لقلب المنافسة. اختار شخصيتك، عدّي العوائق، وخلي اسمك في الصدارة.</p>
              <button type="button" onClick={() => setIsPlaying(true)} className="mt-6 flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-gradient-to-l from-[#dff4a8] to-[#c8e77e] px-6 py-4 font-extrabold text-[#102b23] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[.98] sm:w-auto"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/10"><Play size={16} fill="currentColor"/></span>ابدأ اللعب</button>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-emerald-50/85">
                {['٤ شخصيات', '٣٧ منطقة', 'تحدّي بلا نهاية'].map(label => <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-300"/>{label}</span>)}
              </div>
            </div>
          </div>
        </section>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <GameLeaderboard />
            <section aria-labelledby="characters-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="characters-title" className="text-base font-bold text-slate-900 dark:text-white">اختار نجم الجولة</h2><span className="text-xs text-slate-500">كل شخصية وليها طريقتها</span></div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ['عادل شكل', 'زمارة ٦ إلا تلت', 'adel-horn.png'],
              ['جمال الدولي', 'المبخرة', 'gamal-avatar.jpg'],
              ['حميدو', 'أبو جلمبو', 'hamido.png'],
              ['اللازو', 'حبيبي اخالي', 'lazo.jpeg'],
            ].map(([name, ability, image]) => (
              <div key={name} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-white/10 dark:bg-card-dark">
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-emerald-100 via-slate-100 to-lime-100 sm:h-32"><img src={`/games/ittihadawy/references/${image}`} alt={name} className="h-full w-full object-cover object-[center_25%] transition duration-500 group-hover:scale-105" loading="lazy"/><div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent"/>{name === 'اللازو' && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#d9f49f] px-2.5 py-1 text-[10px] font-extrabold text-emerald-950 shadow"><Sparkles size={11}/>وصل جديد</span>}<span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur"><Gamepad2 size={14}/></span></div>
                <div className="p-3"><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{name}</h3><p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Zap size={12}/>{ability}</p></div>
              </div>
            ))}
          </div>
        </section>
          </div>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-card-dark">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-lime-400/20 text-emerald-700 ring-1 ring-emerald-500/10 dark:text-emerald-300"><Gamepad2 size={23}/></span>
            <h2 className="mt-4 font-bold text-slate-900 dark:text-white">جاهز للجولة؟</h2>
            <div className="mt-4 space-y-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
              <p className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300"><Move size={18}/></span><span>اسحب للحركة والقفز والتزحلق، أو استخدم الأسهم على الكمبيوتر.</span></p>
              <p className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Zap size={18}/></span><span>فعّل قدرة شخصيتك بزر القدرة أو E. البرق بيديك سرعة وحماية مؤقتة.</span></p>
              <p className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><ShieldCheck size={18}/></span><span>العب بحسابك عشان أعلى نتيجة تتحفظ باسمك وتنافس الأعضاء.</span></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
