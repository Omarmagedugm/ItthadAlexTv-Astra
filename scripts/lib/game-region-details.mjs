// Code-native scenery uses the game's shared geometry and material batching.
export function plantVillaTrees(group, { cylinder, ball }) {
  for (const x of [-8.5, 8.5]) {
    cylinder(group,x,1.7,-4,.18,.25,3.4,0x775238,8);
    ball(group,x,4,-4,1.5,0x397347,1,1.2,1);
    ball(group,x-.65,3.5,-3.5,1,0x508743);
  }
}

export function addRegionDetails(group, region, index, { box, cylinder, ball, label }) {
  const zoneOffset=((index%10)+10)%10;
  if(region.id==='misrstation') {
    // Rooftop corridor: train roofs cover every playable lane; rails/platforms remain scenery.
      for(const x of [-4.2,0,4.2]) {
        box(group,x,-1.05,0,4.25,2.1,58,0x28414b);
        box(group,x,.08,0,4.2,.25,57,0x66757a);
        for(const z of [-24,-12,0,12,24]) {
          box(group,x,.25,z,1.35,.14,2.4,0xb7bdba);
          box(group,x,.34,z,1.08,.06,2.05,0x68777b);
        }
        for(const side of [-1,1]) {
          box(group,x+side*1.92,-.15,0,.12,.45,57,0xe0b238);
          for(const z of [-20,-8,4,16,28]) cylinder(group,x+side*1.5,-1.9,z,.16,.16,.2,0x24292b,10);
        }
      }
      for(const x of [-8.5,8.5]) {
        box(group,x,-2.3,0,.25,.25,60,0x41474a);
        box(group,x+Math.sign(x)*.45,-2.45,0,.22,.18,60,0x9ca3a1);
        box(group,x*1.55,-.05,0,3,.5,60,0x938f82);
        for(const z of [-22,0,22]) box(group,x*1.55,2.1,z,2.8,4.2,.35,0xe0d6c2);
      }
  }
  if(region.id==='montaza'&&zoneOffset===5) {
    // Prominent palace and garden wing on the right; the route keeps sea to the left.
    box(group,25,5,-5,22,10,18,0xd7bc8f);
    box(group,25,10,-5,24,1,20,0x914e36);
    for(const x of [18,22,26,30,34]) {
      cylinder(group,x,7,-14,.38,.42,4,0xf0dfbd,12);
      box(group,x,6.4,-14,1.35,2.2,.3,0x536a70);
    }
    box(group,25,12,-5,10,3,7,0xe1c89a);
    for(const x of [-31,-25,-19,-13,13,19,25,31]) {
      cylinder(group,x,1.6,18,.25,.3,3.2,0x745238,8);
      ball(group,x,4,18,1.25,0x326e42,1,1.2,1);
    }
    if(zoneOffset===5)label(group,'قصر المنتزه',25,13,-5,12,1.5,'#80543d','#fff3dc');
    // Historic bridge and lighthouse are positioned along the left waterfront.
    box(group,-35,1,13,12,.5,2,0xe9dfc9);
    for(const x of [-40,-36,-32,-28]) cylinder(group,x,2.1,13,.22,.22,2.2,0xc9bba3,10);
    cylinder(group,-45,7,1,1.5,1.7,1.5,0xf3eee3,16);
    for(let band=0;band<6;band++)cylinder(group,-45,2+band*1.6,1,1.1-band*.035,1.2-band*.035,1.5,band%2?0xd24b3d:0xf4ead8,16);
  }
  if(region.id==='bahary'&&zoneOffset===5) {
    box(group,26,4,-4,19,8,17,0xb9a27d);
    for(const x of [18,23,28,33])box(group,x,9,-4,1.4,2,.8,0x8e4235);
    label(group,'قلعة قايتباي',26,9,-4,12,1.4,'#6d4c36','#fff4df');
  }
  if(region.id==='mansheya'&&zoneOffset===5) {
    box(group,25,4,-4,19,8,17,0xc5b79f);
    for(const x of [18,22,26,30,34])cylinder(group,x,5,-13,.5,.55,7,0xe0d6c5,12);
    box(group,25,9,-4,21,1,18,0x665a50);
    label(group,'ميدان المنشية',25,10,-4,12,1.2,'#4f493f','#fff7e8');
  }
  if(region.id==='mahatetraml'&&zoneOffset===5) {
    cylinder(group,24,2,-4,.35,.4,4,0x665a46,12);
    cylinder(group,24,4.4,-4,1,1.25,.55,0x9d895f,16);
    box(group,24,5,-4,.8,1.7,.7,0x5e594d);
    box(group,21,7,-4,9,.35,2,0x9b8057);
    for(const x of [17,29])box(group,x,4,-4,.45,8,.45,0x79694f);
    label(group,'محطة الرمل',24,8,-4,9,1.1,'#0757a2','#ffffff');
    // Raml's blue tram waits beside the historic station, outside all runner lanes.
    box(group,-14,1.05,-2,2.8,1.9,8,0x24658d);
    box(group,-14,2.08,-2,2.9,.22,8,0xe8e2cf);
    for(const x of [-14.8,-13.2])for(const z of [-5,1])cylinder(group,x,.35,z,.32,.32,.22,0x25282b,12).rotation.z=Math.PI/2;
    for(const z of [-4,0])box(group,-12.55,1.48,z,.12,.8,.9,0xa9cbd2);
  }
  if(['moharrambek','karmouz'].includes(region.id)&&zoneOffset===5) {
    // Yellow Alexandria tram, with a carriage, windows and visible wheels.
    box(group,-14,1.05,-2,2.8,1.9,8,0xe4b52d);
    box(group,-14,2.08,-2,2.9,.22,8,0x29333a);
    for(const x of [-14.8,-13.2])for(const z of [-5,1])cylinder(group,x,.35,z,.32,.32,.22,0x25282b,12).rotation.z=Math.PI/2;
    for(const z of [-4.7,-2.7,-.7,1.3])box(group,-12.55,1.48,z,.12,.8,1,0x9ec4c9);
    label(group,'ترام الإسكندرية',-14,2.8,-2,8,.9,'#ad8420','#ffffff');
  }
  if(region.id==='shatby'&&zoneOffset===5) {
    box(group,27,5,-5,18,10,18,0xa8473e);
    for(const x of [20,25,30,35]) {
      box(group,x,5,-14,1.5,8,.35,0xf0dfc9);
      box(group,x,5,4,1.5,8,.35,0xf0dfc9);
    }
    label(group,'سان مارك',27,11,-5,10,1.2,'#8c3430','#fff4e6');
  }
  if(region.id==='azareeta'&&zoneOffset===5) {
    // Bibliotheca's distinctive tilted-disc silhouette beside the corniche.
    box(group,27,3.1,-4,19,6.2,15,0xd8d1c4);
    const disc=cylinder(group,27,8.4,-4,8.3,8.3,2.4,0x9ba8aa,32);
    disc.rotation.z=-.16;
    box(group,27,3.5,4,18,.35,1.3,0x315966);
    label(group,'مكتبة الإسكندرية',27,12,-4,15,1.45,'#315966','#ffffff');
  }
  if(region.id==='smouha'&&zoneOffset===5) {
    // Inland club branch and sports courts; no coastal assets are used here.
    box(group,26,.15,-5,23,.3,19,0x3f8b52);
    for(const x of [20,32])box(group,x,1.8,-5,.35,3.2,18,0xf3edda);
    for(const z of [-14,4])box(group,26,1.8,z,12,.35,.35,0xf3edda);
    box(group,26,4,-17,20,8,9,0xd7d2c4);
    for(const x of [19,24,29,34])box(group,x,4,-21,1.1,4,.25,0x46708a);
    label(group,'نادي الاتحاد • فرع سموحة',26,8,-17,18,1.3,'#075c42','#ffffff');
  }
  if(region.id==='asafra'&&zoneOffset===5) {
    // Red-brick and unfinished homes give Asafra a distinct local skyline.
    for(const [x,z] of [[24,-11],[31,11]]) {
      box(group,x,4,z,12,8,13,0x9d4936);
      for(const y of [1.2,3.5,5.8])for(const wx of [-3.6,0,3.6])box(group,x+wx,y,z-6.7,.18,1.45,.15,0xe1c6a5);
    }
    for(const x of [22,27,32,37])cylinder(group,x,6,18,.12,.15,12,0xa85840,8);
    for(const z of [13,19])box(group,29,12,z,15,.16,.16,0xa85840);
    label(group,'العصافرة',29,13,18,9,1.1,'#863d2e','#fff2db');
  }
  if(region.id==='sidiBishr'&&zoneOffset===5) {
    box(group,25,3,-4,17,6,15,0xe7deca);
    for(const x of [18,32])cylinder(group,x,9,-4,.8,.9,13,0xece3d1,16);
    cylinder(group,25,9,-4,1.4,1.5,14,0xece3d1,16);
    for(const x of [18,32])cylinder(group,x,17,-4,.55,.65,4,0x59826b,12);
    label(group,'مسجد سيدي بشر',25,18,-4,14,1.3,'#51745d','#ffffff');
  }
  if(region.id==='maamoura'&&zoneOffset===5) {
    // Low-rise holiday villas and garden hedges keep the resort skyline short.
    for(const [x,z] of [[22,-13],[31,10]]) {
      box(group,x,2.4,z,11,4.8,10,0xf0e3c5);
      box(group,x,5,z,12,.6,11,0xa66343);
      for(const wx of [-3,0,3])box(group,x+wx,2.8,z-5.1,1.3,2,.15,0x7799a0);
      box(group,x,5.45,z+5.2,2,.2,.4,0xd0b995);
    }
    for(const x of [17,24,31,38]){cylinder(group,x,1.5,23,.2,.25,3,0x765239,8);ball(group,x,3.8,23,1.2,0x3c7947,1,1.2,1)}
  }
  if(region.id==='minabasal'&&zoneOffset===5) {
    // Mina El Basal warehouses and cargo hoists, with an inland industrial road.
    for(const x of [-27,27]) {
      box(group,x,6,0,20,12,54,0x8b8174);
      box(group,x,12.2,0,21,.5,55,0x514d49);
      for(const z of [-19,0,19]) {
        box(group,x,2.8,z,7,5.6,6,0x71685d);
        box(group,x,2.8,z-3.1,3,4,.16,0xb38a55);
      }
      cylinder(group,x+Math.sign(x)*12,6,-8,.22,.25,12,0x76623f,8);
      box(group,x+Math.sign(x)*6,12,-8,12,.35,.5,0x76623f);
    }
    label(group,'مينا البصل • المخازن',-27,14,-22,14,1.2,'#5b5146','#f6e7c8');
  }
  if(region.id==='borgelarab'&&zoneOffset===5) {
    box(group,27,7,-5,26,14,38,0xc5c2b8);
    box(group,27,15,-5,28,1,40,0x59616a);
    for(const x of [17,21,25,29,33,37]) {
      box(group,x,9,-25,1.4,9,.25,0x59616a);
      box(group,x,9,15,1.4,9,.25,0x59616a);
    }
    box(group,27,3,18,18,6,3,0x9a9b98);
    label(group,'استاد برج العرب',27,17,-5,15,1.5,'#40515c','#ffffff');
  }
  if (region.id === 'dekheila' && zoneOffset===5) {
    // Port cranes, warehouses and container stacks; keep the playable road dry.
    for(const side of [-1,1]) {
      const x=side*25;
      box(group,x,7,0,24,14,54,0x77766f);
      box(group,x,14,0,25,.8,55,0x494d4e);
      for(const z of [-21,-7,7,21]) {
        box(group,x-side*8,1.2,z,7,2.4,10,[0xb7523d,0x366580,0xd3a63a,0x728047][Math.abs(z/7)%4]);
        box(group,x-side*8,3.7,z,7,2.4,10,[0x366580,0xd3a63a,0x728047,0xb7523d][Math.abs(z/7)%4]);
        for(const seam of [-2.5,-.8,.8,2.5])box(group,x-side*8+seam,2.5,z,.06,4.6,10.05,0xd5c5a5);
      }
      for(const z of [-18,18]) {
        cylinder(group,x+side*9,7,z,.24,.28,14,0xe8ad35,8);
        box(group,x+side*4,14,z,12,.45,.6,0xe8ad35);
        box(group,x+side*9,7.8,z,1.3,11,.7,0xe8ad35);
      }
    }
    label(group,'ميناء الدخيلة',-25,16,-24,12,1.5,'#34484a','#fff3dc');
  }
  if (region.id === 'wardian') {
    for (const [x,z] of [[-28,-14],[-34,15]]) {
      for(let band=0;band<8;band++) cylinder(group,x,1+band*2,z,.65,.72,2,band%2?0xdcd9cf:0x934b3a,12);
      cylinder(group,x,16.15,z,.82,.82,.3,0x45494b,12);
      for(let puff=0;puff<3;puff++) ball(group,x-puff*.6,18+puff*2,z,1.1+puff*.25,0xa1a6a5,1,.8,1);
    }
  }
  if (region.id === 'hadra') {
    for(const x of [-17.5,-14.5,-11.5,-8.5]) for(const z of [-24,-12,0,12,24]) {
      box(group,x,.55,z,2.1,1.1,3.2,0x896744);
      box(group,x,2.7,z,2.5,.18,3.8,((x+z)*2)%3?0x3c8653:0xd6ba74);
      for(const corner of [-1,1]) cylinder(group,x+corner,1.35,z-1.4,.035,.035,2.7,0x654e39,6);
      for(let tray=0;tray<3;tray++) {
        box(group,x,1.15,z-1+tray,1.9,.2,.85,0xb98f50);
        for(const offset of [-.55,0,.55]) ball(group,x+offset,1.4,z-1+tray,.23,[0xc34833,0x65a447,0xdfb83b][tray],1,.85,1);
      }
    }
  }
  if (region.id === 'hadra' && index%2===0) {
    // Parked three-wheel taxis on the right, outside all runner lanes.
    for(const z of [-14,16]) {
      const x=7.2;
      box(group,x,.85,z,1.7,1.1,2.7,0xe8b72e);
      box(group,x,1.9,z+.3,1.8,.18,2.2,0x242629);
      box(group,x,1.35,z-1.12,1.45,.65,.12,0x709caa);
      for(const dx of [-.7,.7]) cylinder(group,x+dx,1.45,z+.9,.055,.055,1.1,0x27282a,6);
      for(const [dx,dz] of [[0,-1.2],[-.85,.85],[.85,.85]]) {
        const wheel=cylinder(group,x+dx,.35,z+dz,.34,.34,.22,0x202327,12);
        wheel.rotation.z=Math.PI/2;
      }
      for(const dx of [-.55,.55]) ball(group,x+dx,.95,z-1.38,.13,0xffedb1);
    }
  }
  if (region.id === 'komeldikka' && index%3===0) {
    // Foul cart and street cafe, spaced apart along the pavement.
    box(group,6.8,.85,-10,1.8,1.4,2.6,0xc24736);
    box(group,6.8,1.62,-10,2,.15,2.8,0xc5c7b9);
    cylinder(group,6.8,2,-10,.45,.6,.8,0xb9995e,16);
    cylinder(group,6.8,2.45,-10,.23,.3,.2,0xd0b379,12);
    box(group,6.8,3,-10,2.6,.18,3.2,0x5f8c48);
    for(const z of [-11, -9]) cylinder(group,7.6,2.2,z,.05,.05,1.5,0x6a5036,6);
    for(const z of [-11,-9]) {const wheel=cylinder(group,6.8,.35,z,.35,.35,2,0x282b2b,12);wheel.rotation.z=Math.PI/2;}
    label(group,'فول وطعمية',6.8,2.85,-11.65,2.5,.55,'#8d3029','#fff5d4');
    box(group,-7.3,2.9,12,3.5,.22,8,0x326f50);
    label(group,'قهوة كوم الدكة',-7.3,2.5,8,3.4,.65,'#24543d','#fff2c9');
    for(const z of [10,14]) {
      cylinder(group,-7.3,.65,z,.08,.1,1.3,0x60432d,8);
      cylinder(group,-7.3,1.3,z,.7,.7,.12,0xa17a48,16);
      for(const dx of [-1.1,1.1]) {
        box(group,-7.3+dx,.65,z,.55,.12,.6,0x7a5031);
        box(group,-7.3+dx,1.05,z+.25,.55,.8,.1,0x7a5031);
        for(const dz of [-.2,.2]) cylinder(group,-7.3+dx,.3,z+dz,.04,.04,.6,0x67462e,6);
      }
      cylinder(group,-7.3,1.48,z,.09,.08,.2,0xe3c992,8);
    }
  }
  if (region.id === 'mex' && index%10===9) {
    box(group,-33,.3,0,12,.7,12,0x999b94);
    cylinder(group,-33,1,0,2.8,3.1,1.3,0xe7e5de,20);
    for(let band=0;band<8;band++) cylinder(group,-33,2.6+band*1.6,0,1.5-band*.065,1.56-band*.065,1.6,band%2?0x202729:0xf6f4ea,20);
    cylinder(group,-33,14.8,0,2.1,2.1,.35,0x202729,20);
    cylinder(group,-33,15.7,0,1.25,1.25,1.5,0xe4d28f,12);
    for(let rail=0;rail<8;rail++) cylinder(group,-33+Math.cos(rail*Math.PI/4)*1.6,15.5,Math.sin(rail*Math.PI/4)*1.6,.05,.05,1.4,0x202729,6);
    cylinder(group,-33,16.7,0,0,2.1,1,0x202729,20);
    ball(group,-33,15.8,0,.45,0xffe8a1);
  }
}

export function enrichGameRegions(code) {
  const swap=(from,to)=>{
    if(code.split(from).length!==2)throw new Error('Missing unique region target: '+from.slice(0,70));
    code=code.replace(from,to);
  };
  swap('function ZR(r,t,n,{box:a,cylinder:o,label:c,ball:u}){',plantVillaTrees.toString()+'\n'+addRegionDetails.toString()+'\nfunction ZR(r,t,n,{box:a,cylinder:o,label:c,ball:u}){addRegionDetails(r,t,n,{box:a,cylinder:o,label:c,ball:u});');
  const route=[
    ['stadium','استاد الإسكندرية','stadium',false],
    ['komeldikka','كوم الدكة','market',false],
    ['misrstation','محطة مصر','station',false],
    ['moharrambek','محرم بك','historic',false],
    ['karmouz','كرموز','market',false],
    ['bahary','بحري','harbor',true],
    ['mansheya','المنشية','historic',true],
    ['mahatetraml','محطة الرمل','historic',true],
    ['azareeta','الأزاريطة','urban',true],
    ['shatby','الشاطبي','urban',true],
    ['hadra','الحضرة','market',false],
    ['smouha','سموحة','modern',false],
    ['zahreya','الظاهرية','urban',false],
    ['bakous','باكوس','market',false],
    ['ghabriel','غبريال','urban',false],
    ['victoria','فيكتوريا','urban',false],
    ['sidiBishr','سيدي بشر','beach',true],
    ['miami','ميامي','beach',true],
    ['asafra','العصافرة','market',true],
    ['mandara','المندرة','beach',true],
    ['montaza','المنتزه','gardens',true],
    ['maamoura','المعمورة','gardens',true],
    ['abouqir','أبو قير','harbor',true],
    ['minabasal','مينا البصل','industrial',false],
    ['mex','المكس','harbor',true],
    ['dekheila','الدخيلة','industrial',false],
    ['agamy','العجمي','beach',true],
    ['borgelarab','برج العرب','stadium',false]
  ];
  let distance=300;
  const routeLiteral='['+route.map(([id,name,theme,sea],index)=>{
    if(index>0)distance+=600;
    return `{id:${JSON.stringify(id)},name:${JSON.stringify(name)},theme:${JSON.stringify(theme)},end:${distance},sea:${sea}}`;
  }).join(',')+']';
  swap('const Mr=[{id:"stadium",name:"استاد إسكندرية",end:300},{id:"gate",name:"بوابة الاستاد",end:420},{id:"komeldikka",name:"كوم الدكة • الحارة",end:840},{id:"shatby",name:"الشاطبي • نادي الاتحاد",end:1260},{id:"corniche",name:"المكتبة • الكورنيش",end:1620},{id:"stanley",name:"كوبري ستانلي",end:2040},{id:"gleem",name:"جليم • على البحر",end:2460},{id:"sanstefano",name:"سان ستيفانو",end:2880},{id:"montaza",name:"حدائق المنتزه",end:3480},{id:"memorial",name:"ساحة النصب التذكاري",end:3600},{id:"citadel",name:"جولة بحري • قايتباي",end:4020},..._0]',`const Mr=${routeLiteral}`);
  swap('n(m,5,.2,-7,3,.15,2,5618115)', 'plantVillaTrees(m,{cylinder:a,ball:c}),n(m,5,.2,-7,3,.15,2,5618115)');
  swap('sea:["harbor","beach"].includes(n)', 'sea:["harbor","beach"].includes(n)||r==="dekheila"');
  swap('a(h,-42,-.25,0,30,.12,60,13219985)', 'a(h,t.id==="dekheila"?-29:-42,-.25,0,t.id==="dekheila"?14:30,.12,60,t.id==="dekheila"?0x919b9d:13219985)');
  swap('p.id!=="agamy"&&Zx', '!["agamy","dekheila"].includes(p.id)&&Zx');
  swap('at.createElement("div",{className:"mini-route","aria-label":"تقدم الرحلة"},at.createElement("svg"', 'at.createElement("div",{className:"mini-route","aria-label":"تقدم الرحلة"},at.createElement("strong",{className:"current-region",title:z.current.name},z.current.name),at.createElement("svg"');
  return code;
}
