import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
// @ts-ignore shared browser catalog
import {REWARDS,purchaseItem,normalizeProfile,emptyOutfit,cleanOutfit} from '../public/games/ittihadawy/lobby/catalog.js';
test('coins buy cosmetics once, decrease only available balance, and never auto-unlock items',()=>{
 const original=normalizeProfile({},500000);
 assert.deepEqual(original.unlocked,[]);assert.deepEqual(original.characters,['gamal']);
 const bought=purchaseItem(original,'green-cap');
 assert.equal(bought.balance,499900);assert.equal(bought.totalCoins,500000);assert.equal(bought.spentCoins,100);
 assert.deepEqual(bought.unlocked,['green-cap']);assert.equal(purchaseItem(bought,'green-cap'),bought);
 assert.equal(original.balance,500000);assert.throws(()=>purchaseItem(normalizeProfile({},99),'green-cap'));
 assert.throws(()=>purchaseItem(original,'unknown-item'));
});
test('locked preview cannot become an equipped outfit and saved clothes stay per character',()=>{
 const outfit=emptyOutfit();outfit.cap={item:'green-cap',color:'#087b46'};
 assert.equal(cleanOutfit(outfit,[]).cap.item,'default');assert.equal(cleanOutfit(outfit,[],true).cap.item,'green-cap');
 const state=normalizeProfile({unlocked:['green-cap'],outfits:{gamal:outfit}},5000);
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

test('Islam El Far is purchased with coins and remains owned after spending',()=>{
 let state=normalizeProfile({},3000);assert.deepEqual(state.characters,['gamal']);
 state=purchaseItem(state,'character:islam');assert.ok(state.characters.includes('islam'));assert.equal(state.balance,0);
 assert.equal(purchaseItem(state,'character:islam'),state);
 const restored=normalizeProfile(state,3000);assert.ok(restored.characters.includes('islam'));assert.equal(restored.balance,0);
 assert.throws(()=>purchaseItem(restored,'character:adel'));
});
