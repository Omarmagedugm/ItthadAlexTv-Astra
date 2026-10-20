import { useState } from 'react';
import { ArrowUpLeft, Search, Newspaper, Trophy, ShoppingCart, Users, Activity } from 'lucide-react';
import { ADMIN_GROUPS, ADMIN_SECTIONS, canOpenAdminSection } from '../../lib/adminSections';
import { useAppStore } from '../../store';
export default function AdminStart({onNavigate}:{onNavigate:(tab:string)=>void}){
 const {profile,news,matches,orders,users} = useAppStore();const [search,setSearch]=useState('');
 const allowed=ADMIN_SECTIONS.filter(s=>canOpenAdminSection(profile,s.id));
 const stats=[{id:'news',title:'خبر ومقال',value:news.length,Icon:Newspaper},{id:'matches',title:'مباراة مسجلة',value:matches.length,Icon:Trophy},{id:'orders',title:'طلب قيد الانتظار',value:orders.filter(o=>o.status==='pending').length,Icon:ShoppingCart},{id:'users',title:'عضو في البيانات المحملة',value:users.length,Icon:Users}].filter(s=>canOpenAdminSection(profile,s.id));
 return <div className="admin-start"><div className="admin-welcome"><div><span>مساحة العمل</span><h2>أهلاً {profile.name?.split(' ')[0]||'بيك'}، تبدأ بإيه النهارده؟</h2><p>اختار المهمة، وكل أدوات القسم هتكون قدامك.</p></div>{canOpenAdminSection(profile,'service-health')&&<button onClick={()=>onNavigate('service-health')}><Activity size={17}/>فحص الخدمات<ArrowUpLeft size={16}/></button>}</div>
 <div className="admin-stats">{stats.map(s=><button key={s.id} onClick={()=>onNavigate(s.id)}><s.Icon size={20}/><strong>{s.value.toLocaleString('ar-EG')}</strong><span>{s.title}</span></button>)}</div>
 <div className="admin-directory-heading"><div><h2>أقسام الإدارة</h2><p>{allowed.length} أداة متاحة حسب صلاحياتك</p></div><label className="admin-menu-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} aria-label="البحث في المهام" placeholder="ابحث عن مهمة…"/></label></div>
 <div className="admin-directory">{ADMIN_GROUPS.map(group=>{const sections=allowed.filter(s=>s.group===group&&s.id!=='overview'&&`${s.title} ${s.description} ${group}`.includes(search.trim()));return sections.length>0&&<section key={group}><h3>{group}<small>{sections.length}</small></h3>{sections.map(s=><button key={s.id} onClick={()=>onNavigate(s.id)}><div><strong>{s.title}</strong><span>{s.description}</span></div><ArrowUpLeft size={17}/></button>)}</section>;})}</div>
 {search&&!allowed.some(s=>s.id!=='overview'&&`${s.title} ${s.description} ${s.group}`.includes(search.trim()))&&<p className="admin-menu-empty">لا توجد مهام مطابقة. جرّب كلمة أخرى.</p>}
 </div>;
}
