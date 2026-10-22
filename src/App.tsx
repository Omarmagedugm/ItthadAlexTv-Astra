import { canAccessAdmin } from './lib/adminAccess';
import AppPreloader from './components/AppPreloader';
import PageFrame from "./components/design/PageFrame";
import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import PullToRefresh from './components/PullToRefresh';
import { useAppStore } from './store';
import { useFirestoreSync } from './hooks/useFirestore';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { initOneSignal, requestNotificationPermission } from './lib/onesignal';
import { preloadImages } from './lib/imageCache';

import Home from './pages/Home';
import MaintenanceScreen from './components/MaintenanceScreen';
import { updateClientSEO, buildWebsiteSchema } from './lib/seo';

function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      console.warn('Failed to load route chunk on first attempt, retrying once...', error);
      try {
        return await factory();
      } catch (retryErr) {
        console.error('Route chunk failed to load:', retryErr);
        // Keep the current page in place; recovery is an explicit user action.
        throw retryErr;
      }
    }
  });
}

// Lazy loaded page components
const Auth = safeLazy(() => import('./pages/Auth'));
const News = safeLazy(() => import('./pages/News'));
const NewsDetail = safeLazy(() => import('./pages/NewsDetail'));
const Media = safeLazy(() => import('./pages/Media'));
const Live = safeLazy(() => import('./pages/Live'));
const Matches = safeLazy(() => import('./pages/Matches'));
const Profile = safeLazy(() => import('./pages/Profile'));
const Admin = safeLazy(() => import('./pages/Admin'));
const FanZone = safeLazy(() => import('./pages/FanZone'));
const Game = safeLazy(() => import('./pages/Game'));
const JerseyTryOn = safeLazy(() => import('./pages/JerseyTryOn'));
const History = safeLazy(() => import('./pages/History'));
const Store = safeLazy(() => import('./pages/Store'));
const Bookmarks = safeLazy(() => import('./pages/Bookmarks'));
const Library = safeLazy(() => import('./pages/Library'));
const ClubMembers = safeLazy(() => import('./pages/ClubMembers'));
const DiscountsPage = safeLazy(() => import('./pages/DiscountsPage'));
const DiscountDetailPage = safeLazy(() => import('./pages/DiscountDetailPage'));
const BusinessDirectory = safeLazy(() => import('./pages/BusinessDirectory'));
const BusinessDetail = safeLazy(() => import('./pages/BusinessDetail'));
const WorldFans = safeLazy(() => import('./pages/WorldFans'));
const WorldGroupDetail = safeLazy(() => import('./pages/WorldGroupDetail'));
const CustomPage = safeLazy(() => import('./pages/CustomPage'));
const SocialMedia = safeLazy(() => import('./pages/SocialMedia'));
const PublicServices = safeLazy(() => import('./pages/PublicServices'));
const EducationService = safeLazy(() => import('./pages/EducationService'));
const PrivacyPolicy = safeLazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = safeLazy(() => import('./pages/TermsOfService'));

// Non-critical interactive components
const MusicPlayer = safeLazy(() => import('./components/MusicPlayer'));
const PWAInstallPrompt = safeLazy(() => import('./components/PWAInstallPrompt'));
const GoalCelebration = safeLazy(() => import('./components/GoalCelebration'));
const WinCelebration = safeLazy(() => import('./components/WinCelebration'));

import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';
import { ManagedSectionKey } from './types/sections';

function FeatureGuardRoute({ sectionKey, component: Component }: { sectionKey: ManagedSectionKey; component: React.ComponentType<any> }) {
  const isEnabled = useAppStore(state => state.sectionFlags[sectionKey] !== false);
  
  if (!isEnabled) {
    return <Navigate to="/" replace />;
  }

  return <Component />;
}

function VercelAnalytics() {
  return null;
}

function PageLoader() {
  return <div role="status" aria-live="polite" className="flex min-h-32 items-center justify-center text-xs font-light text-slate-500">جاري تحميل المحتوى…</div>;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("APP CRASH:", error, errorInfo);
  }

  handleReload = async () => {
    // Preserve session state, including the one-time startup screen.
    if ('caches' in window) {
      await caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#072418',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          direction: 'rtl'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '32px' }}>⚽</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            عذراً، حدث خطأ أثناء تحميل التطبيق
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1.5rem', maxWidth: '320px' }}>
            {this.state.error?.message || "فشل تحميل بعض عناصر الصفحة."}
          </p>
          <button 
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '1rem',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
            }}
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContentWrapper({ children, showGoal, showWin, activeMatch, scoredTeam, handleGoalComplete, setShowWin }: any) {
  const location = useLocation();
  const profile = useAppStore(state => state.profile);
  const appSettings = useAppStore(state => state.appSettings);

  const isAdmin = canAccessAdmin(profile);

  const isAllowedPath = location.pathname === '/admin' || location.pathname === '/auth';
  const isMaintenanceActive = Boolean(appSettings?.maintenanceEnabled);

  if (isMaintenanceActive && !isAdmin && !isAllowedPath) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="ds-app">
      <a href="#main-content" className="ds-skip-link">تخطّي إلى المحتوى</a>
      <TopHeader />
      <PageFrame><Suspense fallback={<PageLoader />}>{children}</Suspense></PageFrame>

      {/* Non-blocking background and utility widgets */}
      <Suspense fallback={null}>
        <MusicPlayer />
        <PWAInstallPrompt />
      </Suspense>

      {/* Celebrations loaded only when triggered */}
      {showWin && (
        <Suspense fallback={null}>
          <WinCelebration
            show={showWin}
            onComplete={() => setShowWin(false)}
            match={activeMatch}
          />
        </Suspense>
      )}

      {showGoal && (
        <Suspense fallback={null}>
          <GoalCelebration 
            show={showGoal} 
            onComplete={handleGoalComplete} 
            teamName={scoredTeam} 
            match={activeMatch}
          />
        </Suspense>
      )}
      <AppNav />
    </div>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppContent />
    </GlobalErrorBoundary>
  );
}

function AppContent() {
  const { startupReady } = useFirestoreSync();
  const [startupComplete, setStartupComplete] = useState(() => {
    try { return startupReady || sessionStorage.getItem('ittihad-startup-complete') === '1'; } catch { return startupReady; }
  });
  useEffect(() => {
    if (startupReady) {
      setStartupComplete(true);
      try { sessionStorage.setItem('ittihad-startup-complete', '1'); } catch {}
    }
  }, [startupReady]);
  const matches = useAppStore(state => state.matches);
  const [showGoal, setShowGoal] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [scoredTeam, setScoredTeam] = useState('');
  const [activeMatch, setActiveMatch] = useState<any>(null);
  
  const lastGoalCheck = useRef<Record<string, number>>({});
  const lastMatchStatus = useRef<Record<string, string>>({});
  const isInitialized = useRef(false);

  // Pre-cache key club branding assets & initialize OneSignal smoothly after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadImages([
        '/icon.png',
        'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1777841244/admin_logo/fpjoepth9okjaedlcj97.png',
        'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1786266811/admin_logo/nuzc32cczrp3mczzwbj4.png'
      ]);
      initOneSignal();
      // If permission is already granted, refresh the token and update metadata
      if ('Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000);
      }
    }, 1200);

    // Idle prefetch primary pages so transitions feel instant
    const prefetchCoreRoutes = () => {
      import('./pages/News');
      import('./pages/Matches');
      import('./pages/Live');
      import('./pages/FanZone');
      import('./pages/Library');
    };

    let idleId: any;
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        idleId = (window as any).requestIdleCallback(prefetchCoreRoutes, { timeout: 3500 });
      } else {
        idleId = setTimeout(prefetchCoreRoutes, 2500);
      }
    }

    return () => {
      clearTimeout(timer);
      if (idleId) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Check for Al-Ittihad goals in live matches
    const ittihadMatches = matches.filter(m => 
      m.status === 'live' && (m.homeTeam.includes('اتحاد') || m.awayTeam.includes('اتحاد'))
    );

    if (!isInitialized.current && ittihadMatches.length > 0) {
      ittihadMatches.forEach(m => {
        const isHome = m.homeTeam.includes('اتحاد');
        lastGoalCheck.current[m.id] = isHome ? parseInt(m.homeScore || "0") : parseInt(m.awayScore || "0");
      });
      isInitialized.current = true;
      return;
    }

    ittihadMatches.forEach(match => {
      const isHome = match.homeTeam.includes('اتحاد');
      const currentScore = isHome ? parseInt(match.homeScore || "0") : parseInt(match.awayScore || "0");
      const prevScore = lastGoalCheck.current[match.id];

      // Only trigger if we already had a record for this match (app was open)
      if (prevScore !== undefined && currentScore > prevScore && match.sport !== 'basketball') {
        setScoredTeam(isHome ? match.homeTeam : match.awayTeam);
        setActiveMatch(match);
        setShowGoal(true);
      }
      
      // Update check state
      if (currentScore !== prevScore) {
        lastGoalCheck.current[match.id] = currentScore;
      }
    });

    // Victory Detection
    matches.forEach(match => {
      const prevStatus = lastMatchStatus.current[match.id];
      if (prevStatus === 'live' && match.status === 'finished') {
        const homeScore = parseInt(match.homeScore || "0");
        const awayScore = parseInt(match.awayScore || "0");
        
        const isIttihadHome = match.homeTeam.includes('اتحاد') || match.homeTeam.includes('Ittihad');
        const isIttihadAway = match.awayTeam.includes('اتحاد') || match.awayTeam.includes('Ittihad');
        
        if ((isIttihadHome && homeScore > awayScore) || (isIttihadAway && awayScore > homeScore)) {
          setActiveMatch(match);
          setShowWin(true);
        }
      }
      if (prevStatus !== match.status) {
        lastMatchStatus.current[match.id] = match.status;
      }
    });
  }, [matches]);

  const handleGoalComplete = () => {
    setShowGoal(false);
  };

  const theme = useAppStore(state => state.theme);
  const setIsAuthReady = useAppStore(state => state.setIsAuthReady);
  const updateProfile = useAppStore(state => state.updateProfile);

  useEffect(() => {
    // Global listener for critical Firestore operations (only notify user if an active write/update fails due to connectivity)
    let offlineDebounceTimer: NodeJS.Timeout | null = null;
    const handleFirebaseError = (e: Event) => {
      const customEvent = e as CustomEvent;
      const op = customEvent.detail?.operationType;
      // Do not disturb users with transient read reconnection messages while offline/cached data is seamlessly serving the UI
      if (customEvent.detail?.code === 'unavailable' && (op === 'create' || op === 'update' || op === 'delete' || op === 'write')) {
        if (offlineDebounceTimer) clearTimeout(offlineDebounceTimer);
        offlineDebounceTimer = setTimeout(() => {
          toast.error('تعذر إتمام العملية بسبب ضعف اتصال الإنترنت، سيتم حفظ التعديلات محلياً ومزامنتها تلقائياً.', {
            id: 'firestore-unavailable-write',
            duration: 4000
          });
        }, 1500);
      }
    };
    window.addEventListener('firestore-error', handleFirebaseError);
    return () => {
      if (offlineDebounceTimer) clearTimeout(offlineDebounceTimer);
      window.removeEventListener('firestore-error', handleFirebaseError);
    };
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        updateProfile({ uid: user.uid, email: user.email || '' });
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            updateProfile({
              ...data,
              uid: user.uid,
              email: user.email || data.email || ''
            });
          }
        } catch (e) {
          console.debug('Failed to sync user profile on auth change:', e);
        }
      } else {
        updateProfile({ uid: undefined, name: 'مشجع سكندري', displayName: 'مشجع سكندري', username: 'fan_ittihad', location: 'الإسكندرية، مصر', avatar: '/guest-fan-avatar.svg', email: '', role: 'user', roles: [], tier: 'new', isVerified: false, isVerifiedMember: false, points: 0, stats: { predictions: 0, comments: 0, favorites: 0 } });
      }
      setIsAuthReady(true);
    });
    return unsub;
  }, [setIsAuthReady, updateProfile]);

  useEffect(() => {
    const root = window.document.documentElement;
    const themeColorMeta = document.getElementById('theme-color-meta');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#072418'); // background-dark
    } else {
      root.classList.remove('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#F8FAFC'); // background-light
    }
  }, [theme]);

  const handlePullRefresh = async () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fs_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('app-pull-refresh'));
    await new Promise(resolve => setTimeout(resolve, 700));
  };

function GlobalSEOSynchronizer() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // News detail handles its own specific SEO and canonical tag
    if (pathname.startsWith('/news/')) {
      return;
    }

    const noindexPaths = ['/admin', '/auth', '/profile', '/bookmarks', '/jersey-tryon'];
    const isNoIndex = noindexPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isNoIndex) {
      updateClientSEO({
        noindex: true,
        canonicalUrl: pathname
      });
      return;
    }

    if (pathname === '/') {
      updateClientSEO({
        title: 'قناة الاتحاد السكندري - زعيم الثغر وسيد البلد',
        description: 'تطبيق قناة الاتحاد السكندري - المنصة الرسمية لجماهير سيد البلد، تغطية مباشرة ومباريات وأخبار النادي لحظة بلحظة',
        canonicalUrl: '/',
        type: 'website',
        structuredData: buildWebsiteSchema()
      });
    } else if (pathname === '/news') {
      updateClientSEO({
        title: 'أخبار الاتحاد السكندري',
        description: 'آخر أخبار نادي الاتحاد السكندري، تغطية حصرية لكافة الألعاب والبطولات ومتابعة أخبار زعيم الثغر',
        canonicalUrl: '/news',
        type: 'website'
      });
    } else if (pathname === '/matches') {
      updateClientSEO({
        title: 'مباريات ونتائج الاتحاد السكندري',
        description: 'جدول مباريات نادي الاتحاد السكندري، النتائج المباشرة وترتيب الفريق في الدوري والبطولات',
        canonicalUrl: '/matches',
        type: 'website'
      });
    } else if (pathname === '/media') {
      updateClientSEO({
        title: 'المركز الإعلامي ومكتبة الفيديو والصور',
        description: 'فيديوهات وأهداف وملخصات مباريات الاتحاد السكندري وصور حصرية من قلب النادي',
        canonicalUrl: '/media',
        type: 'website'
      });
    } else if (pathname === '/live') {
      updateClientSEO({
        title: 'البث المباشر والمتابعة الحية',
        description: 'متابعة حية وبث مباشر لمباريات نادي الاتحاد السكندري وأحداث النادي الكبرى',
        canonicalUrl: '/live',
        type: 'website'
      });
    } else if (pathname === '/history') {
      updateClientSEO({
        title: 'تاريخ وبطولات زعيم الثغر',
        description: 'سجل بطولات وتاريخ نادي الاتحاد السكندري العريق منذ التأسيس وأساطير النادي الخالدة',
        canonicalUrl: '/history',
        type: 'website'
      });
    } else if (pathname === '/fanzone' || pathname === '/feed' || pathname === '/fan-zone') {
      updateClientSEO({
        title: 'مدرج جماهير الاتحاد السكندري',
        description: 'مساحة خاصة لجماهير سيد البلد للمشاركة والتفاعل ودعم الفريق',
        canonicalUrl: '/fanzone',
        type: 'website'
      });
    } else if (pathname === '/privacy-policy' || pathname === '/privacy') {
      updateClientSEO({
        title: 'سياسة الخصوصية',
        description: 'سياسة الخصوصية وشروط الاستخدام لتطبيق قناة الاتحاد السكندري',
        canonicalUrl: '/privacy-policy',
        type: 'website'
      });
    } else if (pathname === '/terms') {
      updateClientSEO({
        title: 'شروط الخدمة والاستخدام',
        description: 'الشروط والأحكام الخاصة باستخدام خدمات وتطبيق قناة الاتحاد السكندري',
        canonicalUrl: '/terms',
        type: 'website'
      });
    } else {
      updateClientSEO({
        canonicalUrl: pathname
      });
    }
  }, [location.pathname]);

  return null;
}

  // Keep all navigation and page chrome unmounted during startup.
  if (!startupReady && !startupComplete) return <AppPreloader />;

  // Auth Redirection Logic
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NotificationNavigator />
      <AuthRedirector />
      <GlobalSEOSynchronizer />
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          className: 'bg-white dark:bg-card-dark text-slate-800 dark:text-white font-bold font-display shadow-2xl rounded-2xl border border-border-light dark:border-border-dark',
        }}
      />
      <VercelAnalytics />
      <PullToRefresh onRefresh={handlePullRefresh}>
        <MainContentWrapper
          showGoal={showGoal}
          showWin={showWin}
          activeMatch={activeMatch}
          scoredTeam={scoredTeam}
          handleGoalComplete={handleGoalComplete}
          setShowWin={setShowWin}
        >
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<FanZone />} />
            <Route path="/fanzone" element={<FanZone />} />
            <Route path="/fan-zone" element={<FanZone />} />
            <Route path="/leaderboard" element={<FanZone />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/news/:id/:slug" element={<NewsDetail />} />
            <Route path="/media" element={<Media />} />
            <Route path="/live" element={<Live />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/fan-zone" element={<FanZone />} />
            <Route path="/game" element={<FeatureGuardRoute sectionKey="game" component={Game} />} />
            <Route path="/games/ittihadawy" element={<FeatureGuardRoute sectionKey="game" component={Game} />} />
            <Route path="/jersey-tryon" element={<JerseyTryOn />} />
            <Route path="/history" element={<History />} />
            <Route path="/store" element={<FeatureGuardRoute sectionKey="fanStore" component={Store} />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/library" element={<Library />} />
            <Route path="/club-members" element={<ClubMembers />} />
            <Route path="/club-members/discounts" element={<DiscountsPage />} />
            <Route path="/club-members/discounts/:id" element={<DiscountDetailPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/discounts/:id" element={<DiscountDetailPage />} />
            <Route path="/business" element={<FeatureGuardRoute sectionKey="itthadawyBusiness" component={BusinessDirectory} />} />
            <Route path="/business/:id" element={<FeatureGuardRoute sectionKey="itthadawyBusiness" component={BusinessDetail} />} />
            <Route path="/world-fans" element={<FeatureGuardRoute sectionKey="worldFans" component={WorldFans} />} />
            <Route path="/world-fans/group/:id" element={<FeatureGuardRoute sectionKey="worldFans" component={WorldGroupDetail} />} />
            <Route path="/world-association" element={<FeatureGuardRoute sectionKey="worldFans" component={WorldFans} />} />
            <Route path="/services" element={<FeatureGuardRoute sectionKey="fanServices" component={PublicServices} />} />
            <Route path="/public-services" element={<FeatureGuardRoute sectionKey="fanServices" component={PublicServices} />} />
            <Route path="/services/education" element={<FeatureGuardRoute sectionKey="fanServices" component={EducationService} />} />
            <Route path="/education" element={<FeatureGuardRoute sectionKey="fanServices" component={EducationService} />} />
            <Route path="/education-services" element={<FeatureGuardRoute sectionKey="fanServices" component={EducationService} />} />
            <Route path="/social" element={<SocialMedia />} />
            <Route path="/social-media" element={<SocialMedia />} />
            <Route path="/facebook" element={<SocialMedia />} />
            <Route path="/page/:slug" element={<CustomPage />} />
            <Route path="/image-compressor" element={<Navigate to="/admin" replace />} />
            <Route path="/compress-images" element={<Navigate to="/admin" replace />} />
            <Route path="/compress" element={<Navigate to="/admin" replace />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainContentWrapper>
      </PullToRefresh>
    </BrowserRouter>
  );
}

function AuthRedirector() {
  const profile = useAppStore(state => state.profile);
  const isAuthReady = useAppStore(state => state.isAuthReady);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthReady) return;

    const hasAdminAccess = canAccessAdmin(profile);

    // If logged in and on auth page, go home
    if (profile.uid && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
    
    // If not logged in and on a protected page like admin or profile, go to auth
    const protectedPaths = ['/admin', '/profile', '/bookmarks', '/store']; 
    if (!profile.uid && protectedPaths.includes(location.pathname)) {
      navigate('/auth', { replace: true });
    }

    // Role-based protection for /admin
    if (profile.uid && location.pathname === '/admin' && !hasAdminAccess) {
      toast.error('عذراً، لا تمتلك الصلاحيات الكافية للوصول إلى هذه الصفحة');
      navigate('/', { replace: true });
    }
  }, [profile.uid, profile.role, profile.roles, profile.email, location.pathname, navigate, isAuthReady]);

  return null;
}

function AppNav() {
  const location = useLocation();
  const hideNavPaths = ['/auth'];
  const isSplashOrAuth = hideNavPaths.includes(location.pathname);
  if (isSplashOrAuth) return null;
  return <BottomNav />;
}

function NotificationNavigator() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for native push notification clicks forwarded by Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
          navigate(event.data.url);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [navigate]);

  return null;
}

