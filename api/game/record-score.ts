import { recordGameScore } from '../../server/recordGameScore';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'missing-session' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const outcome = await recordGameScore(authorization.slice(7), body?.result);
    return res.status(outcome.status).json(outcome.body);
  } catch {
    return res.status(503).json({ error: 'save-unavailable' });
  }
}
