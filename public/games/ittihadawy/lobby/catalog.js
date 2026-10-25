export const CHARACTERS=['gamal','adel','hamido','lazo','islam'];
export const CHARACTER_STAGES={gamal:0,adel:25000,hamido:50000,lazo:75000,islam:100000};
export const MOTORCYCLE_STAGE=1000000;
export const COLORS=['#087b46','#ffffff','#171d1b','#e9c64b','#2d5792','#9e3438'];
export const REWARDS=[
 {id:'green-cap',coins:25000,name:'كاب المدرج',slot:'cap'},
 {id:'sunglasses',coins:50000,name:'نظارة الشمس',slot:'glasses'},
 {id:'exclusive-shirt',coins:75000,name:'تيشيرت زعيم الثغر',slot:'shirt'},
 {id:'special-shorts',coins:100000,name:'شورت الفريق',slot:'shorts'},
 {id:'premium-shoes',coins:125000,name:'حذاء الأبطال',slot:'shoes'},
 {id:'ittihad-kit',coins:150000,name:'طقم الاتحاد الكامل',slot:'kit'},
 {id:'legendary-kit',coins:175000,name:'طقم أسطورة المدرج',slot:'kit'}
];
export const SLOTS=[['cap','الكاب'],['shirt','التيشيرت'],['glasses','النظارة'],['shorts','الشورت'],['shoes','الحذاء']];
export const emptyOutfit=()=>Object.fromEntries(SLOTS.map(([slot])=>[slot,{item:'default',color:COLORS[0]}]));

export function cleanOutfit(value,owned=[],preview=false){
 const result=emptyOutfit();
 for(const [slot] of SLOTS){const choice=value?.[slot],item=REWARDS.find(r=>r.id===choice?.item&&(r.slot===slot||r.slot==='kit'));if(choice&&(choice.item==='default'||item&&(preview||owned.includes(item.id)))&&COLORS.includes(choice.color))result[slot]={item:choice.item,color:choice.color};}
 return result;
}
export function normalizeProfile(data,score=0){
 const isAdmin=Boolean(data?.isAdmin);
 const rawScore=Number.isFinite(Number(data?.bestScore))?Number(data.bestScore):Number(score)||0;
 const bestScore=Math.max(0,Math.floor(rawScore));
 const hasExplicitCoins=Number.isFinite(Number(data?.totalCoins));
 const bonusCoins=hasExplicitCoins?Math.max(0,Math.floor(Number(data.totalCoins))):0;
 const totalCoins=hasExplicitCoins?bonusCoins:bestScore;
 const progress=Math.max(bestScore,totalCoins,bestScore+bonusCoins);
 const owned=isAdmin?REWARDS.map(r=>r.id):REWARDS.filter(r=>progress>=r.coins||data?.unlocked?.includes(r.id)).map(r=>r.id);
 const characters=isAdmin?[...CHARACTERS]:CHARACTERS.filter(id=>id!=='islam'&&(id==='gamal'||progress>=CHARACTER_STAGES[id]||data?.characters?.includes(id)));
 const spentCoins=Number.isSafeInteger(data?.spentCoins)?Math.max(0,data.spentCoins):0;
 return {totalCoins,bestScore,spentCoins,balance:Math.max(0,totalCoins-spentCoins),characters,unlocked:owned,outfits:Object.fromEntries(CHARACTERS.map(id=>[id,cleanOutfit(data?.outfits?.[id],owned)])),seen:REWARDS.filter(r=>data?.seen?.includes(r.id)&&owned.includes(r.id)).map(r=>r.id),...(isAdmin?{isAdmin:true}:{})};
}

export function purchaseItem(state,id){
 const character=id.startsWith('character:')?id.slice(10):null;
 if(character==='islam'&&!state?.isAdmin)throw Error('invalid-item');
 const reward=REWARDS.find(r=>r.id===id);
 const price=character?CHARACTER_STAGES[character]:reward?.coins;
 if(!Number.isSafeInteger(price)||price<=0)throw Error('invalid-item');
 const owned=character?state.characters:state.unlocked;
 if(owned.includes(character||id))return state;
 if(state.balance<price)throw Error('insufficient-coins');
 return {...state,spentCoins:state.spentCoins+price,balance:state.balance-price,
  characters:character?[...state.characters,character]:state.characters,
  unlocked:reward?[...state.unlocked,id]:state.unlocked};
}


