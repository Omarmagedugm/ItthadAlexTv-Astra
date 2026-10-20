import { Link } from 'react-router-dom';
import { ArrowUpLeft, Radio, Trophy, Newspaper, Users, Play, BookOpen, ShoppingBag, Globe2, CalendarDays } from 'lucide-react';
import { useAppStore } from '../store';

const destinations = [
  { to: '/news', title: 'أخبار زعيم الثغر', text: 'كل جديد عن نادينا', Icon: Newspaper, section: 'news' },
  { to: '/matches', title: 'مركز المباريات', text: 'المواعيد والنتائج', Icon: Trophy, section: 'matches' },
  { to: '/live', title: 'شاهد الاتحاد', text: 'البث المباشر', Icon: Radio, section: 'live' },
  { to: '/fan-zone', title: 'مدرج الاتحاد', text: 'صوتك وسط الجمهور', Icon: Users, section: 'fan-zone' },
];
export default function ClubWelcome() {
  const { matches, sectionFlags } = useAppStore();
  const enabled = (key: string) => (sectionFlags as Record<string, boolean>)[key] !== false;
  const featured = matches.filter(m => m.status !== 'finished').slice(0, 2);
  return <div className="club-welcome" dir="rtl">
    <div className="club-eyebrow"><span>الإسكندرية · بيت الاتحاداوية</span><span lang="en">ITTIHAD ALEX TV</span></div>
    <div className="club-intro"><div><p>نادي واحد. مدينة كاملة.</p><h1>الاتحاد يجمعنا<span>.</span></h1></div><Link to="/history" className="club-history-link">حكاية زعيم الثغر <ArrowUpLeft size={18}/></Link></div>
    <div className="club-feature-grid">
      <aside className="club-match-panel"><div className="club-panel-heading"><span><CalendarDays size={18}/> على موعد مع الاتحاد</span><Link to="/matches" aria-label="كل المباريات"><ArrowUpLeft size={20}/></Link></div>
      {featured.length ? featured.map(m=><Link to="/matches" key={m.id} className="club-match"><div className="club-match-meta">{m.competition}<span>{m.status === 'live' ? '● مباشر الآن' : 'قادم'}</span></div><div className="club-teams"><div><img src={m.homeLogo || '/icon.png'} alt=""/><strong>{m.homeTeam}</strong></div><b>{m.status === 'live' ? `${m.homeScore} : ${m.awayScore}` : 'VS'}</b><div><img src={m.awayLogo || '/icon.png'} alt=""/><strong>{m.awayTeam}</strong></div></div><p>{Number.isNaN(Date.parse(m.date)) ? m.date : new Date(m.date).toLocaleDateString('ar-EG', {day:'numeric',month:'long'})}{m.stadium ? ` · ${m.stadium}` : ''}</p></Link>) : <div className="club-match-empty"><Trophy size={38}/><h3>الموعد الجاي يجمعنا</h3><p>تابع جدول المباريات لمعرفة المواعيد والنتائج فور نشرها.</p><Link to="/matches">مركز المباريات <ArrowUpLeft size={16}/></Link></div>}
      <Link to="/live" className="club-watch"><span className="club-play"><Play size={17}/></span><div><strong>قناتك. في أي مكان.</strong><small>انتقل إلى البث المباشر</small></div><ArrowUpLeft size={20}/></Link></aside>
    </div>
    <nav className="club-destinations" aria-label="اكتشف التطبيق">{destinations.filter(d=>enabled(d.section)).map(({to,title,text,Icon})=><Link to={to} key={to}><span className="club-destination-icon"><Icon size={23}/></span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpLeft className="club-destination-arrow" size={17}/></Link>)}</nav>
    <div className="club-explore"><span>أكتر من مجرد ماتش</span><div>{[{to:'/library',t:'المكتبة الرقمية',I:BookOpen},{to:'/store',t:'متجر الجماهير',I:ShoppingBag},{to:'/world-fans',t:'اتحاداوية العالم',I:Globe2}].filter(d => d.to === '/store' ? enabled('fanStore') : d.to === '/world-fans' ? enabled('worldFans') : true).map(({to,t,I})=><Link to={to} key={to}><I size={16}/>{t}<ArrowUpLeft size={14}/></Link>)}</div></div>
    <div className="club-feed-heading"><div><span className="club-overline">نبض النادي</span><h2>كل الاتحاد، في مكان واحد</h2></div><span className="club-feed-line"/></div>
  </div>;
}
