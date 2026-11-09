import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, CalendarDays, Trophy, ShieldAlert, Users, BarChart3, Clock3, Goal, WifiOff } from 'lucide-react';
import { loadFootballCenter, type FootballAction, type FootballPayload } from '../lib/footballCenterClient';

type MatchFilter = 'all' | 'upcoming' | 'live' | 'finished';
type DetailsTab = 'lineups' | 'events' | 'statistics';
type Fixture = {
  fixture: { id: number; date: string; status: { short: string; long: string; elapsed?: number | null }; venue?: { name?: string } };
  league?: { name?: string; logo?: string };
  teams: { home: { name: string; logo?: string }; away: { name: string; logo?: string } };
  goals?: { home?: number | null; away?: number | null };
};

const finishedStatuses = new Set(['FT', 'AET', 'PEN']);
const liveStatuses = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']);
function matchState(f: Fixture): MatchFilter {
  const status = f.fixture?.status?.short || '';
  if (finishedStatuses.has(status)) return 'finished';
  if (liveStatuses.has(status)) return 'live';
  return 'upcoming';
}
function readableDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function friendlyError(value: string) {
  if (value === 'api-not-configured') return 'مصدر البيانات لسه مش متضبط على السيرفر.';
  if (value === 'offline-no-saved-data') return 'مفيش نسخة محفوظة للقسم ده على الجهاز. افتحه مرة بالإنترنت.';
  if (value === 'alexandria-team-not-found') return 'المصدر ما قدرش يتعرف على نادي الاتحاد السكندري. يمكن ضبط معرف الفريق يدويًا.';
  if (value === 'provider-rate-limit') return 'وصلنا للحد المسموح لطلبات المصدر، جرّب لاحقًا.';
  if (value === 'provider-coverage-or-plan-error') return 'المصدر مش بيوفر البيانات دي في الاشتراك الحالي.';
  return 'تعذّر تحديث البيانات دلوقتي. لو فيه نسخة محفوظة هنستخدمها.';
}
function emptyMessage(tab: DetailsTab) {
  return tab === 'lineups' ? 'التشكيل الرسمي والبدلاء لسه مش متاحين من المصدر للمباراة دي.' :
    tab === 'events' ? 'مفيش أحداث متاحة للمباراة دي حتى الآن.' :
      'الإحصائيات مش متاحة للمباراة دي حاليًا.';
}
function TeamBadge({ team }: { team: { name?: string; logo?: string } }) {
  return <div className="flex min-w-0 flex-1 items-center gap-2">
    {team.logo && <img src={team.logo} alt="" className="h-9 w-9 shrink-0 object-contain" loading="lazy" />}
    <span className="min-w-0 truncate text-sm font-bold">{team.name || 'فريق'}</span>
  </div>;
}
function Formation({ side }: { side: any }) {
  const lineup: any[] = Array.isArray(side.startXI) ? side.startXI : [];
  const substitutes: any[] = Array.isArray(side.substitutes) ? side.substitutes : [];
  const entries = lineup.map(item => item?.player).filter(Boolean);
  const rowNumbers = [...new Set(entries.map(player => Number(String(player.grid || '').split(':')[0])).filter(n => Number.isInteger(n) && n > 0))].sort((a,b)=>a-b);
  const rows = rowNumbers.length >= 2
    ? rowNumbers.map(row => entries.filter(player => Number(String(player.grid || '').split(':')[0]) === row))
    : ['G','D','M','F'].map(pos=>entries.filter(player=>player.pos===pos || (pos==='F'&&player.pos==='A'))).filter(row=>row.length);
  return <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-card-dark">
    <div className="flex items-center justify-between gap-3 p-4">
      <TeamBadge team={side.team || {}} />
      <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">{side.formation || '—'}</span>
    </div>
    {side.coach?.name && <p className="px-4 pb-3 text-xs text-slate-500">المدرب: {side.coach.name}</p>}
    {entries.length ? <div className="mx-3 rounded-xl border-4 border-white/40 bg-gradient-to-b from-emerald-800 to-green-700 p-3 text-white">
      {rows.map((row,index)=><div key={index} className="flex min-h-[74px] items-center justify-around gap-1 border-b border-white/15 py-3 last:border-0">
        {row.map(player=><div key={player.id || player.name} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/20 text-xs font-black">{player.number ?? '–'}</div>
          <span className="max-w-[90px] break-words text-[10px] font-semibold leading-snug">{player.name}</span>
        </div>)}
      </div>)}
    </div> : <p className="p-4 text-center text-sm text-slate-500">التشكيل الأساسي لم يُنشر بعد.</p>}
    <div className="p-4"><h3 className="mb-2 text-sm font-bold">البدلاء</h3>
      {substitutes.length ? <div className="grid grid-cols-2 gap-x-2 gap-y-2">
        {substitutes.map((item:any)=><p className="text-xs text-slate-600 dark:text-slate-300" key={item.player?.id || item.player?.name}>
          {item.player?.number ?? '—'} — {item.player?.name || 'لاعب'}
        </p>)}
      </div> : <p className="text-xs text-slate-500">لم تتوفر قائمة البدلاء.</p>}
    </div>
  </section>;
}
function Lineups({ items }: {items:any[]}) {
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage('lineups')}</p>;
  return <div className="grid gap-4 lg:grid-cols-2">{items.map((side,index)=><Formation key={side?.team?.id || index} side={side}/>)}</div>;
}
function Events({items}:{items:any[]}) {
  if(!items.length)return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage('events')}</p>;
  return <div className="space-y-2">{items.map((event,index)=><div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-card-dark">
    <span className="min-w-12 text-center text-sm font-black text-emerald-700">{event.time?.elapsed ?? '—'}′</span>
    {event.team?.logo && <img src={event.team.logo} alt="" className="h-8 w-8 object-contain"/>}
    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{event.player?.name || event.team?.name || 'حدث'}</p>
    <p className="text-xs text-slate-500">{event.type === 'Goal' ? 'هدف' : event.type === 'subst' ? 'تبديل' : event.type === 'Card' ? 'بطاقة' : event.type || 'حدث'} • {event.detail || ''}</p></div>
  </div>)}</div>;
}
function Statistics({items}:{items:any[]}) {
  if(!items.length)return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage('statistics')}</p>;
  const home=items[0]||{};
  const away=items[1]||{};
  const labels=[...new Set([...(home.statistics||[]).map((s:any)=>s.type),...(away.statistics||[]).map((s:any)=>s.type)])];
  const get=(side:any,label:string)=>String((side.statistics||[]).find((s:any)=>s.type===label)?.value ?? '—');
  return <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
    <div className="grid grid-cols-3 gap-2 bg-emerald-900 p-4 text-center text-xs font-bold text-white">
      <span>{home.team?.name || 'صاحب الأرض'}</span><span>الإحصائية</span><span>{away.team?.name || 'الضيف'}</span>
    </div>
    {labels.map((label:string,index:number)=><div key={label} className={'grid grid-cols-3 gap-2 px-3 py-3 text-center text-xs '+(index%2===0?'bg-slate-50 dark:bg-slate-900/50':'')}>
      <strong>{get(home,label)}</strong><span className="text-slate-500">{label}</span><strong>{get(away,label)}</strong>
    </div>)}
  </div>;
}

export default function FootballCenter() {
  const [fixtures,setFixtures]=useState<Fixture[]>([]);
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [filter,setFilter]=useState<MatchFilter>('all');
  const [tab,setTab]=useState<DetailsTab>('lineups');
  const [detail,setDetail]=useState<FootballPayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [detailsLoading,setDetailsLoading]=useState(false);
  const [error,setError]=useState('');
  const [detailError,setDetailError]=useState('');
  const [updatedAt,setUpdatedAt]=useState('');
  const [cached,setCached]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let active=true;
    setLoading(true);
    setError('');
    void loadFootballCenter('fixtures').then(data=>{
      if(!active)return;
      const results=data.value.filter(v=>v?.fixture?.id && v?.teams?.home?.name && v?.teams?.away?.name) as Fixture[];
      setFixtures(results);
      setCached(!!data.fromCache);
      setUpdatedAt(data.updatedAt);
      setSelectedId(previous=>results.some(f=>f.fixture.id===previous)?previous:(results.find(f=>matchState(f)==='live')||results.find(f=>matchState(f)==='upcoming')||results[results.length-1])?.fixture.id || null);
    }).catch(err=>{if(active)setError(friendlyError(String(err?.message||err)));}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[refresh]);
  useEffect(()=>{
    let active=true;
    setDetail(null);setDetailError('');
    if(!selectedId)return;
    setDetailsLoading(true);
    void loadFootballCenter(tab as FootballAction,selectedId).then(data=>{if(active)setDetail(data);})
      .catch(err=>{if(active)setDetailError(friendlyError(String(err?.message||err)));})
      .finally(()=>{if(active)setDetailsLoading(false);});
    return ()=>{active=false;};
  },[selectedId,tab,refresh]);
  const selected=fixtures.find(f=>f.fixture.id===selectedId);
  const newestFixtureYear=fixtures.reduce((year,f)=>{
    const candidate=new Date(f.fixture.date).getUTCFullYear();
    return Number.isFinite(candidate)?Math.max(year,candidate):year;
  },0);
  const archiveOnly=newestFixtureYear>0 && newestFixtureYear<new Date().getUTCFullYear()-1;
  const shown=useMemo(()=>fixtures.filter(f=>filter==='all'||matchState(f)===filter)
    .sort((a,b)=>Math.abs(Date.parse(a.fixture.date)-Date.now())-Math.abs(Date.parse(b.fixture.date)-Date.now())).slice(0,30),[fixtures,filter]);
  return <main dir="rtl" className="mx-auto min-h-[75vh] max-w-6xl space-y-5 px-3 py-6 pb-32 sm:px-5">
    <header className="rounded-2xl bg-gradient-to-l from-emerald-950 via-emerald-900 to-green-800 p-5 text-white shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4"><div>
        <p className="text-xs text-emerald-200">قناة الاتحاد السكندري • كرة القدم فقط</p>
        <h1 className="mt-1 text-2xl font-black">مركز المباريات الذكي</h1>
        <p className="mt-2 max-w-xl text-sm text-emerald-100">المباريات والتشكيلات الرسمية والبدلاء والأحداث والإحصائيات، حسب المتاح من API-Football.</p>
      </div><button type="button" onClick={()=>setRefresh(value=>value+1)} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw size={17}/>تحديث</button></div>
      {updatedAt && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-100"><Clock3 size={14}/>آخر تحميل: {readableDate(updatedAt)} {cached?'• نسخة محفوظة':''}</p>}
    </header>
    {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert size={20}/>{error}</p>}
    {archiveOnly && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
      وضع تجريبي ببيانات أرشيفية حتى {newestFixtureYear} — دي مش مباريات الموسم الحالي. الاشتراك الحالي لا يتيح بيانات الموسم الحديث من المصدر.
      المباريات والتوقعات في التطبيق الأساسي مستقلة تمامًا.
    </p>}
    {loading && <p role="status" className="p-8 text-center text-sm text-slate-500">جاري تحميل المباريات…</p>}
    {!loading && !fixtures.length && <div className="rounded-xl border border-slate-200 p-8 text-center dark:border-slate-700"><WifiOff size={30} className="mx-auto mb-2 text-slate-400"/><p>مفيش مباريات متاحة من المصدر حاليًا.</p></div>}
    {!!fixtures.length && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">{([
          ['all','الكل'],['upcoming','القادمة'],['live','مباشر'],['finished','النتائج']
        ] as const).map(([value,label])=><button type="button" aria-pressed={filter===value} key={value} onClick={()=>setFilter(value)} className={'rounded-lg px-3 py-2 text-xs font-bold '+(filter===value?'bg-primary text-white':'border border-slate-200 bg-white text-slate-700 dark:bg-card-dark dark:text-white')}>{label}</button>)}</div>
        {shown.map(f=><button type="button" key={f.fixture.id} onClick={()=>{setSelectedId(f.fixture.id);setTab('lineups');}}
          className={'block w-full rounded-xl border p-4 text-right transition-colors '+(f.fixture.id===selectedId?'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50':'border-slate-200 bg-white dark:border-slate-700 dark:bg-card-dark')}>
          <p className="mb-3 text-xs text-slate-500">{f.league?.name || 'مباراة'} • {readableDate(f.fixture.date)}</p>
          <div className="flex items-center justify-between gap-2"><TeamBadge team={f.teams.home}/>
            <span className="shrink-0 text-lg font-black">{matchState(f)==='upcoming'?'VS':String(f.goals?.home ?? '—')+' : '+String(f.goals?.away ?? '—')}</span>
            <TeamBadge team={f.teams.away}/></div>
          <p className="mt-2 text-[11px] text-slate-500">{f.fixture.status?.long || ''}</p>
        </button>)}
        {!shown.length && <p className="p-5 text-sm text-slate-500">مفيش مباريات في التصنيف ده.</p>}
      </section>
      <section className="min-w-0 space-y-4">
        {selected ? <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-card-dark">
          <p className="mb-2 text-xs text-slate-500">{selected.league?.name} • {selected.fixture.venue?.name || ''}</p>
          <div className="flex items-center justify-between gap-2"><TeamBadge team={selected.teams.home}/>
            <strong className="shrink-0">{matchState(selected)==='upcoming'?'VS':String(selected.goals?.home ?? '–')+' : '+String(selected.goals?.away ?? '–')}</strong>
            <TeamBadge team={selected.teams.away}/></div>
        </div> : null}
        <div className="grid grid-cols-3 gap-2">{([
          ['lineups','التشكيل',Users],['events','الأحداث',Goal],['statistics','الإحصائيات',BarChart3]
        ] as const).map(([value,label,Icon])=><button type="button" key={value} aria-pressed={tab===value} onClick={()=>setTab(value)} className={'flex items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-bold '+(tab===value?'bg-primary text-white':'border border-slate-200 bg-white dark:bg-card-dark dark:text-white')}><Icon size={15}/>{label}</button>)}</div>
        {detailsLoading && <p role="status" className="p-8 text-center text-sm text-slate-500">جاري تحميل بيانات المباراة…</p>}
        {detailError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">{detailError}</p>}
        {!detailsLoading && detail && <>
          {detail.fromCache && <p className="text-xs text-amber-700">بيانات محفوظة؛ ممكن تكون مش محدثة.</p>}
          {tab==='lineups'?<Lineups items={detail.value}/>:tab==='events'?<Events items={detail.value}/>:<Statistics items={detail.value}/>}
        </>}
      </section>
    </div>}
    <footer className="text-center text-xs text-slate-500">البيانات مقدمة من API-Football، وقد تختلف درجة التغطية والتحديث من مباراة للتانية. قسم المباريات الأصلي والتوقعات مستقلين تمامًا.</footer>
  </main>;
}
