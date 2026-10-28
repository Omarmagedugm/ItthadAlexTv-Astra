import { getAdminDatabase } from '../server/firebaseAdmin';
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=15');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method-not-allowed' });
  const groupId = req.query.groupId;
  if (typeof groupId !== 'string' || !groupId || groupId.length > 128 || groupId.includes('/')) return res.status(400).json({ error: 'invalid-group' });
  try {
    const snapshot = await getAdminDatabase().collection('world_group_members').where('groupId', '==', groupId).limit(1000).get();
    const members = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, groupId, userId: data.userId || '', userName: data.userName || '', userAvatar: data.userAvatar || '', role: data.role || 'member', userRole: data.userRole || 'member', joinedAt: data.joinedAt || '' };
    });
    return res.json({ members });
  } catch { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'members-unavailable' }); }
}
