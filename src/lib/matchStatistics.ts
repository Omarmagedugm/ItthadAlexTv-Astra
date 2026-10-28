export type MatchSportFilter = 'all' | 'football' | 'basketball';
export function calculateMatchStatistics(matches: {status?: string;sport?: string;homeTeam?:string;awayTeam?:string;homeScore?:unknown;awayScore?:unknown}[], sport: MatchSportFilter) {
  const isIttihad = (name = '') => {
    const value = name.normalize('NFKC').replace(/[أإآ]/g, 'ا').trim().toLowerCase();
    return value === 'الاتحاد' || value.includes('الاتحاد السكندري') || value.includes('الاتحاد الاسكندري') || value === 'ittihad' || value.includes('ittihad alex');
  };
  return matches.reduce((stats, match) => {
    const matchSport = match.sport || 'football';
    if (match.status !== 'finished' || !['football', 'basketball'].includes(matchSport) || (sport !== 'all' && matchSport !== sport)) return stats;
    const home = isIttihad(match.homeTeam), away = isIttihad(match.awayTeam);
    if (home === away || [match.homeScore,match.awayScore].some(value => value == null || String(value).trim() === '')) return stats;
    const a=Number(match.homeScore), b=Number(match.awayScore);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a<0 || b<0) return stats;
    const difference=home?a-b:b-a;
    if(difference>0)stats.wins++; else if(difference<0)stats.losses++; else stats.draws++;
    return stats;
  }, {wins:0,draws:0,losses:0});
}
