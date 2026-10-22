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
  if (!['ittihadawy:run-start', 'ittihadawy:run-end'].includes(data.type)) return;
  queue = queue.then(async () => {
    await auth.authStateReady();
    if (data.type === 'ittihadawy:run-start') {
      runs.clear(); runs.set(data.id, auth.currentUser?.uid ?? null); return;
    }
    if (!runs.has(data.id) || !validGameResult(data.result)) return;
    const uid = runs.get(data.id);
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
    } catch { reply('error', data.id); }
  }).catch(() => reply('error', data.id));
});
if (parentWindow !== window) reply('ready');

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
