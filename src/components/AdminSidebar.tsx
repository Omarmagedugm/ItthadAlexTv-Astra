import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, LayoutDashboard, ChevronLeft, X, ArrowUpLeft } from 'lucide-react';
import { useAppStore } from '../store';
import { ADMIN_GROUPS, ADMIN_SECTIONS, canOpenAdminSection } from '../lib/adminSections';
interface Props { activeTab: string; setActiveTab: (tab: string) => void; onClose?: () => void; }
export default function AdminSidebar({activeTab,setActiveTab,onClose}: Props) {
 const {profile,orders,businesses,businessUpdates,worldApplications} = useAppStore();
 const [query,setQuery] = useState('');
 const [collapsed,setCollapsed] = useState<string[]>([]);
 useEffect(() => { const group = ADMIN_SECTIONS.find(s => s.id === activeTab)?.group; setCollapsed(old => old.filter(g => g !== group)); }, [activeTab]);
 const counts: Record<string,number> = {
  orders: orders.filter(o => o.status === 'pending').length,
  business: businesses.filter(b => b.status === 'pending').length + businessUpdates.filter(b => b.status === 'pending').length,
  'world-fans': (worldApplications || []).filter(a => a.status === 'pending').length,
 };
 const visible = ADMIN_SECTIONS.filter(s => canOpenAdminSection(profile,s.id));
 const needle = query.trim().toLocaleLowerCase('ar');
 const filtered = visible.filter(s => `${s.title} ${s.description} ${s.group}`.toLocaleLowerCase('ar').includes(needle));
 return <div className="admin-menu" dir="rtl">
  <div className="admin-menu-brand"><span className="admin-brand-icon"><LayoutDashboard size={21}/></span><div><strong>إدارة الاتحاد</strong><small>كل أدواتك في مكان واحد</small></div>{onClose && <button onClick={onClose} aria-label="إغلاق الأقسام"><X size={20}/></button>}</div>
  <label className="admin-menu-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن قسم أو مهمة…" aria-label="البحث في أقسام الإدارة"/>{query && <button onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15}/></button>}</label>
  <nav aria-label="أقسام لوحة التحكم" className="admin-menu-groups">{ADMIN_GROUPS.map(group => {
   const sections = filtered.filter(s => s.group === group); if (!sections.length) return null;
   const open = Boolean(needle) || !collapsed.includes(group);
   return <section key={group}><button className="admin-group-toggle" onClick={() => setCollapsed(old => old.includes(group) ? old.filter(g => g !== group) : [...old,group])} aria-expanded={open}><span>{group}</span><small>{sections.length}</small><ChevronDown size={14} style={{transform:open?'none':'rotate(90deg)'}}/></button>
   {open && <div>{sections.map(s => <button key={s.id} className={`admin-section-link ${activeTab===s.id?'is-active':''}`} onClick={() => {setActiveTab(s.id);onClose?.();}} aria-current={activeTab===s.id?'page':undefined} title={s.description}><span>{s.title}</span>{counts[s.id]>0 ? <b>{counts[s.id]}</b> : activeTab===s.id && <ChevronLeft size={15}/>}</button>)}</div>}</section>;
  })}{filtered.length===0 && <p className="admin-menu-empty">لا توجد أقسام مطابقة للبحث.</p>}</nav>
  <Link to="/" className="admin-return"><ArrowUpLeft size={17}/>عرض التطبيق</Link>
 </div>;
}
