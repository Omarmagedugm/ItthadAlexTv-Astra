import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

interface SWGlobalScope {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
  skipWaiting: () => Promise<void>;
  location: Location;
  importScripts?: (...urls: string[]) => void;
  addEventListener: (type: string, listener: (event: any) => void) => void;
}

const swSelf = self as unknown as SWGlobalScope;

// Activate updated workers promptly and claim open tabs without forcing reloads.
swSelf.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

swSelf.addEventListener('message', (event: any) => {
  if (event?.data && event.data.type === 'SKIP_WAITING') {
    void swSelf.skipWaiting();
  }
});

// Precache the compact core app shell (index.html, manifest, icon, core JS/CSS).
precacheAndRoute((self as any).__WB_MANIFEST, {
  ignoreURLParametersMatching: [/^v$/, /^utm_/, /^fbclid$/],
});

// Resilient SPA navigation handler:
// Online: tries network (3s timeout) and refreshes runtime HTML cache.
// Offline / timeout: ALWAYS serves the precached app shell so iOS Safari never shows
// "Safari cannot open the page because you are not connected to the Internet".
const navigationStrategy = new NetworkFirst({
  cacheName: 'app-shell-html-v1',
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [200],
    }),
  ],
});

const OFFLINE_FALLBACK_HTML = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>قناة الاتحاد السكندري</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#072418;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;">
  <div style="max-width:340px;">
    <img src="/icon.png" alt="قناة الاتحاد" style="width:72px;height:72px;border-radius:18px;margin-bottom:16px;" />
    <h1 style="font-size:20px;margin:0 0 8px;">أنت غير متصل بالإنترنت</h1>
    <p style="font-size:14px;opacity:0.85;line-height:1.6;margin:0 0 20px;">يرجى الاتصال بالإنترنت مرة واحدة لتحديث الملفات المحلية، وبعدها سيعمل التطبيق بدون إنترنت.</p>
    <button onclick="window.location.reload()" style="padding:10px 22px;border:0;border-radius:12px;background:#10b981;color:#fff;font-weight:700;font-size:14px;cursor:pointer;">إعادة المحاولة</button>
  </div>
</body>
</html>`;

registerRoute(
  new NavigationRoute(
    async ({ event, request }) => {
      try {
        const response = await navigationStrategy.handle({ event, request });
        if (response && response.ok) {
          return response;
        }
      } catch {
        // Offline or network timeout — fall back to precached index.html
      }

      const cachedShell =
        (await matchPrecache('/index.html')) ||
        (await matchPrecache('index.html')) ||
        (await caches.match('/index.html', { ignoreSearch: true })) ||
        (await caches.match('/', { ignoreSearch: true }));

      if (cachedShell) {
        return cachedShell;
      }

      return new Response(OFFLINE_FALLBACK_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    },
    {
      denylist: [
        /^\/api(?:\/|$)/,
        /^\/(?:robots\.txt|(?:news-)?sitemap\.xml|ads\.txt|llms\.txt)$/,
        /\.[^/]+$/,
      ],
    }
  )
);

// Runtime cache for hashed Vite JS/CSS chunks so every visited or prefetched lazy page works offline.
registerRoute(
  ({ url, request }) =>
    url.origin === swSelf.location.origin &&
    url.pathname.startsWith('/assets/') &&
    (request.destination === 'script' ||
      request.destination === 'style' ||
      /\.(?:js|css)$/i.test(url.pathname)),
  new CacheFirst({
    cacheName: 'app-assets-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
);

// Same-origin non-hashed static scripts & manifest
registerRoute(
  ({ url }) =>
    url.origin === swSelf.location.origin &&
    (url.pathname === '/manifest.json' || url.pathname === '/interaction-guard.js'),
  new StaleWhileRevalidate({
    cacheName: 'app-static-shell-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
);

// Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Google Fonts files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cloudinary media
registerRoute(
  /^https:\/\/res\.cloudinary\.com\/.*/i,
  new CacheFirst({
    cacheName: 'cloudinary-images-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// External CDN images
registerRoute(
  /^https:\/\/(?:images\.unsplash\.com|firebasestorage\.googleapis\.com|upload\.wikimedia\.org|ui-avatars\.com|lh3\.googleusercontent\.com)\/.*/i,
  new CacheFirst({
    cacheName: 'cdn-images-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Static images (including /icon.png?v=2 and local icons)
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)(?:\?.*)?$/i,
  new CacheFirst({
    cacheName: 'static-images-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 250,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Load OneSignal Push SDK ONLY AFTER all Workbox precaching & fetch routes are registered.
// Guarded by online check + try/catch so offline iOS Safari boot or content blockers
// NEVER crash the Service Worker script.
try {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
  const isHttpsProd =
    swSelf.location.protocol === 'https:' &&
    swSelf.location.hostname !== 'localhost' &&
    swSelf.location.hostname !== '127.0.0.1';

  if (isOnline && isHttpsProd && typeof swSelf.importScripts === 'function') {
    swSelf.importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
  }
} catch (err) {
  console.warn('[SW] OneSignal SDK import skipped (offline or unavailable):', err);
}
