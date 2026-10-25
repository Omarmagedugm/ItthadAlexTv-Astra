import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameVoiceBank } from '../public/games/ittihadawy/voice-bank.js';
function setup() {
 const sources:any[]=[];let requests=0,decodes=0;
 const context:any={currentTime:12,state:'running',resume:async()=>{},decodeAudioData:async(bytes:any)=>{decodes++;return bytes},createGain(){return {gain:{value:1,setTargetAtTime(value:number){this.value=value}},connect(){}}},createBufferSource(){const source={starts:0,stops:0,connect(){},disconnect(){},start(time:number){this.starts++;(this as any).time=time},stop(){this.stops++}};sources.push(source);return source}};
 const fetchAudio=(async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}}) as any;
 return {context,sources,bank:new GameVoiceBank(context,fetchAudio),counts:()=>({requests,decodes})};
}
test('preloaded speech reuses decoded data and starts on the game audio clock',async()=>{
 const {bank,context,sources,counts}=setup();await bank.preload(['hit']);await bank.voice('hit').play();await bank.voice('hit').play();
 assert.deepEqual(counts(),{requests:1,decodes:1});assert.equal(sources[0].stops,1);assert.equal(sources[1].time,context.currentTime);
});
test('arrest cancels a pending older line even if network responses arrive out of order',async()=>{
 const {context,sources}=setup();const resolve:any={};const bank=new GameVoiceBank(context,((url:string)=>new Promise(r=>resolve[url]=r)) as any);
 const hit=bank.voice('hit').play();bank.stopAll();const caught=bank.voice('caught').play();
 resolve.caught({ok:true,arrayBuffer:async()=>({name:'caught'})});await caught;
 resolve.hit({ok:true,arrayBuffer:async()=>({name:'hit'})});await hit;
 assert.equal(sources.length,1);assert.equal(sources[0].buffer.name,'caught');
});
test('voice volume/mute are live and pause stops the active source',async()=>{
 const {bank,sources}=setup();const voice=bank.voice('caught');await voice.play();voice.setVolume(.3);assert.equal(voice.gain.gain.value,.3);
 voice.muted=true;assert.equal(voice.gain.gain.value,0);voice.muted=false;assert.equal(voice.gain.gain.value,.3);voice.pause();assert.equal(sources[0].stops,1);assert.equal(voice.paused,true);
});
test('failed preload can retry instead of permanently silencing a clip',async()=>{
 const {context}=setup();let attempts=0;const bank=new GameVoiceBank(context,(async()=>({ok:++attempts>1,status:503,arrayBuffer:async()=>new ArrayBuffer(1)})) as any);
 await bank.preload(['caught']);await bank.voice('caught').play();assert.equal(attempts,2);
});

