import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
// @ts-ignore shared browser entry
import {createLobby} from '../public/games/ittihadawy/lobby/menu.js';
// @ts-ignore shared catalog
import {CHARACTERS,REWARDS,normalizeProfile,purchaseItem} from '../public/games/ittihadawy/lobby/catalog.js';
test('characters appear directly on the home screen with 25,000-point milestone badges and there is exactly one shop entry',()=>{
 const Lobby=createLobby(React,{}) as any;const characters=[['gamal','جمال الدولي'],['adel','عادل شكل'],['hamido','حميدو'],['lazo','اللازو'],['islam','إسلام الفار']].map(([id,name])=>({id,name,ability:'القدرة'}));
 const html=renderToStaticMarkup(React.createElement(Lobby,{characters,selected:'gamal',engine:null}));
 for(const character of characters)assert.ok(html.includes(character.name));
 assert.ok(html.includes('🔒'));
 assert.ok(html.includes('اختيار الشخصية'));assert.equal((html.match(/>المتجر</g)||[]).length,1);assert.ok(!html.includes('غرفة الملابس'));assert.ok(!html.includes('>الشخصيات<'));
});
test('characters and store items unlock at 25,000-point multiples or via coins',()=>{
 const start=normalizeProfile({},0);
 assert.deepEqual(start.characters,['gamal']);
 assert.deepEqual(start.unlocked,[]);
 const mid=normalizeProfile({},75000);
 assert.deepEqual(mid.characters,['gamal','adel','hamido','lazo']);
 assert.deepEqual(mid.unlocked,['green-cap','sunglasses','exclusive-shirt']);
 const all=normalizeProfile({},175000);
 assert.deepEqual(all.characters,CHARACTERS);
 assert.deepEqual(all.unlocked,REWARDS.map((r:any)=>r.id));
});

