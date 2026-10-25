import {CHARACTERS,CHARACTER_STAGES,REWARDS,SLOTS,COLORS,emptyOutfit,cleanOutfit,normalizeProfile} from './catalog.js';
import {applyOutfit} from './model.js';
let serial=0;
function request(type,input){return new Promise((resolve,reject)=>{
 const id='lobby-'+Date.now()+'-'+(++serial);let timer;
 const response=e=>{if(e.detail?.id!==id)return;clearTimeout(timer);window.removeEventListener('ittihadawy:lobby-response',response);e.detail.error?reject(new Error('sync-failed')):resolve(e.detail)};
 window.addEventListener('ittihadawy:lobby-response',response);timer=setTimeout(()=>{window.removeEventListener('ittihadawy:lobby-response',response);reject(new Error('timeout'))},12000);
 window.dispatchEvent(new CustomEvent('ittihadawy:lobby-request',{detail:{type,id,input}}));
})}
export function createLobby(React,api){
 const e=React.createElement;
 return function Lobby({engine,characters,selected,onSelect,onStart,onAudio,onQuality,quality}){
 const localBest=Math.max(0,Math.floor(Number(engine?.best?.score||0)));
 let localCoins=0;try{localCoins=Math.max(0,Math.floor(Number(localStorage.getItem('gamal-coins'))||0))}catch{}
 const [tab,setTab]=React.useState('home'),[slot,setSlot]=React.useState('cap'),[profile,setProfile]=React.useState(()=>normalizeProfile({bestScore:localBest,totalCoins:localCoins},localBest)),[drafts,setDrafts]=React.useState({}),[message,setMessage]=React.useState(''),[busy,setBusy]=React.useState(false),[starting,setStarting]=React.useState(false),[gifts,setGifts]=React.useState([]),[leaders,setLeaders]=React.useState([]),[yaw,setYaw]=React.useState(0);
 const active=React.useRef(true),timer=React.useRef();
 const bestScore=Math.max(localBest,profile?.bestScore||0);
 const coinBalance=Math.max(localCoins,profile?.balance??profile?.totalCoins??0);
 const progress=Math.max(bestScore,coinBalance,bestScore+coinBalance);
 const unlockedChars=CHARACTERS.filter(id=>id==='gamal'||progress>=CHARACTER_STAGES[id]||profile?.characters?.includes(id));
 const unlockedItems=REWARDS.filter(r=>progress>=r.coins||profile?.unlocked?.includes(r.id)).map(r=>r.id);
 const outfit=drafts[selected]||profile?.outfits?.[selected]||emptyOutfit();
 const sync=async()=>{setBusy(true);try{const data=await request('ittihadawy:cosmetics',{bestScore:localBest,coins:localCoins});if(!active.current)return;setProfile(data.profile);try{if(Number.isFinite(data.profile?.totalCoins))localStorage.setItem('gamal-coins',String(data.profile.totalCoins))}catch{}window.__ittihadawyUnlockedCharacters=data.profile.characters;if(engine?.characterId&&!data.profile.characters.includes(engine.characterId))onSelect('gamal');setMessage('');setGifts(data.profile.unlocked.filter(id=>!data.profile.seen.includes(id)))}catch{if(active.current){const fallback=normalizeProfile({bestScore:localBest,totalCoins:localCoins},localBest);setProfile(fallback);window.__ittihadawyUnlockedCharacters=fallback.characters}}finally{if(active.current)setBusy(false)}};
 React.useEffect(()=>{active.current=true;sync();return()=>{active.current=false;clearTimeout(timer.current);if(engine){engine.lobbyYaw=0;for(const player of engine.players.values()){const saved=engine.lobbyProfile?.outfits?.[player.userData.characterId]||emptyOutfit();applyOutfit(player,saved,api)}}}},[]);
 React.useEffect(()=>{const refresh=()=>sync();window.addEventListener('ittihadawy:lobby-coin-saved',refresh);return()=>window.removeEventListener('ittihadawy:lobby-coin-saved',refresh)},[]);
 React.useEffect(()=>{if(engine){window.__ittihadawyUnlockedCharacters=unlockedChars;engine.lobbyProfile=profile;applyOutfit(engine.player,outfit,api)}},[engine,profile,selected,progress,JSON.stringify(outfit)]);
 React.useEffect(()=>{if(engine)engine.lobbyYaw=yaw},[yaw,engine]);
 const save=async()=>{if(busy)return;const checked=cleanOutfit(outfit,unlockedItems);if(JSON.stringify(checked)!==JSON.stringify(outfit)){const lockedItem=REWARDS.find(r=>r.id===outfit[slot].item);setMessage('دي معاينة فقط! اوصل لـ '+(lockedItem?.coins||25000).toLocaleString('ar-EG')+' نقطة عشان تفتح القطعة وتحفظها.');return}
 setBusy(true);try{const data=await request('ittihadawy:cosmetics',{character:selected,outfit:checked,bestScore,coins:coinBalance});if(active.current){setProfile(data.profile);setDrafts(v=>{const next={...v};delete next[selected];return next});setMessage('اتحفظ الشكل على حسابك ✓')}}catch{if(active.current)setMessage('الشكل لم يُحفظ. حاول مرة أخرى.')}finally{if(active.current)setBusy(false)}};
 const choose=(item,color)=>setDrafts(v=>{const chosen={item,color:color||outfit[slot].color};return {...v,[selected]:REWARDS.some(r=>r.id===item&&r.slot==='kit')?Object.fromEntries(SLOTS.map(([key])=>[key,{...chosen}])):{...outfit,[slot]:chosen}}});
 const start=()=>{if(starting)return;setStarting(true);if(engine){for(const player of engine.players.values())applyOutfit(player,profile?.outfits?.[player.userData.characterId]||emptyOutfit(),api);engine.player.userData.leftArmPivot.rotation.x=-1.8}
 timer.current=setTimeout(()=>{if(active.current)onStart()},350)};
 const button=(label,click,props={})=>e('button',{type:'button',onClick:click,...props},label);
 const navigation=[['home','◀','ابدأ اللعب'],['wardrobe','◈','المتجر'],['leaders','♜','المتصدرين'],['settings','⚙','الإعدادات']];
 const open=async key=>{setTab(key);setMessage('');if(key==='leaders'){setLeaders([]);try{const data=await request('ittihadawy:get-leaderboard');if(active.current)setLeaders(data.items||[])}catch{if(active.current)setMessage('تعذّر تحميل الترتيب. أعد المحاولة.')}}};
 const selectedInfo=characters.find(c=>c.id===selected);
 const nextMilestone=[25000,50000,75000,100000,125000,150000,175000].find(m=>progress<m);
 return e('section',{className:'itt-lobby '+(starting?'launching':''),dir:'rtl','aria-label':'قائمة اتحاداوي'},
  e('div',{className:'lobby-top'},e('div',null,e('small',null,'ITTIHADAWY • ليلة ماتش'),e('h1',null,'اتحاداوي')),e('div',{className:'lobby-record'},e('small',null,'أعلى سكور: '+bestScore.toLocaleString('ar-EG')+' نقطة'),e('strong',null,'🪙 '+coinBalance.toLocaleString('ar-EG')+' كوين'),e('span',null,nextMilestone?'الهدف الجاي: '+nextMilestone.toLocaleString('ar-EG')+' نقطة':'فتحت كل الجوائز والشخصيات ★'))),
  e('div',{className:'lobby-stage','aria-label':'استعراض الشخصية ثلاثية الأبعاد'},e('div',{className:'lobby-name'},e('small',null,'نجم المدرج'),e('h2',null,selectedInfo?.name),e('span',null,selectedInfo?.ability)),e('label',{className:'lobby-rotate'},'تدوير الشخصية',e('input',{type:'range',min:-3.14,max:3.14,step:.02,value:yaw,onChange:event=>setYaw(Number(event.target.value)),'aria-label':'تدوير الشخصية'}))),
  e('div',{className:'lobby-bottom'},e('nav',{'aria-label':'قائمة اللعبة'},navigation.map(([key,icon,label])=>button(e(React.Fragment,null,e('span',null,icon),e('small',null,label)),()=>open(key),{key,'aria-current':tab===key?'page':undefined}))),
  tab==='home'?e('div',{className:'lobby-home'},e('div',{className:'lobby-front-characters','aria-label':'اختيار الشخصية'},e('div',{className:'lobby-characters'},characters.map(c=>{const isUnlocked=c.id==='gamal'||unlockedChars.includes(c.id);return button(e(React.Fragment,null,e('strong',null,c.name),e('small',null,isUnlocked?c.ability:'🔒 '+CHARACTER_STAGES[c.id].toLocaleString('ar-EG')+' نقطة')),()=>{if(!isUnlocked){setMessage('تحدي جديد: اوصل لـ '+CHARACTER_STAGES[c.id].toLocaleString('ar-EG')+' نقطة عشان تفتح '+c.name+'!');return}setMessage('');onSelect(c.id);setYaw(0)},{key:c.id,'aria-pressed':selected===c.id})}))),e('p',null,message||'من قلب المدرج… كل إسكندرية وراك'),button(starting?'جاهز يا زعيم…':'ابدأ اللعب',start,{className:'lobby-start',disabled:starting}),e('small',null,'كل ٢٥,٠٠٠ نقطة بتفتح شخصية جديدة وهدية في المتجر!')):
  e('section',{className:'lobby-panel','aria-label':navigation.find(n=>n[0]===tab)?.[2]},
   e('div',{className:'lobby-panel-title'},e('h2',null,navigation.find(n=>n[0]===tab)?.[2]),button('✕',()=>setTab('home'),{'aria-label':'إغلاق القائمة'})),
   tab==='wardrobe'&&e(React.Fragment,null,e('div',{className:'lobby-tabs'},SLOTS.map(([id,label])=>button(label,()=>setSlot(id),{key:id,'aria-pressed':slot===id}))),
    e('div',{className:'lobby-items'},[{id:'default',name:'الشكل الأصلي',coins:0},...REWARDS.filter(r=>r.slot===slot||r.slot==='kit')].map(item=>button(e(React.Fragment,null,e('strong',null,item.name),e('small',null,item.id==='default'||unlockedItems.includes(item.id)?'متاح':'🔒 '+item.coins.toLocaleString('ar-EG')+' نقطة • معاينة')),()=>choose(item.id),{key:item.id,'aria-pressed':outfit[slot].item===item.id}))),
    e('div',{className:'lobby-colors'},COLORS.map(color=>button('',()=>choose(outfit[slot].item,color),{key:color,style:{background:color},'aria-label':'لون '+color,'aria-pressed':outfit[slot].color===color}))),
    e('div',{className:'lobby-actions'},button('حفظ الشكل',save,{disabled:busy}),button('إعادة تعيين',()=>setDrafts(v=>({...v,[selected]:emptyOutfit()}))))),
   tab==='leaders'&&e('ol',{className:'lobby-leaders'},leaders.map(row=>e('li',{key:row.id},e('span',null,row.rank+' · '+row.name),e('strong',null,row.score.toLocaleString('ar-EG'))))),
   tab==='settings'&&e('div',{className:'lobby-actions'},button('الصوت والموسيقى',onAudio),button('جودة الرسومات: '+(quality==='high'?'عالية':'اقتصادية'),onQuality))),
   e('div',{className:'lobby-status',role:'status'},message,busy&&' جارٍ مزامنة الحساب…')),
  gifts.length>0&&e('div',{className:'lobby-gift',role:'dialog','aria-modal':true,'aria-label':'مكافأة جديدة'},e('div',{className:'gift-box'},'🎁'),e('h2',null,'مبروك! فتحت مكافأة جديدة'),e('p',null,gifts.map(id=>REWARDS.find(r=>r.id===id)?.name).filter(Boolean).join(' • ')),button('تمام يا زعيم',async()=>{setBusy(true);try{const data=await request('ittihadawy:cosmetics',{seen:true,bestScore});if(active.current){setProfile(data.profile);setGifts([])}}catch{setGifts([])}finally{if(active.current)setBusy(false)}},{disabled:busy})))
 };
}


