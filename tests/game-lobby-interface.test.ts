import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
// @ts-ignore shared browser entry
import {createLobby} from '../public/games/ittihadawy/lobby/menu.js';
// @ts-ignore shared catalog
import {normalizeProfile,purchaseItem} from '../public/games/ittihadawy/lobby/catalog.js';
test('characters appear directly on the home screen and there is exactly one shop entry',()=>{
 const Lobby=createLobby(React,{});const characters=[['gamal','جمال الدولي'],['adel','عادل شكل'],['hamido','حميدو'],['lazo','اللازو'],['islam','إسلام الفار']].map(([id,name])=>({id,name,ability:'القدرة'}));
 const html=renderToStaticMarkup(React.createElement(Lobby,{characters,selected:'gamal',engine:null}));
 for(const character of characters)assert.ok(html.includes(character.name));
 assert.ok(html.includes('اختيار الشخصية'));assert.equal((html.match(/>المتجر</g)||[]).length,1);assert.ok(!html.includes('غرفة الملابس'));assert.ok(!html.includes('>الشخصيات<'));
});
test('the member gift is spendable once without changing earned round coins',()=>{
 const earned=80,gift=3000;let state=normalizeProfile({},earned+gift);
 state=purchaseItem(state,'character:islam');assert.equal(state.balance,80);assert.equal(state.totalCoins,3080);
 const restored=normalizeProfile(state,earned+gift);assert.equal(restored.balance,80);assert.equal(purchaseItem(restored,'character:islam'),restored);
});
