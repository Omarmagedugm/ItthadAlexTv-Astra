export type GameResult = {
  score: number;
  distance: number;
  character: string;
  mode?: 'runner' | 'zombie';
  kills?: number;
};
export function validGameResult(value: unknown): value is GameResult {
  const r = value as GameResult | null;
  return !!r && Number.isSafeInteger(r.score) && r.score >= 0 && r.score <= 2147483647
    && Number.isSafeInteger(r.distance) && r.distance >= 0 && r.distance <= 10000000
    && ['gamal', 'adel', 'hamido', 'lazo', 'islam'].includes(r.character)
    && (r.mode === undefined || r.mode === 'runner' || r.mode === 'zombie')
    && (r.kills === undefined || (Number.isSafeInteger(r.kills) && r.kills >= 0 && r.kills <= 10000000));
}
export function improvedGameStats(stats: Record<string, unknown> = {}, result: GameResult) {
  if (!validGameResult(result)) throw new Error('Invalid game result');
  if (result.mode === 'zombie') {
    const previous = typeof stats.ittihadawyZombieScore === 'number' ? stats.ittihadawyZombieScore : -1;
    const prevKills = typeof stats.ittihadawyZombieKills === 'number' ? stats.ittihadawyZombieKills : 0;
    const nextKills = typeof result.kills === 'number' ? Math.max(prevKills, result.kills) : prevKills;
    if (result.score <= previous) {
      return nextKills > prevKills ? { 'stats.ittihadawyZombieKills': nextKills } : null;
    }
    return {
      'stats.ittihadawyZombieScore': result.score,
      'stats.ittihadawyZombieDistance': result.distance,
      'stats.ittihadawyZombieCharacter': result.character,
      'stats.ittihadawyZombieKills': nextKills,
    };
  }
  const previous = typeof stats.ittihadawyScore === 'number' ? stats.ittihadawyScore : -1;
  if (result.score <= previous) return null;
  return { 'stats.ittihadawyScore': result.score, 'stats.ittihadawyDistance': result.distance, 'stats.ittihadawyCharacter': result.character };
}
