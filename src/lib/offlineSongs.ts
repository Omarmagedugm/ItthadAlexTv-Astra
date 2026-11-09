import type { Song } from '../store';

const DB = 'ittihad-offline-audio-v1';
const STORE = 'tracks';
const MAX_FILE = 80 * 1024 * 1024;
const MAX_TOTAL = 500 * 1024 * 1024;
type Track = { id: string; song: Song; blob: Blob; bytes: number; savedAt: number };
export type OfflineSongSummary = Omit<Track, 'blob'>;
let opening: Promise<IDBDatabase> | null = null;

async function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') throw new Error('التخزين المحلي غير مدعوم على الجهاز');
  if (!opening) opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, {keyPath: 'id'}); };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(request.error || new Error('تعذّر فتح التخزين'));
    request.onblocked = () => reject(new Error('اقفل نوافذ التطبيق التانية وحاول مجددًا'));
  }).catch(e => { opening = null; throw e; });
  return opening;
}
function notifyChange() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('ittihad-offline-songs-changed')); }
export async function getOfflineSong(id: string): Promise<Track | null> {
  if (!id) return null;
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE,'readonly').objectStore(STORE).get(id);
    r.onsuccess = () => resolve((r.result as Track | undefined) || null);
    r.onerror = () => reject(r.error);
  });
}
export async function listOfflineSongs(): Promise<OfflineSongSummary[]> {
  const db = await database();
  const tracks = await new Promise<Track[]>((resolve, reject) => {
    const r = db.transaction(STORE,'readonly').objectStore(STORE).getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
  return tracks.filter(t => t?.id && t?.song?.title && t?.blob?.size)
    .map(({id,song,bytes,savedAt})=>({id,song,bytes,savedAt}))
    .sort((a,b)=>b.savedAt-a.savedAt);
}
export async function downloadOfflineSong(song: Song): Promise<OfflineSongSummary> {
  if (!song?.id || !song.audioUrl) throw new Error('الأغنية مالهاش رابط صوت مباشر');
  if (!navigator.onLine) throw new Error('لازم إنترنت لتحميل الأغنية أول مرة');
  const url = new URL(song.audioUrl, window.location.origin);
  if (url.protocol !== 'https:' && url.origin !== window.location.origin) throw new Error('رابط التحميل غير آمن');
  let response: Response;
  try { response = await fetch(url.href, { mode:'cors', credentials:'omit' }); }
  catch { throw new Error('مصدر الأغنية مش بيسمح بالتحميل داخل التطبيق أو الاتصال انقطع'); }
  if (!response.ok || response.type === 'opaque') throw new Error('تعذّر تحميل الملف من المصدر');
  const kind = (response.headers.get('content-type') || '').toLowerCase();
  if (/text\/html|application\/json|mpegurl|video\//.test(kind)) throw new Error('الرابط مش ملف صوت مباشر');
  if (Number(response.headers.get('content-length') || 0)>MAX_FILE) throw new Error('ملف الأغنية أكبر من الحد المسموح');
  const blob=await response.blob();
  if (!blob.size || blob.size>MAX_FILE || /text\/html|application\/json/.test(blob.type)) throw new Error('ملف الأغنية غير صالح أو كبير جدًا');
  const existing = await listOfflineSongs();
  const used = existing.filter(t=>t.id!==song.id).reduce((sum,t)=>sum+t.bytes,0);
  if (used+blob.size>MAX_TOTAL) throw new Error('مساحة التحميلات وصلت للحد الأقصى؛ احذف أغاني قديمة');
  const record: Track = {id:song.id,song:{...song},blob,bytes:blob.size,savedAt:Date.now()};
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(record);
    tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
  });
  const verified=await getOfflineSong(song.id);
  if (!verified?.blob?.size) throw new Error('تعذّر التأكد من حفظ الأغنية');
  notifyChange();
  return {id:verified.id,song:verified.song,bytes:verified.bytes,savedAt:verified.savedAt};
}
export async function removeOfflineSong(id: string) {
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(id);
    tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
  });
  notifyChange();
}
export function formatOfflineSongSize(bytes:number) { return `${(bytes/(1024*1024)).toFixed(1)} م.ب`; }
