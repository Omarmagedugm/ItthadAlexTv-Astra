import { Link, useLocation } from 'react-router-dom';
import { NavigationIcon, useNavigation } from './navigation';
export default function NavigationLinks({onNavigate}:{onNavigate?:()=>void}) {
 const {items,pages}=useNavigation();const {pathname}=useLocation();
 return <><p className="ds-nav-label">عالم الاتحاد</p>{items.map(item=>{
 const active=item.path==='/' ? pathname==='/' : pathname===item.path || pathname.startsWith(item.path+'/');
 const content=<><NavigationIcon path={item.path}/><span>{item.title}</span>{item.badge && <small>{item.badge}</small>}</>;
 return /^https?:\/\//.test(item.path) ? <a className="ds-nav-link" href={item.path} key={item.id} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>{content}</a> : <Link className={`ds-nav-link ${active?'is-active':''}`} aria-current={active?'page':undefined} to={item.path} key={item.id} onClick={onNavigate}>{content}</Link>;
 })}{pages.length>0 && <p className="ds-nav-label">صفحات النادي</p>}{pages.map(p=><Link className="ds-nav-link" to={`/page/${p.slug}`} key={p.id} onClick={onNavigate}><NavigationIcon path="/page/"/><span>{p.title}</span></Link>)}</>;
}
