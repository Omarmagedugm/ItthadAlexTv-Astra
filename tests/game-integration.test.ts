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
 const Sound=new Function('window','localStorage','return ('+sound.getText(source)+')')({},store);
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
test('Adel speed voice is not overridden by a duplicate method',()=>{
 const boosts=sound.members.filter(n=>n.name?.getText(source)==='boost');
 assert.equal(boosts.length,1);assert.match(boosts[0].getText(source),/adel-boost.mp3/);
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
