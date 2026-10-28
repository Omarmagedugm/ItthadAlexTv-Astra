import { getAdminDatabase } from '../server/firebaseAdmin.js';
import { toPublicProfile } from '../server/publicProfile.js';
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method-not-allowed' });
  try {
    const db = getAdminDatabase();
    const ids = typeof req.query.ids === 'string' ? [...new Set<string>(req.query.ids.split(','))] : [];
    if (ids.length > 30 || ids.some(id => !id || id.length > 128 || id.includes('/'))) return res.status(400).json({ error: 'invalid-ids' });
    let docs;
    if (ids.length) docs = await db.getAll(...ids.map(id => db.doc(`users/${id}`)));
    else {
      const count = Math.min(201, Math.max(1, Math.floor(Number(req.query.count) || 100)));
      const field = req.query.mode === 'zombie' ? 'stats.ittihadawyZombieScore' : 'stats.ittihadawyScore';
      const snapshot = await db.collection('users').where(field, '>=', 1).orderBy(field, 'desc').limit(count).get();
      docs = snapshot.docs;
    }
    return res.json({ profiles: docs.filter(doc => doc.exists).map(doc => toPublicProfile(doc.id, doc.data()!)) });
  } catch { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'profiles-unavailable' }); }
}
