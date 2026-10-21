import { Home, Newspaper, Trophy, Radio, Users, Sparkles, ShieldCheck, Library, History, ShoppingBag, UserRound, Bookmark, Globe2, HeartHandshake, Building2, Facebook, Link2, FileText, Gamepad2 } from 'lucide-react';
import { DEFAULT_SIDEBAR_ITEMS, useAppStore } from '../../store';
import { getSectionKeyForPath } from '../../types/sections';
export const routeIcons: Record<string, typeof Home> = {'/':Home,'/news':Newspaper,'/matches':Trophy,'/live':Radio,'/fan-zone':Users,'/game':Gamepad2,'/jersey-tryon':Sparkles,'/club-members':ShieldCheck,'/library':Library,'/history':History,'/store':ShoppingBag,'/profile':UserRound,'/bookmarks':Bookmark,'/world-fans':Globe2,'/services':HeartHandshake,'/business':Building2,'/social':Facebook};
export function useNavigation() {
 const { sidebarMenuItems, sectionFlags, aiConfig, customPages } = useAppStore();
 const source = sidebarMenuItems?.length ? sidebarMenuItems : DEFAULT_SIDEBAR_ITEMS;
 const items = source.filter(i=>i.active!==false).filter(i=>{
  const key=getSectionKeyForPath(i.path); return (!key || sectionFlags[key]!==false) && !(i.path==='/jersey-tryon' && aiConfig?.enabled===false);
 }).sort((a,b)=>(a.order??0)-(b.order??0));
 return {items, pages:customPages.filter(p=>p.active!==false)};
}
export function NavigationIcon({path,size=20}:{path:string;size?:number}) {
 const Icon=routeIcons[path] || (path.startsWith('/page/') ? FileText : Link2);return <Icon size={size} strokeWidth={1.7}/>;
}
