import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowUpLeft, Newspaper } from 'lucide-react';
import { useAppStore } from '../../store';
import { NavigationIcon, useNavigation } from './navigation';
export default function SearchDialog({open,onClose,initialQuery=''}:{open:boolean;onClose:()=>void;initialQuery?:string}) {
 const dialog=useRef<HTMLDialogElement>(null);const input=useRef<HTMLInputElement>(null);const [q,setQ]=useState(initialQuery);const {items}=useNavigation();const news=useAppStore(s=>s.news);
 useEffect(()=>{const el=dialog.current;if(!el)return;if(open&&!el.open){setQ(initialQuery);el.showModal();requestAnimationFrame(()=>input.current?.focus());}else if(!open&&el.open)el.close();},[open,initialQuery]);
 const normal=(v:string)=>v.trim().toLocaleLowerCase('ar').replace(/[أإآ]/g,'ا').replace(/[\u064B-\u065F]/g,'');const query=normal(q);
 const sections=items.filter(i=>!query||normal(i.title).includes(query));const stories=query?news.filter(n=>normal(n.title).includes(query)).slice(0,8):[];
 return <dialog ref={dialog} className="ds-search-dialog" onCancel={onClose} onClose={onClose} aria-label="البحث في التطبيق" dir="rtl"><div className="ds-search-field"><Search size={23}/><input ref={input} aria-label="ابحث عن قسم أو خبر" placeholder="بتدور على إيه؟ خبر، قسم، أو خدمة..." value={q} onChange={e=>setQ(e.target.value)}/><button onClick={onClose} className="ds-icon-button" aria-label="إغلاق البحث"><X size={20}/></button></div><div className="ds-search-results"><p className="ds-nav-label">{query?'نتائج البحث':'اختصارات سريعة'}</p>{sections.map(i=>/^https?:/.test(i.path)?<a key={i.id} href={i.path} onClick={onClose}><NavigationIcon path={i.path}/><span>{i.title}</span><ArrowUpLeft size={17}/></a>:<Link to={i.path} key={i.id} onClick={onClose}><NavigationIcon path={i.path}/><span>{i.title}</span><ArrowUpLeft size={17}/></Link>)}{stories.map(n=><Link to={`/news/${n.id}`} key={n.id} onClick={onClose}><Newspaper size={20}/><span>{n.title}</span><ArrowUpLeft size={17}/></Link>)}{!sections.length&&!stories.length&&<div className="ds-search-empty"><Search size={36}/><h3>مفيش نتائج بالكلمات دي</h3><p>جرّب اسم القسم أو كلمة مختلفة من الخبر.</p></div>}</div><div className="ds-search-hint">ابحث داخل أقسام التطبيق والأخبار المحمّلة.</div></dialog>;
}
