import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, ArrowRight, Trophy, Zap, Move } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SEOHead from '../components/SEOHead';
import GameLeaderboard from '../components/game/GameLeaderboard';
import { auth, db } from '../lib/firebase';

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestResultRef = useRef<{ score: number; distance: number; character: string } | null>(null);

  useEffect(() => auth.onAuthStateChanged((user) => {
    if (!user) setIsPlaying(false);
  }), []);

  const startGameForMember = async () => {
    setIsCheckingMember(true);
    setLoginRequired(false);
    try {
      await auth.authStateReady();
      if (!auth.currentUser) {
        setLoginRequired(true);
        return;
      }
      latestResultRef.current = null;
      setIsPlaying(true);
    } catch (error) {
      console.warn('[GamePage] Could not verify the signed-in member:', error);
      setLoginRequired(true);
    } finally {
      setIsCheckingMember(false);
    }
  };

  const authorizeGameFrame = () => {
    if (!auth.currentUser) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'ittihadawy:member-access', authorized: true },
      window.location.origin
    );
  };

  const saveScoreForUser = async (result: { score: number; distance?: number; character?: string }, requestId?: string) => {
    if (typeof result?.score !== 'number' || result.score < 1) return false;

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
          window.location.origin
        );
      }
      return false;
    }

    if (requestId) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ittihadawy:account', status: 'saving', id: requestId },
        window.location.origin
      );
    }

    let saved = false;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const currentStats = snap.exists() ? (snap.data()?.stats || {}) : {};
      const existingScore = Number(currentStats.ittihadawyScore ?? 0);

      if (result.score > existingScore) {
        await setDoc(
          userRef,
          {
            stats: {
              ...currentStats,
              ittihadawyScore: result.score,
              ittihadawyDistance: result.distance || 0,
              ittihadawyCharacter: result.character || 'gamal'
            },
            lastActive: new Date().toISOString()
          },
          { merge: true }
        );
      }
      saved = true;
      console.info(`[GamePage] Recorded score ${result.score} for user ${user.uid}`);
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
          console.info(`[GamePage] Server endpoint successfully saved score ${result.score}`);
        }
      } catch (serverErr) {
        console.warn('[GamePage] Server record score also failed:', serverErr);
      }
    }

    if (requestId) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ittihadawy:account', status: saved ? 'saved' : 'error', id: requestId },
        window.location.origin
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
            onLoad={authorizeGameFrame}
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
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#073c30] text-white">
          <div className="grid">
            <div className="relative z-10 p-5 sm:p-6 lg:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#d3ed9b]"><Gamepad2 size={15}/>اللعبة الرسمية لجمهور الاتحاد</span>
              <h1 className="mt-4 text-4xl font-black sm:text-5xl">اتحاداوي<span className="text-[#cee991]">.</span></h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-emerald-50/75">من قلب المدرج لقلب المنافسة. اختار شخصيتك، عدّي العوائق، وخلي اسمك في الصدارة.</p>
              <button type="button" onClick={startGameForMember} disabled={isCheckingMember} className="mt-5 flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-[#cee991] px-6 py-4 font-bold text-[#102b23] transition hover:bg-[#dff4b3] active:scale-[.98] disabled:cursor-wait disabled:opacity-70 sm:w-auto"><Play size={20} fill="currentColor"/>{isCheckingMember ? 'جارٍ التحقق من الحساب…' : 'ابدأ اللعب'}</button>
              {loginRequired && <p role="alert" className="mt-3 text-sm text-amber-100">اللعب متاح للأعضاء المسجلين فقط. <Link to="/auth" className="font-bold underline underline-offset-4">سجّل الدخول أو أنشئ حسابًا</Link>.</p>}
              <div className="mt-4 flex gap-5 text-xs text-emerald-100/70"><span>٤ شخصيات</span><span>٢٨ منطقة</span><span>تحدّي بلا نهاية</span></div>
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
              <div key={name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-card-dark">
                <div className="relative h-24 overflow-hidden bg-emerald-950/5 sm:h-28"><img src={`/games/ittihadawy/references/${image}`} alt={name} className="h-full w-full object-cover object-[center_25%]" loading="lazy"/>{name === 'اللازو' && <span className="absolute right-3 top-3 rounded-full bg-[#cee991] px-2.5 py-1 text-[10px] font-bold text-emerald-950">وصل جديد</span>}</div>
                <div className="p-3"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{name}</h3><p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{ability}</p></div>
              </div>
            ))}
          </div>
        </section>
          </div>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-card-dark">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Gamepad2 size={21}/></span>
            <h2 className="mt-4 font-bold text-slate-900 dark:text-white">جاهز للجولة؟</h2>
            <div className="mt-4 space-y-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
              <p className="flex gap-3"><Move size={19} className="mt-1 shrink-0 text-emerald-600"/>اسحب للحركة والقفز والتزحلق، أو استخدم الأسهم على الكمبيوتر.</p>
              <p className="flex gap-3"><Zap size={19} className="mt-1 shrink-0 text-emerald-600"/>فعّل قدرة شخصيتك بزر القدرة أو E. البرق بيديك سرعة وحماية مؤقتة.</p>
              <p className="flex gap-3"><Trophy size={19} className="mt-1 shrink-0 text-emerald-600"/>العب بحسابك عشان أعلى نتيجة تتحفظ باسمك وتنافس الأعضاء.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
