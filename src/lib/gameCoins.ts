import {doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase';
import {coinDelta} from './gameCoinMath';
export {coinDelta} from './gameCoinMath';
export async function startCoinRun(id:string,uid:string){
 await runTransaction(db,async tx=>{if(auth.currentUser?.uid!==uid)throw Error('account-changed');const ref=doc(db,'game_progress',uid,'runs',id),snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{coins:0,createdAt:serverTimestamp()})});
}
export async function recordRunCoins(id:string,uid:string,coins:number){
 coinDelta(0,coins);
 await runTransaction(db,async tx=>{
  if(auth.currentUser?.uid!==uid)throw Error('account-changed');
  const runRef=doc(db,'game_progress',uid,'runs',id),progressRef=doc(db,'game_progress',uid);
  const [run,progress]=await Promise.all([tx.get(runRef),tx.get(progressRef)]);if(!run.exists())throw Error('unknown-run');
  const delta=coinDelta(run.data().coins,coins);if(!delta)return;
  tx.update(runRef,{coins});tx.set(progressRef,{totalCoins:(progress.data()?.totalCoins||0)+delta,lastRun:id});
 });
}
