import { improvedGameStats, validGameResult } from '../src/lib/gameScores';
import { getAdminApp, getAdminDatabase } from './firebaseAdmin';

// Authentication and persistence are server-owned. Client telemetry is still
// untrusted: this bounds and validates it, not an authoritative game replay.
export async function recordGameScore(token: string, result: unknown, services = { verifyToken: (value: string) => getAdminApp().auth().verifyIdToken(value, true), getDatabase: getAdminDatabase }): Promise<{ status: number; body: { error?: string; success?: boolean; updated?: boolean } }> {
  if (!validGameResult(result)) return { status: 400, body: { error: 'invalid-result' } };
  let uid: string;
  try { uid = (await services.verifyToken(token)).uid; }
  catch { return { status: 401, body: { error: 'invalid-session' } }; }
  const db = services.getDatabase();
  const reference = db.doc(`users/${uid}`);
  return db.runTransaction(async transaction => {
    const profile = await transaction.get(reference);
    if (!profile.exists) return { status: 404, body: { error: 'profile-unavailable' } };
    const update = improvedGameStats(profile.data()?.stats, result);
    if (update) transaction.update(reference, update);
    return { status: 200, body: { success: true, updated: !!update } };
  });
}
