import { useEffect, useRef, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { NavigationIcon, useNavigation } from './design/navigation';
import '../desktop-navigation.css';

const PRIMARY_DESKTOP_ITEMS: { path: string; label: string }[] = [
  { path: '/', label: 'الرئيسية' },
  { path: '/live', label: 'البث المباشر' },
  { path: '/news', label: 'الأخبار' },
  { path: '/fan-zone', label: 'فان زون' },
  { path: '/game', label: 'اللعبة' },
  { path: '/library', label: 'المكتبة الرقمية' },
];

export default function DesktopNavigation() {
  const { items, pages } = useNavigation();
  const { pathname } = useLocation();
  const moreRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (moreRef.current?.open && !moreRef.current.contains(event.target as Node)) {
        moreRef.current.open = false;
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const active = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

  const closeMenu = (e: MouseEvent<HTMLAnchorElement>) => {
    const menu = e.currentTarget.closest('details');
    if (menu) menu.open = false;
  };

  const renderLink = (item: any, labelOverride?: string, showBadge = true, iconSize = 16) => {
    const classNames = [
      active(item.path) ? 'is-active' : '',
      item.path === '/live' ? 'ds-nav-live-pill' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Link
        key={item.id}
        to={item.path}
        onClick={closeMenu}
        className={classNames}
        aria-current={active(item.path) ? 'page' : undefined}
      >
        <NavigationIcon path={item.path} size={iconSize} />
        <span>{labelOverride || item.title}</span>
        {showBadge && item.badge && <small>{item.badge}</small>}
      </Link>
    );
  };

  const internal = items.filter((item) => !item.path.startsWith('http'));
  const external = items.filter((item) => item.path.startsWith('http'));

  const primaryPaths = new Set<string>();
  const primaryItems = PRIMARY_DESKTOP_ITEMS.map(({ path, label }) => {
    const found = internal.find((item) => item.path === path);
    if (!found) return null;
    primaryPaths.add(path);
    return { item: found, label };
  }).filter((entry): entry is { item: (typeof internal)[number]; label: string } => Boolean(entry));

  const moreInternal = internal.filter((item) => !primaryPaths.has(item.path));
  const hasMoreItems = moreInternal.length > 0 || external.length > 0 || pages.length > 0;
  const hasActiveMore =
    moreInternal.some((item) => active(item.path)) ||
    pages.some((page) => active('/page/' + page.slug));

  return (
    <nav className="ds-desktop-navigation" dir="rtl" aria-label="التنقل الرئيسي">
      {primaryItems.map(({ item, label }) => renderLink(item, label, false, 16))}
      {hasMoreItems && (
        <details ref={moreRef}>
          <summary className={hasActiveMore ? 'is-active' : undefined}>
            <span>المزيد</span>
            <ChevronDown size={15} className="ds-nav-chevron" aria-hidden="true" />
          </summary>
          <div className="ds-nav-dropdown">
            {moreInternal.map((item) => renderLink(item, undefined, true, 17))}
            {(external.length > 0 || pages.length > 0) && (
              <>
                {moreInternal.length > 0 && <div className="ds-nav-dropdown-divider" role="separator" />}
                {external.map((item) => (
                  <a
                    key={item.id}
                    href={item.path}
                    onClick={closeMenu}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <NavigationIcon path={item.path} size={17} />
                    <span>{item.title}</span>
                  </a>
                ))}
                {pages.map((page) => (
                  <Link
                    key={page.id}
                    to={'/page/' + page.slug}
                    onClick={closeMenu}
                    className={active('/page/' + page.slug) ? 'is-active' : ''}
                    aria-current={active('/page/' + page.slug) ? 'page' : undefined}
                  >
                    <NavigationIcon path="/page/" size={17} />
                    <span>{page.title}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </details>
      )}
    </nav>
  );
}