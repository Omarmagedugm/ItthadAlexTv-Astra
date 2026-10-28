export interface BottomNavigationItem {
  path: string;
  icon: string;
  label: string;
  active: boolean;
  isNew?: boolean;
}
export const DEFAULT_BOTTOM_NAV_ITEMS: BottomNavigationItem[] = [
  {path:'/',icon:'home',label:'الرئيسية',active:true},
  {path:'/news',icon:'newspaper',label:'الأخبار',active:true},
  {path:'/game',icon:'sports_esports',label:'اللعبة 🎮',active:true,isNew:true},
  {path:'/fan-zone',icon:'stadium',label:'فان زون',active:true},
  {path:'/library',icon:'perm_media',label:'الوسائط',active:true},
  {path:'/profile',icon:'person',label:'حسابي',active:true},
];
export const BOTTOM_NAV_DESTINATIONS: BottomNavigationItem[] = [
  ...DEFAULT_BOTTOM_NAV_ITEMS,
  {path:'/matches',icon:'calendar_month',label:'المباريات',active:true},
  {path:'/live',icon:'live_tv',label:'البث المباشر',active:true},
  {path:'/social',icon:'share',label:'سوشيال ميديا',active:true},
  {path:'/history',icon:'history_edu',label:'تاريخ النادي',active:true},
  {path:'/world-fans',icon:'public',label:'اتحاداوية العالم',active:true},
  {path:'/services',icon:'handshake',label:'خدمات الجمهور',active:true},
  {path:'/business',icon:'storefront',label:'اتحاداوي بيزنس',active:true},
  {path:'/store',icon:'shopping_bag',label:'المتجر',active:true},
  {path:'/bookmarks',icon:'bookmark',label:'محفوظاتي',active:true},
  {path:'/jersey-tryon',icon:'auto_awesome',label:'استوديو المشجع',active:true},
];
export function resolveBottomNavigation(saved?: BottomNavigationItem[]): BottomNavigationItem[] {
  if (!Array.isArray(saved)) return DEFAULT_BOTTOM_NAV_ITEMS.map(item => ({...item}));
  const paths = new Set<string>();
  const items: BottomNavigationItem[] = [];
  for (const item of saved) {
    if (!item || typeof item.path !== 'string' || !/^\/(?!\/)/.test(item.path) || paths.has(item.path)) continue;
    paths.add(item.path);
    items.push({path:item.path,label:typeof item.label==='string'?item.label.trim().slice(0,24):'',icon:typeof item.icon==='string'&&/^[a-z0-9_]+$/.test(item.icon)?item.icon:'link',active:item.active!==false,isNew:item.isNew===true});
  }
  return items;
}
