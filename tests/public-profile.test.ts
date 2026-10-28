import assert from 'node:assert/strict';
import { toPublicProfile } from '../server/publicProfile';
const profile=toPublicProfile('u',{name:'Member',email:'private',fcmToken:'secret',location:'private',stats:{ittihadawyScore:12.8,private:'secret'},password:'secret'});
assert.equal(profile.stats.ittihadawyScore,12);
for(const key of ['email','fcmToken','location','password']) assert.equal(key in profile,false);
assert.equal('private' in profile.stats,false);
console.log('Public profile privacy tests passed');
