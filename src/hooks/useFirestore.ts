import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';
import { loadAllCachedCollections, setIdbItem } from '../lib/idbCache';

export function useFirestoreSync() {
  const isInitialFetchDoneRef = useRef(false);
  const [startupReady, setStartupReady] = useState(false);

  // 1. Ultra-fast Tiered Public / Global Data Sync with Offline First & IndexedDB
  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];
    const getStore = () => useAppStore.getState();
    // Wait for each essential collection, rather than the first arriving snapshot.
    const pendingCore = new Set(['settings/homeLayout', 'settings/global', 'appSettings/sections', 'matches', 'news']);
    const settleCore = (path: string) => {
      pendingCore.delete(path);
      if (isMounted && pendingCore.size === 0) setStartupReady(true);
    };

    // STEP 0: Immediate Rehydration of previously saved real data from IndexedDB
    // This allows the app to open with real content in 0ms without waiting for network requests
    loadAllCachedCollections().then((cached) => {
      if (!isMounted) return;
      let hasRealContent = false;

      if (cached.news && Array.isArray(cached.news) && cached.news.length > 0) {
        getStore().setNews(cached.news);
        hasRealContent = true;
      }
      if (cached.matches && Array.isArray(cached.matches) && cached.matches.length > 0) {
        getStore().setMatches(cached.matches);
        hasRealContent = true;
      }
      if (cached.media && Array.isArray(cached.media) && cached.media.length > 0) {
        getStore().setMedia(cached.media);
        hasRealContent = true;
      }
      if (cached.ads && Array.isArray(cached.ads) && cached.ads.length > 0) {
        getStore().setAds(cached.ads);
      }
      if (cached.homeSections && Array.isArray(cached.homeSections) && cached.homeSections.length > 0) {
        getStore().setHomeSections(cached.homeSections);
      }
      if (cached.appSettings) {
        getStore().setSettings(cached.appSettings);
      }
      if (cached.sectionFlags) {
        getStore().setSectionFlags(cached.sectionFlags);
      }
      if (cached.liveStreams) {
        getStore().updateLiveStreams(cached.liveStreams);
      }
      if (cached.songs && Array.isArray(cached.songs) && cached.songs.length > 0) {
        getStore().setSongs(cached.songs);
      }
      if (cached.books && Array.isArray(cached.books) && cached.books.length > 0) {
        getStore().setBooks(cached.books);
      }
      if (cached.services && Array.isArray(cached.services) && cached.services.length > 0) {
        getStore().setServices(cached.services);
      }
      if (cached.worldGroups && Array.isArray(cached.worldGroups) && cached.worldGroups.length > 0) {
        getStore().setWorldGroups(cached.worldGroups);
      }
      if (cached.fanPosts && Array.isArray(cached.fanPosts) && cached.fanPosts.length > 0) {
        getStore().setFanPosts(cached.fanPosts);
        hasRealContent = true;
      }
      if (cached.sidebarMenuItems && Array.isArray(cached.sidebarMenuItems) && cached.sidebarMenuItems.length > 0) {
        getStore().setSidebarMenuItems(cached.sidebarMenuItems);
      }

      // If we restored previously cached real data, unlock UI immediately!
      if (hasRealContent) {
        getStore().setDataLoaded(true);
        if (Array.isArray(cached.news) && Array.isArray(cached.matches) && cached.homeSections && cached.appSettings && cached.sectionFlags) setStartupReady(true);
      }
    }).catch(() => {});

    // Helper for safe snapshot subscription
    const subscribeSnapshot = (
      docOrQuery: any, 
      onNext: (snap: any) => void, 
      path: string, 
      op: OperationType = OperationType.LIST
    ) => {
      try {
        const unsub = onSnapshot(
          docOrQuery,
          { includeMetadataChanges: true },
          (snap: any) => {
            if (!isMounted) return;
            try {
              onNext(snap);
              // An empty local cache is not a completed server response.
              const hasCachedResult = typeof snap.exists === 'function' ? snap.exists() : !snap.empty;
              if (!snap.metadata.fromCache || hasCachedResult) settleCore(path);
            } catch (e) {
              console.warn(`Snapshot callback error for ${path}:`, e);
            }
          }, 
          (err) => {
            if (err?.code !== 'permission-denied') {
              handleFirestoreError(err, op, path);
            }
            // Do NOT wipe data on network error
            if (isMounted) { getStore().setDataLoaded(true); settleCore(path); }
          }
        );
        unsubs.push(unsub);
        return unsub;
      } catch (err) {
        handleFirestoreError(err, op, path);
        if (isMounted) { getStore().setDataLoaded(true); settleCore(path); }
        return () => {};
      }
    };

    // Recovery for a stalled connection; settled snapshots normally unlock startup first.
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        getStore().setDataLoaded(true);
        setStartupReady(true);
      }
    }, 12000);

    // ==========================================
    // TIER 1: CRITICAL CORE (Runs Immediately)
    // Synchronizes core settings and live collections
    // ==========================================

    // 1. Home Layout
    subscribeSnapshot(doc(db, 'settings', 'homeLayout'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.sections)) {
          const sortedSections = [...data.sections].sort((a: any, b: any) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return (a.order ?? 0) - (b.order ?? 0);
          });
          getStore().setHomeSections(sortedSections);
          setIdbItem('homeSections', sortedSections);
        }
      }
    }, 'settings/homeLayout', OperationType.GET);

    // 1.1 Sidebar Menu Layout (Real-time sync for custom sidebar ordering and visibility)
    subscribeSnapshot(doc(db, 'settings', 'sidebar_layout'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const sortedItems = [...data.items].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
          getStore().setSidebarMenuItems(sortedItems);
          setIdbItem('sidebarMenuItems', sortedItems);
        }
      }
    }, 'settings/sidebar_layout', OperationType.GET);

    // 2. Global App Settings
    subscribeSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          const s = { id: snap.id, ...data };
          getStore().setSettings(s);
          setIdbItem('appSettings', s);
        }
      }
    }, 'settings/global', OperationType.GET);

    // 3. Centralized Section Flags
    subscribeSnapshot(doc(db, 'appSettings', 'sections'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const flags = {
          fanServices: data.fanServices !== false,
          worldFans: data.worldFans !== false,
          fanStore: data.fanStore !== false,
          itthadawyBusiness: data.itthadawyBusiness !== false,
          ...data
        };
        getStore().setSectionFlags(flags);
        setIdbItem('sectionFlags', flags);
      }
    }, 'appSettings/sections', OperationType.GET);

    // 4. Live Stream Channels
    subscribeSnapshot(doc(db, 'settings', 'liveStream'), (snap) => {
      if (snap.exists()) getStore().updateLiveStreams({ football: snap.data() as any });
    }, 'settings/liveStream', OperationType.GET);

    subscribeSnapshot(doc(db, 'settings', 'liveStream_football'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const current = getStore().liveStreams?.football as any;
        if (!current?.updatedAt || !data?.updatedAt || data.updatedAt >= current.updatedAt) {
          getStore().updateLiveStreams({ football: data as any });
        }
      }
    }, 'settings/liveStream_football', OperationType.GET);

    subscribeSnapshot(doc(db, 'settings', 'liveStream_basketball'), (snap) => {
      if (snap.exists()) getStore().updateLiveStreams({ basketball: snap.data() as any });
    }, 'settings/liveStream_basketball', OperationType.GET);

    subscribeSnapshot(doc(db, 'settings', 'liveStream_programs'), (snap) => {
      if (snap.exists()) getStore().updateLiveStreams({ programs: snap.data() as any });
    }, 'settings/liveStream_programs', OperationType.GET);

    subscribeSnapshot(doc(db, 'settings', 'liveStream_custom'), (snap) => {
      if (snap.exists()) getStore().updateLiveStreams({ custom: snap.data() as any });
    }, 'settings/liveStream_custom', OperationType.GET);

    // 5. Matches (Fetch up to 50 real matches)
    subscribeSnapshot(
      query(collection(db, 'matches'), orderBy('date', 'desc'), limit(50)), 
      (snap) => {
        // If snapshot is empty but came from a transient error or empty cache, do not overwrite memory
        if (snap.empty && snap.metadata.fromCache && getStore().matches.length > 0) {
          return;
        }
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setMatches(items as any);
          setIdbItem('matches', items);
        } else if (!snap.metadata.fromCache) {
          getStore().setMatches([]);
          setIdbItem('matches', []);
        }
        if (isMounted) getStore().setDataLoaded(true);
      }, 
      'matches'
    );

    // 6. News (Fetch up to 100 real published news items)
    subscribeSnapshot(
      query(collection(db, 'news'), orderBy('date', 'desc'), limit(100)), 
      (snap) => {
        if (snap.empty && snap.metadata.fromCache && getStore().news.length > 0) {
          return;
        }
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setNews(items as any);
          setIdbItem('news', items);
        } else if (!snap.metadata.fromCache) {
          getStore().setNews([]);
          setIdbItem('news', []);
        }
        if (isMounted) getStore().setDataLoaded(true);
      }, 
      'news'
    );

    // 7. Active Ads
    subscribeSnapshot(
      query(collection(db, 'ads'), where('active', '==', true), orderBy('order', 'asc'), limit(20)),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setAds(items as any);
          setIdbItem('ads', items);
        }
      },
      'ads'
    );

    // 8. Media items (Real-time sync for gallery photos & videos)
    subscribeSnapshot(
      query(collection(db, 'media')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        items.sort((a: any, b: any) => {
          const timeA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        if (items.length > 0) {
          getStore().setMedia(items as any);
          setIdbItem('media', items);
        }
      },
      'media'
    );

    // 9. Media Playlists (Real-time sync)
    subscribeSnapshot(
      query(collection(db, 'media_playlists')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setMediaPlaylists(items as any);
        }
      },
      'media_playlists'
    );

    // 10. Songs & Library (Real-time sync)
    subscribeSnapshot(
      query(collection(db, 'songs')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setSongs(items as any);
          setIdbItem('songs', items);
        }
      },
      'songs'
    );

    subscribeSnapshot(
      query(collection(db, 'books')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setBooks(items as any);
          setIdbItem('books', items);
        }
      },
      'books'
    );

    subscribeSnapshot(
      query(collection(db, 'albums')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setAlbums(items as any);
          setIdbItem('albums', items);
        }
      },
      'albums'
    );

    subscribeSnapshot(
      query(collection(db, 'playlists')),
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (items.length > 0) {
          getStore().setPlaylists(items as any);
          setIdbItem('playlists', items);
        }
      },
      'playlists'
    );

    // 11. World Fan Associations
    subscribeSnapshot(
      query(collection(db, 'world_groups')),
      (snap) => {
        if (!snap.empty) {
          const groups = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          getStore().setWorldGroups(groups);
          setIdbItem('worldGroups', groups);
        }
      },
      'world_groups'
    );

    const getPostTime = (createdAt: any): number => {
      if (!createdAt) return 0;
      if (typeof createdAt === 'number') return createdAt;
      if (typeof createdAt === 'string') {
        const t = new Date(createdAt).getTime();
        return isNaN(t) ? 0 : t;
      }
      if (typeof createdAt === 'object') {
        if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
        if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
        if (createdAt.seconds !== undefined) {
          const sec = Number(createdAt.seconds || 0);
          const nano = Number(createdAt.nanoseconds || 0);
          return sec * 1000 + Math.floor(nano / 1000000);
        }
      }
      return 0;
    };

    // 12. Fan Posts (Real-time sync for all community posts up to 200, sorted robustly)
    subscribeSnapshot(
      query(collection(db, 'fan_posts'), limit(200)), 
      (s) => {
        if (s.empty && s.metadata.fromCache && getStore().fanPosts.length > 0) {
          return;
        }
        const items = s.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        items.sort((a: any, b: any) => getPostTime(b.createdAt) - getPostTime(a.createdAt));
        if (items.length > 0) {
          getStore().setFanPosts(items as any);
          setIdbItem('fanPosts', items);
        } else if (!s.metadata.fromCache) {
          getStore().setFanPosts([]);
          setIdbItem('fanPosts', []);
        }
      }, 
      'fan_posts'
    );

    // ==========================================
    // TIER 2: SECONDARY HOME WIDGETS (Deferred by 1.5s)
    // ==========================================
    const tier2Timer = setTimeout(() => {
      if (!isMounted) return;

      subscribeSnapshot(
        query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(15)), 
        (s) => getStore().setPolls(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 
        'polls'
      );

      subscribeSnapshot(
        query(collection(db, 'predictions'), orderBy('createdAt', 'desc'), limit(30)), 
        (s) => getStore().setPredictions(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 
        'predictions'
      );
    }, 1500);

    // ==========================================
    // TIER 3: BACKGROUND EXTENDED SECTIONS (Deferred by 3s)
    // ==========================================
    const tier3Timer = setTimeout(async () => {
      if (!isMounted || isInitialFetchDoneRef.current) return;
      isInitialFetchDoneRef.current = true;

      const fetchCol = async (col: string, setter: (d: any) => void, idbKey?: string, q?: any) => {
        try {
          const s = await getDocs(q || query(collection(db, col), limit(50)));
          if (!isMounted) return;
          const data = s.docs.map(d => ({ id: d.id, uid: d.id, ...(d.data() as any) }));
          if (data.length > 0) {
            setter(data);
            if (idbKey) setIdbItem(idbKey, data);
          }
        } catch (e) {}
      };

      try {
        await Promise.allSettled([
          fetchCol('clubs', (d) => getStore().setClubs(d), undefined, query(collection(db, 'clubs'), limit(50))),
          fetchCol('club_members_settings', (data) => {
            const main = data?.find((d: any) => d.id === 'main');
            if (main) getStore().setClubMembersSettings(main);
          }),
          fetchCol('member_discounts', (d) => getStore().setMemberDiscounts(d), 'memberDiscounts', query(collection(db, 'member_discounts'), limit(50))),
          fetchCol('club_announcements', (d) => getStore().setClubAnnouncements(d), undefined, query(collection(db, 'club_announcements'), limit(50))),
          fetchCol('club_services', (d) => getStore().setClubServices(d), undefined, query(collection(db, 'club_services'), limit(50))),
          fetchCol('club_trips', (d) => getStore().setClubTrips(d), undefined, query(collection(db, 'club_trips'), limit(50))),
          fetchCol('club_committees', (d) => getStore().setClubCommittees(d), undefined, query(collection(db, 'club_committees'), limit(50))),
          fetchCol('businesses', (d) => getStore().setBusinesses(d), undefined, query(collection(db, 'businesses'), limit(50))),
          fetchCol('world_countries', (d) => getStore().setWorldCountries(d), undefined, query(collection(db, 'world_countries'), limit(50))),
          fetchCol('world_groups', (d) => {
            if (Array.isArray(d) && d.length > 0) getStore().setWorldGroups(d);
          }, 'worldGroups', query(collection(db, 'world_groups'), limit(50))),
          fetchCol('public_services', (d) => getStore().setServices(d), 'services', query(collection(db, 'public_services'), limit(50))),
          fetchCol('club_stats', (d) => getStore().setClubStats(d), undefined, query(collection(db, 'club_stats'), limit(20))),
          fetchCol('club_titles', (d) => getStore().setClubTitles(d), undefined, query(collection(db, 'club_titles'), limit(50))),
          fetchCol('club_timeline', (d) => getStore().setHistoryEvents(d), 'historyEvents', query(collection(db, 'club_timeline'), limit(50))),
          fetchCol('club_stadiums', (d) => getStore().setStadiums(d), 'stadiums', query(collection(db, 'club_stadiums'), limit(20))),
        ]);
      } catch (e) {}
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      clearTimeout(tier2Timer);
      clearTimeout(tier3Timer);
      unsubs.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
    };
  }, []);

  // 2. User-specific Data Effect - Auth State Managed
  useEffect(() => {
    let userUnsubs: (() => void)[] = [];
    let currentSubscribedUid: string | null = null;
    const getStore = () => useAppStore.getState();

    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      const newUid = currentUser ? currentUser.uid : null;
      if (newUid === currentSubscribedUid) return;
      currentSubscribedUid = newUid;

      // Clean up previous user listeners
      userUnsubs.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
      userUnsubs = [];

      if (!currentUser) {
        getStore().setOrders([]);
        return;
      }

      // User Profile listener
      try {
        const unsubProfile = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as any;
              getStore().updateProfile({ ...userData, uid: currentUser.uid });
            }
          },
          (err) => {
            if (err?.code !== 'permission-denied') {
              handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
            }
          }
        );
        userUnsubs.push(unsubProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      }

      // Orders listener (limited to user's orders)
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const unsubOrders = onSnapshot(
          ordersQuery,
          (s) => {
            getStore().setOrders(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any);
          },
          (err) => {
            if (err?.code !== 'permission-denied') {
              handleFirestoreError(err, OperationType.LIST, 'orders');
            }
          }
        );
        userUnsubs.push(unsubOrders);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    });

    return () => {
      unsubAuth();
      userUnsubs.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
      userUnsubs = [];
    };
  }, []);
  return { startupReady };
}
