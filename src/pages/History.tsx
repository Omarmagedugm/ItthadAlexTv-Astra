import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Trophy, History as HistoryIcon, MapPin, Calendar, Star, Award, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration });
      return controls.stop;
    }
  }, [isInView, value, count, duration]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export default function History() {
  const [activeTab, setActiveTab] = useState<'titles' | 'timeline' | 'stadiums'>('titles');
  const navigate = useNavigate();
  
  const { 
    clubStats: storeStats, 
    clubTitles: storeTitles, 
    historyEvents: storeEvents, 
    stadiums: storeStadiums,
    dataLoaded 
  } = useAppStore();

  const sortHistoryItems = <T extends { order?: number }>(items: T[], fallbackSort?: (a: T, b: T) => number): T[] => {
    return [...items].sort((a, b) => {
      const hasA = typeof a.order === 'number';
      const hasB = typeof b.order === 'number';
      if (hasA && hasB) return (a.order as number) - (b.order as number);
      if (hasA) return -1;
      if (hasB) return 1;
      if (fallbackSort) return fallbackSort(a, b);
      return 0;
    });
  };

  const clubStats = sortHistoryItems((storeStats || []).filter(i => !i.hidden));
  const clubTitles = sortHistoryItems((storeTitles || []).filter(i => !i.hidden), (a, b) => b.count - a.count);
  const historyEvents = sortHistoryItems((storeEvents || []).filter(i => !i.hidden), (a, b) => (a.year || '').localeCompare(b.year || ''));
  const stadiums = sortHistoryItems((storeStadiums || []).filter(i => !i.hidden));
  const loading = !dataLoaded && clubTitles.length === 0 && historyEvents.length === 0;
  
  const getStatIcon = (label: string) => {
    if (label.includes('سنة')) return <Calendar className="text-blue-500" />;
    if (label.includes('كأس')) return <Trophy className="text-yellow-500" />;
    if (label.includes('دوري')) return <Star className="text-primary" />;
    if (label.includes('سلة')) return <Award className="text-orange-500" />;
    return <Star className="text-primary" />;
  };

  const getTitleIcon = (name: string) => {
    if (name.includes('كأس')) return <Trophy size={16} />;
    if (name.includes('دوري')) return <Shield size={16} />;
    if (name.includes('دورة') || name.includes('بطولة')) return <Star size={16} />;
    return <Award size={16} />;
  };

  const footballTitles = clubTitles.filter(t => t.category === 'football');
  const basketballTitles = clubTitles.filter(t => t.category === 'basketball');

  return <div className="ds-heritage-page"><div className="ds-heritage-intro"><div><span className="ds-kicker">من الجذور إلى المدرجات</span><h2>أجيال بتسلّم أجيال.</h2><p>تاريخ نحتفظ به، وانتماء نكمل به الحكاية.</p></div><div className="ds-heritage-year"><span>1906</span><small>تاريخ التأسيس المسجّل بالتطبيق</small></div></div>
    <div className="ds-heritage-stats">{clubStats.map(s=><div key={s.id}>{getStatIcon(s.label)}<strong><AnimatedCounter value={Number(s.value)}/></strong><span>{s.label}</span></div>)}</div>
    <div className="ds-toolbar"><div className="ds-segmented">{[{id:'titles',label:'خزينة البطولات'},{id:'timeline',label:'رحلة عبر الزمن'},{id:'stadiums',label:'ملاعبنا'}].map(t=><button key={t.id} className={activeTab===t.id?'is-active':''} aria-pressed={activeTab===t.id} onClick={()=>setActiveTab(t.id as typeof activeTab)}>{t.label}</button>)}</div></div>
    {activeTab==='titles'&&<div className="ds-trophy-cabinet">{[{title:'كرة القدم',data:footballTitles},{title:'كرة السلة',data:basketballTitles}].map(group=><section key={group.title}><div className="ds-section-bar"><h2>{group.title}</h2><Trophy size={23}/></div>{group.data.length?<div className="ds-trophy-grid">{group.data.map(t=><article key={t.id}><div className="ds-trophy-emblem">{getTitleIcon(t.name)}</div><strong>{t.count}</strong><h3>{t.name}</h3></article>)}</div>:<div className="ds-empty-state ds-empty-compact"><Trophy size={32}/><p>سيتم عرض البطولات هنا عند إضافتها.</p></div>}</section>)}</div>}
    {activeTab==='timeline'&&<div className="ds-timeline">{historyEvents.map((event,i)=><article key={event.id}><div className="ds-timeline-year"><span>{event.year}</span><small>محطة {String(i+1).padStart(2,'0')}</small></div><div><h3>{event.title}</h3><p>{event.desc}</p></div></article>)}{!historyEvents.length&&<div className="ds-empty-state"><HistoryIcon size={35}/><h2>محطات التاريخ</h2><p>لا توجد أحداث تاريخية مضافة حالياً.</p></div>}</div>}
    {activeTab==='stadiums'&&<div className="ds-stadium-grid">{stadiums.map(stadium=><article key={stadium.id}><div className="ds-stadium-photo">{stadium.imageUrl?<img src={stadium.imageUrl} alt={stadium.name} loading="lazy" referrerPolicy="no-referrer"/>:<MapPin size={50}/>}<span>{stadium.type}</span></div><div><h3>{stadium.name}</h3><p>{stadium.desc}</p></div></article>)}{!stadiums.length&&<div className="ds-empty-state"><MapPin size={35}/><h2>ملاعبنا</h2><p>لا توجد ملاعب مضافة حالياً.</p></div>}</div>}
  </div>;
}
