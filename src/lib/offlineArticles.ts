import type { NewsItem } from '../store';
import { getIdbItem, setIdbItem } from './idbCache';

const PREFIX = 'offlineArticle:';
const INDEX = 'offlineArticleIds';
export async function getOfflineArticle(id: string): Promise<NewsItem | null> {
  if (!id) return null;
  return getIdbItem<NewsItem>(PREFIX + id);
}
export async function listOfflineArticles(): Promise<NewsItem[]> {
  const ids = await getIdbItem<string[]>(INDEX) || [];
  const found = await Promise.all(ids.map(getOfflineArticle));
  return found.filter((item): item is NewsItem => !!item);
}
export async function removeOfflineArticle(id: string) {
  const ids = await getIdbItem<string[]>(INDEX) || [];
  await setIdbItem(INDEX, ids.filter(key => key !== id));
  // IndexedDB collection helper supports write only; use a tombstone for removal.
  await setIdbItem(PREFIX + id, null);
}
export async function saveOfflineArticle(article: NewsItem, imageUrl?: string): Promise<boolean> {
  if (!article.id || !article.title) throw new Error('Invalid article');
  await setIdbItem(PREFIX + article.id, article);
  const ids = await getIdbItem<string[]>(INDEX) || [];
  if (!ids.includes(article.id)) await setIdbItem(INDEX, [article.id, ...ids]);
  if (!navigator.onLine || !imageUrl || !('caches' in window)) return false;
  try {
    const target = new URL(imageUrl, location.origin);
    if (target.protocol !== 'https:' && target.origin !== location.origin) return false;
    const response = await fetch(target.toString(), { mode: 'no-cors', cache: 'reload' });
    if (!response.ok && response.type !== 'opaque') return false;
    const cache = await caches.open('ittihad-saved-article-images-v1');
    await cache.put(target.toString(), response);
    return true;
  } catch {
    return false;
  }
}
