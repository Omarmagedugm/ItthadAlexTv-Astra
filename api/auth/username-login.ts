import { getAdminApp, getAdminDatabase } from '../../server/firebaseAdmin.js';
import config from '../../firebase-applet-config.json' with { type: 'json' };
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = body?.password;
    if (!/^[a-z0-9_]{1,100}$/.test(username) || typeof password !== 'string' || !password || password.length > 4096) return res.status(401).json({ error: 'invalid-credentials' });
    const records = await getAdminDatabase().collection('users').where('username', '==', username).limit(2).get();
    if (records.size > 1) return res.status(401).json({ error: 'invalid-credentials' });
    const email = records.empty ? `${username}@ittihad.club` : records.docs[0].data().email;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) return res.status(401).json({ error: 'invalid-credentials' });
    const session = await response.json();
    if (!session.localId || (!records.empty && records.docs[0].id !== session.localId)) return res.status(401).json({ error: 'invalid-credentials' });
    const token = await getAdminApp().auth().createCustomToken(session.localId);
    return res.json({ token });
  } catch { return res.status(503).json({ error: 'login-unavailable' }); }
}
