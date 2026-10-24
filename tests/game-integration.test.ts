import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { GameVoiceBank } from '../public/games/ittihadawy/voice-bank.js';
import { validGameResult, improvedGameStats } from '../src/lib/gameScores';
const html=readFileSync('public/games/ittihadawy/index.html','utf8');
const asset=html.match(/src="\/games\/ittihadawy\/(assets\/index-[^"]+.js)"/)![1];
const source=ts.createSourceFile('game.js',readFileSync('public/games/ittihadawy/'+asset,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
test('only a signed-in app member can open the game or unlock its standalone frame',()=>{
 const page=readFileSync('src/pages/Game.tsx','utf8');
 const html=readFileSync('public/games/ittihadawy/index.html','utf8');
 const bridge=readFileSync('public/games/ittihadawy/enhancements.js','utf8');
 assert.match(page,/await auth\.authStateReady\(\)[\s\S]*if \(!auth\.currentUser\)[\s\S]*setLoginRequired\(true\)/);
 assert.match(page,/type: 'ittihadawy:member-access', authorized: true/);
 assert.match(html,/id="member-access-gate"/);
 assert.match(bridge,/event\.origin !== location\.origin/);
 assert.match(bridge,/event\.source === frame\.contentWindow/);
 assert.match(bridge,/event\.source === window\.parent/);
 assert.match(bridge,/event\.data\.authorized === true/);
});
const sound=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='gC') as ts.ClassDeclaration;
const makeSound=(saved:Record<string,string>={}, Bank=GameVoiceBank)=>{
 const store={getItem:(key:string)=>saved[key]??null,setItem:(key:string,value:string)=>saved[key]=value};
 const Sound=new Function('window','localStorage','Audio','GameVoiceBank','return ('+sound.getText(source)+')')({},store,class {currentTime=0;plays=0;preload="";pause(){}play(){this.plays++;return Promise.resolve()}},Bank);
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
 assert.equal(route.length,28);assert.equal(signs.length,56);
 for(const region of route)assert.equal(signs.filter(name=>name===region.name).length,2);
 assert.deepEqual(route.map((r:any)=>r.id),['stadium','komeldikka','misrstation','moharrambek','karmouz','bahary','mansheya','mahatetraml','azareeta','shatby','hadra','smouha','zahreya','bakous','ghabriel','victoria','sidiBishr','miami','asafra','mandara','montaza','maamoura','abouqir','minabasal','mex','dekheila','agamy','borgelarab']);
 assert.deepEqual(route.filter((r:any)=>r.sea).map((r:any)=>r.id),['bahary','mansheya','mahatetraml','azareeta','shatby','sidiBishr','miami','asafra','mandara','montaza','maamoura','abouqir','mex','agamy']);
 assert.deepEqual(extended.map((r:any)=>r.id),route.map((r:any)=>r.id));
 const lookup=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='YR')!;
 const findRegion=new Function('_0','return '+lookup.getText(source))(extended);
 assert.ok(route.every((r:any)=>findRegion(r.id)?.id===r.id));
});

test('account bridge rejects outside frames and cannot credit a run to a different member',async()=>{
 const handlers:Record<string,Function>={}, replies:any[]=[], writes:any[]=[];
 const parent={postMessage:(message:any)=>replies.push(message)};
 const window={parent,addEventListener:(name:string,handler:Function)=>handlers[name]=handler};
 const auth:any={currentUser:{uid:'member-a'},authStateReady:async()=>{},onAuthStateChanged(callback:Function){handlers.auth=callback;callback(this.currentUser);return ()=>{}}};
 const input=readFileSync('src/gameAccount.ts','utf8').replace(/^import .*;\n/gm,'');
 const js=ts.transpile(input,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
 const storage={getItem:()=>null,setItem:()=>{}};
 const instance=new Function('auth','db','doc','runTransaction','validGameResult','improvedGameStats','window','location','crypto','localStorage','sessionStorage','setDoc','serverTimestamp',js+';return {flush:()=>queue};')(
  auth,{},(_db:any,_collection:string,uid:string)=>({uid}),async(_db:any,work:Function)=>work({get:async()=>({exists:()=>true,data:()=>({stats:{}})}),update:(...args:any[])=>writes.push(args)}),validGameResult,improvedGameStats,window,{origin:'https://app.example'},crypto,storage,storage,async()=>{},()=>0);
 assert.ok(replies.some(r=>r.type==='ittihadawy:member-access'&&r.authorized===true));
 handlers.auth(null);assert.equal(replies.at(-1).authorized,false);
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

test('running speed increases faster and keeps rising on successive route loops',()=>{
 const variables=new Map<string,ts.VariableDeclaration>();
 for(const statement of source.statements)if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations)variables.set(d.name.getText(source),d);
 const extended=new Function('return '+variables.get('_0')!.initializer!.getText(source))();
 const route=new Function('_0','return '+variables.get('Mr')!.initializer!.getText(source))(extended);
 const lap=route.at(-1).end;
 const stageNode=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='regionStage')!;
 const stage=new Function('Uf','Mr','return '+stageNode.getText(source))(lap,route);
 const speed=new Function('Uf','regionStage','return '+variables.get('Wy')!.initializer!.getText(source))(lap,stage);
 assert.equal(speed(0),24);assert.equal(speed(-100),24);
 assert.ok(speed(1000)>24+1000/130);
 assert.ok(speed(lap)>=66);
 for(let loop=1;loop<=10;loop++)assert.ok(speed((loop+1)*lap)>speed(loop*lap));
 for(const loop of [0,1,2])for(const r of route){const d=loop*lap+r.end;assert.ok(speed(d)>speed(d-.01));}
 const spacing=new Function('Wy','regionStage','return '+variables.get('yC')!.initializer!.getText(source))(speed,stage);
 assert.ok(spacing(1000)/speed(1000)<spacing(0)/speed(0));assert.ok(spacing(lap)/speed(lap)>=.95);
});

test('speed pickups are spaced farther apart while normal coin rows remain',()=>{
 const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=game.members.find(n=>n.name?.getText(source)==='spawn')!;
 const spawn=new Function('SC','vr','yC','return ({'+method.getText(source)+'}).spawn')(()=>[0],()=> 'shatby',()=>60);
 const pickups:number[]=[];let coins=0;
 const engine={spawnAt:75,nextBoostAt:300,getObject(type:string,_lane:number,at:number){if(type==='boost')pickups.push(at);if(type==='coin')coins++}};
 for(let i=0;i<100;i++)spawn.call(engine);
 assert.ok(pickups.length<=15);assert.ok(pickups[0]>=300);
 for(let i=1;i<pickups.length;i++)assert.ok(pickups[i]-pickups[i-1]>=420);
 assert.equal(coins,400);
});

function regionScenery(id:string,index=0) {
 const declaration=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addRegionDetails')!;
 const decorate=new Function('return ('+declaration.getText(source)+')')();
 const shapes:{kind:string,args:any[]}[]=[];
 const primitives=Object.fromEntries(['box','cylinder','ball','label'].map(kind=>[kind,(_group:any,...args:any[])=>{shapes.push({kind,args});return {rotation:{}}}]));
 decorate({}, {id}, index, primitives);
 return shapes;
}

test('Dekheila has port containers and cranes without sea scenery',()=>{
 const shapes=regionScenery('dekheila',255);
 assert.ok(shapes.some(s=>s.kind==='box'&&s.args[3]===24&&s.args[4]===14));
 assert.ok(shapes.filter(s=>s.kind==='cylinder'&&s.args[1]===7&&s.args[5]===14).length>=4);
 assert.ok(shapes.some(s=>s.kind==='label'&&s.args[0]==='ميناء الدخيلة'));
 const variable=source.statements.filter(ts.isVariableStatement).flatMap(n=>Array.from(n.declarationList.declarations)).find(n=>n.name.getText(source)==='_0')!;
 const regions=new Function('return '+variable.initializer!.getText(source))();
 assert.equal(regions.find((r:any)=>r.id==='dekheila').sea,false);
});

test('Agamy villa gardens have extra leafy trees and Wardian has striped smoking stacks',()=>{
 const declaration=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='plantVillaTrees')!;
 const plant=new Function('return ('+declaration.getText(source)+')')();
 const trunks:any[][]=[],leaves:any[][]=[];
 plant({}, {cylinder:(_g:any,...args:any[])=>trunks.push(args),ball:(_g:any,...args:any[])=>leaves.push(args)});
 assert.deepEqual(trunks.map(s=>s[0]),[-8.5,8.5]);assert.equal(leaves.length,4);
 const villa=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='jR')!;
 assert.match(villa.getText(source),/plantVillaTrees\(m,/);
 const industrial=regionScenery('wardian');
 assert.equal(industrial.filter(s=>s.kind==='cylinder').length,18);
 assert.equal(industrial.filter(s=>s.kind==='ball').length,6);
});

test('Hadra vegetable stalls occupy all four left lanes and leave runner lanes clear',()=>{
 const shapes=regionScenery('hadra',1);
 const stalls=shapes.filter(s=>s.kind==='box'&&s.args[1]===.55);
 assert.equal(stalls.length,20);
 assert.deepEqual([...new Set(stalls.map(s=>s.args[0]))],[-17.5,-14.5,-11.5,-8.5]);
 assert.equal(shapes.filter(s=>s.kind==='ball').length,180);
 for(const shape of shapes)assert.ok(shape.args[0]<-6);
});

test('Mex has one black and white lighthouse per region pass, and HUD names the current region',()=>{
 const shapes=Array.from({length:10},(_,i)=>regionScenery('mex',i+107)).flat();
 const bands=shapes.filter(s=>s.kind==='cylinder'&&s.args[5]===1.6);
 assert.equal(bands.length,8);
 assert.deepEqual(bands.map(s=>s.args[6]),[0xf6f4ea,0x202729,0xf6f4ea,0x202729,0xf6f4ea,0x202729,0xf6f4ea,0x202729]);
 assert.ok(shapes.every(s=>s.args[0]<-25));
 const ui=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='WC')!.getText(source);
 assert.match(ui,/className:"current-region",title:z\.current\.name},z\.current\.name/);
});

test('Misr Station trains rest on rails beside ground-level lanes and Montaza landmarks are prominent',()=>{
 const trains=regionScenery('misrstation',4);
 const bodies=trains.filter(s=>s.kind==='box'&&s.args[4]===2.6);
 assert.equal(bodies.length,6);
 assert.ok(bodies.every(s=>Math.abs(s.args[0])-s.args[3]/2>5));
 const wheels=trains.filter(s=>s.kind==='cylinder'&&s.args[3]===.36);
 assert.equal(wheels.length,24);assert.ok(wheels.every(s=>Math.abs(s.args[1]-s.args[3]-.04)<1e-6));
 assert.ok(trains.filter(s=>s.kind==='box'&&s.args[1]-s.args[4]/2<2).every(s=>Math.abs(s.args[0])-s.args[3]/2>4.5));
 const montaza=regionScenery('montaza',5);
 assert.ok(montaza.some(s=>s.kind==='label'&&s.args[0]==='قصر المنتزه'));
 assert.ok(montaza.some(s=>s.kind==='box'&&s.args[0]===25&&s.args[3]===22&&s.args[4]===10));
 assert.ok(montaza.some(s=>s.kind==='cylinder'&&s.args[0]===-45));
});

test('district trams and moving street obstacles are assigned to their required zones',()=>{
 for(const id of ['moharrambek','karmouz'])assert.ok(regionScenery(id,5).some(s=>s.kind==='box'&&s.args[0]===-14&&s.args[6]===0xe4b52d));
 assert.ok(regionScenery('mahatetraml',5).some(s=>s.kind==='box'&&s.args[0]===-14&&s.args[6]===0x24658d));
 const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const objectMaker=engine.members.find(n=>n.name?.getText(source)==='getObject')!.getText(source);
 const spawner=engine.members.find(n=>n.name?.getText(source)==='spawn')!.getText(source);
 const runner=engine.members.find(n=>n.name?.getText(source)==='tickRun')!.getText(source);
 assert.match(objectMaker,/t==="tuktuk"/);assert.match(objectMaker,/t==="motorcycle"/);assert.match(objectMaker,/t==="dog"/);
 assert.doesNotMatch(objectMaker,/vr\(a\)==="misrstation"/);
 assert.match(spawner,/\["komeldikka","karmouz","asafra"\]\.includes\(zone\)/);
 assert.doesNotMatch(spawner,/zone==="misrstation"/);
 assert.match(runner,/g\.group\.userData\.movingWheels/);assert.match(runner,/g\.group\.userData\.dogLegs/);
 const collision=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='MC')!;
 const avoids=new Function('return '+collision.getText(source))();
 assert.equal(avoids('motorcycle',2,false),false);assert.equal(avoids('motorcycle',0,false),true);
});

test('major district landmarks cover Azarita, Smouha, Asafra, Maamoura, Mina El Basal and Borg El Arab',()=>{
 assert.ok(regionScenery('azareeta',205).some(s=>s.kind==='label'&&s.args[0]==='مكتبة الإسكندرية'));
 const smouha=regionScenery('smouha',115);
 assert.ok(smouha.some(s=>s.kind==='label'&&s.args[0]==='نادي الاتحاد • فرع سموحة'));
 assert.ok(smouha.some(s=>s.kind==='box'&&s.args[6]===0x3f8b52));
 const asafra=regionScenery('asafra',175);
 assert.ok(asafra.some(s=>s.kind==='box'&&s.args[6]===0x9d4936));
 assert.ok(regionScenery('maamoura',205).some(s=>s.kind==='box'&&s.args[4]===4.8));
 assert.ok(regionScenery('minabasal',235).some(s=>s.kind==='label'&&s.args[0]==='مينا البصل • المخازن'));
 assert.ok(regionScenery('borgelarab',265).some(s=>s.kind==='label'&&s.args[0]==='استاد برج العرب'));
});

test('all refined characters build with their animation joints and ability attachments intact',()=>{
 const characterClass=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qy') as ts.ClassDeclaration;
 const method=characterClass.members.find(n=>n.name?.getText(source)==='createGamalCharacter')!.getText(source).replace(/^static /,'');
 class Vector {x=0;y=0;z=0;set(x:number,y:number,z:number){Object.assign(this,{x,y,z});return this}setScalar(n:number){return this.set(n,n,n)}multiplyScalar(n:number){this.x*=n;this.y*=n;this.z*=n;return this}}
 class Group {name='';children:any[]=[];userData:any={};position=new Vector;rotation=new Vector;scale=new Vector().setScalar(1);visible=true;add(child:any){this.children.push(child)}traverse(fn:Function){fn(this);this.children.forEach(c=>c.traverse(fn))}}
 class Geometry {parameters:any;constructor(...args:any[]){this.parameters={radius:args[0]}}}
 class Material {color:any;constructor(options:any){Object.assign(this,options);this.color={value:options.color,setHex(n:number){this.value=n}}}}
 class Mesh extends Group {isMesh=true;constructor(public geometry:any,public material:any){super()}}
 const surface=(kind:string)=>({kind});
 const build=new Function('oe','Ee','Ve','Mt','Jn','Un','dn','pi','l0','ob','$n','naturalSurface','return ({'+method+'}).createGamalCharacter')(Group,Material,Geometry,Mesh,Geometry,Geometry,Geometry,Material,Geometry,Group,2,surface);
 const factory={createAlIttihadScarfTexture:()=>({}),createMabkharaFiligreeTexture:()=>({})};
 for(const id of ['gamal','adel','hamido','lazo']){
  const model=build.call(factory,id),rig=model.userData;
  assert.equal(rig.characterId,id);assert.equal(rig.headPivot.scale.x,.84);
  assert.equal(rig.leftLegPivot.scale.y,1.1);assert.equal(rig.rightLegPivot.position.y,1.23);
  for(const joint of ['leftForearmPivot','rightForearmPivot','leftShinPivot','rightShinPivot','mouthMesh','mabkharaPivot','scarfBackPivot'])assert.ok(rig[joint]);
  if(id==='adel'){assert.ok(rig.hornCarry);assert.ok(rig.hornMouth)}
  if(id==='lazo'){assert.equal(model.name,'Lazo');assert.ok(rig.headPivot.children.some((n:any)=>n.name==='LazoBackwardsCap'));assert.equal(rig.scarfFrontLeft.visible,false);assert.ok(validGameResult({score:1,distance:10,character:id}))}
  const materials:any[]=[];model.traverse((node:any)=>{if(node.material)materials.push(node.material)});
  assert.ok(materials.some(m=>m.bumpMap?.kind==='skin'&&m.metalness===0));
  assert.ok(materials.some(m=>m.bumpMap?.kind==='cloth'&&m.roughness===.94));
 }
});

test('Lazo voice events use distinct clips and arrest interrupts earlier speech',()=>{
 const s=makeSound();s.ctx=context();s.master=gain();
 s.playLazoVoice('ability');const ability=s.lazoAbilityAudio;assert.equal(ability.plays,1);
 let stopped=0;ability.pause=()=>stopped++;ability.currentTime=2;
 s.hit('lazo');assert.ok(stopped>0);assert.equal(ability.currentTime,0);assert.equal(s.lazoHitAudio.plays,1);
 let hitStopped=0;s.lazoHitAudio.pause=()=>hitStopped++;s.lazoHitAudio.currentTime=2;
 s.caught('lazo');assert.ok(hitStopped>0);assert.equal(s.lazoHitAudio.currentTime,0);assert.equal(s.lazoCaughtAudio.plays,1);
 assert.equal(s.mediaNodes.get(s.lazoCaughtAudio).gain.gain.value,.95);
 s.setSfxVolume(.2);assert.equal(s.mediaNodes.get(s.lazoCaughtAudio).gain.gain.value,.2);
 let caughtStops=0;s.lazoCaughtAudio.pause=()=>caughtStops++;s.setPlaybackState('GAME_OVER');assert.equal(caughtStops,0);s.setPlaybackState('MENU');assert.equal(caughtStops,1);
 s.muted=true;s.hit('lazo');assert.equal(s.lazoHitAudio.plays,1);
 s.muted=false;s.reset();assert.equal(s.lazoCaughtAudio.currentTime,0);
 const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.members.some(m=>m.name?.getText(source)==='finishIntro'))!;
 assert.match(engine.getText(source),/this.characterId==="lazo"\?\(this.cb.toast\([^)]*\),this.sound.playLazoVoice\("ability"\)\)/);
});


test('Lazo arrest stops all other voice tracks without stopping background music',()=>{
 const s=makeSound();s.ctx=context();s.master=gain();let stopped=0;
 for(const key of ['opening','hornAudio','crabAudio','adelHitAudio','adelCaughtAudio','adelBoostAudio'])s[key]={currentTime:3,pause(){stopped++}};
 let musicStopped=false;s.soundtrack={pause(){musicStopped=true}};s.openingWasPlaying=true;
 s.caught('lazo');assert.equal(stopped,6);assert.equal(s.openingWasPlaying,false);assert.equal(musicStopped,false);assert.equal(s.lazoCaughtAudio.plays,1);
 for(const key of ['opening','hornAudio','crabAudio','adelHitAudio','adelCaughtAudio','adelBoostAudio'])assert.equal(s[key].currentTime,0);
});


test('game engine uses prepared buffers for Lazo arrest and preserves the volume slider',async()=>{
 const Bank=class extends GameVoiceBank{constructor(ctx:any){super(ctx,async(url:string)=>({ok:true,arrayBuffer:async()=>({url})}))}};
 const s=makeSound({},Bank),sources:any[]=[];s.ctx={...context(),state:'running',resume:async()=>{},decodeAudioData:async(b:any)=>b,createBufferSource(){const n={connect(){},disconnect(){},start(){},stop(){this.stopped=true}};sources.push(n);return n}};
 s.prepareVoices();await s.voiceBank.preload(['/games/ittihadawy/audio/lazo-caught.mp3']);s.caught('lazo');await new Promise(r=>setTimeout(r,0));
 assert.equal(sources.length,1);assert.equal(sources[0].buffer.url,'/games/ittihadawy/audio/lazo-caught.mp3');
 s.setSfxVolume(.25);assert.equal(s.lazoCaughtAudio.gain.gain.value,.25);s.reset();assert.equal(sources[0].stopped,true);
});

test('supporter banners stay on the stadium stand, clear of the running lanes, and repeat sparingly',()=>{
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addStadiumFanBanner')!;
 class Texture{colorSpace:any;image:any;needsUpdate=false;offset={set(){}};repeat={set(){}}}
 class Material{userData:any={};constructor(options:any){Object.assign(this,options)}}
 class Mesh{userData:any={};rotation:any={};position:any={set(x:number,y:number,z:number){Object.assign(this,{x,y,z})}};constructor(public geometry:any,public material:any){}}
 const add=new Function('ns','yn','pi','$n','Image','Mt','Vs','let stadiumFanMaterial;return '+fn.getText(source))(Texture,'srgb',Material,2,class{},Mesh,class{constructor(public w:number,public h:number){}});
 const banners:any[]=[];const group={add(n:any){banners.push(n)}};add(group,1);add(group,2);assert.equal(banners.length,0);add(group,0);add(group,3);
 assert.equal(banners.length,2);assert.equal(banners[0].material,banners[1].material);assert.equal(banners[0].material.userData.sharedSurface,true);
 assert.ok(banners.every(b=>b.position.x>9&&b.position.y>2));assert.equal(banners[0].rotation.y,-Math.PI/2);
});




test('Gamal, Adel and Hamido have separate opening clips',()=>{
 const s=makeSound();s.ctx=context();s.playOpening('adel');const adel=s.opening;assert.equal(adel.plays,1);assert.equal(adel,s.adelOpeningAudio);
 let paused=0;adel.pause=()=>paused++;s.playOpening('gamal');assert.equal(paused,1);assert.notEqual(s.opening,adel);assert.equal(s.opening,s.gamalOpeningAudio);assert.equal(s.opening.plays,1);
 s.playOpening('hamido');assert.equal(s.hamidoOpeningAudio.plays,1);assert.equal(s.opening,s.hamidoOpeningAudio);
 s.playOpening('lazo');assert.equal(s.gamalOpeningAudio.plays,1);assert.equal(adel.plays,1);
 s.muted=true;s.playOpening('adel');assert.equal(adel.plays,1);s.muted=false;s.playOpening('adel');assert.equal(adel.plays,2);
});
test('all playable characters are unlocked immediately regardless of score',()=>{
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='characterUnlocked')!;
 const unlocked=new Function('return '+fn.getText(source))();
 for(const id of ['gamal','adel','hamido'])for(const score of [0,undefined,200000,300000])assert.equal(unlocked(id,score),true);
 const availableNode=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='availableCharacter')!;
 const available=new Function('characterUnlocked','sc','return '+availableNode.getText(source))(unlocked,(id:string)=>({id}));
 assert.equal(available('hamido',0),'hamido');
});
test('Hadra taxis and Kom el Dikka food cart and cafe stay off the runner lanes',()=>{
 const taxis=regionScenery('hadra',0).filter(s=>typeof s.args[0]==='number'&&s.args[0]>0);
 assert.ok(taxis.length>10);assert.ok(taxis.every(s=>s.args[0]>6));
 const cafe=regionScenery('komeldikka',0);assert.ok(cafe.some(s=>s.kind==='label'&&s.args[0]==='قهوة كوم الدكة'));
 assert.ok(cafe.some(s=>s.kind==='label'&&s.args[0]==='فول وطعمية'));
 assert.ok(cafe.filter(s=>s.kind!=='label').every(s=>Math.abs(s.args[0])>=6));
 assert.equal(regionScenery('komeldikka',1).length,0);
});

test('existing app and persisted account sessions unlock gameplay without another login',()=>{
 const code=readFileSync('public/games/ittihadawy/enhancements.js','utf8');
 const parsed=ts.createSourceFile('enhancements.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const statement=parsed.statements.find(s=>ts.isExpressionStatement(s)&&s.getText(parsed).includes('const fromApp')) as ts.ExpressionStatement;
 const callback=(statement.expression as ts.CallExpression).arguments[1].getText(parsed);
 for(const embedded of [false,true]){
  const parent={},account={},win:any={parent};if(!embedded)win.parent=win;
  let opened=0,locked=0;const fields:any={h1:{},p:{},a:{hidden:true}};
  const gate={remove(){opened++},querySelector:(s:string)=>fields[s]};
  const root={removeAttribute(){},setAttribute(){locked++}};
  const handler=new Function('window','location','frame','accessGate','document','return '+callback)(win,{origin:'https://app.example'},{contentWindow:account},gate,{getElementById:()=>root,body:{append(){}}});
  const send=(source:any,authorized:boolean,origin='https://app.example')=>handler({source,origin,data:{type:'ittihadawy:member-access',authorized}});
  send({},true);send(account,true,'https://other.example');assert.equal(opened,0);
  send(account,true);assert.equal(opened,1);
  if(embedded){send(parent,true);assert.equal(opened,2);send(account,false);assert.equal(locked,0);send(parent,false)}else send(account,false);
  assert.equal(locked,1);assert.equal(fields.a.hidden,false);
 }
});

test('stadium uses original renderer and gate on every lap instead of generic streets',()=>{
 const declarations=source.statements.flatMap(s=>ts.isVariableStatement(s)?[...s.declarationList.declarations]:[]);
 const route=new Function('return '+declarations.find(d=>d.name.getText(source)==='Mr')!.initializer!.getText(source))();
 const lap=route.at(-1).end, calls:string[]=[];
 const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration;
 const method=engine.members.find(m=>m.name?.getText(source)==='segment')!;
 const shape=()=>({rotation:{},material:{},position:{set(){}}});
 const env:any={Uf:lap,vr:(d:number)=>route.find((r:any)=>d%lap<r.end).id,Me:{white:1,green:2,skin:3,black:4},br:new Map(),YR:(id:string)=>{calls.push('generic:'+id);return route.find((r:any)=>r.id===id)},XC:()=>calls.push('original-stands'),addGateGrandstands:()=>calls.push('gate-stands'),oC:()=>calls.push('komeldikka'),vf:()=>false,Xt:shape,ea:shape,Le:shape,Be:shape,kC:()=>{},Kp:()=>{},jp:()=>{}};
 const segment=new Function('env','with(env){return ({'+method.getText(source)+'}).segment}')(env);
 const self={disposeGroup(){},regionSign(){},flag(){},light(){},gate(){calls.push('original-gate')}};
 for(const offset of [0,lap/60]){
  calls.length=0;segment.call(self,{},offset);assert.ok(calls.includes('original-stands'));assert.ok(!calls.some(c=>c.startsWith('generic:')));
  calls.length=0;segment.call(self,{},offset+5);assert.deepEqual(calls,['original-stands','original-gate','gate-stands']);
  calls.length=0;segment.call(self,{},offset+7);assert.deepEqual(calls,['komeldikka']);
 }
});

test('gate grandstands contain eight supported seating tiers on each side and keep the route clear',()=>{
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addGateGrandstands')!;
 const build=new Function('return '+fn.getText(source))();const boxes:number[][]=[],crowds:any[]=[];
 build({}, {box:(_g:any,...args:number[])=>boxes.push(args),cylinder(){},crowd:(_g:any,seats:any[],options:any)=>crowds.push({seats,options})});
 const tiers=boxes.filter(b=>b[4]===.5&&b[5]===1.2);assert.equal(tiers.length,16);
 for(const b of boxes)assert.ok(b[0]+b[3]/2<=-7.39||b[0]-b[3]/2>=7.39);
 assert.ok(crowds[0].seats.length>200);assert.equal(crowds[0].options.seats,true);
});

test('Shatby restores original club facilities and Azarita restores the original library each lap',()=>{
 const declarations=source.statements.flatMap(s=>ts.isVariableStatement(s)?[...s.declarationList.declarations]:[]);
 const route=new Function('return '+declarations.find(d=>d.name.getText(source)==='Mr')!.initializer!.getText(source))();
 const lap=route.at(-1).end,calls:string[]=[];
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='renderOriginalLandmarks')!;
 const shape=()=>({rotation:{},material:{}});
 const env:any={Mr:route,Uf:lap,Yx(){},Xt:shape,Le:shape,Be:shape,ea:shape,Zx(){},Kp(){},br:new Map(),addShatbyReferenceBuilding:()=>calls.push('reference-building-left'),sC:()=>calls.push('tram'),$R:()=>calls.push('fence'),Xy:(_g:any,h:number)=>calls.push('facilities:'+h),hC:()=>calls.push('club-gate'),nC(){}};
 const render=new Function('env','with(env){return '+fn.getText(source)+'}')(env);
 const engine={light(){},palm(){},building(){},club(){calls.push('original-club')},library(){calls.push('original-library')},citadel(){calls.push('original-citadel')}};
 for(const offset of [0,lap/60]){
  calls.length=0;const shatbyStart=route[route.findIndex((r:any)=>r.id==='shatby')-1].end/60;
  for(let i=0;i<10;i++)render(engine,{},offset+shatbyStart+i,'shatby');
  assert.equal(calls.filter(c=>c==='original-club').length,1);assert.equal(calls.filter(c=>c==='club-gate').length,1);
  for(const h of [9,10,11,12,13])assert.ok(calls.includes('facilities:'+h));
  calls.length=0;const libraryStart=route[route.findIndex((r:any)=>r.id==='azareeta')-1].end/60;
  for(let i=0;i<10;i++)render(engine,{},offset+libraryStart+i,'azareeta');
  assert.deepEqual(calls,['original-library']);
  calls.length=0;const baharyStart=route[route.findIndex((r:any)=>r.id==='bahary')-1].end/60;
  for(let i=0;i<10;i++)render(engine,{},offset+baharyStart+i,'bahary');
  assert.deepEqual(calls,['original-citadel']);
 }
});

test('original stadium, gate, Shatby club and library models are preserved verbatim',()=>{
 const old=ts.createSourceFile('old.js',readFileSync('public/games/ittihadawy/assets/index-e2d85a39.js','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 for(const name of ['XC','uC','sC','hC','Xy','fC']){
  const find=(s:ts.SourceFile)=>s.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!.getText(s);
  assert.equal(find(source),find(old),name);
 }
 for(const name of ['gate','club','library','citadel']){
  const find=(s:ts.SourceFile)=>(s.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC') as ts.ClassDeclaration).members.find(m=>m.name?.getText(s)===name)!.getText(s);
  assert.equal(find(source),find(old),name);
 }
});

test('uploaded station reference is represented by arched bays, clock towers and overhead trusses',()=>{
 const station=regionScenery('misrstation',5);
 assert.equal(station.filter(s=>s.kind==='box'&&s.args[0]===16.1).length,39);
 assert.equal(station.filter(s=>s.kind==='cylinder'&&s.args[0]===14.99).length,2);
 assert.ok(station.some(s=>s.kind==='label'&&s.args[0]==='محطة مصر'));
 assert.ok(station.some(s=>s.kind==='box'&&s.args[6]===0xb5d8de&&s.args[1]>12));
});

test('Shatby reference building stands on the left with its dome clear of the runner and tram',()=>{
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addShatbyReferenceBuilding')!;
 const create=new Function('return '+fn.getText(source))();const shapes:any[]=[];
 const primitive=(kind:string)=>(_g:any,...args:any[])=>{shapes.push({kind,args});return {rotation:{}}};
 create({}, {box:primitive('box'),cylinder:primitive('cylinder'),ball:primitive('ball')});
 assert.ok(shapes.every(s=>s.args[0]<-23));
 assert.ok(shapes.some(s=>s.kind==='ball'&&s.args[1]===13.4&&s.args[3]===4.5));
 assert.ok(shapes.some(s=>s.kind==='box'&&s.args[6]===0x934e43));
});
