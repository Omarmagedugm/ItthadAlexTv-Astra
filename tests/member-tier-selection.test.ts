import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesMemberTier } from '../src/lib/memberTierSelection';
test('selects all membership tiers, including legacy new members, without selecting other tiers', () => {
  const tiers = ['new', 'bronze', 'silver', 'gold', 'diamond', 'premium'];
  for (const source of tiers) for (const current of tiers) assert.equal(matchesMemberTier(current, source), current === source);
  for (const value of [null, undefined, '']) assert.equal(matchesMemberTier(value, 'new'), true);
  assert.equal(matchesMemberTier('gold', 'silver'), false); // skip concurrent tier changes
  assert.equal(matchesMemberTier('admin', 'admin'), false); // never change account roles
});
