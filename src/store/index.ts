import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  WorldCountry, 
  WorldGroup, 
  WorldPost, 
  WorldEvent, 
  WorldHelpRequest, 
  WorldGroupApplication 
} from '../types/worldFans';
import { defaultWorldCountries, defaultWorldGroups } from '../data/defaultWorldFansData';
import {
  PublicService,
  EducationVideo,
  defaultEducationCategories
} from '../data/defaultServicesData';
import { SectionFlags, DEFAULT_SECTION_FLAGS } from '../types/sections';

export type { PublicService, EducationVideo, SectionFlags };
export { DEFAULT_SECTION_FLAGS };

export interface HomeSection {
  id: string;
  type: 'hero' | 'matches' | 'news' | 'media' | 'history' | 'stadiums' | 'store' | 'polls' | 'live' | 'custom' | 'widget' | 'city' | 'ads' | 'advertise' | 'image' | 'ai_banner' | 'tickets' | 'club_members' | 'club_members_ad' | 'club_members_banner' | 'business' | 'business_directory' | 'ittihad_business' | 'social' | 'social_media' | 'world_fans' | 'world_association' | 'video' | 'video_embed' | 'youtube' | 'facebook' | 'services' | 'public_services';
  title?: string;
  subtitle?: string;
  active: boolean;
  order: number;
  htmlCode?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoType?: 'youtube' | 'facebook' | 'direct' | 'auto';
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16';
  autoplay?: boolean;
  link?: string;
  spacing?: number;
  pinned?: boolean;
  bannerHeight?: number; // Height in px: e.g. 60 to 1000, or 0 for unlimited / maximum natural full size
  bannerSize?: 'compact' | 'small' | 'medium' | 'large' | 'max' | 'custom';
  imageFit?: 'cover' | 'contain' | 'auto';
  bannerWidth?: 'full' | 'medium' | 'compact';
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  iconType?: 'material' | 'lucide' | 'facebook';
  active: boolean;
  order: number;
  badge?: string;
  badgeColor?: string;
  isCustom?: boolean;
  highlighted?: boolean;
  highlightColor?: 'default' | 'amber' | 'blue' | 'emerald' | 'primary' | 'purple' | 'red' | 'none';
  group?: 'main' | 'more' | 'legal';
}

export const DEFAULT_SIDEBAR_ITEMS: SidebarMenuItem[] = [
  { id: 'home', title: 'الرئيسية', path: '/', icon: 'home', iconType: 'material', active: true, order: 0, highlighted: false, group: 'main' },
  { id: 'news', title: 'الأخبار والتغطيات', path: '/news', icon: 'newspaper', iconType: 'material', active: true, order: 1, highlighted: false, group: 'main' },
  { id: 'matches', title: 'جدول المباريات', path: '/matches', icon: 'sports_soccer', iconType: 'material', active: true, order: 2, highlighted: false, group: 'main' },
  { id: 'live', title: 'البث المباشر', path: '/live', icon: 'live_tv', iconType: 'material', active: true, order: 3, highlighted: false, group: 'main' },
  { id: 'world-fans', title: 'رابطة اتحاداوية العالم', path: '/world-fans', icon: 'Globe', iconType: 'lucide', active: true, order: 3.5, highlighted: false, group: 'main' },
  { id: 'public-services', title: 'خدمات الجمهور', path: '/services', icon: 'volunteer_activism', iconType: 'material', active: true, order: 3.8, badge: 'جديد', badgeColor: '#10b981', highlighted: true, highlightColor: 'emerald', group: 'main' },
  { id: 'fan-zone', title: 'منطقة الجماهير', path: '/fan-zone', icon: 'stadium', iconType: 'material', active: true, order: 4, highlighted: false, group: 'main' },
  { id: 'jersey-tryon', title: 'استوديو المشجع (AI)', path: '/jersey-tryon', icon: 'bolt', iconType: 'material', active: true, order: 5, highlighted: false, group: 'main' },
  { id: 'club-members', title: 'أعضاء النادي', path: '/club-members', icon: 'ShieldCheck', iconType: 'lucide', active: true, order: 6, highlighted: false, group: 'main' },
  { id: 'library', title: 'المكتبة الرقمية والوسائط', path: '/library', icon: 'perm_media', iconType: 'material', active: true, order: 7, highlighted: false, group: 'main' },
  { id: 'social', title: 'سوشيال ميديا', path: '/social', icon: 'facebook', iconType: 'facebook', active: true, order: 8, highlighted: false, group: 'main' },
  { id: 'history', title: 'تاريخ النادي', path: '/history', icon: 'history_edu', iconType: 'material', active: true, order: 9, highlighted: false, group: 'main' },
  { id: 'business', title: 'اتحاداوي بيزنس', path: '/business', icon: 'Building2', iconType: 'lucide', active: true, order: 10, highlighted: false, group: 'main' },
  { id: 'store', title: 'متجر الجماهير', path: '/store', icon: 'shopping_bag', iconType: 'material', active: true, order: 11, highlighted: false, group: 'main' },
  { id: 'profile', title: 'حسابي', path: '/profile', icon: 'person', iconType: 'material', active: true, order: 12, highlighted: false, group: 'more' },
  { id: 'bookmarks', title: 'محفوظاتي', path: '/bookmarks', icon: 'bookmark', iconType: 'material', active: true, order: 13, highlighted: false, group: 'more' },
];

export interface NewsTag {
  id: string;
  name: string;
  color: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
  type: 'manual' | 'rss';
  newsType?: 'news' | 'article';
  category?: string;
  summary?: string;
  author?: string;
  editorName?: string;
  rssUrl?: string;
  rssSource?: string;
  videoUrl?: string;
  videoType?: 'youtube' | 'facebook' | 'direct' | 'auto';
  tagIds?: string[];
  views?: number;
  createdAt?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'photo';
  source?: 'upload' | 'youtube';
  url: string;
  thumbnailUrl: string;
  videoUrl?: string;
  date: string;
  duration?: string;
  views?: string | number;
  likes?: string[];
  playlistId?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface MediaPlaylist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  type?: 'video' | 'photo';
  createdAt: string;
}

export interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  date: string;
  status: 'live' | 'upcoming' | 'finished';
  competition: string;
  stadium?: string;
  stadiumImage?: string;
  isMatchDay?: boolean;
  isTimerRunning?: boolean;
  timerStartTime?: string | null;
  timerBaseMinute?: number;
  sport: 'football' | 'basketball';
  featured?: boolean;
  stadiumOpacity?: number;
}

export interface BusinessItem {
  id: string;
  ownerId: string;
  ownerName?: string;
  businessName: string;
  category: string;
  description: string;
  phone: string;
  whatsapp?: string;
  address: string;
  mapsUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  coverImage: string;
  gallery?: string[];
  discountPercentage?: number | string;
  discountNote?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted';
  featured?: boolean;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  stats?: {
    views?: number;
    phoneClicks?: number;
    whatsappClicks?: number;
    mapClicks?: number;
    websiteClicks?: number;
    socialClicks?: number;
  };
}

export interface BusinessUpdate {
  id: string;
  businessId: string;
  ownerId: string;
  previousData: Partial<BusinessItem>;
  requestedData: Partial<BusinessItem>;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface BusinessReport {
  id: string;
  businessId: string;
  businessName: string;
  userId?: string;
  userName?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface CityInfo {
  id: string;
  cityName: string;
  useAutoWeather?: boolean;
  temperature: string;
  condition: string;
  sunset: string;
  sunrise: string;
  description: string;
  image: string;
  weatherBg?: string;
  active: boolean;
}

export interface ClubItem {
  id: string;
  name: string;
  logo: string;
}

export interface PollItem {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  voters?: string[];
  voterChoices?: Record<string, number>;
  active: boolean;
  createdAt: string;
}

export interface PredictionItem {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  homeScore: number;
  awayScore: number;
  status?: 'pending' | 'won' | 'lost';
  pointsAwarded?: number;
  createdAt: string;
}

export interface FanPostItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title?: string;
  content: string;
  image?: string;
  location?: string;
  date?: string;
  poll?: {
    options: string[];
    votes: Record<number, number>;
    voters?: string[];
    voterChoices?: Record<string, number>;
  };
  likes: number;
  likedBy?: string[];
  commentsCount?: number;
  tags?: string[];
  createdAt: string;
}

export interface LiveStream {
  isActive: boolean;
  url: string;
  rawUrl?: string;
  embedUrl?: string;
  streamType?: string;
  useProxy?: boolean;
  isWebView?: boolean;
  title: string;
  viewers: number;
  sport?: 'football' | 'basketball' | 'programs' | 'custom' | string;
  customName?: string;
  hidden?: boolean;
  bannerUrl?: string;
  bannerLink?: string;
  bannerTitle?: string;
}

export const isStreamHidden = (stream?: LiveStream | null): boolean => {
  if (!stream) return false;
  return stream.hidden === true || 
         (stream.hidden as any) === 'true' || 
         (stream.hidden as any) === '1' || 
         (stream.hidden as any) === 1;
};

export interface ClubTitle {
  id: string;
  name: string;
  count: number;
  icon: string;
  category: 'football' | 'basketball';
  order?: number;
  hidden?: boolean;
}

export interface ClubStat {
  id: string;
  label: string;
  value: number;
  icon: string;
  order?: number;
  hidden?: boolean;
}

export interface HistoryEvent {
  id: string;
  year: string;
  title: string;
  desc: string;
  order?: number;
  hidden?: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId?: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
  category: 'anthem' | 'chant' | 'song';
  lyrics?: string;
  hidden?: boolean;
  createdAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: string;
  songIds?: string[];
  hidden?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  coverUrl: string;
  songIds: string[];
  hidden?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  desc: string;
  category: string;
  hidden?: boolean;
}

export interface AdBanner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface StadiumItem {
  id: string;
  name: string;
  type: string;
  desc: string;
  imageUrl: string;
  order?: number;
  hidden?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'tshirt' | 'mug' | 'scarf' | 'bracelet' | 'other';
  imageUrl: string;
  stock: number;
}

export interface ClubCommittee {
  id: string;
  name: string;
  description: string;
  president?: string;
  vicePresident?: string;
  icon?: string;
  image?: string;
  status: 'active' | 'inactive';
  order: number;
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  image?: string;
  category?: string;
  priority: 'urgent' | 'important' | 'normal';
  committeeId?: string;
  pinned?: boolean;
  active: boolean;
  createdAt: string;
  validUntil?: string;
}

export interface ClubService {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  workingHours: string;
  phone?: string;
  requirements?: string;
  image?: string;
  bookingUrl?: string;
  bookingText?: string;
  active: boolean;
  order: number;
}

export interface AuditLogItem {
  id: string;
  action: 'delete' | 'create' | 'update' | 'restore';
  collectionName: string;
  collectionLabel: string;
  itemId: string;
  itemTitle: string;
  itemThumbnail?: string;
  itemData?: any;
  performedBy: {
    uid: string;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  timestamp: string;
  status?: 'deleted' | 'restored' | 'active';
  details?: string;
}

export interface ClubTrip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  priceMember: number;
  priceNonMember: number;
  features?: string;
  requirements?: string;
  maxParticipants?: number;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  active: boolean;
  order: number;
  createdAt?: string;
}

export interface ClubMembersSettings {
  id?: string;
  phoneHotline?: string;
  workingHours?: string;
  memberNotice?: string;
  updatedAt?: string;
}

export interface MemberDiscount {
  id: string;
  name: string;
  category: string;
  address: string;
  location?: string;
  discountDetails: string;
  phoneNumbers: string;
  mapsUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  coverImage?: string | null;
  active: boolean;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userEmail?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'ready' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'sold' | 'completed' | 'confirmed' | 'rejected';
  channel?: string;
  source?: string;
  createdAt: string;
}

export type AppRole = 'admin' | 'superadmin' | 'moderator' | 'writer' | 'news_editor' | 'media_editor' | 'matches_editor' | 'store_editor' | 'layout_editor' | 'user_manager' | 'members_editor';

export interface UserProfile {
  uid?: string;
  name: string;
  displayName?: string;
  username?: string;
  location: string;
  joinDate: string;
  avatar: string;
  isVerified?: boolean;
  isVerifiedMember?: boolean;
  membershipNumber?: string;
  points?: number;
  lastActive?: string;
  createdAt?: string;
  phone?: string;
  phoneNumber?: string;
  role?: 'user' | 'admin' | 'superadmin' | 'moderator' | 'writer' | 'news_editor' | 'media_editor' | 'matches_editor' | 'store_editor' | 'layout_editor' | 'user_manager' | 'members_editor';
  roles?: AppRole[];
  tier?: 'new' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'premium';
  bio?: string;
  email?: string;
  isBannedFromAI?: boolean;
  stats: {
    predictions: number;
    comments: number;
    favorites: number;
  };
}

interface AppState {
  news: NewsItem[];
  media: MediaItem[];
  matches: MatchItem[];
  clubs: ClubItem[];
  polls: PollItem[];
  predictions: PredictionItem[];
  fanPosts: FanPostItem[];
  users: UserProfile[];
  sectionFlags: SectionFlags;
  aiConfig: { enabled: boolean; bannerTitle?: string; bannerDescription?: string; bannerImage?: string; bannerOpacity?: number; clubLogo?: string; userDailyLimit?: number };
  appSettings: {
    appName: string;
    appLogo: string;
    headerLogoLight?: string;
    headerLogoDark?: string;
    headerLogoSize?: 'small' | 'medium' | 'large' | 'xlarge' | 'custom';
    headerLogoHeight?: number;
    logoType?: 'image' | 'text';
    logoText?: string;
    bottomNavStyle?: 'modern' | 'classic';
    defaultSport?: 'football' | 'basketball' | 'auto';
    liveViewMode?: 'both' | 'football' | 'basketball';
    liveBannerUrl?: string;
    liveBannerLink?: string;
    liveBannerTitle?: string;
    liveBannerActive?: boolean;
    liveAdBanner?: {
      imageUrl?: string;
      link?: string;
      title?: string;
      enabled?: boolean;
    };
    libraryBanner?: string;
    facebookPageUrl?: string;
    onesignalRestApiKey?: string;
    onesignalAppId?: string;
    maintenanceEnabled?: boolean;
    maintenanceTitle?: string;
    maintenanceMessage?: string;
    maintenanceEstimatedTime?: string;
    socialLinks?: {
      facebook?: string;
      youtube?: string;
      instagram?: string;
      tiktok?: string;
      twitter?: string;
      whatsapp?: string;
    };
  };
  liveStream: LiveStream;
  liveStreams: {
    football: LiveStream;
    basketball: LiveStream;
    programs: LiveStream;
    custom: LiveStream;
  };
  theme: 'dark' | 'light';
  profile: UserProfile;
  clubTitles: ClubTitle[];
  clubStats: ClubStat[];
  historyEvents: HistoryEvent[];
  stadiums: StadiumItem[];
  newsCategories: string[];
  newsTags: NewsTag[];
  products: Product[];
  orders: StoreOrder[];
  ads: AdBanner[];
  customPages: any[];
  clubCommittees: ClubCommittee[];
  clubAnnouncements: ClubAnnouncement[];
  clubServices: ClubService[];
  clubTrips: ClubTrip[];
  clubMembersSettings: ClubMembersSettings | null;
  memberDiscounts: MemberDiscount[];
  businesses: BusinessItem[];
  businessUpdates: BusinessUpdate[];
  businessReports: BusinessReport[];
  worldCountries: WorldCountry[];
  worldGroups: WorldGroup[];
  worldPosts: WorldPost[];
  worldEvents: WorldEvent[];
  worldHelpRequests: WorldHelpRequest[];
  worldApplications: WorldGroupApplication[];
  homeSections: HomeSection[];
  sidebarMenuItems: SidebarMenuItem[];
  services: PublicService[];
  educationVideos: EducationVideo[];
  educationCategories: string[];
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  mediaPlaylists: MediaPlaylist[];
  books: Book[];
  cityInfo: CityInfo | null;
  currentSong: Song | null;
  isPlaying: boolean;
  playerVolume: number;
  stadiumOpacity: number;
  isAuthReady: boolean;
  dataLoaded: boolean;
  activePlaylist: Song[];
  undoStack: { collection: string; action: 'add' | 'delete' | 'update'; data: any }[];
  auditLogs: AuditLogItem[];
  setNews: (news: NewsItem[]) => void;
  addNews: (item: NewsItem) => void;
  deleteNews: (id: string) => void;
  updateNews: (id: string, item: Partial<NewsItem>) => void;
  setMedia: (media: MediaItem[]) => void;
  addMedia: (item: MediaItem) => void;
  deleteMedia: (id: string) => void;
  updateMedia: (id: string, item: Partial<MediaItem>) => void;
  setMatches: (matches: MatchItem[]) => void;
  addMatch: (item: MatchItem) => void;
  deleteMatch: (id: string) => void;
  updateMatch: (id: string, item: Partial<MatchItem>) => void;
  setClubs: (clubs: ClubItem[]) => void;
  setPolls: (polls: PollItem[]) => void;
  setPredictions: (predictions: PredictionItem[]) => void;
  setFanPosts: (posts: FanPostItem[]) => void;
  setUsers: (users: UserProfile[]) => void;
  updateUser: (uid: string, item: Partial<UserProfile>) => void;
  deleteUser: (uid: string) => void;
  setSectionFlags: (flags: Partial<SectionFlags>) => void;
  setSettings: (settings: any) => void;
  updateLiveStream: (stream: Partial<LiveStream>) => void;
  updateLiveStreams: (streams: { football?: Partial<LiveStream>; basketball?: Partial<LiveStream>; programs?: Partial<LiveStream>; custom?: Partial<LiveStream> }) => void;
  toggleTheme: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setClubTitles: (titles: ClubTitle[]) => void;
  setClubStats: (stats: ClubStat[]) => void;
  setHistoryEvents: (events: HistoryEvent[]) => void;
  setStadiums: (stadiums: StadiumItem[]) => void;
  setNewsCategories: (categories: string[]) => void;
  setNewsTags: (tags: NewsTag[]) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: StoreOrder[]) => void;
  setAds: (ads: AdBanner[]) => void;
  setCustomPages: (pages: any[]) => void;
  setClubCommittees: (committees: ClubCommittee[]) => void;
  setClubAnnouncements: (announcements: ClubAnnouncement[]) => void;
  setClubServices: (services: ClubService[]) => void;
  setClubTrips: (trips: ClubTrip[]) => void;
  setClubMembersSettings: (settings: ClubMembersSettings | null) => void;
  setMemberDiscounts: (memberDiscounts: MemberDiscount[]) => void;
  setBusinesses: (businesses: BusinessItem[]) => void;
  setBusinessUpdates: (updates: BusinessUpdate[]) => void;
  setBusinessReports: (reports: BusinessReport[]) => void;
  setWorldCountries: (countries: WorldCountry[]) => void;
  setWorldGroups: (groups: WorldGroup[]) => void;
  setWorldPosts: (posts: WorldPost[]) => void;
  setWorldEvents: (events: WorldEvent[]) => void;
  setWorldHelpRequests: (requests: WorldHelpRequest[]) => void;
  setWorldApplications: (applications: WorldGroupApplication[]) => void;
  setHomeSections: (sections: HomeSection[]) => void;
  setSidebarMenuItems: (items: SidebarMenuItem[]) => void;
  setServices: (services: PublicService[]) => void;
  addService: (service: PublicService) => void;
  updateService: (id: string, item: Partial<PublicService>) => void;
  deleteService: (id: string) => void;
  setEducationVideos: (videos: EducationVideo[]) => void;
  addEducationVideo: (video: EducationVideo) => void;
  updateEducationVideo: (id: string, item: Partial<EducationVideo>) => void;
  deleteEducationVideo: (id: string) => void;
  setEducationCategories: (categories: string[]) => void;
  setSongs: (songs: Song[]) => void;
  setAlbums: (albums: Album[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setMediaPlaylists: (playlists: MediaPlaylist[]) => void;
  setBooks: (books: Book[]) => void;
  setCityInfo: (info: CityInfo | null) => void;
  setAiConfig: (config: any) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayerVolume: (volume: number) => void;
  setStadiumOpacity: (opacity: number) => void;
  setIsAuthReady: (ready: boolean) => void;
  setDataLoaded: (loaded: boolean) => void;
  setActivePlaylist: (songs: Song[]) => void;
  setAuditLogs: (logs: AuditLogItem[]) => void;
  pushToUndoStack: (op: { collection: string; action: 'add' | 'delete' | 'update'; data: any }) => void;
  popFromUndoStack: () => { collection: string; action: 'add' | 'delete' | 'update'; data: any } | undefined;
}

const defaultNews: NewsItem[] = [];

const defaultMedia: MediaItem[] = [];

const defaultMatches: MatchItem[] = [];

const defaultLiveStream: LiveStream = {
  isActive: false,
  url: '',
  title: 'بث مباشر',
  viewers: 0,
  sport: 'football',
};

const defaultLiveStreams = {
  football: { ...defaultLiveStream, sport: 'football' as const },
  basketball: { ...defaultLiveStream, sport: 'basketball' as const },
  programs: { ...defaultLiveStream, title: 'برامج واستوديو الاتحاد', sport: 'programs' as const },
  custom: { ...defaultLiveStream, title: 'بث خاص ومباشر', sport: 'custom' as const, customName: 'بث خاص' },
};

const defaultProfile: UserProfile = {
  name: 'مشجع سكندري',
  username: 'fan_ittihad',
  location: 'الإسكندرية، مصر',
  joinDate: '٢٠٢٤',
  avatar: 'https://ui-avatars.com/api/?name=%D9%85%D8%B4%D8%AC%D8%B9+%D8%B3%D9%83%D9%86%D8%AF%D8%B1%D9%8A&background=random',
  isVerified: false,
  role: 'user',
  tier: 'new',
  bio: 'مشجع عاشق لنادي الاتحاد السكندري - زعيم الثغر',
  stats: {
    predictions: 0,
    comments: 0,
    favorites: 0
  }
};

let persistTimer: any = null;
let pendingStorageKey: string | null = null;
let pendingStorageVal: string | null = null;

const flushPendingStorage = () => {
  if (pendingStorageKey && pendingStorageVal !== null && typeof window !== 'undefined') {
    try {
      localStorage.setItem(pendingStorageKey, pendingStorageVal);
    } catch (e) {
      try {
        const parsed = JSON.parse(pendingStorageVal);
        if (parsed?.state) {
          if (Array.isArray(parsed.state.news)) parsed.state.news = parsed.state.news.slice(0, 20);
          if (Array.isArray(parsed.state.matches)) parsed.state.matches = parsed.state.matches.slice(0, 20);
          if (Array.isArray(parsed.state.media)) parsed.state.media = parsed.state.media.slice(0, 10);
          localStorage.setItem(pendingStorageKey, JSON.stringify(parsed));
        }
      } catch (_) {}
    }
    pendingStorageKey = null;
    pendingStorageVal = null;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingStorage);
  window.addEventListener('pagehide', flushPendingStorage);
}

const debouncedStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    if (pendingStorageKey === name && pendingStorageVal !== null) {
      return pendingStorageVal;
    }
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    pendingStorageKey = name;
    pendingStorageVal = value;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      flushPendingStorage();
    }, 1000);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    pendingStorageKey = null;
    pendingStorageVal = null;
    localStorage.removeItem(name);
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      news: defaultNews,
      media: defaultMedia,
      matches: defaultMatches,
      clubs: [],
      polls: [],
      predictions: [],
      fanPosts: [],
      users: [],
      sectionFlags: DEFAULT_SECTION_FLAGS,
      appSettings: {
        appName: 'قناة الاتحاد السكندري',
        appLogo: '/icon.png',
        headerLogoLight: '',
        headerLogoDark: '',
        headerLogoSize: 'medium',
        headerLogoHeight: 48,
        logoType: 'image',
        logoText: 'قناة الاتحاد السكندري',
        bottomNavStyle: 'modern',
        defaultSport: 'auto',
        liveViewMode: 'both',
        liveBannerUrl: '/nada_ad.png',
        liveBannerLink: '',
        liveBannerTitle: '',
        liveBannerActive: true,
        liveAdBanner: {
          imageUrl: '/nada_ad.png',
          link: '',
          title: '',
          enabled: true
        },
        facebookPageUrl: 'https://www.facebook.com/Itthadalexchannel',
        maintenanceEnabled: false,
        maintenanceTitle: 'سنعود بعد قليل انتظرونا',
        maintenanceMessage: 'نقوم حالياً بإجراء بعض التحديثات وأعمال الصيانة لتحسين تجربة استخدام قناة الاتحاد السكندري. سنعود بعد قليل، انتظرونا!',
        maintenanceEstimatedTime: '',
        socialLinks: {
          facebook: 'https://www.facebook.com/Itthadalexchannel',
          youtube: 'https://youtube.com/@itthadalexchannel',
          instagram: 'https://instagram.com/itthadalexchannel',
          tiktok: 'https://tiktok.com/@itthadalexchannel',
          twitter: 'https://x.com/itthadalexchannel',
          whatsapp: 'https://wa.me/itthadalexchannel'
        }
      },
      liveStream: defaultLiveStream,
      liveStreams: defaultLiveStreams,
      theme: 'light',
      profile: defaultProfile,
      isAuthReady: false,
      clubTitles: [],
      clubStats: [],
      historyEvents: [],
      stadiums: [],
      newsCategories: ['أخبار الفريق', 'كرة سلة', 'ألعاب أخرى', 'تقارير', 'انتقالات'],
      newsTags: [
        { id: '1', name: 'مباشر', color: '#ef4444' },
        { id: '2', name: 'عاجل', color: '#eab308' },
        { id: '3', name: 'رائج', color: '#22c55e' },
      ],
      products: [],
      orders: [],
      ads: [],
      customPages: [],
      clubCommittees: [],
      clubAnnouncements: [],
      clubServices: [],
      clubTrips: [],
      clubMembersSettings: null,
      memberDiscounts: [],
      businesses: [],
      businessUpdates: [],
      businessReports: [],
      worldCountries: defaultWorldCountries,
      worldGroups: defaultWorldGroups,
      worldPosts: [],
      worldEvents: [],
      worldHelpRequests: [],
      worldApplications: [],
      homeSections: [
        { id: 'hero', type: 'hero', active: true, order: 0 },
        { id: 'matches', type: 'matches', active: true, order: 1 },
        { id: 'world_fans', type: 'world_fans', active: true, order: 1.1, title: 'رابطة اتحاداوية العالم' },
        { id: 'public_services', type: 'services', active: true, order: 1.15, title: 'خدمات الجمهور' },
        { id: 'club_members', type: 'club_members', active: true, order: 1.2, title: 'بوابة الأعضاء والأنشطة' },
        { id: 'city', type: 'city', active: true, order: 1.5, title: 'عروس البحر المتوسط' },
        { id: 'news', type: 'news', active: true, order: 2 },
        { id: 'media', type: 'media', active: true, order: 3 },
        { id: 'polls', type: 'polls', active: true, order: 4 },
        { id: 'history', type: 'history', active: true, order: 5 },
        { id: 'advertise', type: 'advertise', active: true, order: 10 },
      ],
      sidebarMenuItems: DEFAULT_SIDEBAR_ITEMS,
      services: [],
      educationVideos: [],
      educationCategories: defaultEducationCategories,
      songs: [],
      albums: [],
      playlists: [],
      mediaPlaylists: [],
      books: [],
      cityInfo: null,
      aiConfig: { enabled: true },
      currentSong: null,
      isPlaying: false,
      playerVolume: 1,
      stadiumOpacity: 0.2,
      dataLoaded: false,
      activePlaylist: [],
      undoStack: [],
      auditLogs: [],
      setNews: (news) => {
        const seen = new Set<string>();
        const unique = news.filter(n => n?.id && !seen.has(n.id) && seen.add(n.id));
        set({ news: unique });
      },
      addNews: (item) => set((state) => ({ news: [item, ...state.news.filter(n => n.id !== item.id)] })),
      deleteNews: (id) => set((state) => ({ news: state.news.filter(n => n.id !== id) })),
      updateNews: (id, updatedItem) => set((state) => ({
        news: state.news.map(n => n.id === id ? { ...n, ...updatedItem } : n)
      })),
      setMedia: (media) => {
        const seen = new Set<string>();
        const unique = media.filter(m => m?.id && !seen.has(m.id) && seen.add(m.id));
        set({ media: unique });
      },
      addMedia: (item) => set((state) => ({ media: [item, ...state.media.filter(m => m.id !== item.id)] })),
      deleteMedia: (id) => set((state) => ({ media: state.media.filter(m => m.id !== id) })),
      updateMedia: (id, updatedItem) => set((state) => ({
        media: state.media.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setMatches: (matches) => {
        const seen = new Set<string>();
        const unique = matches.filter(m => m?.id && !seen.has(m.id) && seen.add(m.id));
        set({ matches: unique });
      },
      addMatch: (item) => set((state) => ({ matches: [item, ...state.matches.filter(m => m.id !== item.id)] })),
      deleteMatch: (id) => set((state) => ({ matches: state.matches.filter(m => m.id !== id) })),
      updateMatch: (id, updatedItem) => set((state) => ({
        matches: state.matches.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setClubs: (clubs) => set({ clubs }),
      setPolls: (polls) => set({ polls }),
      setPredictions: (predictions) => set({ predictions }),
      setFanPosts: (posts) => set({ fanPosts: posts }),
      setUsers: (users) => set({ users }),
      updateUser: (uid, updatedItem) => set((state) => ({
        users: state.users.map(u => u.uid === uid ? { ...u, ...updatedItem } : u)
      })),
      deleteUser: (uid) => set((state) => ({
        users: state.users.filter(u => u.uid !== uid)
      })),
      setSectionFlags: (flags) => set((state) => ({ 
        sectionFlags: { ...state.sectionFlags, ...flags } 
      })),
      setSettings: (settings) => set((state) => ({ appSettings: { ...state.appSettings, ...settings } })),
      setAiConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
      updateLiveStream: (stream) => set((state) => ({ liveStream: { ...state.liveStream, ...stream } })),
      updateLiveStreams: (streams) => set((state) => ({
        liveStreams: {
          football: streams.football
            ? { ...state.liveStreams?.football, ...streams.football, hidden: streams.football.hidden !== undefined ? streams.football.hidden : state.liveStreams?.football?.hidden }
            : state.liveStreams?.football,
          basketball: streams.basketball
            ? { ...state.liveStreams?.basketball, ...streams.basketball, hidden: streams.basketball.hidden !== undefined ? streams.basketball.hidden : state.liveStreams?.basketball?.hidden }
            : state.liveStreams?.basketball,
          programs: streams.programs
            ? { ...state.liveStreams?.programs, ...streams.programs, hidden: streams.programs.hidden !== undefined ? streams.programs.hidden : state.liveStreams?.programs?.hidden }
            : state.liveStreams?.programs,
          custom: streams.custom
            ? { ...(state.liveStreams?.custom || defaultLiveStreams.custom), ...streams.custom, hidden: streams.custom.hidden !== undefined ? streams.custom.hidden : state.liveStreams?.custom?.hidden }
            : state.liveStreams?.custom,
        },
        // Also update legacy liveStream if football is updated
        ...(streams.football ? { liveStream: { ...state.liveStream, ...streams.football, hidden: streams.football.hidden !== undefined ? streams.football.hidden : state.liveStream?.hidden } } : {})
      })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } as UserProfile })),
      setClubTitles: (clubTitles) => set({ clubTitles }),
      setClubStats: (clubStats) => set({ clubStats }),
      setHistoryEvents: (historyEvents) => set({ historyEvents }),
      setStadiums: (stadiums) => set({ stadiums }),
      setNewsCategories: (newsCategories) => set({ newsCategories }),
      setNewsTags: (newsTags) => set({ newsTags }),
      setProducts: (products) => set({ products }),
      setOrders: (orders) => set({ orders }),
      setAds: (ads) => set({ ads }),
      setCustomPages: (customPages) => set({ customPages }),
      setClubCommittees: (clubCommittees) => set({ clubCommittees }),
      setClubAnnouncements: (clubAnnouncements) => set({ clubAnnouncements }),
      setClubServices: (clubServices) => set({ clubServices }),
      setClubTrips: (clubTrips) => set({ clubTrips }),
      setClubMembersSettings: (clubMembersSettings) => set({ clubMembersSettings }),
      setMemberDiscounts: (memberDiscounts) => set({ memberDiscounts }),
      setBusinesses: (businesses) => set({ businesses }),
      setBusinessUpdates: (businessUpdates) => set({ businessUpdates }),
      setBusinessReports: (businessReports) => set({ businessReports }),
      setWorldCountries: (worldCountries) => set({ worldCountries }),
      setWorldGroups: (worldGroups) => set({ worldGroups }),
      setWorldPosts: (worldPosts) => set({ worldPosts }),
      setWorldEvents: (worldEvents) => set({ worldEvents }),
      setWorldHelpRequests: (worldHelpRequests) => set({ worldHelpRequests }),
      setWorldApplications: (worldApplications) => set({ worldApplications }),
      setHomeSections: (homeSections) => set({ homeSections }),
      setSidebarMenuItems: (sidebarMenuItems) => set({ sidebarMenuItems }),
      setServices: (services) => {
        const seen = new Set<string>();
        const unique = services.filter(s => s?.id && !seen.has(s.id) && seen.add(s.id));
        set({ services: unique });
      },
      addService: (item) => set((state) => ({ services: [item, ...state.services.filter(s => s.id !== item.id)] })),
      updateService: (id, updatedItem) => set((state) => ({
        services: state.services.map(s => s.id === id ? { ...s, ...updatedItem } : s)
      })),
      deleteService: (id) => set((state) => ({
        services: state.services.filter(s => s.id !== id)
      })),
      setEducationVideos: (educationVideos) => {
        const seen = new Set<string>();
        const unique = educationVideos.filter(v => v?.id && !seen.has(v.id) && seen.add(v.id));
        set({ educationVideos: unique });
      },
      addEducationVideo: (item) => set((state) => ({
        educationVideos: [item, ...state.educationVideos.filter(v => v.id !== item.id)]
      })),
      updateEducationVideo: (id, updatedItem) => set((state) => ({
        educationVideos: state.educationVideos.map(v => v.id === id ? { ...v, ...updatedItem } : v)
      })),
      deleteEducationVideo: (id) => set((state) => ({
        educationVideos: state.educationVideos.filter(v => v.id !== id)
      })),
      setEducationCategories: (educationCategories) => set({ educationCategories }),
      setSongs: (songs) => set({ songs }),
      setAlbums: (albums) => set({ albums }),
      setPlaylists: (playlists) => set({ playlists }),
      setMediaPlaylists: (mediaPlaylists) => set({ mediaPlaylists }),
      setBooks: (books) => set({ books }),
      setCityInfo: (cityInfo) => set({ cityInfo }),
      setCurrentSong: (currentSong) => set({ currentSong }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setPlayerVolume: (playerVolume) => set({ playerVolume }),
      setStadiumOpacity: (stadiumOpacity) => set({ stadiumOpacity }),
      setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
      setDataLoaded: (dataLoaded) => set({ dataLoaded }),
      setActivePlaylist: (activePlaylist) => set({ activePlaylist }),
      setAuditLogs: (auditLogs) => set({ auditLogs }),
      pushToUndoStack: (op) => set((state) => ({ 
        undoStack: [op, ...state.undoStack].slice(0, 20) // Keep last 20 operations
      })),
      popFromUndoStack: () => {
        let op: any = undefined;
        set((state) => {
          if (state.undoStack.length === 0) return state;
          const [first, ...rest] = state.undoStack;
          op = first;
          return { undoStack: rest };
        });
        return op;
      },
    }),
    {
      name: 'ittihad-app-storage-v3',
      storage: createJSONStorage(() => debouncedStateStorage),
      partialize: (state) => ({
        theme: state.theme,
        playerVolume: state.playerVolume,
        stadiumOpacity: state.stadiumOpacity,
        profile: state.profile,
        liveStreams: state.liveStreams,
        liveStream: state.liveStream,
        news: (state.news || []).slice(0, 50),
        media: state.media || [],
        mediaPlaylists: state.mediaPlaylists || [],
        matches: (state.matches || []).slice(0, 50),
        fanPosts: (state.fanPosts || []).slice(0, 150),
        polls: state.polls || [],
        ads: (state.ads || []).slice(0, 15),
        homeSections: state.homeSections,
        appSettings: state.appSettings,
        sectionFlags: state.sectionFlags,
        cityInfo: state.cityInfo,
        songs: state.songs || [],
        books: state.books || [],
        albums: state.albums || [],
        playlists: state.playlists || [],
        services: state.services || [],
        clubCommittees: state.clubCommittees || [],
        clubAnnouncements: state.clubAnnouncements || [],
        clubServices: state.clubServices || [],
        clubTrips: state.clubTrips || [],
        memberDiscounts: state.memberDiscounts || [],
        worldCountries: state.worldCountries || [],
        clubTitles: state.clubTitles || [],
        clubStats: state.clubStats || [],
        historyEvents: state.historyEvents || [],
        stadiums: state.stadiums || [],
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.dataLoaded = true;
          // Filter out legacy default items cached from older sessions so only user-added data remains
          if (Array.isArray(state.songs)) {
            state.songs = state.songs.filter((s: any) => !s.id?.startsWith('song-'));
          }
          if (Array.isArray(state.books)) {
            state.books = state.books.filter((b: any) => !b.id?.startsWith('book-'));
          }
          if (Array.isArray(state.albums)) {
            state.albums = state.albums.filter((a: any) => !a.id?.startsWith('album-'));
          }
          if (Array.isArray(state.playlists)) {
            state.playlists = state.playlists.filter((p: any) => !p.id?.startsWith('pl-'));
          }
          if (Array.isArray(state.mediaPlaylists)) {
            state.mediaPlaylists = state.mediaPlaylists.filter((p: any) => !p.id?.startsWith('pl_'));
          }
          if (Array.isArray(state.media)) {
            state.media = state.media.filter((m: any) => !m.id?.startsWith('media_photo_') && !m.id?.startsWith('media_video_'));
          }
          if (Array.isArray(state.clubCommittees)) {
            state.clubCommittees = state.clubCommittees.filter((c: any) => !c.id?.startsWith('comm-'));
          }
          if (Array.isArray(state.clubAnnouncements)) {
            state.clubAnnouncements = state.clubAnnouncements.filter((a: any) => !a.id?.startsWith('ann-'));
          }
          if (Array.isArray(state.clubServices)) {
            state.clubServices = state.clubServices.filter((s: any) => !s.id?.startsWith('serv-'));
          }
          if (Array.isArray(state.clubTrips)) {
            state.clubTrips = state.clubTrips.filter((t: any) => !t.id?.startsWith('trip-'));
          }
        }
      }
    }
  )
);
