import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {attachLazoPrototype} from '../public/games/ittihadawy/lobby/lazo-prototype.js';
import {readPrototype} from '../public/games/ittihadawy/lobby/character-prototype.js';
import {applyOutfit} from '../public/games/ittihadawy/lobby/model.js';
import {emptyOutfit} from '../public/games/ittihadawy/lobby/catalog.js';
const bytes=readFileSync('public/games/ittihadawy/models/lazo-prototype.glb');
const buffer=()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const source=ts.createSourceFile('game.js',readFileSync('public/games/ittihadawy/assets/index-a4cfa365.js','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const code=source.statements.filter(n=>!ts.isImportDeclaration(n)&&!n.getText(source).startsWith('(function(){const t=document')&&!n.getText(source).startsWith('I2.createRoot')).map(n=>n.getText(source)).join('\n');
const api=new Function('createLobby',code+';return {Group:oe,Geometry:Hn,Attribute:Vi,Material:Ee,Mesh:Mt,Box:Jn,Sphere:dn};')(()=>{});
const joints=readPrototype(buffer()).document.extras.joints;
function makePlayer(id='lazo'){
 const player=new api.Group(),model=new api.Group();player.add(model);
 const oldMesh=new api.Mesh(new api.Geometry(),new api.Material());model.add(oldMesh);
 const data:any={characterId:id,model,cosmeticParts:{shirt:[],shorts:[],shoes:[],capVisible:false}};
 for(const [,[,,name]] of Object.entries(joints) as any){data[name]=new api.Group();model.add(data[name])}
 player.userData=data;return {player,oldMesh};
}
test('Lazo GLB has valid geometry, explicit articulated attachments and separate accessories',()=>{
 const {document,accessor}=readPrototype(buffer());assert.equal(document.extras.character,'lazo');
 for(const m of document.meshes){
  assert.ok(joints[m.extras.bone]);
  for(const p of m.primitives){
   const v=accessor(p.attributes.POSITION),n=accessor(p.attributes.NORMAL),indices=accessor(p.indices);
   assert.equal(v.length,n.length);assert.ok([...v,...n].every(Number.isFinite));assert.ok([...indices].every(i=>i<v.length/3));
  }
 }
 assert.ok(document.meshes.some(m=>m.extras.slot==='headwear'));assert.ok(document.meshes.some(m=>m.extras.slot==='eyewear'));
 assert.ok(bytes.length<1_500_000);
});
test('failed download preserves original Lazo; successful retry follows pivots and wardrobe without duplicates',async()=>{
 const fetch=globalThis.fetch,warn=console.warn;let attempts=0;console.warn=()=>{};
 globalThis.fetch=async()=>{attempts++;return attempts===1?new Response('',{status:503}):new Response(bytes)};
 try{
  const other=makePlayer('gamal');attachLazoPrototype(other.player,api);assert.equal(attempts,0);
  const failed=makePlayer();attachLazoPrototype(failed.player,api);await new Promise(r=>setTimeout(r,20));
  assert.equal(failed.player.userData.prototypeStatus,'fallback');assert.equal(failed.oldMesh.visible,true);
  const {player,oldMesh}=makePlayer();let outfit=emptyOutfit();applyOutfit(player,outfit,api);attachLazoPrototype(player,api);attachLazoPrototype(player,api);
  await new Promise(r=>setTimeout(r,30));const d=player.userData;
  assert.equal(d.prototypeStatus,'ready');assert.equal(attempts,2);assert.equal(oldMesh.visible,false);
  let meshes=0;d.prototypeRoot.traverse(o=>{if(o.isMesh)meshes++});assert.ok(meshes<60);
  for(const [key,[,,source]] of Object.entries(joints) as any){d[source].rotation.x=.6;player.updateMatrixWorld(true);assert.equal(d.prototypeBones[key].rotation.x,.6);d[source].rotation.x=0}
  assert.ok(d.prototypeHeadwear.length>0);assert.ok(d.prototypeEyewear.length>0);
  outfit={...emptyOutfit(),cap:{item:'green-cap',color:'#116633'},glasses:{item:'sunglasses',color:'#ffffff'}};
  applyOutfit(player,outfit,api);
  assert.ok(d.prototypeHeadwear.every(m=>!m.visible));assert.ok(d.prototypeEyewear.every(m=>!m.visible));
  assert.ok(d.cosmeticGroups.every(group=>group.parent===d.prototypeBones.head));
  const previous=[...d.cosmeticGroups];applyOutfit(player,emptyOutfit(),api);
  assert.ok(previous.every(g=>g.parent===null));assert.ok(d.prototypeHeadwear.every(m=>m.visible));assert.ok(d.prototypeEyewear.every(m=>m.visible));
  const retired=makePlayer();attachLazoPrototype(retired.player,api);retired.player.userData.prototypeDisposed=true;
  await new Promise(r=>setTimeout(r,10));assert.equal(retired.player.userData.prototypeRoot,undefined);
 }finally{globalThis.fetch=fetch;console.warn=warn}
});
