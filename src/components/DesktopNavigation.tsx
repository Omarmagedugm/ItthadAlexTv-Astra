import { Link, useLocation } from 'react-router-dom';
import { NavigationIcon, useNavigation } from './design/navigation';
import '../desktop-navigation.css';

const groups=[
 {title:'المباريات',paths:['/matches','/live']},
 {title:'الأخبار والنادي',paths:['/news','/history','/social']},
 {title:'الجماهير والخدمات',paths:['/fan-zone','/world-fans','/club-members','/services','/jersey-tryon']},
 {title:'المكتبة والتسوق',paths:['/library','/business','/store']},
];
export default function DesktopNavigation(){
 const {items,pages}=useNavigation();const {pathname}=useLocation();
 const active=(path:string)=>path==='/'?pathname==='/':pathname===path||pathname.startsWith(path+'/');
 const link=(item:any)=><Link key={item.id} to={item.path} className={active(item.path)?'is-active':''} aria-current={active(item.path)?'page':undefined}><NavigationIcon path={item.path}/><span>{item.title}</span>{item.badge&&<small>{item.badge}</small>}</Link>;
 const internal=items.filter(item=>!item.path.startsWith('http'));
 const home=internal.find(item=>item.path==='/');
 const used=new Set(['/']);
 return <nav className="ds-desktop-navigation" dir="rtl" aria-label="التنقل الرئيسي">
 {home&&link(home)}
 {groups.map(group=>{const members=group.paths.map(path=>internal.find(item=>item.path===path)).filter((item): item is (typeof internal)[number] => Boolean(item));members.forEach(item=>used.add(item.path));if(!members.length)return null;return <details key={group.title}><summary>{group.title}</summary><div className="ds-nav-dropdown">{members.map(link)}</div></details>;})}
 {internal.filter(item=>!used.has(item.path)).length>0&&<details><summary>المزيد</summary><div className="ds-nav-dropdown">{internal.filter(item=>!used.has(item.path)).map(link)}</div></details>}
 {items.filter(item=>item.path.startsWith('http')).map(item=><a key={item.id} href={item.path} target="_blank" rel="noopener noreferrer"><NavigationIcon path={item.path}/><span>{item.title}</span></a>)}
 {pages.length>0&&<details><summary>صفحات إضافية</summary><div className="ds-nav-dropdown">{pages.map(page=><Link key={page.id} to={'/page/'+page.slug} className={active('/page/'+page.slug)?'is-active':''}><NavigationIcon path="/page/"/><span>{page.title}</span></Link>)}</div></details>}
 </nav>;
}