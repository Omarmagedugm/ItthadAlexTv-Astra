/**
 * IndexedDB Data Cache Layer for Ittihad Alex TV
 * Stores all real collections fetched from Firebase for instant startup
 * and offline resilience (Zero Mock Data).
 */

const DB_NAME = 'ittihad_alex_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }
  return dbPromise;
}

/**
 * Gets a cached collection by key from IndexedDB.
 */
export async function getIdbItem<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result;
          resolve(val !== undefined ? val : null);
        };
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  } catch (_) {
    return null;
  }
}

/**
 * Saves a collection to IndexedDB.
 */
export async function setIdbItem<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  } catch (_) {
    // Fail safely without disrupting the UI
  }
}

/**
 * Loads all primary real collections from IndexedDB.
 */
export async function loadAllCachedCollections(): Promise<{
  news?: any[];
  matches?: any[];
  media?: any[];
  ads?: any[];
  homeSections?: any[];
  appSettings?: any;
  sectionFlags?: any;
  liveStreams?: any;
  songs?: any[];
  books?: any[];
  albums?: any[];
  playlists?: any[];
  services?: any[];
  memberDiscounts?: any[];
  worldGroups?: any[];
  historyEvents?: any[];
  stadiums?: any[];
  fanPosts?: any[];
  sidebarMenuItems?: any[];
}> {
  try {
    const keys = [
      'news',
      'matches',
      'media',
      'ads',
      'homeSections',
      'appSettings',
      'sectionFlags',
      'liveStreams',
      'songs',
      'books',
      'albums',
      'playlists',
      'services',
      'memberDiscounts',
      'worldGroups',
      'historyEvents',
      'stadiums',
      'fanPosts',
      'sidebarMenuItems'
    ];

    const results: Record<string, any> = {};
    await Promise.all(
      keys.map(async (k) => {
        const val = await getIdbItem(k);
        if (val !== null && val !== undefined) {
          results[k] = val;
        }
      })
    );
    return results;
  } catch (_) {
    return {};
  }
}

/**
 * Saves all critical collections to IndexedDB in a batch.
 */
export async function saveCollectionsBatch(data: Record<string, any>): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            store.put(value, key);
          }
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  } catch (_) {
    // Fail safely
  }
}
