import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
// @ts-ignore shared browser entry
import {createLobby} from '../public/games/ittihadawy/lobby/menu.js';
// @ts-ignore shared catalog
import {CHARACTERS,MOTORCYCLE_STAGE,REWARDS,emptyOutfit,normalizeProfile} from '../public/games/ittihadawy/lobby/catalog.js';
// @ts-ignore shared model
import {applyOutfit} from '../public/games/ittihadawy/lobby/model.js';
test('characters appear directly on the home screen with 25,000-point milestone badges and 1,000,000-point motorcycle option',()=>{
 const Lobby=createLobby(React,{}) as any;const characters=[['gamal','جمال الدولي'],['adel','عادل شكل'],['hamido','حميدو'],['lazo','اللازو'],['islam','إسلام الفار']].map(([id,name])=>({id,name,ability:'القدرة'}));
 const html=renderToStaticMarkup(React.createElement(Lobby,{characters,selected:'gamal',engine:null}));
 for(const character of characters)assert.ok(html.includes(character.name));
 assert.ok(html.includes('🔒'));
 assert.ok(html.includes('🔒 قريباً'));
 assert.equal(MOTORCYCLE_STAGE,1000000);
 assert.ok(html.includes('اللعب بالموتوسيكل'));
 assert.ok(html.includes('اختيار الشخصية'));assert.equal((html.match(/>المتجر</g)||[]).length,1);assert.ok(!html.includes('غرفة الملابس'));assert.ok(!html.includes('>الشخصيات<'));
});
test('characters and store items unlock at 25,000-point multiples or via coins while islam stays admin-only',()=>{
 const start=normalizeProfile({},0);
 assert.deepEqual(start.characters,['gamal']);
 assert.deepEqual(start.unlocked,[]);
 const mid=normalizeProfile({},75000);
 assert.deepEqual(mid.characters,['gamal','adel','hamido','lazo']);
 assert.deepEqual(mid.unlocked,['green-cap','sunglasses','exclusive-shirt']);
 const all=normalizeProfile({},175000);
 assert.deepEqual(all.characters,['gamal','adel','hamido','lazo']);
 assert.deepEqual(all.unlocked,REWARDS.map((r:any)=>r.id));
 const adminAtZero=normalizeProfile({isAdmin:true},0);
 assert.equal(adminAtZero.isAdmin,true);
 assert.deepEqual(adminAtZero.characters,CHARACTERS);
 assert.deepEqual(adminAtZero.unlocked,REWARDS.map((r:any)=>r.id));
});
test('motorcycle mode attaches a 3D motorcycle and poses any character in riding posture',()=>{
 class MockObj{children:any[]=[];position={x:0,y:0,z:0,set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z}};rotation={x:0,y:0,z:0,set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z}};scale={x:1,y:1,z:1,set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z}};parent:any=null;userData:any={};add(c:any){c.parent=this;this.children.push(c)}removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter((x:any)=>x!==this);this.parent=null}traverse(fn:any){fn(this);for(const c of this.children)c.traverse?.(fn)}}
 const api={Group:MockObj,Mesh:class extends MockObj{geometry:any;material:any;constructor(g:any,m:any){super();this.geometry=g;this.material=m}},Box:class{dispose(){}},Sphere:class{dispose(){}},Material:class{color={getHex:()=>0,set(){}};emissive={setHex(){}};dispose(){}}};
 const player:any=new MockObj();
 player.updateMatrixWorld=function(){return 'ok'};
 player.userData={cosmeticParts:{shirt:[],shorts:[],shoes:[],originalCap:new MockObj(),capVisible:true},bodyPivot:new MockObj(),torsoPivot:new MockObj(),headPivot:new MockObj(),leftLegPivot:new MockObj(),rightLegPivot:new MockObj(),leftShinPivot:new MockObj(),rightShinPivot:new MockObj(),leftArmPivot:new MockObj(),rightArmPivot:new MockObj(),leftForearmPivot:new MockObj(),rightForearmPivot:new MockObj()};
 applyOutfit(player,{...emptyOutfit(),motorcycle:true},api);
 assert.ok(player.userData.motorcycleGroup);
 assert.equal(player.userData.motorcycleGroup.name,'IttihadMotorcycle');
 player.updateMatrixWorld(true);
 assert.equal(player.userData.leftLegPivot.rotation.x,-1.02);
 assert.equal(player.userData.rightLegPivot.rotation.x,-1.02);
 assert.equal(player.userData.leftShinPivot.rotation.x,1.24);
});

