export type ManagedSectionKey = 'fanServices' | 'worldFans' | 'fanStore' | 'itthadawyBusiness' | 'game' | 'footballCenter';

export interface SectionFlags {
  fanServices: boolean;
  worldFans: boolean;
  fanStore: boolean;
  itthadawyBusiness: boolean;
  game?: boolean;
  footballCenter?: boolean;
  [key: string]: boolean | undefined;
}

export const DEFAULT_SECTION_FLAGS: SectionFlags = {
  fanServices: true,
  worldFans: true,
  fanStore: true,
  itthadawyBusiness: true,
  game: true,
  footballCenter: true,
};

export interface SectionConfig {
  key: ManagedSectionKey;
  name: string;
  description: string;
  badge: string;
  icon: string;
  paths: string[];
}

export const MANAGED_SECTIONS: Record<ManagedSectionKey, SectionConfig> = {
  footballCenter: {
    key: 'footballCenter',
    name: 'مركز المباريات الذكي',
    description: 'قسم منفصل للتشكيلات والأحداث والإحصائيات من API-Football (/football-center)',
    badge: 'كرة القدم', icon: 'Trophy', paths: ['/football-center']
  },
  fanServices: {
    key: 'fanServices',
    name: 'خدمات الجماهير والتعليم',
    description: 'منصة خدمات الجمهور، دليل الخدمات العامة، ومنصة التعليم والتدريب المجاني (/services)',
    badge: 'خدمات جماهيرية',
    icon: 'HeartHandshake',
    paths: ['/services', '/public-services', '/services/education', '/education', '/education-services']
  },
  worldFans: {
    key: 'worldFans',
    name: 'رابطة اتحاداوية العالم',
    description: 'رابطة المشجعين حول العالم، مجموعات وروابط المغتربين، الفعاليات وطلبات المساعدة (/world-fans)',
    badge: 'المغتربين',
    icon: 'Globe',
    paths: ['/world-fans', '/world-fans/group', '/world-association']
  },
  fanStore: {
    key: 'fanStore',
    name: 'متجر الجماهير',
    description: 'منتجات النادي، كتالوج وتصنيفات الشراء، وتفاصيل الطلبات والمشتريات (/store)',
    badge: 'المتجر',
    icon: 'ShoppingBag',
    paths: ['/store']
  },
  itthadawyBusiness: {
    key: 'itthadawyBusiness',
    name: 'اتحاداوي بيزنس',
    description: 'دليل الأنشطة والمشروعات التجارية للاتحاداوية وتفاصيل الأعمال والخصومات التجارية (/business)',
    badge: 'دليل الأعمال',
    icon: 'Building2',
    paths: ['/business']
  },
  game: {
    key: 'game',
    name: 'لعبة اتحاداوي',
    description: 'لعبة اتحاداوي ثلاثية الأبعاد التفاعلية في شوارع ومعالم الإسكندرية ومطاردات المشجعين (/game)',
    badge: 'لعبة جديدة 🎮',
    icon: 'Gamepad2',
    paths: ['/game']
  }
};

/**
 * Returns whether a given section is enabled.
 * Defaults to true if flags are undefined or the key is not explicitly set to false.
 */
export function isSectionEnabled(flags: SectionFlags | undefined, sectionKey: string): boolean {
  if (!flags) return true;
  return flags[sectionKey] !== false;
}

/**
 * Maps a URL route pathname to a managed section key if it matches any protected paths.
 */
export function getSectionKeyForPath(pathname: string): ManagedSectionKey | null {
  const normalized = pathname.toLowerCase();
  
  if (normalized === '/football-center' || normalized.startsWith('/football-center/')) return 'footballCenter';

  if (
    normalized === '/game' ||
    normalized.startsWith('/game/')
  ) {
    return 'game';
  }

  if (
    normalized === '/services' || 
    normalized === '/public-services' || 
    normalized.startsWith('/services/') || 
    normalized === '/education' || 
    normalized === '/education-services'
  ) {
    return 'fanServices';
  }

  if (
    normalized === '/world-fans' || 
    normalized.startsWith('/world-fans/') || 
    normalized === '/world-association'
  ) {
    return 'worldFans';
  }

  if (
    normalized === '/store' || 
    normalized.startsWith('/store/')
  ) {
    return 'fanStore';
  }

  if (
    normalized === '/business' || 
    normalized.startsWith('/business/')
  ) {
    return 'itthadawyBusiness';
  }

  return null;
}
