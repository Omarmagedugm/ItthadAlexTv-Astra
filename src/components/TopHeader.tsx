import HeaderLogo from './design/HeaderLogo';
import { canAccessAdmin } from '../lib/adminAccess';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, Sun, Moon, Bell, UserRound, Radio, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { requestNotificationPermission } from '../lib/onesignal';
import Sidebar from './Sidebar';
import DesktopNavigation from './DesktopNavigation';
import SearchDialog from './design/SearchDialog';
export default function TopHeader(){
 const {profile,theme,toggleTheme,appSettings}=useAppStore();const {pathname}=useLocation();const [menu,setMenu]=useState(false);const [search,setSearch]=useState(false);const [busy,setBusy]=useState(false);
 useEffect(()=>{const open=()=>setMenu(true);const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setSearch(v=>!v);}};window.addEventListener('club:menu',open);window.addEventListener('keydown',key);return()=>{window.removeEventListener('club:menu',open);window.removeEventListener('keydown',key);};},[]);
 useEffect(()=>{setMenu(false);setSearch(false);},[pathname]);
 const notify=async()=>{if(busy)return;setBusy(true);try{const result=await requestNotificationPermission();result.success?toast.success('تم تفعيل الإشعارات'):toast.error(result.reason==='ios_not_standalone'?'ثبّت التطبيق على الشاشة الرئيسية أولاً لتفعيل إشعارات آيفون':'تعذّر تفعيل الإشعارات، راجع إعدادات المتصفح');}catch{toast.error('تعذّر تفعيل الإشعارات');}finally{setBusy(false);}};
 const primaryLogo=appSettings.headerLogoLight||'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1778009104/admin_headerLogoLight/wwc7cnjzvrod4xgzvrdb.png';
 const logo=(theme==='dark'?appSettings.headerLogoDark:primaryLogo)||primaryLogo;
 const logoText=appSettings.logoText||'قناة الاتحاد';
 const admin=canAccessAdmin(profile);
 return <><header className="ds-topbar ds-topbar--navigation" dir="rtl"><div className="ds-mobile-brand"><button onClick={()=>setMenu(true)} className="ds-icon-button" aria-label="فتح كل الأقسام"><Menu size={23}/></button><Link to="/"><HeaderLogo key={logo} src={logo} text={logoText}/></Link></div><Link to="/" className="ds-desktop-brand"><HeaderLogo key={logo} src={logo} text={logoText}/></Link><DesktopNavigation/><button className="ds-global-search" onClick={()=>setSearch(true)}><Search size={19}/><span>ابحث في عالم الاتحاد...</span><kbd>⌘ K</kbd></button><div className="ds-top-actions"><Link to="/live" className="ds-live-link"><span/>البث المباشر<Radio size={17}/></Link><button onClick={()=>setSearch(true)} className="ds-icon-button ds-mobile-search" aria-label="البحث"><Search size={21}/></button><button onClick={toggleTheme} className="ds-icon-button" aria-label={theme==='dark'?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن'}>{theme==='dark'?<Sun size={20}/>:<Moon size={20}/>}</button><button onClick={notify} disabled={busy} className="ds-icon-button" aria-label="تفعيل الإشعارات"><Bell size={20}/></button>{admin&&<Link to="/admin" className="ds-icon-button" aria-label="لوحة التحكم"><Settings2 size={20}/></Link>}<Link to={profile.uid?'/profile':'/auth'} className="ds-account-button" aria-label="حسابي"><UserRound size={20}/></Link></div></header>
