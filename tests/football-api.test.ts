import assert from 'node:assert/strict';
import { findAlexandriaTeam, FootballSourceError } from '../server/footballData.ts';

const candidates = [
  { team: { id: 10, country: 'Saudi Arabia', name: 'Al Ittihad' } },
  { team: { id: 21, country: 'Egypt', name: 'Al Ittihad Alexandria' } },
  { team: { id: 30, country: 'Egypt', name: 'Ismaily SC' } },
];
assert.equal(findAlexandriaTeam(candidates),21);
assert.equal(findAlexandriaTeam([{team:{id:44,country:'Egypt',name:'Al Ittihad'}}]),44);
assert.equal(findAlexandriaTeam([{team:{id:44,country:'Egypt',name:'Al Ahly'}}]),null);
assert.equal(findAlexandriaTeam([{team:{id:44,country:'Libya',name:'Al Ittihad Tripoli'}}]),null);
const error = new FootballSourceError(429,'provider-rate-limit');
assert.equal(error.status,429);
assert.equal(error.message,'provider-rate-limit');
console.log('football API safety checks passed');
