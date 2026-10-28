import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recordGameScore } from '../server/recordGameScore';
const result = {score:125,distance:200,character:'adel'};
function services(score = 0) {
 const writes: any[] = []; const paths: string[] = [];
 const deps = { verifyToken: async () => ({uid:'member-1'}), getDatabase: () => ({
   doc: (path: string) => { paths.push(path); return path; },
   runTransaction: async (fn: any) => fn({get:async()=>({exists:true,data:()=>({stats:{ittihadawyScore:score}})}),update:(ref:any,patch:any)=>writes.push({ref,patch})})
 }) } as any;
 return {deps,writes,paths};
}
test('authenticated identity selects the only writable profile', async()=>{
 const f=services(); const out=await recordGameScore('token',result,f.deps);
 assert.equal(out.status,200); assert.equal(out.body.updated,true);
 assert.deepEqual(f.paths,['users/member-1']); assert.equal(f.writes[0].patch['stats.ittihadawyScore'],125);
});
test('lower scores do not overwrite records', async()=>{
 const f=services(200); const out=await recordGameScore('token',result,f.deps);
 assert.equal(out.body.updated,false); assert.equal(f.writes.length,0);
});
test('invalid scores or revoked tokens never reach persistence', async()=>{
 const f=services(); assert.equal((await recordGameScore('token',{...result,score:1.2},f.deps)).status,400);
 f.deps.verifyToken=async()=>{throw new Error('revoked')};
 assert.equal((await recordGameScore('bad',result,f.deps)).status,401); assert.equal(f.paths.length,0);
});
