import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { validGameResult, improvedGameStats } from '../src/lib/gameScores';
const html=readFileSync('public/games/ittihadawy/index.html','utf8');
const asset=html.match(/src="\/games\/ittihadawy\/(assets\/index-[^"]+.js)"/)![1];
const source=ts.createSourceFile('game.js',readFileSync('public/games/ittihadawy/'+asset,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const sound=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='gC') as ts.ClassDeclaration;
const makeSound=(saved:Record<string,string>={})=>{
 const store={getItem:(key:string)=>saved[key]??null,setItem:(key:string,value:string)=>saved[key]=value};
 const Sound=new Function('window','localStorage','Audio','return ('+sound.getText(source)+')')({},store,class {currentTime=0;plays=0;preload="";pause(){}play(){this.plays++;return Promise.resolve()}});
 return new Sound(false);
};
const gain=()=>({gain:{value:1,setTargetAtTime(value:number){this.value=value}},connect(){return this}});
function context(){return {currentTime:0,destination:{},createGain:gain,createMediaElementSource(){return {connect(){}}}}}

test('music starts at 50%, preserves saved 0 and clamps out-of-range settings',()=>{
 assert.equal(makeSound().musicVolume,.5);
 assert.equal(makeSound({'game-music-vol':'0'}).musicVolume,0);
 assert.equal(makeSound({'game-music-vol':'500'}).musicVolume,1);
 assert.equal(makeSound({'game-music-vol':'broken'}).musicVolume,.5);
});
test('iOS media gain follows live sliders independently and reaches silence',()=>{
 const s=makeSound();s.ctx=context();s.master=gain();
 // iOS-like element: changing .volume has no effect.
 const media=()=>Object.defineProperty({},'volume',{get:()=>1,set(){}});
 s.soundtrack=media();s.hornAudio=media();s.applyVolumes();
 assert.equal(s.mediaNodes.get(s.soundtrack).gain.gain.value,.5);
 s.setMusicVolume(.18);s.setSfxVolume(0);
 assert.equal(s.mediaNodes.get(s.soundtrack).gain.gain.value,.18);
 assert.equal(s.mediaNodes.get(s.hornAudio).gain.gain.value,0);
 assert.equal(s.master.gain.value,0);
 s.muted=true;s.applyVolumes();assert.equal(s.mediaNodes.get(s.soundtrack).gain.gain.value,0);
 s.muted=false;s.applyVolumes();assert.equal(s.mediaNodes.get(s.soundtrack).gain.gain.value,.18);
 assert.equal(s.mediaNodes.size,2);
});
test('speed pickup uses a sound effect without speech for every character',()=>{
 const boosts=sound.members.filter(n=>n.name?.getText(source)==='boost');
 assert.equal(boosts.length,1);
 assert.doesNotMatch(boosts[0].getText(source),/new Audio|\.play\(|adel-boost/);
 assert.match(boosts[0].getText(source),/createOscillator/);
});
test('only Adel plays the moved clip when hitting a ball, and mute is respected',()=>{
 const s=makeSound();s.ctx=context();s.master=gain();let genericHits=0;s.hit=()=>genericHits++;
 s.ballHit('gamal');s.ballHit('hamido');assert.equal(genericHits,2);assert.equal(s.adelBoostAudio,undefined);
 s.ballHit('adel');assert.equal(s.adelBoostAudio.plays,1);assert.equal(s.adelBoostAudio.currentTime,0);
 assert.equal(s.mediaNodes.get(s.adelBoostAudio).gain.gain.value,.95);
 s.muted=true;s.ballHit('adel');assert.equal(s.adelBoostAudio.plays,1);
 s.muted=false;s.effectsEnabled=false;s.ballHit('adel');assert.equal(s.adelBoostAudio.plays,1);
});
test('collision dispatch selects ball voice separately from ordinary obstacles',()=>{
 let expression:ts.ConditionalExpression|undefined;
 const visit=(node:ts.Node)=>{if(ts.isConditionalExpression(node)&&node.whenTrue.getText(source)==='this.sound.ballHit(this.characterId)')expression=node;ts.forEachChild(node,visit)};
 visit(source);assert.ok(expression);
 const dispatch=new Function('g','return '+expression!.getText(source));
 for(const characterId of ['adel','gamal','hamido'])for(const type of ['ball','low','high','block']){
   const calls:string[]=[];
   dispatch.call({characterId,sound:{ballHit:()=>calls.push('ball'),hit:()=>calls.push('obstacle')}},{type});
   assert.deepEqual(calls,[type==='ball'?'ball':'obstacle']);
 }
});
test('lower or equal runs cannot replace a members highest score',()=>{
 const result={score:500,distance:200,character:'adel'};
 assert.equal(improvedGameStats({ittihadawyScore:600},result),null);
 assert.equal(improvedGameStats({ittihadawyScore:500},result),null);
 assert.equal(improvedGameStats({ittihadawyScore:10},result)!['stats.ittihadawyScore'],500);
 for(const score of [-1,Infinity,NaN,1.5])assert.equal(validGameResult({...result,score}),false);
 assert.equal(validGameResult({...result,character:'unknown'}),false);
});
test('one blue entrance sign per region in each route loop, never repeated down the road',()=>{
 const variables=new Map<string,ts.VariableDeclaration>();
 for(const statement of source.statements)if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations)variables.set(d.name.getText(source),d);
 const extended=new Function('return '+variables.get('_0')!.initializer!.getText(source))();
 const route=new Function('_0','return '+variables.get('Mr')!.initializer!.getText(source))(extended);
 const length=route.at(-1).end;
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='regionSign')!;
 const signs:string[]=[];
 const sign=new Function('x0','Mr','Uf','Xt','Be','return ({'+method.getText(source)+'}).regionSign')(
   (distance:number)=>({current:route.find((r:any)=>distance%length<r.end)}),route,length,()=>{},(_group:any,name:string)=>signs.push(name));
 for(let i=-2;i<length/60*2;i++)sign({},i);
 assert.equal(route.length,37);assert.equal(signs.length,74);
 for(const region of route)assert.equal(signs.filter(name=>name===region.name).length,2);
});

test('account bridge rejects outside frames and cannot credit a run to a different member',async()=>{
 const handlers:Record<string,Function>={}, replies:any[]=[], writes:any[]=[];
 const parent={postMessage:(message:any)=>replies.push(message)};
 const window={parent,addEventListener:(name:string,handler:Function)=>handlers[name]=handler};
 const auth:any={currentUser:{uid:'member-a'},authStateReady:async()=>{}};
 const input=readFileSync('src/gameAccount.ts','utf8').replace(/^import .*;\n/gm,'');
 const js=ts.transpile(input,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
 const storage={getItem:()=>null,setItem:()=>{}};
 const instance=new Function('auth','db','doc','runTransaction','validGameResult','improvedGameStats','window','location','crypto','localStorage','sessionStorage','setDoc','serverTimestamp',js+';return {flush:()=>queue};')(
  auth,{},(_db:any,_collection:string,uid:string)=>({uid}),async(_db:any,work:Function)=>work({get:async()=>({exists:()=>true,data:()=>({stats:{}})}),update:(...args:any[])=>writes.push(args)}),validGameResult,improvedGameStats,window,{origin:'https://app.example'},crypto,storage,storage,async()=>{},()=>0);
 const message=(type:string,id:string,result?:any,source:any=parent)=>handlers.message({origin:'https://app.example',source,data:{type,id,result}});
 const result={score:500,distance:200,character:'adel'};
 message('ittihadawy:run-start','foreign',undefined,{});await instance.flush();
 message('ittihadawy:run-end','foreign',result);await instance.flush();assert.equal(writes.length,0);
 message('ittihadawy:run-start','switched');await instance.flush();auth.currentUser={uid:'member-b'};
 message('ittihadawy:run-end','switched',result);await instance.flush();assert.equal(writes.length,0);assert.equal(replies.at(-1).status,'guest');
 message('ittihadawy:run-start','valid');await instance.flush();message('ittihadawy:run-end','valid',result);await instance.flush();
 assert.equal(writes.length,1);assert.equal(writes[0][0].uid,'member-b');assert.equal(replies.at(-1).status,'saved');
 message('ittihadawy:run-end','valid',result);await instance.flush();assert.equal(writes.length,1);
});

test('ads are smaller and stay beside the player corridor instead of overhead',()=>{
 const ad=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='jp')!;
 class Group {name='';userData:any={};children:any[]=[];position={x:0,y:0,z:0,set(x:number,y:number,z:number){Object.assign(this,{x,y,z})}};rotation={y:0};add(child:any){this.children.push(child)}traverse(callback:Function){callback(this);for(const child of this.children)child.traverse(callback)}}
 class Mesh extends Group {isMesh=true;constructor(public geometry:any,public material:any){super()}}
 class Plane {constructor(public width:number,public height:number){}}
 const makeAd=new Function('oe','Mt','Vs','iC','return ('+ad.getText(source)+')')(Group,Mesh,Plane,()=>({ad:true}));
 for(const [zone,index] of [['shatby',18],['komeldikka',18],['agamy',36]] as const){
  const group=new Group(),boxes:number[][]=[];
  makeAd(group,index,zone,{box:(_g:any,...args:number[])=>boxes.push(args),label:()=>{}});
  const stand=group.children[0],face=stand.children[0],right=stand.position.x+face.position.x+face.geometry.width/2;
  assert.equal(stand.rotation.y,0);assert.equal(stand.userData.channelAd,true);
  assert.ok(face.geometry.width<=2.7);assert.equal(face.userData.noBatch,true);
  if(zone==='komeldikka'){assert.ok(right<4.2);assert.ok(stand.position.x>=3)}else{assert.ok(right<-5);assert.equal(stand.position.x,-6.5)}
 }
 const root=new Group();for(let index=-2;index<360;index++)makeAd(root,index,'shatby',{box:()=>{},label:()=>{}});
 assert.equal(root.children.length,20); // One per 1080 m rather than every 180 m.
});
test('the entire advertisement disappears before approaching the camera',()=>{
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='updateAdVisibility')!;
 const update=new Function('return ({'+method.getText(source)+'}).updateAdVisibility')();
 const ad={userData:{channelAd:true},position:{z:0},visible:true},frame={userData:{noBatch:true}};
 const segment={group:{position:{z:0},children:[ad]}};
 for(const [z,expected] of [[-11,false],[-12,true],[-50,true],[-161,false],[10,false]]){
  segment.group.position.z=z as number;update.call({segments:[segment]});assert.equal(ad.visible,expected);
 }
 const world=game.members.find(n=>n.name?.getText(source)==='updateWorld')!;
 assert.match(world.getText(source),/this\.updateAdVisibility\(\)/);
 const batch=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Kp')!;
 assert.match(batch.getText(source),/o\.userData\.noBatch/);
});
test('region sign plate and support stay clear of facades',()=>{
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='regionSign')!;
 const region={name:'الشاطبي',end:300},boxes:number[][]=[],labels:any[][]=[];
 const sign=new Function('x0','Mr','Uf','Xt','Be','return ({'+method.getText(source)+'}).regionSign')(()=>({current:region}),[region],300,(_g:any,...args:number[])=>boxes.push(args),(...args:any[])=>labels.push(args));
 sign({},0);assert.equal(labels.length,1);
 assert.ok(boxes.every(([x,_y,_z,width])=>x+width/2<4.2&&x-width/2>-4.2));
 const board=boxes[2];assert.ok(board[1]-board[4]/2>4.5);

});

test('Adel arrest immediately stops and rewinds the hit voice before playing the arrest clip',()=>{
 const s=makeSound();s.ctx=context();s.master=gain();const events:string[]=[];
 s.adelHitAudio={currentTime:2.3,pause(){events.push('stop-hit')}};
 s.adelCaughtAudio={currentTime:1.1,volume:1,muted:false,pause(){events.push('restart-arrest')},play(){events.push('play-arrest');return Promise.resolve()}};
 s.caught('adel');
 assert.equal(s.adelHitAudio.currentTime,0);assert.equal(s.adelCaughtAudio.currentTime,0);
 assert.deepEqual(events,['stop-hit','restart-arrest','play-arrest']);
 events.length=0;s.muted=true;s.adelHitAudio.currentTime=2;
 s.caught('adel');assert.equal(s.adelHitAudio.currentTime,0);assert.deepEqual(events,['stop-hit']);
 events.length=0;s.muted=false;s.tone=()=>events.push('generic-arrest');
 s.caught('hamido');assert.deepEqual(events,['generic-arrest']);
});

test('canvas follows the scene size in portrait, landscape and after initially hidden layout',()=>{
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='resize')!;
 const resize=new Function('return ({'+method.getText(source)+'}).resize')();
 const sizes:number[][]=[];let projections=0;
 const engine={disposed:false,el:{clientWidth:0,clientHeight:0},renderer:{setSize:(...size:number[])=>sizes.push(size)},camera:{aspect:1,updateProjectionMatrix:()=>projections++}};
 resize.call(engine);assert.equal(sizes.length,0);
 for(const [width,height] of [[393,852],[852,393],[393,760]]){
  engine.el.clientWidth=width;engine.el.clientHeight=height;resize.call(engine);
  assert.deepEqual(sizes.at(-1),[width,height]);assert.equal(engine.camera.aspect,width/height);
 }
 assert.equal(projections,3);engine.disposed=true;resize.call(engine);assert.equal(projections,3);
 const constructor=game.members.find(ts.isConstructorDeclaration)!.getText(source);
 assert.match(constructor,/viewportObserver\?\.observe\(this\.el\)/);
 assert.match(constructor,/window\.visualViewport,"resize"/);
 const destroy=game.members.find(n=>n.name?.getText(source)==='destroy')!.getText(source);
 assert.match(destroy,/viewportObserver\?\.disconnect\(\)/);
});

test('arrest transition dispatches Adel caught voice once before the capture scene',()=>{
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='end')!;
 const end=new Function('localStorage','return ({'+method.getText(source)+'}).end')({setItem(){}});
 const events:string[]=[];
 const engine={state:'PLAYING',characterId:'adel',player:{position:{x:0},rotation:{z:0},userData:{}},run:{boostTime:0,smoke:0,distance:100,points:50},best:{distance:0,score:0},boostAura:{visible:false},cb:{best(){}},sound:{whistle(){},caught:(id:string)=>events.push('caught:'+id)},setState(state:string){this.state=state;events.push(state)}};
 end.call(engine);end.call(engine);
 assert.deepEqual(events,['caught:adel','FALLING']);
});
