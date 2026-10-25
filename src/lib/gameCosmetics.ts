import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
// Shared catalog contains no browser-only dependencies.
// @ts-ignore JavaScript catalog is also consumed directly by the isolated game.
import { normalizeProfile, cleanOutfit, CHARACTERS, purchaseItem } from '../../public/games/ittihadawy/lobby/catalog.js';
export async function syncGameCosmetics(input: any = {}) {
 await auth.authStateReady();const user=auth.currentUser;if(!user)throw new Error('login-required');
 return runTransaction(db,async tx=>{
  const profileRef=doc(db,'users',user.uid),cosmeticsRef=doc(db,'game_cosmetics',user.uid);
  const [member,saved,progress]=await Promise.all([tx.get(profileRef),tx.get(cosmeticsRef),tx.get(doc(db,'game_progress',user.uid))]);
  if(auth.currentUser?.uid!==user.uid)throw new Error('account-changed');
  let state=normalizeProfile(saved.data(),progress.data()?.totalCoins||0);
  if(input.purchase)state=purchaseItem(state,input.purchase);
  if(input.character){if(!CHARACTERS.includes(input.character))throw new Error('invalid-character');
   const checked=cleanOutfit(input.outfit,state.unlocked);
   if(JSON.stringify(checked)!==JSON.stringify(input.outfit))throw new Error('item-locked');
   state.outfits[input.character]=checked;
  }
  if(input.seen===true)state.seen=[...state.unlocked];
  tx.set(cosmeticsRef,{outfits:state.outfits,unlocked:state.unlocked,seen:state.seen,characters:state.characters,spentCoins:state.spentCoins});
  return {...state,uid:user.uid};
 });
}
