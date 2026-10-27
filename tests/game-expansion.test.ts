import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
// @ts-ignore browser modules share pure rules with these runtime tests
import {canPlayZombie,weatherAt,EVENTS,crossedPlayer,eventComplete} from '../public/games/ittihadawy/world/rules.js';
// @ts-ignore
import {installExpansion} from '../public/games/ittihadawy/world/expansion.js';
import {createReferenceMicrobus} from '../public/games/ittihadawy/lobby/vehicles.js';
const html=readFileSync('public/games/ittihadawy/index.html','utf8');
const bundle=readFileSync('public/games/ittihadawy/'+html.match(/assets\/index-[^" ]+\.js/)![0],'utf8');
const source=ts.createSourceFile('bundle.js',bundle,99,true,ts.ScriptKind.JS);
const core=source.statements.filter(n=>!ts.isImportDeclaration(n)&&!n.getText(source).startsWith('(function(){const t=document')&&!n.getText(source).startsWith('I2.createRoot')).map(n=>n.getText(source)).join('\n');
const A=new Function('createLobby',core+';return {Group:oe,Mesh:Mt,Box:Jn,Material:Ee,Color:Oe,Geometry:Hn,Attribute:Vi,LineMaterial:o0,Lines:xT,region:x0,regions:Mr,waterMaterials:new Map(),Sphere:dn,Cylinder:Ve};')(()=>{});
A.microbus=()=>createReferenceMicrobus(A);A.character=()=>new A.Group();
test('million threshold uses best score only, not coins or summed progress; admins exempt',()=>{
 for(const bestScore of [0,999999,NaN,Infinity,-1])assert.equal(canPlayZombie({bestScore,totalCoins:2000000}),false);
 assert.equal(canPlayZombie({bestScore:1000000}),true);assert.equal(canPlayZombie({bestScore:0,isAdmin:true}),true);assert.equal(canPlayZombie({bestScore:0,isAdmin:'true'}),false);
});
test('every current route region has a challenge and route loops unchanged',()=>{
 assert.equal(A.regions.length,41);for(const r of A.regions)assert.ok(EVENTS[r.id],r.id);
 assert.equal(A.region(A.regions.at(-1).end).current.id,'stadium');
});
test('weather is continuous at phase boundaries and stays bounded',()=>{
 for(let t=0;t<520;t+=.1){const w=weatherAt(t);for(const k of ['blend','night','rain','wind'])assert.ok(w[k]>=0&&w[k]<=1,k)}
 for(const t of [45,90,135,180,260]){const a=weatherAt(t-.001),b=weatherAt(t+.001);const ca=new A.Color(a.sky).lerp(new A.Color(a.nextSky),a.blend),cb=new A.Color(b.sky).lerp(new A.Color(b.nextSky),b.blend);assert.ok(Math.abs(ca.r-cb.r)<.001);assert.ok(Math.abs(a.rain-b.rain)<.001)}
});
test('collision crossing survives large frame steps and challenge requires both objectives',()=>{
 assert.ok(crossedPlayer(-5,2));assert.equal(crossedPlayer(2,5),false);
 assert.equal(eventComplete({coins:5,avoided:3},{coins:11,avoided:5}),false);
 assert.equal(eventComplete({coins:5,avoided:3},{coins:11,avoided:6}),true);
});
class Element {children:any[]=[];hidden=false;textContent='';className='';dir='';append(...items:any[]){this.children.push(...items)}setAttribute(){}addEventListener(){}removeEventListener(){}remove(){}}
class Engine {
 scene=new A.Group();el=new Element();state='PLAYING';gameMode='runner';opts={quality:'low'};run:any;time=0;sun={intensity:2.4};fill={intensity:.65};player=new A.Group();pool:any[]=[];objects:any[]=[];lobbyProfile:any={bestScore:0};characterId='gamal';expansion:any;toasts:string[]=[];
 cb={toast:(t:string)=>this.toasts.push(t)};sound={tone(){}};
 constructor(){this.scene.background=new A.Color(0x72c6ef);this.scene.fog={color:new A.Color(),near:95,far:205};this.reset()}
 reset(){this.run={distance:0,speed:24,points:0,coins:0,avoided:0,invincible:0,boostTime:0,smoke:0,y:0,gap:100}}
 tickParticles(_dt:number){}destroy(){}getObject(type:string,lane:number,at:number){return {type,lane,at}}puff(){}animatePerson(){}disposeGroup(){}end(){this.state='GAME_OVER'}
 setGameMode!:(mode:string)=>string;
}
test('real Three geometry runtime: weather, regional reward once, mode gate, pooling, reset and cleanup',()=>{
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 // @ts-ignore minimal DOM surface; rendering is separately checked by the production build
 globalThis.document={createElement:()=>new Element()};
 // @ts-ignore
 globalThis.window={addEventListener(){},removeEventListener(){}};
 try{
 installExpansion(Engine,A);const e=new Engine();e.tickParticles(.04);
 assert.equal(e.setGameMode('zombie'),'runner');e.lobbyProfile={bestScore:1000000};assert.equal(e.setGameMode('zombie'),'zombie');
 e.run.coins=6;e.run.avoided=3;e.tickParticles(.04);assert.equal(e.run.points,250);e.tickParticles(.04);assert.equal(e.run.points,250);
 e.run.distance=A.regions.find((r:any)=>r.id==='mandara').end-200;e.tickParticles(.04);
 const bus=e.getObject('block',1,e.run.distance+50) as any;assert.equal(bus.type,'microbus');assert.equal(bus.group.position.x,3);e.objects=[];e.pool.push(bus);assert.equal(e.getObject('microbus',0,e.run.distance+70),bus);
 const geometryBefore=e.scene.children.length;e.run.invincible=1000;
 for(let i=0;i<4000;i++){e.time+=.04;e.tickParticles(.04)}
 assert.ok(e.scene.children.length<=geometryBefore+4,'bounded pools plus at most four recruited allies');
 assert.ok(Number.isFinite(e.scene.background.r));assert.ok(e.sun.intensity>=.4);
 e.reset();assert.equal(e.expansion.event,null);e.state='MENU';e.tickParticles(.04);assert.equal(e.el.children[0].hidden,true);
 e.destroy();assert.equal(e.scene.children.length,1,'expansion-owned root removed; pooled microbus retained for engine cleanup');
 }finally{globalThis.document=oldDocument;globalThis.window=oldWindow}
});
