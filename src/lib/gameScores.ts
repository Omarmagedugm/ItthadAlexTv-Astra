export type GameResult = { score: number; distance: number; character: string };
export function validGameResult(value: unknown): value is GameResult {
  const r = value as GameResult | null;
  return !!r && Number.isSafeInteger(r.score) && r.score >= 0 && r.score <= 2147483647
    && Number.isSafeInteger(r.distance) && r.distance >= 0 && r.distance <= 10000000
    && ['gamal', 'adel', 'hamido'].includes(r.character);
}
export function improvedGameStats(stats: Record<string, unknown> = {}, result: GameResult) {
  if (!validGameResult(result)) throw new Error('Invalid game result');
  const previous = typeof stats.ittihadawyScore === 'number' ? stats.ittihadawyScore : -1;
  if (result.score <= previous) return null;
  return { 'stats.ittihadawyScore': result.score, 'stats.ittihadawyDistance': result.distance, 'stats.ittihadawyCharacter': result.character };
}
