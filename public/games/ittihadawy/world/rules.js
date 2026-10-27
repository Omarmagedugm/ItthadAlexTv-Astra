export const ZOMBIE_SCORE = 1000000;
export function canPlayZombie(profile) {
 return profile?.isAdmin === true || (Number.isFinite(profile?.bestScore) && profile.bestScore >= ZOMBIE_SCORE);
}
// Each existing region has a named challenge; rows keep the engine's free lane.
export const EVENTS = {
 stadium:['هتاف المدرجات','scarf'],komeldikka:['زحمة حارات كوم الدكة','tuktuk'],misrstation:['سباق الرصيف','low'],
 moharrambek:['شارع الترام الأصفر','high'],karmouz:['تكاتك كرموز','tuktuk'],bahary:['نسمة القلعة','scarf'],
 mansheya:['تحدي الميدان','ball'],mahatetraml:['عبور محطة الترام','high'],azareeta:['سباق المكتبة','scarf'],
 shatby:['تشجيع نادي الاتحاد','scarf'],hadra:['زحمة الحضرة','tuktuk'],smouha:['شوارع سموحة','motorcycle'],
 zahreya:['مراوغة الظاهرية','low'],bakous:['سوق باكوس','high'],ghabriel:['شوارع غبريال','ball'],victoria:['سباق فيكتوريا','motorcycle'],
 sidiBishr:['كورنيش سيدي بشر','scarf'],miami:['انطلاقة ميامي','motorcycle'],asafra:['تكاتك العصافرة','tuktuk'],
 mandara:['طريق المندرة','microbus'],montaza:['جولة القصر','scarf'],maamoura:['ممشى المعمورة','low'],abouqir:['ميناء الصيادين','high'],
 minabasal:['مخازن مينا البصل','low'],mex:['تحدي الفنار','scarf'],dekheila:['طريق الميناء','microbus'],agamy:['طريق العجمي','microbus'],borgelarab:['نهائي برج العرب','scarf'],
 anfoushi:['جولة الأنفوشي','scarf'],raseltin:['طريق رأس التين','low'],gomrok:['حارات الجمرك','high'],attarin:['سوق العطارين','tuktuk'],
 ibrahimiya:['زحمة الإبراهيمية','ball'],sporting:['سباق سبورتنج','motorcycle'],cleopatra:['شوارع كليوباترا','low'],sidigaber:['عبور سيدي جابر','high'],
 stanley:['سباق كوبري ستانلي','scarf'],gleem:['نسمة جليم','scarf'],sanstefano:['كورنيش سان ستيفانو','motorcycle'],louran:['شوارع لوران','low'],wardian:['طريق الورديان','microbus']
};
const SKY=[0x85cbe5,0x66bbef,0xdb907b,0x243950];
export function weatherAt(seconds) {
 const phase=(Math.max(0,seconds)/45)%4,index=Math.floor(phase),blend=phase-index;
 const rainPhase=(Math.max(0,seconds)/65)%4;
 const rain=rainPhase<1?0:rainPhase<2?rainPhase-1:rainPhase<3?1:4-rainPhase;
 return {sky:SKY[index],nextSky:SKY[(index+1)%4],blend:blend*blend*(3-2*blend),night:Math.max(0,1-Math.abs(phase-3)),rain,wind:rain*(rainPhase>=2?1:.35),label:['صباح','ظهر','غروب','ليل'][index]};
}
export function crossedPlayer(previousZ,z) { return previousZ < .9 && z >= -.8; }
export function eventComplete(event,run) { return run.coins-event.coins >= 6 && run.avoided-event.avoided >= 3; }
