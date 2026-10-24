import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recordGameScore } from '../server/recordGameScore';
const config={apiKey:'public-key',projectId:'game',firestoreDatabaseId:'custom'};
const result={score:125,distance:200,character:'adel'};
function fakeFetch(initial=-1){
 let score=initial, update=0, conflict=false;const calls:string[]=[];
 const fetch=async(input:any,init:any={})=>{
  const url=String(input);calls.push(url);
  if(url.includes('accounts:lookup'))return new Response(JSON.stringify({users:[{localId:'member-1'}]}),{status:200});
  if(init.method==='PATCH'){
   if(conflict){conflict=false;score=130;return new Response('',{status:409})}
   const body=JSON.parse(init.body);score=Number(body.fields.stats.mapValue.fields.ittihadawyScore.integerValue);update++;return new Response('{}',{status:200});
  }
  return new Response(JSON.stringify({updateTime:'2026-10-23T10:00:00.000000Z',fields:{stats:{mapValue:{fields:{ittihadawyScore:{integerValue:String(score)}}}}}}),{status:200});
 };
 return {fetch:fetch as typeof globalThis.fetch,calls,get score(){return score},get update(){return update},set conflict(v:boolean){conflict=v}};
}
test('server validates the member token and writes only that member’s best score',async()=>{
 const f=fakeFetch();const out=await recordGameScore('valid',result,config,f.fetch);
 assert.equal(out.status,200);assert.deepEqual(out.body,{success:true,updated:true,currentScore:125});assert.equal(f.score,125);assert.equal(f.update,1);
 assert.ok(f.calls.some(url=>url.includes('/databases/custom/documents/users/member-1')));
});
test('lower and equal scores never replace a member record',async()=>{
 const f=fakeFetch(150);const out=await recordGameScore('valid',result,config,f.fetch);
 assert.equal(out.body.updated,false);assert.equal(f.update,0);
});
test('concurrent newer scores retry after Firestore update precondition conflict',async()=>{
 const f=fakeFetch();f.conflict=true;const out=await recordGameScore('valid',result,config,f.fetch);
 assert.deepEqual(out.body,{success:true,updated:false,currentScore:130});assert.equal(f.update,0);
});
test('bad results and invalid sessions never write',async()=>{
 const f=fakeFetch();assert.equal((await recordGameScore('valid',{...result,score:1.2},config,f.fetch)).status,400);assert.equal(f.calls.length,0);
 const noAuth=async()=>new Response('{}',{status:400});assert.equal((await recordGameScore('expired',result,config,noAuth)).status,401);
});
