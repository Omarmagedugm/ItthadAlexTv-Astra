import { validGameResult } from '../src/lib/gameScores';

type Config = { apiKey: string; projectId: string; firestoreDatabaseId?: string };
export async function recordGameScore(token: string, result: unknown, config: Config, request: typeof fetch = fetch) {
  if (!validGameResult(result)) return { status: 400, body: { error: 'invalid-result' } };
  const identity = await request(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token })
  });
  if (!identity.ok) return { status: 401, body: { error: 'invalid-session' } };
  const uid = (await identity.json()).users?.[0]?.localId;
  if (!uid) return { status: 401, body: { error: 'invalid-session' } };
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(config.firestoreDatabaseId || '(default)')}/documents/users/${encodeURIComponent(uid)}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await request(url, { headers });
    if (!response.ok) return { status: response.status === 403 ? 403 : 503, body: { error: 'profile-unavailable' } };
    const profile = await response.json();
    const stats = profile.fields?.stats?.mapValue?.fields || {};
    const previous = Number(stats.ittihadawyScore?.integerValue ?? stats.ittihadawyScore?.doubleValue ?? -1);
    if (result.score <= previous) return { status: 200, body: { success: true, updated: false, currentScore: previous } };
    // A precondition prevents simultaneous rounds or retries from lowering the record.
    const query = new URLSearchParams({ 'currentDocument.updateTime': profile.updateTime });
    for (const field of ['ittihadawyScore', 'ittihadawyDistance', 'ittihadawyCharacter']) query.append('updateMask.fieldPaths', `stats.${field}`);
    const saved = await request(`${url}?${query}`, {
      method: 'PATCH', headers, body: JSON.stringify({ fields: { stats: { mapValue: { fields: {
        ittihadawyScore: { integerValue: String(result.score) },
        ittihadawyDistance: { integerValue: String(result.distance) },
        ittihadawyCharacter: { stringValue: result.character }
      } } } } })
    });
    if (saved.ok) return { status: 200, body: { success: true, updated: true, currentScore: result.score } };
    if (![409, 412].includes(saved.status)) return { status: saved.status === 403 ? 403 : 503, body: { error: 'save-failed' } };
  }
  return { status: 503, body: { error: 'retry-save' } };
}
