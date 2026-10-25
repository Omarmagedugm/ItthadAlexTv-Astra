import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
// Shared catalog contains no browser-only dependencies.
// @ts-ignore JavaScript catalog is also consumed directly by the isolated game.
import { normalizeProfile, cleanOutfit, CHARACTERS, purchaseItem } from '../../public/games/ittihadawy/lobby/catalog.js';
export async function syncGameCosmetics(input: any = {}) {
 await auth.authStateReady();const user=auth.currentUser;if(!user)throw new Error('login-required');
 const isPrimaryAdmin=['HRDB2ppkGqOfBrat2D0xThuTkRe2','RrpMWEOls8SfFDQj4CJrLnEF5dr1'].includes(user.uid)||user.email?.toLowerCase()==='megastudiodm@gmail.com';
 const localScore=Number.isFinite(Number(input?.bestScore))&&Number(input.bestScore)>=0&&Number(input.bestScore)<=2147483647?Math.floor(Number(input.bestScore)):0;
 const localCoins=Number.isFinite(Number(input?.coins))&&Number(input.coins)>=0&&Number(input.coins)<=2147483647?Math.floor(Number(input.coins)):0;
 try {
  return await runTransaction(db,async tx=>{
   const profileRef=doc(db,'users',user.uid);
   const member=await tx.get(profileRef);
   if(auth.currentUser?.uid!==user.uid)throw new Error('account-changed');
   const memberData=member.data()||{};
   const memberStats=memberData.stats||{};
   const isAdmin=isPrimaryAdmin||memberData.isAdmin===true||['admin','superadmin'].includes(memberData.role)||(Array.isArray(memberData.roles)&&memberData.roles.some((r:string)=>['admin','superadmin'].includes(r)));
   const dbScore=Math.floor(Number(memberStats.ittihadawyScore??memberData.ittihadawyScore??0));
   const bestScore=Math.max(0,dbScore,localScore);
   const statsCoins=Math.max(0,Math.floor(Number(memberStats.ittihadawyCoins??0)));
   const totalCoins=Math.max(statsCoins,localCoins);
   const savedOutfits=memberStats.ittihadawyOutfits;
   const savedSeen=memberStats.ittihadawySeen;
   let state=normalizeProfile({outfits:savedOutfits,seen:savedSeen,bestScore,totalCoins,isAdmin},bestScore);
   if(input.purchase)state=purchaseItem(state,input.purchase);
   if(input.character){if(!CHARACTERS.includes(input.character))throw new Error('invalid-character');
    const checked=cleanOutfit(input.outfit,state.unlocked);
    if(JSON.stringify(checked)!==JSON.stringify(input.outfit))throw new Error('item-locked');
    state.outfits[input.character]=checked;
   }
   if(input.seen===true)state.seen=[...state.unlocked];
   if(member.exists()&&(input.character||input.seen===true)){
    tx.update(profileRef,{
     'stats.ittihadawyOutfits':state.outfits,
     'stats.ittihadawySeen':state.seen
    });
   }
   return {...state,uid:user.uid,welcomeGiftPending:false};
  });
 } catch (err) {
  const fallback=normalizeProfile({bestScore:localScore,totalCoins:localCoins,isAdmin:isPrimaryAdmin},localScore);
  return {...fallback,uid:user.uid,welcomeGiftPending:false};
 }
}
