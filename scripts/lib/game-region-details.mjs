// Code-native scenery uses the game's shared geometry and material batching.
export function plantVillaTrees(group, { cylinder, ball }) {
  for (const x of [-8.5, 8.5]) {
    cylinder(group,x,1.7,-4,.18,.25,3.4,0x775238,8);
    ball(group,x,4,-4,1.5,0x397347,1,1.2,1);
    ball(group,x-.65,3.5,-3.5,1,0x508743);
  }
}

export function addRegionDetails(group, region, index, { box, cylinder, ball, label }) {
  if (region.id === 'dekheila') {
    // Sea and a working dock on the left; keep the player corridor clear.
    box(group,-29,.1,0,14,.5,60,0x919b9d);
    for (const z of [-18,18]) {
      for (const x of [-32,-26]) cylinder(group,x,6,z,.2,.25,12,0xe8ad35,8);
      box(group,-29,12,z,7,.5,.6,0xe8ad35);
      box(group,-33,12.4,z,14,.4,.5,0xe8ad35);
      cylinder(group,-38,9.5,z,.035,.035,5.5,0x39434a,6);
      box(group,-38,6.6,z,.4,.3,.4,0x39434a);
      for (let row=0;row<2;row++) for (let stack=0;stack<2;stack++)
        box(group,-27-row*3,1+stack*1.7,z+6,2.6,1.6,5,[0xb7523d,0x366580,0xd3a63a][(row+stack)%3]);
    }
    ball(group,-45,.7,0,1,0x244654,3.7,1.5,13);
    box(group,-45,2,0,6.3,1.4,22,0xe7e2d3);
    for (const z of [-6,0,6]) for (const x of [-46.5,-43.5])
      box(group,x,3.6,z,2.6,2,5,[0xb7523d,0x366580,0xd3a63a][Math.abs(z/6)%3]);
    box(group,-45,4,9,5,3,3,0xf4f2e8);
    box(group,-45,5,10.55,4,.7,.08,0x386173);
    if(index%10===8) label(group,'ميناء الدخيلة',-29,6,-7,9,1.2,'#125578','#ffffff');
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
  swap('n(m,5,.2,-7,3,.15,2,5618115)', 'plantVillaTrees(m,{cylinder:a,ball:c}),n(m,5,.2,-7,3,.15,2,5618115)');
  swap('sea:["harbor","beach"].includes(n)', 'sea:["harbor","beach"].includes(n)||r==="dekheila"');
  swap('a(h,-42,-.25,0,30,.12,60,13219985)', 'a(h,t.id==="dekheila"?-29:-42,-.25,0,t.id==="dekheila"?14:30,.12,60,t.id==="dekheila"?0x919b9d:13219985)');
  swap('p.id!=="agamy"&&Zx', '!["agamy","dekheila"].includes(p.id)&&Zx');
  swap('at.createElement("div",{className:"mini-route","aria-label":"تقدم الرحلة"},at.createElement("svg"', 'at.createElement("div",{className:"mini-route","aria-label":"تقدم الرحلة"},at.createElement("strong",{className:"current-region",title:z.current.name},z.current.name),at.createElement("svg"');
  return code;
}
