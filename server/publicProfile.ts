/** Explicit projection: never serialize the private user document. */
export function toPublicProfile(uid: string, user: Record<string, any>) {
  const string = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';
  const stats: Record<string, number | string> = {};
  for (const key of ['ittihadawyScore', 'ittihadawyDistance', 'ittihadawyZombieScore', 'ittihadawyZombieDistance', 'ittihadawyZombieKills', 'predictions', 'comments', 'favorites']) {
    const value = user.stats?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) stats[key] = Math.floor(value);
  }
  for (const key of ['ittihadawyCharacter', 'ittihadawyZombieCharacter']) {
    if (typeof user.stats?.[key] === 'string') stats[key] = string(user.stats[key], 100);
  }
  return { uid, id: uid, name: string(user.name || user.displayName || user.username, 100) || 'عضو الاتحاد', username: string(user.username, 100), avatar: string(user.avatar, 5000), tier: string(user.tier, 50), role: string(user.role, 50), roles: Array.isArray(user.roles) ? user.roles.filter((r: unknown) => typeof r === 'string').slice(0, 20) : [], stats };
}
