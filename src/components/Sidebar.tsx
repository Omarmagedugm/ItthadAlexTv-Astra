import { canAccessAdmin } from '../lib/adminAccess';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, LogOut, ShieldCheck, FileText, Mail, LayoutDashboard } from 'lucide-react';
import { useAppStore, UserProfile } from '../store';
import { auth } from '../lib/firebase';
import NavigationLinks from './design/NavigationLinks';
export default function Sidebar({isOpen,onClose,profile}:{isOpen:boolean;onClose:()=>void;profile:UserProfile}) {
 const ref=useRef<HTMLDialogElement>(null);const navigate=useNavigate();const {appSettings,updateProfile}=useAppStore();
 useEffect(()=>{const d=ref.current;if(!d)return;if(isOpen&&!d.open)d.showModal();if(!isOpen&&d.open)d.close();},[isOpen]);
 const admin=canAccessAdmin(profile);
 const logout=async()=>{await auth.signOut();updateProfile({uid:undefined,name:'مشجع سكندري',displayName:'مشجع سكندري',username:'fan_ittihad',location:'الإسكندرية، مصر',avatar:'/guest-fan-avatar.svg',email:'',role:'user',roles:[],tier:'new',isVerified:false,isVerifiedMember:false,points:0,stats:{predictions:0,comments:0,favorites:0}});onClose();navigate('/auth',{replace:true});};
 return <dialog ref={ref} className="ds-drawer" onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-label="قائمة أقسام التطبيق" dir="rtl"><div className="ds-drawer-inner"><div className="ds-drawer-heading"><span>كل الاتحاد، بين إيديك.</span><button onClick={onClose} className="ds-icon-button" aria-label="إغلاق القائمة"><X size={21}/></button></div><Link to={profile.uid?'/profile':'/auth'} onClick={onClose} className="ds-drawer-profile"><img src={profile.uid?(profile.avatar||appSettings.appLogo||'/icon.png'):'/guest-fan-avatar.svg'} alt=""/><div><small>أهلاً بيك في بيتك</small><strong>{profile.uid?(profile.name||'مشجع اتحاداوي'):'مشجع سكندري'}</strong></div></Link><nav>{admin&&<Link className="ds-nav-link" to="/admin" onClick={onClose}><LayoutDashboard size={20}/><span>لوحة التحكم</span></Link>}<NavigationLinks onNavigate={onClose}/></nav><div className="ds-drawer-footer"><Link to="/privacy" onClick={onClose}><ShieldCheck size={18}/>سياسة الخصوصية</Link><Link to="/terms" onClick={onClose}><FileText size={18}/>شروط الاستخدام</Link><a href="mailto:info@itthadalextv.com"><Mail size={18}/>تواصل معنا</a>{profile.uid&&<button onClick={logout}><LogOut size={18}/>تسجيل الخروج</button>}</div></div></dialog>;
}
