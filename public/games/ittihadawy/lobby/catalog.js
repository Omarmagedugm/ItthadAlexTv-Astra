export const CHARACTERS=['gamal','adel','hamido','lazo','islam'];
export const CHARACTER_STAGES={gamal:0,adel:250,hamido:750,lazo:1500,islam:3000};
export const COLORS=['#087b46','#ffffff','#171d1b','#e9c64b','#2d5792','#9e3438'];
export const REWARDS=[
 {id:'green-cap',coins:100,name:'كاب المدرج',slot:'cap'},
 {id:'sunglasses',coins:300,name:'نظارة الشمس',slot:'glasses'},
 {id:'exclusive-shirt',coins:600,name:'تيشيرت زعيم الثغر',slot:'shirt'},
 {id:'special-shorts',coins:1000,name:'شورت الفريق',slot:'shorts'},
 {id:'premium-shoes',coins:2000,name:'حذاء الأبطال',slot:'shoes'},
 {id:'ittihad-kit',coins:4000,name:'طقم الاتحاد الكامل',slot:'kit'},
 {id:'legendary-kit',coins:10000,name:'طقم أسطورة المدرج',slot:'kit'}
];
export const SLOTS=[['cap','الكاب'],['shirt','التيشيرت'],['glasses','النظارة'],['shorts','الشورت'],['shoes','الحذاء']];
export const emptyOutfit=()=>Object.fromEntries(SLOTS.map(([slot])=>[slot,{item:'default',color:COLORS[0]}]));

export function cleanOutfit(value,owned,preview=false){
 const result=emptyOutfit();
 for(const [slot] of SLOTS){const choice=value?.[slot],item=REWARDS.find(r=>r.id===choice?.item&&(r.slot===slot||r.slot==='kit'));if(choice&&(choice.item==='default'||item&&(preview||owned.includes(item.id)))&&COLORS.includes(choice.color))result[slot]={item:choice.item,color:choice.color};}
 return result;
}
export function normalizeProfile(data,coins){
 const owned=REWARDS.filter(r=>data?.unlocked?.includes(r.id)).map(r=>r.id);
 const totalCoins=Number.isSafeInteger(coins)?Math.max(0,coins):0;
 const spentCoins=Number.isSafeInteger(data?.spentCoins)?Math.max(0,data.spentCoins):0;
 return {totalCoins,spentCoins,balance:Math.max(0,totalCoins-spentCoins),characters:CHARACTERS.filter(id=>id==='gamal'||data?.characters?.includes(id)),unlocked:owned,outfits:Object.fromEntries(CHARACTERS.map(id=>[id,cleanOutfit(data?.outfits?.[id],owned)])),seen:REWARDS.filter(r=>data?.seen?.includes(r.id)&&owned.includes(r.id)).map(r=>r.id)};
}

export function purchaseItem(state,id){
 const character=id.startsWith('character:')?id.slice(10):null;
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
