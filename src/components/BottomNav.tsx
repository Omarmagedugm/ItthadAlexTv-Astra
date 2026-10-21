import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

const navItems = [
  { path: '/', icon: 'home', label: 'الرئيسية' },
  { path: '/news', icon: 'newspaper', label: 'الأخبار' },
  { path: '/game', icon: 'sports_esports', label: 'اللعبة 🎮', isNew: true },
  { path: '/fan-zone', icon: 'stadium', label: 'فان زون' },
  { path: '/library', icon: 'perm_media', label: 'الوسائط' },
  { path: '/profile', icon: 'person', label: 'حسابي' },
];

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { appSettings, theme } = useAppStore();
  const inverseBackground = theme === 'dark' ? '#f7faf8' : '#111a17';
  const inverseForeground = theme === 'dark' ? '#14201a' : '#f8fafc';
  const inverseBorder = theme === 'dark' ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.3)';
  const isClassic = appSettings?.bottomNavStyle === 'classic';

  if (isClassic) {
    return (
      <nav
        dir="rtl"
        aria-label="شريط التنقل السفلي"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6px)', backgroundColor: inverseBackground, color: inverseForeground, borderColor: inverseBorder, backdropFilter: 'blur(20px)' }}
        className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-50 max-w-md mx-auto glass-nav bottom-nav-inverse rounded-[28px] border border-white/35 dark:border-white/10 shadow-2xl px-2 py-1 md:hidden select-none"
      >
        <div className="flex items-center justify-around h-14 relative">
          {navItems.map((item, idx) => {
            const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
            const isCenter = idx === 2;

            if (isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -top-5 flex flex-col items-center group active:scale-95 transition-transform duration-150"
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ring-4 ring-background-light dark:ring-background-dark ${
                      isActive
                        ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-[0_0_20px_rgba(46,204,113,0.5)] scale-105'
                        : 'bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-105'
                    }`}
                  >
                    <span className="material-symbols-outlined !text-[30px] drop-shadow-sm">
                      {item.icon}
                    </span>
                    {item.isNew && !isActive && (
                      <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-emerald-950 animate-ping" />
                    )}
                  </div>
                  <span style={{ color: isActive ? '#b9df71' : inverseForeground }} className={`text-[10px] mt-1 font-black transition-colors duration-200 ${isActive ? 'text-accent' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#2ecc71] mt-0.5" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                style={{ color: isActive ? '#b9df71' : inverseForeground }}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? 'text-accent font-black'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span className={`material-symbols-outlined !text-[24px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  {item.isNew && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-slate-900 animate-pulse" />
                  )}
                </div>
                <span style={{ color: isActive ? '#b9df71' : inverseForeground }} className={`text-[10px] mt-0.5 transition-colors duration-200 ${isActive ? 'font-black text-accent' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#2ecc71] mt-0.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Modern / New floating capsule design:
  return (
    <nav
      dir="rtl"
        aria-label="شريط التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden px-4 pointer-events-none select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-md glass-nav rounded-full p-1.5 flex items-center justify-between gap-1 border shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: inverseBackground, color: inverseForeground, borderColor: inverseBorder, backdropFilter: "blur(20px)" }}>
        {navItems.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{ color: isActive ? '#ffffff' : inverseForeground }}
              className={`relative flex items-center justify-center gap-1.5 h-12 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-primary text-white px-3 shrink-0 shadow-sm'
                  : 'min-w-0 flex-1 max-w-12 text-white/70 dark:text-slate-600 hover:text-white dark:hover:text-slate-950'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined !text-[24px]"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                >
                  {item.icon}
                </span>
                {item.isNew && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-slate-900 animate-pulse" />
                )}
              </div>
              {isActive && <span className="text-[12px] font-bold whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
