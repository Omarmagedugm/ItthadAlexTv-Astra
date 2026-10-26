import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
// @ts-ignore browser mesh builders
import {createReferenceMotorcycle,createReferenceTuktuk,createReferenceMicrobus} from '../public/games/ittihadawy/lobby/vehicles.js';
const text=readFileSync('public/games/ittihadawy/assets/index-a4cfa365.js','utf8');
const source=ts.createSourceFile('bundle.js',text,99,true,ts.ScriptKind.JS);
const core=source.statements.filter(n=>!ts.isImportDeclaration(n)&&!n.getText(source).startsWith('(function(){const t=document')&&!n.getText(source).startsWith('I2.createRoot')).map(n=>n.getText(source)).join('\n');
const api=new Function('createLobby',core+';return {Group:oe,Box:Jn,Sphere:dn,Cylinder:Ve,Material:Ee,Mesh:Mt,Geometry:Hn,Attribute:Vi};')(()=>{});
for(const [name,make,wheelCount] of [['motorcycle',createReferenceMotorcycle,2],['tuktuk',createReferenceTuktuk,3],['microbus',createReferenceMicrobus,4]] as const){
 test(name+' has bounded geometry, batched rigid details and independently spinning wheels',()=>{
  const vehicle=make(api);vehicle.updateMatrixWorld(true);let count=0;const bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
  vehicle.traverse((mesh:any)=>{if(!mesh.isMesh)return;count++;const position=mesh.geometry.getAttribute('position');assert.ok(position.count>0);assert.equal(position.count,mesh.geometry.getAttribute('normal').count);const e=mesh.matrixWorld.elements;
   for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);const p=[e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];for(let j=0;j<3;j++){assert.ok(Number.isFinite(p[j]));bounds[j]=Math.min(bounds[j],p[j]);bounds[j+3]=Math.max(bounds[j+3],p[j])}}
  });
  assert.ok(count<=35,'mobile draw-call budget');assert.ok(bounds[1]>=-.005,'tires rest on road');assert.ok(bounds[4]<2,'vehicle height');assert.ok(bounds[3]-bounds[0]<2.2,'vehicle width');assert.ok(bounds[5]-bounds[2]<3.7,'vehicle length');
  const wheels=vehicle.userData.wheels||vehicle.userData.movingWheels||[vehicle.userData.frontWheel,vehicle.userData.rearWheel];assert.equal(wheels.length,wheelCount);
  for(const wheel of wheels){const initial=wheel.position.clone();assert.ok(wheel.children.some((m:any)=>m.isMesh));wheel.rotation.x+=.9;vehicle.updateMatrixWorld(true);assert.deepEqual(wheel.position.toArray(),initial.toArray());assert.equal(wheel.rotation.x,.9)}
 });
}
test('microbuses join existing traffic without replacing taxis or changing road lanes',()=>{
 const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=engine.members.find(n=>n.name?.getText(source)==='setupTraffic')!;
 const setup=new Function('oe','aC','Xt','Le','Be','Wx','Ym','createReferenceMicrobus','Ee','Jn','dn','Ve','Hn','Vi','Mt','return function '+method.getText(source))(api.Group,()=>new api.Group(),()=>{},()=>{},()=>{},(n:any)=>{n.userData.wheels=[];n.userData.isExistingCar=true},{opposite:[-9,-12,-15]},createReferenceMicrobus,api.Material,api.Box,api.Sphere,api.Cylinder,api.Geometry,api.Attribute,api.Mesh);
 const instance:any={scene:new api.Group()};setup.call(instance);
 assert.equal(instance.traffic.length,12);assert.equal(instance.traffic.filter((t:any)=>t.group.name==='AlexandriaWhiteMicrobus').length,3);assert.equal(instance.traffic.filter((t:any)=>t.group.userData.isExistingCar).length,9);
 for(const car of instance.traffic){assert.ok([-9,-12,-15].includes(car.lane));assert.equal(car.group.visible,false);assert.equal(car.group.rotation.y,Math.PI)}
});
