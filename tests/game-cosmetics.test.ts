import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
// @ts-ignore shared browser catalog
import {CHARACTERS,REWARDS,purchaseItem,normalizeProfile,emptyOutfit,cleanOutfit} from '../public/games/ittihadawy/lobby/catalog.js';
test('cosmetics and characters unlock at 25,000-point multiples',()=>{
 const original=normalizeProfile({},0);
 assert.deepEqual(original.unlocked,[]);
 assert.deepEqual(original.characters,['gamal']);
 assert.equal(original.balance,0);
 const stage1=normalizeProfile({},25000);
 assert.deepEqual(stage1.characters,['gamal','adel']);
 assert.deepEqual(stage1.unlocked,['green-cap']);
 const full=normalizeProfile({},175000);
 assert.deepEqual(full.characters,['gamal','adel','hamido','lazo']);
 assert.deepEqual(full.unlocked,REWARDS.map((r:any)=>r.id));
 const adminFull=normalizeProfile({isAdmin:true},0);
 assert.deepEqual(adminFull.characters,CHARACTERS);
 assert.throws(()=>purchaseItem({...original,balance:500000},'character:islam'));
 assert.throws(()=>purchaseItem(original,'unknown-item'));
});
test('saved clothes stay per character and reject invalid items',()=>{
 const outfit=emptyOutfit();outfit.cap={item:'green-cap',color:'#087b46'};
 assert.equal(cleanOutfit(outfit,['green-cap']).cap.item,'green-cap');
 const state=normalizeProfile({outfits:{gamal:outfit}},25000);
 assert.equal(state.outfits.gamal.cap.item,'green-cap');assert.equal(state.outfits.adel.cap.item,'default');
 assert.equal(cleanOutfit({cap:{item:'hacked',color:'url(secret)'}},REWARDS.map((r:any)=>r.id)).cap.item,'default');
});
test('character abilities grant 10s massive speed & obstacle destruction with recharge cooldown and reduced road boosts',()=>{
 const html=fs.readFileSync('public/games/ittihadawy/index.html','utf8'),active=html.match(/assets\/index-[^"? ]+\.js/)![0];
 const code=fs.readFileSync('public/games/ittihadawy/'+active,'utf8');
 assert.ok(code.includes('cost:100,duration:10,gap:45'));
 assert.ok(code.includes('r.charge=0,r.smoke=n.duration,r.boostTime=Math.max(r.boostTime||0,n.duration)'));
 assert.ok(code.includes('TC=(r,t,s=0)=>Wy(r)*(s>0?2.35:t>0?1.65:1)'));
 assert.ok(code.includes('if(!v&&!g.done&&n.smoke>0&&m>-16&&m<4)'));
 assert.ok(code.includes('this.nextBoostAt=950'));
 assert.ok(code.includes('this.nextBoostAt=t+1500'));
});

