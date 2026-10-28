import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../../store';
import { BOTTOM_NAV_DESTINATIONS, DEFAULT_BOTTOM_NAV_ITEMS, resolveBottomNavigation, type BottomNavigationItem } from '../../lib/bottomNavigation';

export default function BottomNavigationEditor({ value, onChange }: { value?: BottomNavigationItem[]; onChange: (items: BottomNavigationItem[]) => void }) {
  const customPages = useAppStore(state => state.customPages);
  const items = Array.isArray(value) ? value : resolveBottomNavigation();
  const destinations = [...BOTTOM_NAV_DESTINATIONS, ...customPages.filter(page => page.active !== false).map(page => ({path:`/page/${page.slug || page.id}`,label:page.title,icon:'description',active:true}))];
  const [selectedPath, setSelectedPath] = useState('');
  const choices = destinations.filter(destination => !items.some(item => item.path === destination.path));
  const visibleCount = items.filter(item => item.active).length;
  const update = (index: number, patch: Partial<BottomNavigationItem>) => onChange(items.map((item, at) => at === index ? {...item,...patch} : item));
  const move = (index: number, direction: number) => {
    const next = [...items];
    [next[index],next[index+direction]] = [next[index+direction],next[index]];
    onChange(next);
  };
  return <section className="mt-5 space-y-3" dir="rtl" aria-label="إدارة عناصر القائمة السفلية">
    <h4 className="font-bold text-sm">عناصر القائمة السفلية</h4>
    <p className="text-xs text-slate-500 leading-relaxed">اختار العناصر وأسماءها وترتيبها، ثم اضغط حفظ الإعدادات. يمكنك إظهار حتى ٦ عناصر. الأقسام المخفية من إعدادات التطبيق ستظل مخفية هنا.</p>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{visibleCount} / ٦ عناصر مفعّلة</span><button type="button" className="ds-control px-3 py-2 rounded-lg border" onClick={() => onChange(DEFAULT_BOTTOM_NAV_ITEMS.map(item => ({...item})))}>استعادة الافتراضي</button></div>
    {items.length === 0 && <p className="p-3 rounded-lg bg-slate-500/10 text-xs">القائمة السفلية مخفية بالكامل. أضف عنصرًا لإظهارها.</p>}
    {items.map((item,index) => <div key={item.path} className="rounded-xl border border-slate-300/30 p-3 space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-bold min-w-0"><input type="checkbox" checked={item.active} disabled={!item.active && visibleCount >= 6} onChange={event => update(index,{active:event.target.checked})}/><span className="truncate">{item.label || 'عنصر بدون اسم'}</span></label>
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label={`تحريك ${item.label} لأعلى`} disabled={index===0} onClick={()=>move(index,-1)} className="ds-control p-2 disabled:opacity-30"><ArrowUp size={16}/></button>
          <button type="button" aria-label={`تحريك ${item.label} لأسفل`} disabled={index===items.length-1} onClick={()=>move(index,1)} className="ds-control p-2 disabled:opacity-30"><ArrowDown size={16}/></button>
          <button type="button" aria-label={`حذف ${item.label} من القائمة السفلية`} onClick={()=>onChange(items.filter((_,at)=>at!==index))} className="ds-control p-2 text-red-500"><Trash2 size={16}/></button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-xs space-y-1 min-w-0 block"><span>اسم العنصر</span><input aria-label={`اسم العنصر ${index+1}`} value={item.label} maxLength={24} onChange={event=>update(index,{label:event.target.value})} className="w-full min-w-0 rounded-lg border border-slate-300/30 bg-transparent p-2"/></label>
        <label className="text-xs space-y-1 min-w-0 block"><span>الصفحة</span><select value={item.path} onChange={event=>{const destination=destinations.find(candidate=>candidate.path===event.target.value);if(destination) update(index,{path:destination.path,icon:destination.icon,label:destination.label,isNew:false});}} className="w-full min-w-0 rounded-lg border border-slate-300/30 bg-white dark:bg-slate-900 p-2">
          {!destinations.some(destination=>destination.path===item.path) && <option value={item.path}>{item.label}</option>}
          {destinations.filter(destination=>destination.path===item.path||!items.some(existing=>existing.path===destination.path)).map(destination=><option key={destination.path} value={destination.path}>{destination.label}</option>)}
        </select></label>
      </div>
    </div>)}
    <div className="flex gap-2 min-w-0">
      <select aria-label="عنصر جديد للقائمة السفلية" value={choices.some(choice=>choice.path===selectedPath)?selectedPath:''} onChange={event=>setSelectedPath(event.target.value)} className="flex-1 min-w-0 rounded-lg border border-slate-300/30 bg-white dark:bg-slate-900 p-2 text-xs"><option value="">اختار صفحة لإضافتها</option>{choices.map(choice=><option key={choice.path} value={choice.path}>{choice.label}</option>)}</select>
      <button type="button" disabled={!choices.some(choice=>choice.path===selectedPath)} onClick={()=>{const choice=choices.find(candidate=>candidate.path===selectedPath);if(choice){onChange([...items,{...choice,active:visibleCount<6}]);setSelectedPath('');}}} className="ds-control inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-white text-xs font-bold whitespace-nowrap disabled:opacity-40"><Plus size={15}/>إضافة عنصر</button>
    </div>
  </section>;
}
