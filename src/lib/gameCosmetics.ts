import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
// Shared catalog contains no browser-only dependencies.
// @ts-ignore JavaScript catalog is also consumed directly by the isolated game.
import { normalizeProfile, cleanOutfit, CHARACTERS, purchaseItem } from '../../public/games/ittihadawy/lobby/catalog.js';
export async function syncGameCosmetics(input: any = {}) {
 await auth.authStateReady();const user=auth.currentUser;if(!user)throw new Error('login-required');
 return runTransaction(db,async tx=>{
  const profileRef=doc(db,'users',user.uid),progressRef=doc(db,'game_progress',user.uid),giftRef=doc(db,'game_gifts',user.uid),cosmeticsRef=doc(db,'game_cosmetics',user.uid);
  const [member,progress,gift,saved]=await Promise.all([tx.get(profileRef),tx.get(progressRef),tx.get(giftRef),tx.get(cosmeticsRef)]);
  if(auth.currentUser?.uid!==user.uid)throw new Error('account-changed');
  const memberStats=member.data()?.stats||{};
  const dbScore=Math.floor(Number(memberStats.ittihadawyScore??member.data()?.ittihadawyScore??0));
  const localScore=Number.isFinite(Number(input?.bestScore))&&Number(input.bestScore)>=0&&Number(input.bestScore)<=2147483647?Math.floor(Number(input.bestScore)):0;
  const bestScore=Math.max(0,dbScore,localScore);
  const progressCoins=Math.max(0,Math.floor(Number(progress.data()?.totalCoins??0)));
  const statsCoins=Math.max(0,Math.floor(Number(memberStats.ittihadawyCoins??0)));
  const localCoins=Number.isFinite(Number(input?.coins))&&Number(input.coins)>=0&&Number(input.coins)<=2147483647?Math.floor(Number(input.coins)):0;
  const giftCoins=gift.exists()&&Number.isSafeInteger(gift.data()?.amount)&&gift.data().amount>0?gift.data().amount:0;
  const totalCoins=Math.max(progressCoins,statsCoins,localCoins)+giftCoins;
  const savedOutfits=memberStats.ittihadawyOutfits||saved.data()?.outfits;
  const savedSeen=memberStats.ittihadawySeen||saved.data()?.seen;
  let state=normalizeProfile({outfits:savedOutfits,seen:savedSeen,bestScore,totalCoins},bestScore);
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
}
