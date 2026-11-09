# Offline-first (non-game areas)
This PWA caches its app shell and selected static media with Workbox. Previously fetched public Firestore data is restored from IndexedDB. Opening the app at least once online is required. Private data is not blindly copied to the shared public cache.

- Offline articles: Library page /offline-reads; save button inside a news article. The text is retained in IndexedDB, while images are best effort via Cache API and depend on browser eviction and URL stability.
- The last synchronized public settings are respected to avoid exposing admin-disabled widgets offline.
- Live streaming, external videos, fresh scores, new login, write confirmations need online access.
- Downloads of audio use app origin's IndexedDB blobs; iOS/browser storage may be evicted.
- Offline functionality requires production HTTPS, installed service-worker and at least one online load.

Manual QA: install PWA on iOS Safari and Android Chrome, open /news and /matches online, save an article, turn airplane mode on, restart the standalone app, navigate /news /matches /offline-reads and /live, then reconnect. Verify that hidden features stay hidden and data refreshes after reconnecting.
