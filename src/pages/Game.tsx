import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';
import './Game.css';
import {recordRunCoins, startCoinRun} from '../lib/gameCoins';
import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, ArrowRight, Trophy, Zap, Move, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, runTransaction } from 'firebase/firestore';
import { improvedGameStats, validGameResult } from '../lib/gameScores';
import SEOHead from '../components/SEOHead';
import GameLeaderboard from '../components/game/GameLeaderboard';
import { auth, db } from '../lib/firebase';

const SHARE_REWARD_COINS = 3000;
const numberFormatter = new Intl.NumberFormat('ar-EG');

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestResultRef = useRef<{ score: number; distance: number; character: string; coins?: number; runId?: string } | null>(null);

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

  const handleShareGame = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareFeedback('');
    setLoginRequired(false);

    const shareUrl = `${window.location.origin}/game`;
    const shareData = {
      title: 'لعبة اتحاداوي — قناة الاتحاد',
      text: 'العب اتحاداوي ونافسني على صدارة لوحة الأبطال في قناة الاتحاد! 🟢⚪',
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        setIsSharing(false);
        return;
      }
    }

    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) {
        setLoginRequired(true);
        setShareFeedback('سجّل دخولك عشان تاخد +٣,٠٠٠ عملة هدية على كل مشاركة!');
        return;
      }

      let localCoins = 0;
      try {
        localCoins = Math.max(0, Math.floor(Number(localStorage.getItem('gamal-coins')) || 0));
      } catch (_) {}

      const shareRunId = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try {
        await startCoinRun(shareRunId, user.uid);
        await recordRunCoins(shareRunId, user.uid, SHARE_REWARD_COINS);
      } catch (coinErr) {
        console.warn('[GamePage] game_progress coin credit warning:', coinErr);
      }

      let newTotalCoins = localCoins + SHARE_REWARD_COINS;
      const userRef = doc(db, 'users', user.uid);
      const progressRef = doc(db, 'game_progress', user.uid);
      await runTransaction(db, async (transaction) => {
        const [snap, progressSnap] = await Promise.all([
          transaction.get(userRef),
          transaction.get(progressRef),
        ]);
        if (!snap.exists()) throw new Error('Member profile missing');
        const data = snap.data() || {};
        const stats = data.stats || {};
        const currentStatsCoins = Math.max(0, Math.floor(Number(stats.ittihadawyCoins ?? 0)));
        const currentProgressCoins = Math.max(0, Math.floor(Number(progressSnap.data()?.totalCoins ?? 0)));
        const baseCoins = Math.max(currentStatsCoins, localCoins);
        newTotalCoins = Math.min(2147483647, Math.max(currentProgressCoins, baseCoins + SHARE_REWARD_COINS));

        transaction.update(userRef, {
          'stats.ittihadawyCoins': newTotalCoins,
        });
      });

      try {
        localStorage.setItem('gamal-coins', String(newTotalCoins));
      } catch (_) {}

      setShareFeedback(`تمت المشاركة! 🎉 كسبت +${numberFormatter.format(SHARE_REWARD_COINS)} عملة • رصيد العملات الآن: ${numberFormatter.format(newTotalCoins)} عملة`);
    } catch (err) {
      console.warn('[GamePage] Could not credit share coins:', err);
      setShareFeedback('تعذّر إضافة عملات المشاركة حالياً. حاول مرة أخرى.');
    } finally {
      setIsSharing(false);
    }
  };

  const authorizeGameFrame = async () => {
    const user = auth.currentUser;
    if (!user) return;
    let isAdmin =
      ['HRDB2ppkGqOfBrat2D0xThuTkRe2', 'RrpMWEOls8SfFDQj4CJrLnEF5dr1'].includes(user.uid) ||
      user.email === 'megastudiodm@gmail.com';
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'ittihadawy:member-access', authorized: true, isAdmin },
      window.location.origin
    );
    if (!isAdmin) {
      try {
        const { getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', user.uid));
        const d = snap.data() || {};
        if (
          d.isAdmin === true ||
          ['admin', 'superadmin'].includes(d.role) ||
          (Array.isArray(d.roles) && d.roles.some((r: string) => ['admin', 'superadmin'].includes(r)))
        ) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'ittihadawy:member-access', authorized: true, isAdmin: true },
            window.location.origin
          );
        }
      } catch (_) {}
    }
  };

  const saveScoreForUser = async (result: { score: number; distance?: number; character?: string }, requestId?: string) => {
    if (!validGameResult(result) || result.score < 1) return false;

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
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error('Member profile missing');
        if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed');
        const update = improvedGameStats(snap.data().stats, result);
        if (update) transaction.update(userRef, update);
      });
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
        if (res.ok && (await res.json()).success === true) {
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

  const handleExitGame = () => {
    const pendingScore = latestResultRef.current;
    latestResultRef.current = null;
    if(pendingScore?.runId && Number.isSafeInteger(pendingScore.coins) && auth.currentUser) {
      void recordRunCoins(pendingScore.runId,auth.currentUser.uid,pendingScore.coins!).catch(error=>console.warn('[GamePage] Coin save pending:',error));
    }
    // Return to the game page immediately, even if score storage is offline or slow.
    setIsPlaying(false);
    if (pendingScore && typeof pendingScore.score === 'number' && pendingScore.score >= 1) {
      void saveScoreForUser(pendingScore).catch((error) => {
        console.warn('[GamePage] Could not save score after leaving:', error);
      });
    }
  };

  // Direct game listener: guarantees any score made by an authenticated member is saved instantly
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data) return;

      if (data.type === 'ittihadawy:access-request') {
        authorizeGameFrame();
        return;
      }

      if (data.type === 'ittihadawy:run-start' && data.id && auth.currentUser) {
        void startCoinRun(data.id, auth.currentUser.uid).catch(() => {});
        return;
      }

      if (data.type === 'ittihadawy:coin-progress' && data.id && Number.isSafeInteger(data.result?.coins) && auth.currentUser) {
        void recordRunCoins(data.id, auth.currentUser.uid, data.result.coins).catch(() => {});
        return;
      }

      if (data.type === 'ittihadawy:live-progress' && data.result) {
        if ((typeof data.result.score === 'number' && data.result.score >= 1) || (typeof data.result.coins === 'number' && data.result.coins >= 1)) {
          latestResultRef.current = {...data.result,runId:data.id};
        }
        return;
      }

      if (data.type === 'ittihadawy:close' || data.type === 'ittihadawy:exit') {
        await handleExitGame();
        return;
      }

      if (data.type === 'ittihadawy:run-end' && data.result) {
        latestResultRef.current = {...data.result,runId:data.id};
        if (data.id && Number.isSafeInteger(data.result.coins) && data.result.coins >= 1 && auth.currentUser) {
          void recordRunCoins(data.id, auth.currentUser.uid, data.result.coins).catch((err) => {
            console.warn('[GamePage] Coin save warning:', err);
          });
        }
        await saveScoreForUser(data.result, data.id);
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  return (
    <div className="game-landing" dir="rtl">
      {!isPlaying && <><TopHeader /><BottomNav /></>}
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
            aria-label="الرجوع لصفحة اللعبة"
            title="الرجوع لصفحة اللعبة"
            className="fixed top-3.5 left-3.5 z-[99999] flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-2xl backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-90 border border-white/30 cursor-pointer pointer-events-auto"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      )}

      <div className="game-landing-content" hidden={isPlaying}>
        <div className="game-page-label"><Link to="/" aria-label="الرجوع للتطبيق"><ArrowRight size={18}/></Link><span>منطقة الألعاب</span><span className="game-edition">ITTIHADAWY / 1914</span></div>
        <section className="game-hero" aria-labelledby="game-title">
          <div className="game-hero-art" aria-hidden="true"><div className="game-pitch"/><img src="/games/ittihadawy/references/ittihad-crest.png" alt=""/><span>إسكندرية كلها وراك</span></div>
          <div className="game-hero-copy">
            <span className="game-eyebrow"><span/> من المدرج… لشوارع إسكندرية</span>
            <h1 id="game-title">اتحاداوي<span>.</span></h1>
            <p>مدينتك. شخصيتك. تحدّيك.<br/>عدّي العوائق، جمّع النقاط، وافتح الشخصيات والملابس كل ٢٥,٠٠٠ نقطة.</p>
            <button type="button" onClick={startGameForMember} disabled={isCheckingMember} className="game-start"><Play size={22} fill="currentColor"/>{isCheckingMember ? 'جارٍ التحقق…' : 'ابدأ اللعب'}<span aria-hidden="true">←</span></button>
            <button type="button" onClick={handleShareGame} disabled={isSharing} className="game-share-btn"><Share2 size={18}/>{isSharing ? 'جارٍ المشاركة…' : 'شارك اللعبة واكسب +٣,٠٠٠ عملة'}<span className="game-share-badge">+٣٠٠٠ عملة</span></button>
            {shareFeedback && <p role="status" className="game-share-feedback">{shareFeedback}</p>}
            {loginRequired && <p role="alert" className="game-login">اللعب متاح للأعضاء. <Link to="/auth">سجّل الدخول أو أنشئ حسابًا</Link></p>}
            <div className="game-hero-stats"><span><strong>٥</strong> شخصيات</span><span><strong>٢٥ ألف</strong> لكل مرحلة</span><span><Trophy size={15}/> صدارة الأعضاء</span></div>
          </div>
        </section>
        <div className="game-section-heading"><span>الجولة بتبدأ بيك</span><a href="#game-ranking-title">شوف المتصدرين <Trophy size={15}/></a></div>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <GameLeaderboard />
            <section aria-labelledby="characters-title">
              <div className="mb-3 flex items-center justify-between"><h2 id="characters-title" className="text-base font-bold text-slate-900 dark:text-white">نجوم اتحاداوي</h2><span className="text-xs text-slate-500">تحدي النقاط: افتح نجم جديد كل ٢٥,٠٠٠ نقطة</span></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['جمال الدولي', 'المبخرة • مفتوح من البداية', 'gamal-avatar.jpg'],
                  ['عادل شكل', 'زمارة ٦ إلا تلت • ٢٥,٠٠٠ نقطة', 'adel-horn.png'],
                  ['حميدو', 'أبو جلمبو • ٥٠,٠٠٠ نقطة', 'hamido.png'],
                  ['اللازو', 'حبيبي اخالي • ٧٥,٠٠٠ نقطة', 'lazo.jpeg'],
                ].map(([name, ability, image]) => (
                  <div key={name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-card-dark">
                    <div className="relative h-24 overflow-hidden bg-emerald-950/5 sm:h-28"><img src={`/games/ittihadawy/references/${image}`} alt={name} className="h-full w-full object-cover object-[center_25%]" loading="lazy"/>{name === 'اللازو' && <span className="absolute right-3 top-3 rounded-full bg-[#cee991] px-2.5 py-1 text-[10px] font-bold text-emerald-950">وصل جديد</span>}</div>
                    <div className="p-3"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{name}</h3><p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{ability}</p></div>
                  </div>
                ))}
              </div>
            </section>
            <div className="game-fifth-character"><Gamepad2 size={22}/><div><strong>إسلام الفار (قريباً 🔒) • وموتوسيكل الزعيم عند ١,٠٠٠,٠٠٠ نقطة 🏍️</strong><p>كل ٢٥,٠٠٠ نقطة بتفتح شخصيات وأطقم جديدة، وأول ما تعدي مليون نقطة تقدر تختار تلعب بالموتوسيكل مع أي شخصية!</p></div></div>
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
