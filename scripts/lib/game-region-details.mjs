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
    const stationExit=typeof Uf==='number'&&Number.isFinite(region.end)
      ? Math.floor(((index*60%Uf)+Uf)%Uf/60)===region.end/60-1
      : zoneOffset===9;
    // Ground-level running between trains: wheels rest on rails beside the road.
    for(const x of [-7.5,7.5]) {
      for(const rail of [-.9,.9])box(group,x+rail,.04,0,.12,.08,60,0x596369);
      for(const z of (stationExit?[0,20]:[-20,0,20])) {
        box(group,x,1.9,z,2.8,2.6,18,0x28414b);
        box(group,x,3.27,z,2.9,.18,18.2,0x66757a);
        for(const side of [-1,1]) {
          for(const wz of [-6,6]) {
            const wheel=cylinder(group,x+side*1.12,.4,z+wz,.36,.36,.2,0x24292b,10);
            wheel.rotation.z=Math.PI/2;
          }
          for(const wz of [-6,-2,2,6])box(group,x+side*1.42,2.3,z+wz,.08,1.05,2.3,0xa8c9d2);
          box(group,x+side*1.43,1.2,z,.08,.15,17,0xe0b238);
        }
      }
    }
    // Reference: exposed steel trusses, blue roof panels and a glazed central ridge.
    for(const z of (stationExit?[-4,16]:[-24,-4,16])) {
      for(const side of [-1,1]) {
        cylinder(group,side*15,4.8,z,.13,.16,9.6,0x33474f,8);
        const rafter=box(group,side*7.5,11,z,15.9,.18,.2,0x33474f);
        rafter.rotation.z=-side*.25;
        const roof=box(group,side*9,11.1,z,12.4,.12,19.8,0x56889a);
        roof.rotation.z=-side*.25;
        const glass=box(group,side*1.6,12.9,z,3.2,.08,19.8,0xb5d8de);
        glass.rotation.z=-side*.25;
        for(const x of [3,6,9,12]) {
          const brace=box(group,side*x,10.1+(15-x)*.24,z,.09,1.5,.1,0x33474f);
          brace.rotation.z=side*.5;
        }
      }
      box(group,0,9.6,z,30,.1,.1,0x33474f);
    }
    if(stationExit) {
      // Front-facing exit at the final edge of the station, with a real open central bay.
      const stone=0xe5d9bd,brick=0x914e43,z=-28;
      for(const x of [-18,-6,6,18]) {
        box(group,x,6.5,z,2,13,2,brick);
        for(const edge of [-.7,.7])cylinder(group,x+edge,3.8,z+.95,.24,.3,7.6,stone,12);
        box(group,x,7.6,z+.95,2.5,.35,.7,stone);
      }
      for(const x of [-12,0,12]) {
        const radius=x===0?5.1:4.9;
        for(let i=0;i<17;i++) {
          const angle=i*Math.PI/16;
          const arch=box(group,x+Math.cos(angle)*radius,7.6+Math.sin(angle)*radius,z+.95,.85,.55,.6,stone);
          arch.rotation.z=angle-Math.PI/2;
        }
        if(x!==0) {
          box(group,x,3.2,z,8.5,6.4,.25,0x294349);
          for(const dx of [-2,0,2])box(group,x+dx,3.2,z+.2,.12,6.4,.12,stone);
        }
        const surround=cylinder(group,x,14,z+1.1,.65,.65,.18,stone,20);surround.rotation.x=Math.PI/2;
        const medallion=cylinder(group,x,14,z+1.22,.44,.44,.15,0x25425d,20);medallion.rotation.x=Math.PI/2;
      }
      // Only the upper facade spans the playable road; no wall or sill closes the opening.
      box(group,0,14.2,z,38,2.9,2,brick);
      for(const y of [13,15.5,16])box(group,0,y,z+.95,39,.35,.7,stone);
      for(const side of [-1,1]) {
        const x=side*27;
        box(group,x,5.1,z-1,15,10.2,4,brick);
        for(const y of [.45,5.9,9.9,10.35])box(group,x,y,z+1.1,15,.35,.6,stone);
        for(const wx of [side*22,side*27,side*32]) {
          box(group,wx,2.3,z+1.15,3,4.6,.16,0x29433e);
          for(const edge of [-1,1])box(group,wx+edge*1.65,2.4,z+1.25,.35,4.8,.5,stone);
          for(let i=0;i<11;i++) {
            const angle=i*Math.PI/10;
            const arch=box(group,wx+Math.cos(angle)*1.65,4.6+Math.sin(angle)*1.65,z+1.25,.5,.35,.5,stone);
            arch.rotation.z=angle-Math.PI/2;
          }
          box(group,wx,8,z+1.15,3.1,2.8,.3,stone);
          box(group,wx,8,z+1.35,2.6,2.4,.12,0x29433e);
        }
        box(group,side*19,8.5,z,2.5,17,2.8,stone);
        box(group,side*19,17.2,z,3.4,.5,3.6,stone);
        cylinder(group,side*19,18.2,z,.65,.8,1.7,stone,12);
        const clock=cylinder(group,side*19,15.6,z+1.5,1,1,.12,0xf4edda,24);clock.rotation.x=Math.PI/2;
        box(group,side*19,15.85,z+1.6,.07,.6,.08,0x263b40);
        box(group,side*19+.22,15.6,z+1.61,.5,.07,.08,0x263b40);
      }
      label(group,'محطة مصر',0,15.1,z+1.4,11,.8,'#d8d0b8','#36494b');
    }
    for(const x of [-12.5,12.5]) {
      box(group,x,.22,0,3,.44,60,0x938f82);
      box(group,x,4.3,0,4,.2,60,0xe0d6c2);
      for(const z of [-24,0,24])cylinder(group,x,2.3,z,.13,.16,4,0x69756c,8);
    }
  }
  if(region.id==='gomrok'&&zoneOffset%5===1) {
    // Cruise liners moored on the sea side: stepped decks, cabin windows and lifeboats.
    const x=-36;
    box(group,x,.7,0,10,2.2,38,0x253e53);
    const bow=cylinder(group,x,.7,-19,5,4.6,2.2,0x253e53,3);bow.rotation.y=Math.PI;
    box(group,x,1.9,0,10.3,.3,38,0xeceee9);
    for(let deck=0;deck<4;deck++) {
      const length=32-deck*3,y=2.8+deck*1.45;
      box(group,x,y,1,8-deck*.5,1.4,length,0xf5f1e7);
      for(const side of [-1,1])for(let z=-length/2+3;z<length/2;z+=2)
        box(group,x+side*(4-deck*.25+.03),y,1+z,.1,.55,.9,0x28516b);
    }
    for(const z of [-9,-3,3,9])for(const side of [-1,1]) {
      box(group,x+side*4.6,3.2,z,.9,.65,3.1,0xe3832f);
      box(group,x+side*5,2.3,z,.08,.7,3.4,0xe8e5d9);
    }
    for(const z of [1,6]) {
      cylinder(group,x,8.4,z,.85,1.05,2.5,0xd9a94b,12);
      cylinder(group,x,9.7,z,.9,.9,.25,0x253e53,12);
    }
    box(group,x,7.6,-8,5,1.2,3,0x29566e);
    cylinder(group,x,9,-11,.08,.1,3.4,0xf4f0e5,8);
  }
  if(region.id==='bahary'&&zoneOffset===5) {
    box(group,26,4,-4,19,8,17,0xb9a27d);
    for(const x of [18,23,28,33])box(group,x,9,-4,1.4,2,.8,0x8e4235);
    label(group,'قلعة قايتباي',26,9,-4,12,1.4,'#6d4c36','#fff4df');
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
    cylinder(group,-33,1,0,3.5,3.8,1.3,0xe7e5de,20);
    for(let band=0;band<8;band++) cylinder(group,-33,2.6+band*1.6,0,2.7-band*.07,2.77-band*.07,1.6,band%2?0x202729:0xf6f4ea,20);
    cylinder(group,-33,14.8,0,3.2,3.2,.35,0x202729,20);
    cylinder(group,-33,15.7,0,2.1,2.1,1.5,0xe4d28f,12);
    for(let rail=0;rail<8;rail++) cylinder(group,-33+Math.cos(rail*Math.PI/4)*2.6,15.5,Math.sin(rail*Math.PI/4)*2.6,.05,.05,1.4,0x202729,6);
    cylinder(group,-33,16.7,0,0,3.2,1,0x202729,20);
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
