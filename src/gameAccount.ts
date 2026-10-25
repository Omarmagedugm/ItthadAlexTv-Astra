import {startCoinRun,recordRunCoins} from './lib/gameCoins';
import { syncGameCosmetics } from './lib/gameCosmetics';
import { auth, db } from './lib/firebase';
import { doc, runTransaction, setDoc, serverTimestamp } from 'firebase/firestore';
import { improvedGameStats, validGameResult } from './lib/gameScores';

const parentWindow = window.parent;
const runs = new Map<string, string | null>();
let queue = Promise.resolve();
function reply(status: string, id?: string) {
  parentWindow.postMessage({ type: 'ittihadawy:account', status, id }, location.origin);
}
window.addEventListener('message', (event) => {
  if (parentWindow === window || event.source !== parentWindow || event.origin !== location.origin) return;
  const data = event.data;
  if (!data || typeof data.id !== 'string' || data.id.length > 80) return;

  if (data.type === 'ittihadawy:cosmetics') {
    queue=queue.then(async()=>{
      try { await coinQueue; const profile=await syncGameCosmetics(data.input); parentWindow.postMessage({type:'ittihadawy:cosmetics-data',id:data.id,profile},location.origin); }
      catch { parentWindow.postMessage({type:'ittihadawy:cosmetics-data',id:data.id,error:true},location.origin); }
    }); return;
  }

  if (data.type === 'ittihadawy:get-leaderboard') {
    queue = queue.then(async () => {
      await auth.authStateReady();
      try {
        const { collection, getDocs, limit, orderBy, query, where } = await import('firebase/firestore');
        const count = typeof data.count === 'number' && data.count > 0 ? Math.min(data.count, 200) : 10;
        const q = query(
          collection(db, 'users'),
          where('stats.ittihadawyScore', '>=', 1),
          orderBy('stats.ittihadawyScore', 'desc'),
          limit(count + 1)
        );
        const snapshot = await getDocs(q);
        const hasMore = snapshot.docs.length > count;
        const items = snapshot.docs.slice(0, count).map((docItem, index) => {
          const d = docItem.data();
          return {
            rank: index + 1,
            id: docItem.id,
            name: d.name || d.displayName || d.username || 'عضو الاتحاد',
            score: Math.floor(Number(d.stats?.ittihadawyScore ?? d.ittihadawyScore ?? 0)),
            character: d.stats?.ittihadawyCharacter || '',
          };
        }).filter(item => Number.isSafeInteger(item.score) && item.score >= 1);

        parentWindow.postMessage({
          type: 'ittihadawy:leaderboard-data',
          id: data.id,
          items,
          hasMore,
          currentUid: auth.currentUser?.uid ?? null,
        }, location.origin);
      } catch (err) {
        console.warn('Leaderboard bridge fetch error:', err);
        parentWindow.postMessage({
          type: 'ittihadawy:leaderboard-data',
          id: data.id,
          items: [],
          hasMore: false,
          error: true,
        }, location.origin);
      }
    });
    return;
  }

  if (!['ittihadawy:run-start', 'ittihadawy:run-end'].includes(data.type)) return;
  queue = queue.then(async () => {
    await auth.authStateReady();
    if (data.type === 'ittihadawy:run-start') {
      runs.clear(); runs.set(data.id, auth.currentUser?.uid ?? null); return;
    }
    if (!runs.has(data.id) || !validGameResult(data.result)) return;
    let uid = runs.get(data.id);
    if (!uid && auth.currentUser?.uid) {
      uid = auth.currentUser.uid;
    }
    if (!uid || uid !== auth.currentUser?.uid) {
      reply('guest', data.id); runs.delete(data.id); return;
    }
    reply('saving', data.id);
    try {
      const reference = doc(db, 'users', uid);
      await runTransaction(db, async (transaction) => {
        const profile = await transaction.get(reference);
        if (!profile.exists()) throw new Error('Member profile missing');
        if (auth.currentUser?.uid !== uid) throw new Error('Account changed');
        const update = improvedGameStats(profile.data().stats, data.result);
        if (update) transaction.update(reference, update);
      });
      runs.delete(data.id); reply('saved', data.id);
    } catch (primaryErr) {
      try {
        if (typeof fetch === 'function' && auth.currentUser?.getIdToken) {
          const token = await auth.currentUser.getIdToken();
          const response = await fetch('/api/game/record-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ result: data.result })
          });
          if (response.ok && (await response.json()).success === true) {
            runs.delete(data.id);
            reply('saved', data.id);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn('Fallback server score save error:', fallbackErr);
      }
      reply('error', data.id);
    }
  }).catch(() => reply('error', data.id));
});
if (parentWindow !== window) {
  reply('ready');
  // Reuse the application's persisted Firebase session; never request a new login.
  auth.onAuthStateChanged((user) => {
    parentWindow.postMessage({ type: 'ittihadawy:member-access', authorized: !!user }, location.origin);
  });
}

// Count real game entries, not opens of the promotional page. A refresh within
// thirty minutes is part of the same visit. Guest identities are browser-local.
async function recordVisit() {
  await auth.authStateReady();
  let visitor: string, visit: string;
  try {
    visitor = localStorage.getItem('ittihadawy-visitor') || crypto.randomUUID();
    localStorage.setItem('ittihadawy-visitor', visitor);
    const previous = JSON.parse(sessionStorage.getItem('ittihadawy-visit') || 'null');
    if (previous && Date.now() - previous.at < 30 * 60 * 1000 && previous.saved) return;
    visit = previous && Date.now() - previous.at < 30 * 60 * 1000 ? previous.id : crypto.randomUUID();
    sessionStorage.setItem('ittihadawy-visit', JSON.stringify({id:visit, at:Date.now(), saved:false}));
  } catch { visitor = crypto.randomUUID(); visit = crypto.randomUUID(); }
  await setDoc(doc(db, 'game_visits', visit), {
    visitorId: auth.currentUser ? `member_${auth.currentUser.uid}` : `guest_${visitor}`,
    member: !!auth.currentUser,
    createdAt: serverTimestamp(),
  });
  try { sessionStorage.setItem('ittihadawy-visit', JSON.stringify({id:visit, at:Date.now(), saved:true})); } catch {}
}
if (parentWindow !== window) recordVisit().catch(error => console.warn('Game visit could not be recorded:', error.code));

// Coin credits are bound to the member at run start, independent of leaderboard writes.
let coinQueue=Promise.resolve();const coinOwners=new Map<string,string>();
window.addEventListener('message',event=>{
 if(parentWindow===window||event.source!==parentWindow||event.origin!==location.origin)return;
 const data=event.data;if(!data||typeof data.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(data.id))return;
 if(!['ittihadawy:run-start','ittihadawy:run-end','ittihadawy:coin-progress'].includes(data.type))return;
 coinQueue=coinQueue.then(async()=>{
  await auth.authStateReady();const user=auth.currentUser;if(!user)return;
  if(data.type==='ittihadawy:run-start'){coinOwners.clear();await startCoinRun(data.id,user.uid);coinOwners.set(data.id,user.uid);return;}
  if(coinOwners.get(data.id)!==user.uid||!Number.isSafeInteger(data.result?.coins))return;
  await recordRunCoins(data.id,user.uid,data.result.coins);
  parentWindow.postMessage({type:'ittihadawy:coins-saved',id:data.id},location.origin);
 }).catch(()=>parentWindow.postMessage({type:'ittihadawy:coins-error',id:data.id},location.origin));
});
