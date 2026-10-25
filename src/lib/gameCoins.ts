import {doc,getDoc,runTransaction} from 'firebase/firestore';
import {auth,db} from './firebase';
import {coinDelta} from './gameCoinMath';
export {coinDelta} from './gameCoinMath';

const runBaseCoins=new Map<string,number>();
const runCreditedCoins=new Map<string,number>();

function readLocalCoins():number{
 try{return Math.max(0,Math.floor(Number(localStorage.getItem('gamal-coins'))||0))}catch{return 0}
}
function writeLocalCoins(value:number){
 try{localStorage.setItem('gamal-coins',String(Math.max(0,Math.floor(value))))}catch{}
}

export async function startCoinRun(id:string,uid:string){
 const local=readLocalCoins();
 runBaseCoins.set(id,local);
 runCreditedCoins.set(id,0);
 try{
  if(auth.currentUser?.uid!==uid)return;
  const snap=await getDoc(doc(db,'users',uid));
  if(snap.exists()){
   const dbCoins=Math.max(0,Math.floor(Number(snap.data()?.stats?.ittihadawyCoins??0)));
   const base=Math.max(local,dbCoins);
   runBaseCoins.set(id,base);
   if(base>local)writeLocalCoins(base);
  }
 }catch{}
}

export async function recordRunCoins(id:string,uid:string,coins:number){
 coinDelta(0,coins);
 const previous=runCreditedCoins.get(id)??0;
 const delta=coinDelta(previous,coins);
 if(!delta)return;
 runCreditedCoins.set(id,coins);
 const base=runBaseCoins.get(id)??Math.max(0,readLocalCoins()-coins);
 runBaseCoins.set(id,base);
 const optimisticTotal=Math.max(readLocalCoins(),base+coins);
 writeLocalCoins(optimisticTotal);
 try{
  await runTransaction(db,async tx=>{
   if(auth.currentUser?.uid!==uid)throw Error('account-changed');
   const userRef=doc(db,'users',uid);
   const snap=await tx.get(userRef);
   if(!snap.exists())return;
   const dbCoins=Math.max(0,Math.floor(Number(snap.data()?.stats?.ittihadawyCoins??0)));
   const effectiveBase=Math.max(base,dbCoins-previous);
   const nextTotal=Math.min(2147483647,Math.max(dbCoins,effectiveBase+coins,readLocalCoins()));
   if(nextTotal!==dbCoins){
    tx.update(userRef,{'stats.ittihadawyCoins':nextTotal});
   }
   writeLocalCoins(nextTotal);
  });
 }catch(err){
  runCreditedCoins.set(id,previous);
  throw err;
 }
}
