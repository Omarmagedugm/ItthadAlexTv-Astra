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
 assert.deepEqual(full.characters,CHARACTERS);
 assert.deepEqual(full.unlocked,REWARDS.map((r:any)=>r.id));
 assert.throws(()=>purchaseItem(original,'unknown-item'));
});
test('saved clothes stay per character and reject invalid items',()=>{
 const outfit=emptyOutfit();outfit.cap={item:'green-cap',color:'#087b46'};
 assert.equal(cleanOutfit(outfit,['green-cap']).cap.item,'green-cap');
 const state=normalizeProfile({outfits:{gamal:outfit}},25000);
 assert.equal(state.outfits.gamal.cap.item,'green-cap');assert.equal(state.outfits.adel.cap.item,'default');
 assert.equal(cleanOutfit({cap:{item:'hacked',color:'url(secret)'}},REWARDS.map((r:any)=>r.id)).cap.item,'default');
});
test('lobby patch leaves the complete running engine and non-menu UI intact',()=>{
 const html=fs.readFileSync('public/games/ittihadawy/index.html','utf8'),active=html.match(/assets\/index-[^" ]+\.js/)![0];
 const old=ts.createSourceFile('old.js',fs.readFileSync('public/games/ittihadawy/assets/index-5856bff8.js','utf8'),99,true);
 const current=ts.createSourceFile('current.js',fs.readFileSync('public/games/ittihadawy/'+active,'utf8'),99,true);
 const engine=(s:ts.SourceFile)=>s.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC')!;
 assert.equal(engine(current).getText(current).replace('coins:Math.floor(this.run?.coins||0),','').replace('window.dispatchEvent(new CustomEvent("ittihadawy:coin-checkpoint",{detail:{coins:Math.floor(this.run?.coins||0)}}));',''),engine(old).getText(old));
 for(const name of ['PC','gc','zC','MC','Wy','R2']){
  const find=(s:ts.SourceFile)=>s.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(find(old))assert.equal(find(current)!.getText(current),find(old)!.getText(old),name);
 }
 const wc=(s:ts.SourceFile)=>s.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='WC')!;
 const subtree=(s:ts.SourceFile)=>{const values:string[]=[];function visit(n:ts.Node){if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken&&n.left.getText(s)!=='n==="MENU"')values.push(n.getText(s));ts.forEachChild(n,visit)}visit(wc(s));return values};
 assert.deepEqual(subtree(current),subtree(old));
});

