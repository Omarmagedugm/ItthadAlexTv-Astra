import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ar } from 'date-fns/locale';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ChevronRight, Calendar, Trophy, MapPin, Edit2, Play, Users, Send, Target, X, FileText, Dribbble } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import PredictionMatchPicker from '../components/PredictionMatchPicker';
import { getOptimizedImage } from '../lib/cloudinary';
import { SafeImage } from '../components/SafeImage';

export default function Matches() {
  const { matches, profile } = useAppStore();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSport, setSelectedSport] = useState<'all' | 'football' | 'basketball'>('all');
  const [showPredictionsList, setShowPredictionsList] = useState<string | null>(null);
  const [matchPredictions, setMatchPredictions] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const [predictionMatchId, setPredictionMatchId] = useState<string | null>(null);
  const [homePrediction, setHomePrediction] = useState('0');
  const [awayPrediction, setAwayPrediction] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userPredictions, setUserPredictions] = useState<Record<string, any>>({});

  const isPastPredictionDeadline = (matchDate: string) => {
    const matchTime = new Date(matchDate).getTime();
    const now = new Date().getTime();
    return (matchTime - now) < (24 * 60 * 60 * 1000);
  };

  // Fetch all predictions for a specific match
  useEffect(() => {
    if (!showPredictionsList) {
      setMatchPredictions([]);
      return;
    }
    const q = query(collection(db, 'predictions'), where('matchId', '==', showPredictionsList));
    return onSnapshot(q, (snap) => {
      const allPreds = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatchPredictions(allPreds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `predictions/${showPredictionsList}`);
    });
  }, [showPredictionsList]);

  // Fetch existing predictions for this user
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'predictions'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      const preds: Record<string, any> = {};
      snap.forEach(doc => {
        const data = doc.data();
        preds[data.matchId] = { id: doc.id, ...data };
      });
      setUserPredictions(preds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'predictions-user');
    });
  }, [auth.currentUser]);

  const handleSavePrediction = async () => {
    if (!auth.currentUser || !predictionMatchId) return;
    
    const hScore = parseInt(homePrediction);
    const aScore = parseInt(awayPrediction);
    
    if (isNaN(hScore) || isNaN(aScore) || hScore < 0 || aScore < 0) {
      setSubmitError('يرجى إدخال أرقام صحيحة');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const match = matches.find(m => m.id === predictionMatchId);
      if (match && isPastPredictionDeadline(match.date)) {
        setSubmitError('عذراً، لا يمكن تغيير التوقع قبل المباراة بأقل من 24 ساعة');
        setIsSubmitting(false);
        return;
      }

      const predData = {
        matchId: predictionMatchId,
        userId: auth.currentUser.uid,
        userName: profile.name || auth.currentUser.displayName || 'مشجع',
        userEmail: auth.currentUser.email,
        homeScore: hScore,
        awayScore: aScore,
        createdAt: new Date().toISOString()
      };

      // Check if already exists to update or create
      const existing = userPredictions[predictionMatchId];
      if (existing) {
        await setDoc(doc(db, 'predictions', existing.id), predData);
      } else {
        await addDoc(collection(db, 'predictions'), predData);
      }

      setPredictionMatchId(null);
    } catch (error) {
      setSubmitError('حدث خطأ أثناء حفظ التوقع. يرجى المحاولة مرة أخرى.');
      handleFirestoreError(error, OperationType.WRITE, 'predictions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const hasLiveRunningMatch = matches.some(m => m.status === 'live' && m.isTimerRunning);

  useEffect(() => {
    if (!hasLiveRunningMatch) return;
    const interval = setInterval(() => setCurrentTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasLiveRunningMatch]);

  const calculateCurrentTimeFormat = (match: any) => {
    const isBasketball = match.sport === 'basketball';
    const defaultBase = isBasketball ? 10 : 0;
    const baseMin = (match.timerBaseMinute !== undefined && match.timerBaseMinute !== null && match.timerBaseMinute !== '')
      ? Number(match.timerBaseMinute)
      : defaultBase;

    if (!match.isTimerRunning || !match.timerStartTime) {
      return `${String(baseMin).padStart(2, '0')}:00${isBasketball ? '' : "'"}`;
    }
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) {
      return `${String(baseMin).padStart(2, '0')}:00${isBasketball ? '' : "'"}`;
    }
    const totalSeconds = Math.max(0, Math.floor((currentTimestamp - start) / 1000));
    
    if (isBasketball) {
      // Basketball countdown timer
      const baseSeconds = baseMin * 60;
      const remainingSeconds = Math.max(0, baseSeconds - totalSeconds);
      const mm = Math.floor(remainingSeconds / 60);
      const ss = remainingSeconds % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    } else {
      // Football count up
      const baseSeconds = baseMin * 60;
      const currentSeconds = baseSeconds + totalSeconds;
      const mm = Math.floor(currentSeconds / 60);
      const ss = currentSeconds % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}'`;
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();

    // 1. Live matches first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;

    // 2. Upcoming matches before finished
    if (a.status === 'upcoming' && b.status === 'finished') return -1;
    if (a.status === 'finished' && b.status === 'upcoming') return 1;

    // 3. For upcoming matches: closest date/time first (ascending order)
    if (a.status === 'upcoming' && b.status === 'upcoming') {
      return timeA - timeB;
    }

    // 4. For finished matches: most recently finished first (descending order)
    if (a.status === 'finished' && b.status === 'finished') {
      return timeB - timeA;
    }

    return timeA - timeB;
  });

  const getNewestMatch = (sportMatches: any[]) => {
    return sportMatches.find(m => m.status === 'live') || sportMatches.find(m => m.status === 'upcoming') || sportMatches[0];
  };

  const footballMatches = sortedMatches.filter(m => m.sport === 'football' || !m.sport);
  const basketballMatches = sortedMatches.filter(m => m.sport === 'basketball');

  const sportSections = [
    { 
      id: 'football', 
      title: 'مباريات', 
      subtitle: 'Football Matches', 
      matches: footballMatches, 
      newestMatch: getNewestMatch(footballMatches),
      icon: <Trophy size={16} className="text-primary" /> 
    },
    { 
      id: 'basketball', 
      title: 'مباريات كرة السلة', 
      subtitle: 'Basketball Matches', 
      matches: basketballMatches, 
      newestMatch: getNewestMatch(basketballMatches),
      icon: <Dribbble size={16} className="text-[#ea580c]" /> 
    }
  ].filter(section => selectedSport === 'all' || section.id === selectedSport);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  } as const;

  const seasonStats = matches.filter(m => m.status === 'finished' && (m.homeTeam === 'الاتحاد' || m.awayTeam === 'الاتحاد')).reduce((acc, match) => {
    const isHome = match.homeTeam === 'الاتحاد';
    const homeScore = parseInt(match.homeScore);
    const awayScore = parseInt(match.awayScore);
    
    if (homeScore === awayScore) {
      acc.draws += 1;
    } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
      acc.wins += 1;
    } else {
      acc.losses += 1;
    }
    return acc;
  }, { wins: 0, draws: 0, losses: 0 });

  const totalGames = (seasonStats.wins + seasonStats.draws + seasonStats.losses) || 1;
  const winRate = (seasonStats.wins / totalGames) * 100;
  const drawRate = (seasonStats.draws / totalGames) * 100;
  const lossRate = (seasonStats.losses / totalGames) * 100;

  return (
    <div className="ds-match-center">
      <div className="ds-toolbar"><div className="ds-segmented">{[{id:'all',label:'كل الرياضات'},{id:'football',label:'كرة القدم'},{id:'basketball',label:'كرة السلة'}].map(s=><button key={s.id} className={selectedSport===s.id?'is-active':''} aria-pressed={selectedSport===s.id} onClick={()=>setSelectedSport(s.id as typeof selectedSport)}>{s.label}</button>)}</div><div className="ds-filter-chips ds-match-filter">{[{id:'all',label:'كل المباريات'},{id:'live',label:'مباشر'},{id:'upcoming',label:'القادمة'},{id:'finished',label:'النتائج'}].map(s=><button key={s.id} className={selectedStatus===s.id?'is-active':''} onClick={()=>setSelectedStatus(s.id)}>{s.label}</button>)}</div></div>
      <div className="ds-match-overview"><div><span>فوز</span><strong>{seasonStats.wins}</strong><small>من المباريات المسجّلة</small></div><div><span>تعادل</span><strong>{seasonStats.draws}</strong><small>من المباريات المسجّلة</small></div><div><span>خسارة</span><strong>{seasonStats.losses}</strong><small>من المباريات المسجّلة</small></div><Link to="/fan-zone"><Trophy size={30}/><div><strong>توقّع.. وشجّع</strong><span>شارك في منطقة الجماهير</span></div><ChevronRight size={18} className="rotate-180"/></Link></div>
      {sportSections.map(section=>{const shown=section.matches.filter(m=>selectedStatus==='all'||m.status===selectedStatus);return <section className="ds-match-sport" key={section.id}><div className="ds-section-bar"><h2>{section.icon}{section.id==='football'?'كرة القدم':'كرة السلة'}</h2><span>{shown.length} مباراة</span></div>{shown.length?<div className="ds-fixture-grid">{shown.slice(0,visibleCount[section.id]||6).map(match=><article className={`ds-fixture ${match.status==='live'?'is-live':''}`} key={match.id}>
        <div className="ds-fixture-head"><span>{match.competition}</span><span className={`ds-match-status status-${match.status}`}>{match.status==='live'?'● مباشر':match.status==='finished'?'انتهت المباراة':'المباراة القادمة'}</span></div>
        <div className="ds-fixture-teams"><div><SafeImage teamName={match.homeTeam} src={match.homeLogo} width={100} className="ds-team-logo"/><strong>{match.homeTeam}</strong></div><div className="ds-fixture-score">{match.status==='upcoming'?<><strong className="ds-vs">VS</strong><small>{Number.isNaN(Date.parse(match.date))?'':format(new Date(match.date),'h:mm a',{locale:ar})}</small></>:<><strong><span>{match.homeScore}</span><i>:</i><span>{match.awayScore}</span></strong><small>{match.status==='live'?calculateCurrentTimeFormat(match):'النتيجة النهائية'}</small></>}</div><div><SafeImage teamName={match.awayTeam} src={match.awayLogo} width={100} className="ds-team-logo"/><strong>{match.awayTeam}</strong></div></div>
        <div className="ds-fixture-meta"><span><Calendar size={13}/>{Number.isNaN(Date.parse(match.date))?match.date:format(new Date(match.date),'d MMMM yyyy',{locale:ar})}</span>{match.stadium&&<span><MapPin size={13}/>{match.stadium}</span>}</div>
        <div className="ds-fixture-actions">{match.status==='live'&&<Link to="/live" className="ds-live-action"><Play size={14}/>شاهد البث</Link>}<Link to="/news"><FileText size={14}/>التغطية</Link>{auth.currentUser&&<button onClick={()=>setShowPredictionsList(match.id)}><Users size={14}/>توقعات الجمهور</button>}{profile.role==='admin'&&<button aria-label="تعديل المباراة" onClick={()=>navigate('/admin',{state:{editCategory:'matches',editId:match.id}})}><Edit2 size={14}/></button>}</div>
        {auth.currentUser&&match.status==='upcoming'&&<button disabled={isPastPredictionDeadline(match.date)} className="ds-predict-action" onClick={()=>{setPredictionMatchId(match.id);const existing=userPredictions[match.id];setHomePrediction(existing?String(existing.homeScore):'0');setAwayPrediction(existing?String(existing.awayScore):'0');setSubmitError(null);}}><Target size={16}/>{isPastPredictionDeadline(match.date)?'انتهت مهلة التوقع':userPredictions[match.id]?'عدّل توقعك للمباراة':'توقّع نتيجة المباراة'}</button>}
      </article>)}</div>:<div className="ds-empty-state ds-empty-compact"><Trophy size={35}/><h2>لا توجد مباريات في هذا التصنيف</h2><p>المواعيد والنتائج هتظهر هنا عند نشرها.</p></div>}{shown.length>(visibleCount[section.id]||6)&&<button className="ds-load-more" onClick={()=>setVisibleCount(prev=>({...prev,[section.id]:(prev[section.id]||6)+6}))}>عرض المزيد من المباريات</button>}</section>})}
      <AnimatePresence>
        {predictionMatchId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPredictionMatchId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="prediction-modal ds-content-card relative w-full max-w-sm bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm"
            >
               <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary"></div>
               
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="ds-content-heading text-lg font-bold text-slate-800 dark:text-white uppercase leading-none">توقع النتيجة</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">Make your prediction</p>
                  </div>
                  <button onClick={() => { setPredictionMatchId(null); setSubmitError(null); }} className="ds-control h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
               </div>

               {submitError && (
                 <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold">
                   <span className="material-symbols-outlined !text-lg">error</span>
                   {submitError}
                 </div>
               )}

                {(() => {
                  const match = matches.find(m => m.id === predictionMatchId);
                  if (!match) return null;
                  
                  return (
                    <div className="flex flex-col gap-8">
                      <PredictionMatchPicker
                        match={match}
                        home={Number(homePrediction) || 0}
                        away={Number(awayPrediction) || 0}
                        hasPrediction={Boolean(userPredictions[match.id]) || homePrediction !== '0' || awayPrediction !== '0'}
                        disabled={isSubmitting || isPastPredictionDeadline(match.date)}
                        onChange={(home, away) => { setHomePrediction(String(home)); setAwayPrediction(String(away)); }}
                      />

                     <button 
                       onClick={handleSavePrediction}
                       disabled={isSubmitting}
                       className="ds-control w-full h-14 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                       {isSubmitting ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <>
                           <Send size={18} />
                           حفظ التوقع وتأكيده
                         </>
                       )}
                     </button>
                   </div>
                 );
               })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Predictions list modal */}
      <AnimatePresence>
        {showPredictionsList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPredictionsList(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="ds-content-card relative w-full max-w-sm bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="ds-content-heading text-lg font-bold text-slate-800 dark:text-white uppercase leading-none">توقعات الجمهور</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">Community Predictions</p>
                  </div>
                  <button onClick={() => setShowPredictionsList(null)} className="ds-control h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {matchPredictions.length > 0 ? (
                    matchPredictions.map((pred) => {
                      const match = matches.find(m => m.id === pred.matchId);
                      const isFinished = match?.status === 'finished';
                      const isBasketball = match?.sport === 'basketball';
                      const isCorrect = isBasketball 
                        ? (isFinished && ((Number(match.homeScore) > Number(match.awayScore) && Number(pred.homeScore) > Number(pred.awayScore)) || (Number(match.awayScore) > Number(match.homeScore) && Number(pred.awayScore) > Number(pred.homeScore))))
                        : (isFinished && Number(match.homeScore) === Number(pred.homeScore) && Number(match.awayScore) === Number(pred.awayScore));
                      
                      return (
                        <div key={pred.id} className={`ds-content-card p-4 rounded-lg border ${isCorrect ? 'border-green-500 bg-green-50/20 dark:bg-green-900/10' : 'border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark'} flex items-center justify-between transition-all group`}>
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                               <span className={`text-[11px] font-bold uppercase ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{pred.userName}</span>
                               {isFinished && (
                                  <div className={`text-[12px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isCorrect ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-red-100 text-red-700'}`}>
                                    {isCorrect ? (
                                      <>
                                        <span className="material-symbols-outlined !text-[12px]">stars</span>
                                        توقع صحيح
                                      </>
                                    ) : (
                                      <>
                                        <X size={8} />
                                        غير دقيق
                                      </>
                                    )}
                                  </div>
                               )}
                             </div>
                             <span className="text-[11px] font-bold text-slate-400">{format(new Date(pred.createdAt), 'dd/MM HH:mm')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {isBasketball ? (
                               <div className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase shadow-sm ${isCorrect ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                 فوز {pred.homeScore > pred.awayScore ? match?.homeTeam : match?.awayTeam}
                               </div>
                             ) : (
                               <>
                                 <div className="flex flex-col items-center">
                                   <span className={`w-8 h-8 flex items-center justify-center border rounded-lg font-bold text-sm ${isCorrect ? 'bg-white dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-white dark:bg-card-dark border-border-light dark:border-border-dark text-slate-800 dark:text-white'}`}>{pred.homeScore}</span>
                                 </div>
                                 <span className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-slate-300'}`}>-</span>
                                 <div className="flex flex-col items-center">
                                   <span className={`w-8 h-8 flex items-center justify-center border rounded-lg font-bold text-sm ${isCorrect ? 'bg-white dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-white dark:bg-card-dark border-border-light dark:border-border-dark text-slate-800 dark:text-white'}`}>{pred.awayScore}</span>
                                 </div>
                               </>
                             )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-slate-400 font-bold text-xs">
                      لا توجد توقعات لهذا اللقاء بعد
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

