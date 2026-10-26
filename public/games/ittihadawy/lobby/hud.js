const REGION_EN={stadium:'Alexandria Stadium',komeldikka:'Kom El Dikka',misrstation:'Misr Station',moharrambek:'Moharram Bek',karmouz:'Karmouz',anfoushi:'Anfoushi',raseltin:'Ras El Tin',gomrok:'El Gomrok',bahary:'Bahary',mansheya:'Mansheya',attarin:'Attarin',mahatetraml:'Raml Station',azareeta:'Azarita',shatby:'Shatby',ibrahimiya:'Ibrahimiya',sporting:'Sporting',cleopatra:'Cleopatra',sidigaber:'Sidi Gaber',stanley:'Stanley Bridge',gleem:'Gleem',sanstefano:'San Stefano',louran:'Louran',hadra:'Hadra',smouha:'Smouha',zahreya:'Zahreya',bakous:'Bakous',ghabriel:'Ghabrial',victoria:'Victoria',sidiBishr:'Sidi Bishr',miami:'Miami',asafra:'Asafra',mandara:'Mandara',montaza:'Montaza',maamoura:'Maamoura',abouqir:'Abu Qir',minabasal:'Mina El Basal',wardian:'Wardian',mex:'El Max',dekheila:'Dekheila',agamy:'Agamy',borgelarab:'Borg El Arab'};
export function regionBanner(React,region){
 const e=React.createElement;
 return e('section',{className:'current-region',dir:'rtl','aria-label':'المنطقة الحالية'},
  e('small',{className:'region-caption'},'المنطقة الحالية'),
  e('strong',{className:'region-ar'},region.current.name),
  e('span',{className:'region-en',dir:'ltr'},REGION_EN[region.current.id]||region.current.name),
  e('div',{className:'region-distance'},e('span',null,'للمنطقة التالية'),e('b',{dir:'ltr'},(Math.max(0,region.remaining)/1000).toFixed(1)+' km')));
}
export function speedDisplay(React,speed,motorcycle){
 const e=React.createElement,value=Math.max(0,Math.round((Number(speed)||0)*3.6));
 if(!motorcycle)return e('div',{className:'velocity'},e('b',null,value),e('small',null,'كم/س'));
 return e('div',{className:'velocity motorcycle-speed','aria-label':'سرعة الموتوسيكل '+value+' كم/س'},
  e('span',{className:'speed-dial','aria-hidden':true},e('i',{style:{transform:'rotate('+(-120+Math.min(value/360,1)*240)+'deg)'}})),
  e('small',{className:'speed-mode'},'الموتوسيكل'),e('b',null,value),e('small',null,'كم/س'));
}
