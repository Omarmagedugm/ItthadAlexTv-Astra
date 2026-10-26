const MEMBER_TIERS = new Set(['new', 'bronze', 'silver', 'gold', 'diamond', 'premium']);

// Legacy profiles without a tier have always displayed the new-member badge.
export function matchesMemberTier(current: unknown, source: string): boolean {
  return MEMBER_TIERS.has(source) && (current == null || current === '' ? 'new' : current) === source;
}
