import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {readPrototype,partJoint,attachAdelPrototype} from '../public/games/ittihadawy/lobby/adel-prototype.js';
const bytes=readFileSync('public/games/ittihadawy/models/adel-prototype.glb');
const buffer=()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
test('the bundled GLB parses every mesh and contains bounded finite geometry',()=>{
 const {document,accessor}=readPrototype(buffer());
 assert.ok(document.meshes.length>0);
 for(const m of document.meshes)for(const p of m.primitives){
  const vertices=accessor(p.attributes.POSITION),normals=accessor(p.attributes.NORMAL),indices=accessor(p.indices);
  assert.equal(vertices.length,normals.length);assert.equal(indices.length%3,0);
  assert.ok([...vertices].every(Number.isFinite));assert.ok([...indices].every(i=>i*3<vertices.length));
 }
 assert.throws(()=>readPrototype(buffer().slice(0,128)));
});
// Evaluate the actual bundled Three.js classes without mounting React or touching a browser.
const source=ts.createSourceFile('bundle.js',readFileSync('public/games/ittihadawy/assets/index-a4cfa365.js','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const core=source.statements.filter(n=>!ts.isImportDeclaration(n)&&!n.getText(source).startsWith('(function(){const t=document')&&!n.getText(source).startsWith('I2.createRoot')).map(n=>n.getText(source)).join('\n');
const api=new Function('createLobby',core+';return {Group:oe,Geometry:Hn,Attribute:Vi,Material:Ee,Mesh:Mt};')(()=>{});
const pivots=['bodyPivot','torsoPivot','headPivot','leftArmPivot','leftForearmPivot','rightArmPivot','rightForearmPivot','leftLegPivot','leftShinPivot','rightLegPivot','rightShinPivot'];
function player(characterId='adel'){
 const p=new api.Group(),model=new api.Group();p.add(model);
 const oldMesh=new api.Mesh(new api.Geometry(),new api.Material());model.add(oldMesh);
 p.userData={characterId,model,cosmeticParts:{shirt:[],shorts:[],shoes:[]},...Object.fromEntries(pivots.map(key=>[key,new api.Group()]))};return {p,oldMesh};
}
test('GLB attaches to actual Three pivots, batches draw calls, animates, and excludes other characters',async()=>{
 const originalFetch=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;return new Response(bytes)};
 try{
  const other=player('hamido');attachAdelPrototype(other.p,api);assert.equal(requests,0);
  const {p,oldMesh}=player();attachAdelPrototype(p,api);attachAdelPrototype(p,api);
  await new Promise(r=>setTimeout(r,20));assert.equal(p.userData.prototypeStatus,'ready');assert.equal(requests,1);assert.equal(oldMesh.visible,false);
  let count=0;p.userData.prototypeRoot.traverse(o=>{if(o.isMesh){count++;assert.ok(o.geometry.attributes.position.count>0)}});assert.ok(count<60);
  p.userData.leftLegPivot.rotation.x=.75;p.updateMatrixWorld(true);assert.equal(p.userData.prototypeBones.leftLeg.rotation.x,.75);
  assert.ok(p.userData.cosmeticParts.shirt.length>0);
  const retired=player();attachAdelPrototype(retired.p,api);retired.p.userData.prototypeDisposed=true;
  await new Promise(r=>setTimeout(r,10));assert.equal(retired.p.userData.prototypeRoot,undefined);assert.equal(retired.oldMesh.visible,true);
 }finally{globalThis.fetch=originalFetch}
});
test('legs and arms map to the appropriate movement pivots',()=>{
 assert.equal(partJoint('Trouser_R',.7),'leftLeg');assert.equal(partJoint('Trouser_R',.2),'leftShin');
 assert.equal(partJoint('Green_horn',.8),'rightForearm');assert.equal(partJoint('Nose_tip',1.7),'head');
});
