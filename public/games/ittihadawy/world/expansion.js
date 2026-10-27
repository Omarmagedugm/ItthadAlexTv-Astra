import {EVENTS,canPlayZombie,weatherAt,crossedPlayer,eventComplete} from './rules.js';

// Receives the existing engine's Three classes: no second renderer or Three download.
export function installExpansion(Engine,A) {
 const proto=Engine.prototype;
 if(proto.expansionInstalled)return;
 proto.expansionInstalled=true;
 const oldTick=proto.tickParticles,oldReset=proto.reset,oldDestroy=proto.destroy,oldGet=proto.getObject;
 proto.setGameMode=function(mode){
  this.gameMode=mode==='zombie'&&canPlayZombie(this.lobbyProfile)?'zombie':'runner';
  if(this.el?.dataset)this.el.dataset.gameMode=this.gameMode;
  return this.gameMode;
 };
 proto.reset=function(...args){this.expansion?.reset();return oldReset.apply(this,args)};
 proto.tickParticles=function(dt){
  oldTick.call(this,dt);
  this.expansion ||= createExpansion(this,A);
  this.expansion.tick(dt);
 };
 proto.getObject=function(type,lane,at){
  // Substitute an existing blocking slot only, preserving the original escape lane.
  const event=this.expansion?.event,regional=EVENTS[A.region(at).current.id];
  if(type==='block'&&regional?.[1]==='microbus')type='microbus';
  else if(event&&event.remaining>0&&['low','block','ball'].includes(type)&&regional&&regional[1]!=='scarf')type=regional[1];
  if(type!=='microbus')return oldGet.call(this,type,lane,at);
  const index=this.pool.findIndex(o=>o.type==='microbus');
  let o=index>=0?this.pool.splice(index,1)[0]:null;
  if(!o){const group=A.microbus();group.rotation.y=Math.PI;o={group,type:'microbus'};this.scene.add(group)}
  Object.assign(o,{at,lane,done:false});o.group.visible=true;o.group.position.set(lane*3,0,this.run.distance-at);this.objects.push(o);return o;
 };
 proto.destroy=function(){this.expansion?.destroy();return oldDestroy.call(this)};
}
function createExpansion(engine,A) {
 const {Group,Mesh,Box,Sphere,Cylinder,Material,Color,Geometry,Attribute,LineMaterial,Lines}=A;
 const root=new Group();root.name='IttihadawyExpansion';engine.scene.add(root);
 const geometries=new Set(),materials=new Set();
 const addGeo=g=>{geometries.add(g);return g};
 const geometry=(...size)=>addGeo(new Box(...size));
 const material=options=>{const m=new Material(options);materials.add(m);return m};
 const cube=geometry(1,1,1);
 const ballGeo=Sphere?addGeo(new Sphere(.5,14,12)):cube;
 const cylGeo=Cylinder?addGeo(new Cylinder(.5,.5,1,12)):cube;
 const stoneGeo=Cylinder?addGeo(new Cylinder(.36,.48,1,7)):cube;
 const debrisMat=material({color:0x716c60,roughness:1}),darkMat=material({color:0x283237,roughness:1});
 const charredMat=material({color:0x1b1918,roughness:1}),ruinMat=material({color:0x524b44,roughness:.98}),rustMat=material({color:0x5e3424,roughness:.92});
 const hazardMat=material({color:0xd99b16,roughness:.85}),ashColor=new Color(0x382f2b);
 const fireCoreMat=material({color:0xffca4b,emissive:0xff9500,emissiveIntensity:2.3,transparent:true,opacity:.46,depthWrite:false});
 const fireOuterMat=material({color:0xff7714,emissive:0xff5500,emissiveIntensity:1.8,transparent:true,opacity:.24,depthWrite:false});
 const flameWispMat=material({color:0xff8c1a,emissive:0xff5e00,emissiveIntensity:2.6,transparent:true,opacity:.9,depthWrite:false});
 const emberMat=material({color:0xff3b00,emissive:0xd92300,emissiveIntensity:1.6});
 const pitStoneMat=material({color:0x725b46,roughness:.92}),pitStoneDarkMat=material({color:0x594636,roughness:.95});
 const logWoodMat=material({color:0x8f4c1a,emissive:0x6b2604,emissiveIntensity:.65,roughness:.85});
 const logGlowMat=material({color:0xc96518,emissive:0xe85d04,emissiveIntensity:1.35,roughness:.75});
 const smokeUniforms={smokeTime:{value:0}};
 const smokeStageSpecs=[
  [0x241d1a,.28,.62],[0x1d1917,.58,.48],[0x262220,.54,.28],[0x332e2c,.46,.14],
  [0x423d3a,.38,.06],[0x544e4a,.29,.02],[0x68615c,.19,0],[0x7c756f,.09,0]
 ];
 const smokeStageMats=smokeStageSpecs.map(([hex,op,warmth],idx)=>{
  const m=material({color:hex,roughness:1,metalness:0,transparent:true,opacity:op,depthWrite:false});
  const prevCompile=m.onBeforeCompile,prevKey=m.customProgramCacheKey?m.customProgramCacheKey.bind(m):()=>'';
  const baseKey=prevKey();
  m.onBeforeCompile=function(shader,renderer){
   if(prevCompile)prevCompile.call(this,shader,renderer);
   shader.uniforms.smokeTime=smokeUniforms.smokeTime;
   shader.uniforms.smokeWarmth={value:warmth};
   shader.vertexShader='uniform float smokeTime;\nvarying vec3 vSmokeLocal;\n'+shader.vertexShader
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvSmokeLocal = position;\nfloat sWave = sin(position.x * 3.8 + smokeTime * 1.9) * cos(position.y * 3.4 - smokeTime * 1.5);\ntransformed += normal * (sWave * 0.085);');
   shader.fragmentShader='uniform float smokeTime;\nuniform float smokeWarmth;\nvarying vec3 vSmokeLocal;\n'+shader.fragmentShader
    .replace('#include <opaque_fragment>',`
     float viewDot = abs(dot(normalize(normal), normalize(vViewPosition)));
     float edgeSoft = pow(smoothstep(0.04, 0.82, viewDot), 1.65);
     float n1 = sin(vSmokeLocal.x * 5.2 + smokeTime * 1.7) * cos(vSmokeLocal.y * 4.8 - smokeTime * 2.1) * sin(vSmokeLocal.z * 5.4 + smokeTime * 1.3);
     float n2 = cos(vSmokeLocal.x * 10.4 - smokeTime * 2.4) * sin(vSmokeLocal.y * 9.6 + smokeTime * 1.8);
     float wisp = clamp(0.76 + n1 * 0.24 + n2 * 0.14, 0.25, 1.0);
     float underLit = clamp(-normal.y * 0.6 + 0.3, 0.0, 1.0);
     outgoingLight *= mix(0.72, 1.15, clamp(normal.y * 0.5 + 0.5, 0.0, 1.0));
     outgoingLight += vec3(0.96, 0.38, 0.07) * underLit * smokeWarmth;
     diffuseColor.a *= edgeSoft * wisp;
     #include <opaque_fragment>
    `);
  };
  m.customProgramCacheKey=()=>baseKey+'|ittihad-vol-smoke-v2-'+idx;
  return m;
 });
 const glowMat=material({color:0xffd395,emissive:0xffbd67,emissiveIntensity:0,transparent:true,opacity:0});
 const wetMat=material({color:0x8eaeb7,metalness:.65,roughness:.12,transparent:true,opacity:0,depthWrite:false});
 const rainGeo=new Geometry(),rainData=new Float32Array(120*6);geometries.add(rainGeo);
 rainGeo.setAttribute('position',new Attribute(rainData,3));
 const rainMat=new LineMaterial({color:0xc7e4f2,transparent:true,opacity:0,depthWrite:false});materials.add(rainMat);
 const rain=new Lines(rainGeo,rainMat);rain.frustumCulled=false;root.add(rain);
 const drops=Array.from({length:120},()=>({x:Math.random()*24-12,y:Math.random()*16,z:-Math.random()*90}));
 const fixtures=[],rubble=[],puddles=[],poles=[],cracks=[],ruins=[],wrecks=[],flames=[],smokes=[];
 const waves=new Map();
 let cityWeathered=false;
 function box(parent,mat,x,y,z,sx,sy,sz){const mesh=new Mesh(cube,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 function ball(parent,mat,x,y,z,sx,sy,sz){const mesh=new Mesh(ballGeo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 function cyl(parent,mat,x,y,z,sx,sy,sz){const mesh=new Mesh(cylGeo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 function stone(parent,mat,x,y,z,sx,sy,sz){const mesh=new Mesh(stoneGeo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 for(let i=0;i<12;i++){
  const x=i%2?8:-8,z=-10-Math.floor(i/2)*22;
  fixtures.push(box(root,glowMat,x,4.6,z,.45,.18,.6));
  poles.push(box(root,darkMat,x,2.3,z,.09,4.6,.09));
  const puddle=box(root,wetMat,(i%3-1)*3,.018,-5-i*11,1.6,.012,4);puddles.push(puddle);
 }
 // Shattered multi-story building facades, collapsed slabs & exposed girders along both sides of the street
 for(let i=0;i<16;i++){
  const side=i%2?1:-1,x=side*(8.3+(i%3)*.65),z=-i*8.75,h=5.2+(i%4)*1.35,w=2.8+(i%3)*.55;
  const g=new Group();g.position.set(x,0,z);root.add(g);
  const wall=box(g,i%2?ruinMat:debrisMat,0,h*.48,0,1.35,h,w);
  wall.rotation.set((i%3-1)*.05,side*.08,side*(-.07-(i%3)*.03));
  // Jagged broken upper wall chunks & exposed steel rebar
  box(g,charredMat,-side*.25,h+.35,-.45,.95,1.2,w*.48).rotation.z=side*.22;
  box(g,ruinMat,side*.15,h+.1,.55,.85,.95,w*.38).rotation.z=-side*.18;
  for(let r=0;r<3;r++){
   const bar=box(g,rustMat,(r-1)*.3,h+.85,(r-1)*.65,.09,1.45,.09);
   bar.rotation.set((r-1)*.25,0,side*(.28+r*.12));
  }
  // Blown-out charred windows with fire/ember glow inside
  for(let wy=1.8;wy<h-.8;wy+=2.1){
   box(g,charredMat,-side*.62,wy,-.45,.22,1.05,.82);
   box(g,charredMat,-side*.62,wy,.55,.22,1.05,.82);
   if((i+Math.floor(wy))%2===0)box(g,emberMat,-side*.66,wy-.15,i%2?-.45:.55,.16,.55,.58);
  }
  // Collapsed overhanging balcony / floor slab & base masonry pile
  const slab=box(g,darkMat,-side*.95,2.4+(i%3)*.6,0,1.65,.32,w*.78);
  slab.rotation.set(.12*(i%2?1:-1),0,-side*.42);
  box(g,charredMat,-side*1.25,.55,0,1.5,1.1,w*.72).rotation.y=.25*i;
  g.visible=false;ruins.push(g);
 }
 // Burned-out overturned car wrecks & broken street barricades on sidewalks/shoulders
 for(let i=0;i<10;i++){
  const side=i%2?1:-1,x=side*(5.75+(i%3)*.45),z=-i*14;
  const g=new Group();g.position.set(x,0,z);root.add(g);
  const chassis=new Group();chassis.position.set(0,.58,0);
  chassis.rotation.set((i%2?.08:-.08),side*(.28+(i%3)*.18),side*(i%3===0?.38:-.24));
  g.add(chassis);
  box(chassis,i%2?rustMat:charredMat,0,0,0,1.55,.68,3.2);
  box(chassis,charredMat,0,.48,-.15,1.35,.52,1.75).rotation.z=side*.14;
  box(chassis,emberMat,0,.18,1.1,.95,.28,.75);
  for(const wx of [-.78,.78])for(const wz of [-1.05,1.05])box(chassis,darkMat,wx,-.28,wz,.26,.48,.48);
  // Broken concrete roadblock barrier beside wreck
  const barrier=box(g,debrisMat,-side*.75,.42,2.1,.55,.82,1.9);barrier.rotation.y=-side*.35;
  box(g,hazardMat,-side*.98,.58,2.1,.12,.22,1.65).rotation.y=-side*.35;
  g.visible=false;wrecks.push(g);
 }
 // Heavy sidewalk & curb rubble chunks
 for(let i=0;i<32;i++){
  const side=i%2?1:-1,x=side*(5.1+(i%4)*.75),z=-i*4.35;
  const mat=i%4===0?charredMat:i%3===0?rustMat:i%2===0?debrisMat:darkMat;
  const mesh=box(root,mat,x,.28+(i%3)*.22,z,.75+(i%4)*.42,.48+(i%3)*.38,.95+(i%3)*.45);
  mesh.rotation.set(.18*i,.85*i,.24*i);mesh.visible=false;rubble.push(mesh);
 }
 // Road blast craters, scorch marks & glowing fissures across the street
 for(let i=0;i<18;i++){
  const g=new Group();g.position.set(((i%5)-2)*1.85,0,-i*7.75);root.add(g);
  const scorch=box(g,charredMat,0,.016,0,2.1+(i%3)*.55,.012,2.4+(i%2)*.7);scorch.rotation.y=.5*i;
  const fissure=box(g,i%2?emberMat:darkMat,0,.026,0,.22,.014,1.95);fissure.rotation.y=.7+i;
  const cross=box(g,darkMat,.15,.024,-.1,.12,.012,1.45);cross.rotation.y=1.8+i;
  box(g,debrisMat,.85,.12,.45,.42,.22,.48).rotation.set(.2,.6*i,.3);
  box(g,charredMat,-.78,.1,-.52,.36,.18,.42).rotation.set(-.2,.4*i,-.25);
  g.visible=false;cracks.push(g);
 }
 // 3D Campfire / Bonfire pits (ring of low-poly stones, crisscrossed wooden logs, warm volumetric glow & wispy flame tongues)
 for(let i=0;i<20;i++){
  const side=i%2?1:-1,onBuilding=i%4===0;
  const x=side*(onBuilding?7.5+(i%2)*.6:5.35+(i%3)*.52),y=onBuilding?2.1+(i%3)*1.35:0;
  const g=new Group();g.position.set(x,y,-i*7);root.add(g);
  // Ring of 10 faceted low-poly stones around the fire pit
  for(let s=0;s<10;s++){
   const ang=(s/10)*Math.PI*2,rad=.62+(s%2)*.06,sh=.26+(s%3)*.08;
   const st=stone(g,s%2?pitStoneMat:pitStoneDarkMat,Math.cos(ang)*rad,sh*.5,Math.sin(ang)*rad,.34+(s%2)*.06,sh,.34+(s%3)*.05);
   st.rotation.set(Math.sin(ang)*-.12,ang,Math.cos(ang)*.12);
  }
  // 6 crisscrossed stacked timber logs leaning into the fire core
  for(let l=0;l<6;l++){
   const ang=(l/6)*Math.PI*2+.25,dist=.24+(l%2)*.06;
   const log=box(g,l%2?logGlowMat:logWoodMat,Math.cos(ang)*dist,.28+(l%3)*.07,Math.sin(ang)*dist,.14,.12,.88);
   log.rotation.y=-ang+Math.PI/2;
   log.rotation.z=.52+(l%2)*.14;
   log.rotation.x=(l%3-1)*.12;
  }
  // Soft volumetric orange/amber glow halos + rising wispy flame ribbons
  const outer=ball(g,fireOuterMat,0,.58,0,1.45,1.65,1.45);
  const core=ball(g,fireCoreMat,0,.42,0,.86,1.02,.86);
  const tongue=new Group();tongue.position.set(0,.78,0);g.add(tongue);
  const w1=box(tongue,flameWispMat,0,0,0,.38,.26,.12);w1.rotation.set(.18,.3,.42);
  const w2=box(tongue,flameWispMat,.12,.28,-.04,.28,.22,.1);w2.rotation.set(-.15,-.4,-.38);
  const w3=ball(tongue,flameWispMat,-.08,.56,.03,.24,.14,.12);w3.rotation.z=.35;
  const spark=ball(tongue,fireCoreMat,.14,.68,-.02,.09,.09,.09);
  g.visible=false;flames.push({group:g,outer,core,tongue,spark,baseY:y,phase:i*1.37});
 }
 // Realistic volumetric multi-lobe billowing smoke plumes rising from campfires, wrecks & ruined roofs
 const lobeOffsets=[
  [0,0,0,1.08,.86,1.08],
  [-.42,.14,.26,.82,.72,.84],
  [.44,-.08,-.24,.86,.68,.82],
  [.18,.36,.3,.76,.66,.78],
  [-.26,-.2,-.32,.74,.62,.74]
 ];
 for(let i=0;i<40;i++){
  const fromFire=i<20,fi=i%20;
  const side=fi%2?1:-1,onBuilding=fi%4===0;
  const fireX=side*(onBuilding?7.5+(fi%2)*.6:5.35+(fi%3)*.52);
  const fireY=onBuilding?2.1+(fi%3)*1.35:0;
  const x=fromFire?fireX:side*(5.5+(i%5)*.78);
  const baseY=fromFire?fireY+.85:1.15+(i%4)*1.1;
  const zStep=fromFire?fi*7:i*3.5;
  const g=new Group();g.position.set(x,baseY,-zStep);root.add(g);
  const stageIdx=i%smokeStageMats.length;
  const lobes=lobeOffsets.map(([lx,ly,lz,sx,sy,sz],li)=>{
   const m=ball(g,smokeStageMats[Math.min(smokeStageMats.length-1,stageIdx+(li>0?1:0))],lx,ly,lz,sx,sy,sz);
   m.rotation.set(.4*li,.9*li,.3*li);
   return m;
  });
  g.visible=false;
  smokes.push({group:g,lobes,baseX:x,baseY,zStep,seed:i*1.19,speed:1.35+(i%4)*.32});
 }
 // 3D Scientist / Lab-Coat Zombies (matching CCSO_Zombi_Host.png: tattered grey-white lab coat, REX pocket badge, Dr. John ID tag, torn blue shirt, slashed necrotic chest, round greyish-brown head, glowing milky-white dead eyes, screaming mouth with white teeth, clawed hands, black laced boots)
 const enemies=[];
 const zSkinMat=material({color:0x5e433c,roughness:.88}),zBruiseMat=material({color:0x422622,roughness:.92});
 const zWoundMat=material({color:0x7a1815,emissive:0x2e0505,emissiveIntensity:.45,roughness:.65});
 const zCoatMat=material({color:0xc2c4c8,roughness:.86}),zCoatGrimeMat=material({color:0x7d8086,roughness:.92});
 const zShirtMat=material({color:0x254161,roughness:.88}),zPantsMat=material({color:0x212326,roughness:.9});
 const zBootMat=material({color:0x121315,roughness:.72}),zHairMat=material({color:0x1b1512,roughness:.92});
 const zEyeMat=material({color:0xf2f7fa,emissive:0xd9ecf2,emissiveIntensity:1.7,roughness:.2});
 const zTeethMat=material({color:0xe6e2d8,roughness:.45}),zRexMat=material({color:0xd92424,emissive:0x7a1010,emissiveIntensity:.85});
 for(let i=0;i<28;i++){
  const group=new Group();root.add(group);
  const torso=new Group();torso.position.set(0,1.05,0);group.add(torso);
  // Torn dark-blue undershirt & muscular necrotic slashed chest
  cyl(torso,zShirtMat,0,.06,0,.52,.66,.32);
  ball(torso,zSkinMat,-.08,.15,.09,.21,.25,.16);
  ball(torso,zSkinMat,.08,.15,.09,.21,.25,.16);
  box(torso,zSkinMat,0,-.03,.13,.22,.34,.09);
  for(let s=0;s<3;s++){
   const slash=box(torso,zWoundMat,-.03+s*.04,.16-s*.09,.18,.16,.024,.03);
   slash.rotation.z=-.58+s*.08;
  }
  for(const side of [-1,1]){
   const flap=box(torso,zShirtMat,side*.13,.09,.15,.11,.42,.05);
   flap.rotation.z=side*.18;
  }
  // Tattered dirty white-grey lab coat (open front, lapels, buttons, REX pocket & Dr. John ID badge)
  box(torso,zCoatMat,0,-.03,-.15,.55,.84,.07);
  box(torso,zCoatGrimeMat,0,-.34,-.16,.57,.3,.06);
  // 3 diagonal claw slashes across the back of the lab coat
  for(let s=0;s<3;s++){
   const gash=box(torso,s%2?zWoundMat:zShirtMat,-.04+s*.055,-.02-s*.06,-.19,.045,.48,.025);
   gash.rotation.z=.48;
  }
  for(const side of [-1,1]){
   box(torso,zCoatMat,side*.22,-.04,.01,.17,.84,.34);
   box(torso,zCoatGrimeMat,side*.23,-.34,.01,.18,.28,.35);
   const lapel=box(torso,zCoatMat,side*.17,.18,.17,.12,.36,.045);
   lapel.rotation.z=-side*.24;
  }
  for(let b=0;b<3;b++)ball(torso,zTeethMat,-.16,.04-b*.12,.19,.036,.036,.02);
  // Left breast pocket with REX emblem & clip-on Dr. John ID badge
  box(torso,zCoatGrimeMat,.19,.08,.185,.12,.14,.025);
  box(torso,zTeethMat,.19,.145,.195,.11,.038,.02);
  ball(torso,zRexMat,.155,.145,.205,.03,.03,.015);
  const idCard=box(torso,zTeethMat,.22,.24,.195,.08,.105,.02);idCard.rotation.z=-.12;
  box(torso,zHairMat,.22,.25,.206,.042,.042,.01);
  // Jagged torn bottom hem fringes around the coat
  for(let f=0;f<6;f++){
   const fx=(f-2.5)*.1,fz=f===0||f===5?.08:-.15;
   const fringe=box(torso,f%2?zCoatMat:zCoatGrimeMat,fx,-.49,fz,.09,.16,.05);
   fringe.rotation.z=(f%2?.22:-.22);
  }
  // Sculpted broad zombie head, slicked dark hair, milky-white dead eyes & screaming toothed mouth
  const head=new Group();head.position.set(0,1.66,.07);group.add(head);
  ball(head,zSkinMat,0,.04,0,.43,.45,.42);
  ball(head,zSkinMat,0,-.04,.03,.45,.3,.37);
  ball(head,zHairMat,0,.11,-.03,.44,.36,.43);
  for(const side of [-1,1]){
   box(head,zHairMat,side*.205,.04,-.02,.045,.21,.24);
   ball(head,zSkinMat,side*.225,.01,-.01,.065,.12,.085);
   const brow=box(head,zBruiseMat,side*.09,.095,.185,.13,.042,.065);
   brow.rotation.z=-side*.22;
   ball(head,zBruiseMat,side*.092,.045,.17,.105,.09,.055);
   ball(head,zEyeMat,side*.092,.045,.198,.07,.055,.038);
  }
  box(head,zSkinMat,0,-.01,.21,.07,.085,.065);
  box(head,zBruiseMat,0,-.045,.205,.085,.032,.055);
  // Open screaming mouth cavity + upper & lower white teeth rows
  box(head,charredMat,0,-.115,.155,.18,.11,.09);
  box(head,zWoundMat,0,-.072,.19,.16,.024,.045);
  box(head,zTeethMat,0,-.088,.196,.145,.026,.032);
  const jaw=new Group();jaw.position.set(0,-.135,.12);head.add(jaw);
  ball(jaw,zBruiseMat,0,-.025,.04,.32,.13,.22);
  box(jaw,zWoundMat,0,.012,.07,.15,.024,.045);
  box(jaw,zTeethMat,0,.026,.076,.14,.025,.032);
  // Articulated legs in grimy charcoal trousers & black laced boots
  const legs=[-1,1].map(side=>{
   const leg=new Group();leg.position.set(side*.16,.72,0);group.add(leg);
   cyl(leg,zPantsMat,0,-.25,0,.18,.5,.18);
   box(leg,zCoatGrimeMat,0,-.22,.08,.12,.14,.04);
   box(leg,zBootMat,0,-.56,.035,.185,.17,.28);
   ball(leg,zBootMat,0,-.59,.13,.175,.11,.15);
   box(leg,zCoatGrimeMat,0,-.51,.11,.065,.09,.035);
   return leg;
  });
  // Articulated arms with tattered lab-coat sleeves, veined forearms & clawed hands
  const arms=[-1,1].map(side=>{
   const arm=new Group();arm.position.set(side*.35,1.36,.04);group.add(arm);
   cyl(arm,zCoatMat,0,-.1,.05,.18,.24,.18).rotation.x=-.45;
   box(arm,zBruiseMat,side*.075,-.11,.07,.055,.11,.08);
   const forearm=cyl(arm,zSkinMat,0,-.23,.26,.13,.36,.13);forearm.rotation.x=-1.28;
   box(arm,zBruiseMat,0,-.21,.29,.032,.22,.028).rotation.x=-1.28;
   box(arm,zSkinMat,0,-.28,.45,.11,.05,.12);
   for(let c=-1.5;c<=1.5;c+=1){
    box(arm,zSkinMat,c*.026,-.29,.53,.02,.025,.07);
    box(arm,zTeethMat,c*.026,-.3,.575,.016,.02,.035);
   }
   return arm;
  });
  group.visible=false;enemies.push({group,torso,head,jaw,legs,arms,active:false,hp:1,offset:i*.7,drift:(i%3-1)*.35});
 }
 const shotMat=material({color:0xb9ffb3,emissive:0x70ff77,emissiveIntensity:2.4});
 const shots=Array.from({length:24},()=>{const mesh=box(root,shotMat,0,1,0,.08,.08,1.05);mesh.visible=false;return mesh});
 let allies=[],allyCharacter='',clock=0,spawnClock=0,fireClock=0,kills=0,squad=1,lastRegion='',event=null,weather=weatherAt(0),lastHud='',uiClock=0;
 const tint=new Color(),nextTint=new Color();
 const hud=document.createElement('div');hud.className='expansion-hud';hud.dir='rtl';hud.setAttribute('aria-label','الطقس وتحدي المنطقة');
 const status=document.createElement('span'),challenge=document.createElement('span');hud.append(status,challenge);engine.el.append(hud);
 const fire=document.createElement('button');fire.className='zombie-fire';fire.textContent='إطلاق ⚡';fire.setAttribute('aria-label','إطلاق على الزومبي');fire.hidden=true;engine.el.append(fire);
 const onFire=e=>{e.preventDefault();e.stopPropagation();if(engine.state==='PLAYING'&&engine.gameMode==='zombie')shoot(true)};
 const stop=e=>e.stopPropagation();fire.addEventListener('pointerdown',stop);fire.addEventListener('pointerup',stop);fire.addEventListener('click',onFire);
 const onKey=e=>{if(e.code==='KeyF'&&!e.repeat)onFire(e)};window.addEventListener('keydown',onKey);
 function clearAllies(){for(const ally of allies){ally.userData.prototypeDisposed=true;engine.scene.remove(ally);engine.disposeGroup(ally)}allies=[];allyCharacter=''}
 function shoot(manual=false){
  if(fireClock>0)return;
  fireClock=manual?.07:Math.max(.09,.24-squad*.03);
  const volley=Math.min(squad,3);
  for(let v=0;v<volley;v++){
   const shot=shots.find(s=>!s.visible);
   if(shot){
    shot.visible=true;
    const xOff=v===0?0:(v%2?1:-1)*.55;
    shot.position.set(engine.player.position.x+xOff,1.22,-1.1-v*.35);
    shot.userData.life=.18;
   }
  }
  const targets=enemies.filter(e=>e.active&&e.group.position.z<1&&e.group.position.z>-85&&Math.abs(e.group.position.x-engine.player.position.x)<2.25).sort((a,b)=>b.group.position.z-a.group.position.z);
  const hitCount=Math.min(targets.length,manual?2:1);
  for(let h=0;h<hitCount;h++){
   const target=targets[h];
   target.hp-=Math.max(1,squad);
   if(target.hp<=0){
    target.active=false;target.group.visible=false;kills++;engine.run.points+=40;engine.run.zombieKills=kills;
    if(engine.el?.dataset)engine.el.dataset.zombieKills=String(kills);
    engine.puff(target.group.position.x,1,target.group.position.z,true);
    if(kills%8===0&&squad<5){squad++;engine.cb.toast('انضم فرد من نفس شخصيتك للفريق!')}
   }
  }
  engine.sound.tone(420,.035,'triangle',.018);
 }
 function reset(){clock=0;spawnClock=0;fireClock=0;kills=0;squad=1;lastRegion='';event=null;if(engine.run)engine.run.zombieKills=0;if(engine.el?.dataset){engine.el.dataset.zombieKills='0';engine.el.dataset.gameMode=engine.gameMode||'runner'}for(const enemy of enemies){enemy.active=false;enemy.group.visible=false}for(const shot of shots)shot.visible=false;for(const ally of allies)ally.visible=false;}
 function tick(dt){
  const playing=engine.state==='PLAYING',zombie=engine.gameMode==='zombie';
  if(engine.run)engine.run.zombieKills=kills;
  if(engine.el?.dataset){engine.el.dataset.gameMode=zombie?'zombie':'runner';engine.el.dataset.zombieKills=String(kills)}
  hud.hidden=!playing;fire.hidden=!(playing&&zombie);
  if(playing)clock+=dt;
  weather=weatherAt(clock);
  tint.set(weather.sky).lerp(nextTint.set(weather.nextSky),weather.blend);
  if(zombie){
   // War-torn apocalyptic crimson-ash sky & dense smoke haze
   const pulse=.58+Math.sin(clock*2.2)*.06;
   tint.lerp(nextTint.set(0x3b1f18),pulse);
   engine.scene.background.copy(tint);
   engine.scene.fog.color.copy(tint).lerp(nextTint.set(0x2a1814),.45);
   engine.scene.fog.near=45;engine.scene.fog.far=145;
   engine.sun.intensity=Math.max(.55,1.25-weather.night*.45);
   engine.fill.intensity=.52+Math.sin(clock*7)*.06;
   const flicker=Math.sin(clock*19)>.15?2.4:.35;
   glowMat.emissiveIntensity=flicker;glowMat.opacity=.92;
  }else{
   engine.scene.background.copy(tint);engine.scene.fog.color.copy(tint).lerp(nextTint.set(0x8ca4ad),weather.rain*.35);
   engine.scene.fog.near=95;engine.scene.fog.far=205-weather.rain*25;
   engine.sun.intensity=2.4-weather.night*1.5-weather.rain*.5;engine.fill.intensity=.65+weather.night*.2;
   glowMat.emissiveIntensity=weather.night*2;glowMat.opacity=weather.night*.95;
  }
  if(zombie!==cityWeathered){
   cityWeathered=zombie;
   for(const [hex,m] of A.waterMaterials.entries()){
    if(!m.userData?.water&&m.color&&typeof hex==='number'){
     m.color.setHex(hex);
     if(zombie)m.color.lerp(ashColor,.58);
    }
   }
  }
  wetMat.opacity=weather.rain*.24;
  rainMat.opacity=weather.rain*.45;
  const count=engine.opts.quality==='low'?40:120;rainGeo.setDrawRange(0,count*2);
  for(let i=0;i<count;i++){
   const d=drops[i];if(playing){d.y-=dt*(14+weather.wind*8);d.x+=dt*weather.wind*5;if(d.y<0){d.y=16;d.x=Math.random()*24-12}if(d.x>12)d.x=-12}
   const p=i*6;rainData[p]=d.x;rainData[p+1]=d.y;rainData[p+2]=d.z;rainData[p+3]=d.x-weather.wind*.35;rainData[p+4]=d.y+.7;rainData[p+5]=d.z;
  }
  rainGeo.attributes.position.needsUpdate=true;rain.visible=weather.rain>.01;
  const showDestruction=zombie&&playing;
  for(const [i,mesh] of rubble.entries()){mesh.visible=showDestruction;mesh.position.z=((engine.run.distance+i*4.35)%140)-135}
  for(const [i,g] of ruins.entries()){g.visible=showDestruction;g.position.z=((engine.run.distance+i*8.75)%140)-135}
  for(const [i,g] of wrecks.entries()){g.visible=showDestruction;g.position.z=((engine.run.distance+i*14)%140)-135}
  for(const [i,g] of cracks.entries()){g.visible=showDestruction;g.position.z=((engine.run.distance+i*7.75)%140)-135}
  for(const [i,f] of flames.entries()){
   f.group.visible=showDestruction;
   f.group.position.z=((engine.run.distance+i*7)%140)-135;
   if(showDestruction){
    const wave=Math.sin(clock*13+f.phase),sway=Math.cos(clock*9+f.phase);
    f.outer.scale.set(1.42+wave*.12,1.62+wave*.22,1.42-wave*.1);
    f.core.scale.set(.85-wave*.08,1.02-wave*.15,.85+wave*.08);
    f.tongue.position.y=.74+Math.abs(wave)*.18;
    f.tongue.rotation.z=sway*.22;f.tongue.rotation.y+=dt*2.2;
    if(f.spark){
     const sparkRise=(clock*1.9+f.phase)%1;
     f.spark.position.y=.52+sparkRise*.65;
     f.spark.position.x=Math.sin(clock*10+f.phase)*.16;
    }
   }
  }
  smokeUniforms.smokeTime.value=clock;
  for(const [i,s] of smokes.entries()){
   s.group.visible=showDestruction;
   s.group.position.z=((engine.run.distance+s.zStep)%140)-135;
   if(showDestruction){
    const cycle=9.6,rise=((clock*s.speed+s.seed)%cycle),tNorm=rise/cycle;
    const windDrift=(weather.wind||.25)*rise*1.05;
    const sway=Math.sin(clock*1.55+s.seed)*(.28+tNorm*.85)+Math.cos(clock*.9+s.seed*1.7)*(.15+tNorm*.35);
    s.group.position.y=s.baseY+rise*1.32;
    s.group.position.x=s.baseX+windDrift*.35+sway;
    const spread=.68+Math.pow(tNorm,.82)*2.15;
    const squash=.62+tNorm*1.45;
    s.group.scale.set(spread,squash,spread);
    s.group.rotation.y+=dt*(.38+(i%3)*.12);
    s.group.rotation.z=Math.sin(clock*1.2+s.seed)*.18;
    const stageIdx=Math.min(smokeStageMats.length-1,Math.floor(tNorm*smokeStageMats.length));
    const outerMat=smokeStageMats[Math.min(smokeStageMats.length-1,stageIdx+1)];
    const coreMat=smokeStageMats[stageIdx];
    for(let li=0;li<s.lobes.length;li++){
     const lobe=s.lobes[li];
     lobe.material=li===0?coreMat:outerMat;
     if(li>0){
      const curl=clock*2.1+s.seed+li*1.35;
      lobe.rotation.z=Math.sin(curl)*.35;
      lobe.rotation.x=Math.cos(curl*.85)*.28;
     }
    }
   }
  }
  for(const [i,mesh] of puddles.entries())mesh.position.z=((engine.run.distance+i*11)%140)-135;
  for(const [i,mesh] of fixtures.entries()){
   mesh.position.z=((engine.run.distance+Math.floor(i/2)*22)%140)-135;
   poles[i].position.z=mesh.position.z;
   poles[i].rotation.z=zombie?(i%2?.26:-.24):0;
   poles[i].rotation.x=zombie?(i%3===0?.14:-.08):0;
  }
  // Reuse coastal water meshes; shader displacement adds small waves without
  // creating sea in inland zones or changing the original textures.
  for(const m of A.waterMaterials.values())if(m.userData.water&&m.map){
   if(!waves.has(m)){
    const uniforms={waveTime:{value:0},waveStrength:{value:.05}};
    const compile=m.onBeforeCompile,cacheKey=m.customProgramCacheKey,key=cacheKey.call(m);
    m.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform float waveTime; uniform float waveStrength;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y += sin(position.x * .65 + waveTime) * cos(position.y * .3 + waveTime * .7) * waveStrength;')};
    m.customProgramCacheKey=()=>key+'|ittihad-waves-v1';m.needsUpdate=true;waves.set(m,{uniforms,compile,cacheKey});
   }
   const u=waves.get(m).uniforms;u.waveTime.value=engine.time;u.waveStrength.value=.05+weather.wind*.13;
   m.map.offset.x=engine.time*(.006+weather.wind*.012);m.map.offset.y=engine.time*(.012+weather.wind*.018);
  }
  for(const ally of allies)ally.visible=playing&&zombie;
  if(!playing){for(const enemy of enemies)enemy.group.visible=false;return}
  const region=A.region(engine.run.distance).current;
  if(region.id!==lastRegion){
   lastRegion=region.id;event={region:region.id,remaining:18,coins:engine.run.coins,avoided:engine.run.avoided,complete:false};
   engine.cb.toast((EVENTS[region.id]?.[0]||region.name)+' — 🪙٦ وعوائق ٣');
  }
  if(event.remaining>0){event.remaining=Math.max(0,event.remaining-dt);if(eventComplete(event,engine.run)){event.complete=true;event.remaining=0;engine.run.points+=250;engine.cb.toast('تم التحدي! +٢٥٠')}}
  if(zombie){
   fireClock=Math.max(0,fireClock-dt);spawnClock-=dt;
   if(spawnClock<=0){
    const hordeSize=3+Math.min(3,Math.floor(kills/14))+(Math.random()>.45?1:0);
    const centerLane=Math.floor(Math.random()*3)-1;
    for(let h=0;h<hordeSize;h++){
     const enemy=enemies.find(e=>!e.active);
     if(!enemy)break;
     enemy.active=true;
     enemy.hp=1+Math.floor(kills/22);
     const lane=((centerLane+h)%3+3)%3-1;
     const spread=(h%2?1:-1)*(.35+(h*.18)%0.75);
     enemy.group.position.set(lane*3+spread,0,-88-h*4.2-Math.random()*3);
     enemy.group.visible=true;
    }
    spawnClock=Math.max(.95,2.05-kills*.018);
   }
   for(const enemy of enemies){if(!enemy.active)continue;enemy.group.visible=true;const previous=enemy.group.position.z;enemy.group.position.z+=(engine.run.speed+4.2)*dt;
    const stride=clock*10+enemy.offset;
    enemy.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(stride+i*Math.PI)*.56);
    enemy.arms.forEach((arm,i)=>{
     arm.rotation.x=-.32+Math.sin(stride*.85+i*1.2)*.24;
     arm.rotation.z=(i===0?-1:1)*(.1+Math.cos(stride*.7)*.08);
    });
    if(enemy.torso){
     enemy.torso.rotation.x=.14+Math.sin(stride*2)*.04;
     enemy.torso.rotation.z=Math.cos(stride)*.08;
    }
    if(enemy.head){
     enemy.head.rotation.z=Math.sin(stride*.6)*.14;
     enemy.head.rotation.y=Math.cos(stride*.5)*.11;
    }
    if(enemy.jaw)enemy.jaw.rotation.x=.08+Math.abs(Math.sin(stride*1.2))*.18;
    if(crossedPlayer(previous,enemy.group.position.z)&&Math.abs(enemy.group.position.x-engine.player.position.x)<.9&&engine.run.y<1.6){
     enemy.active=false;enemy.group.visible=false;
     if(engine.run.invincible<=0&&engine.run.boostTime<=0){if(squad>1)squad--;else{engine.run.gap=Math.max(0,engine.run.gap-25);if(engine.run.gap<=0)engine.end()}engine.run.invincible=1.2;engine.sound.tone(100,.1,'triangle',.04)}
    }else if(enemy.group.position.z>8){enemy.active=false;enemy.group.visible=false}
   }
   shoot();
   if(allyCharacter!==engine.characterId){clearAllies();allyCharacter=engine.characterId}
   while(allies.length<squad-1){const ally=A.character(engine.characterId);ally.scale.setScalar(.68);engine.scene.add(ally);allies.push(ally)}
   allies.forEach((ally,i)=>{ally.visible=i<squad-1;ally.position.set(engine.player.position.x+(i%2?1:-1)*(.75+Math.floor(i/2)*.55),engine.run.y,1.2+Math.floor(i/2));ally.rotation.y=Math.PI;engine.animatePerson(ally,engine.time+i*.06,true)});
   for(const shot of shots)if(shot.visible){shot.position.z-=dt*240;shot.userData.life-=dt;if(shot.userData.life<=0)shot.visible=false}
  }
  uiClock+=dt;if(uiClock>.2){uiClock=0;const text=weather.label+(weather.rain>.65?' • نوة':weather.rain>.1?' • مطر':'');if(text!==lastHud){status.textContent=text;lastHud=text}const chText=(zombie?'🧟 هزمت '+kills+' • فريق '+squad+(event.remaining>0?' | ':''):'')+(event.remaining>0?(EVENTS[region.id]?.[0]||region.name)+' '+Math.ceil(event.remaining)+'ث • 🪙'+Math.min(6,engine.run.coins-event.coins)+'/٦':event.complete?'تم التحدي ✓':'');challenge.textContent=chText;challenge.hidden=!chText}
 }
 return {get event(){return event},tick,reset,destroy(){for(const [hex,m] of A.waterMaterials.entries())if(!m.userData?.water&&m.color&&typeof hex==='number')m.color.setHex(hex);for(const [m,entry] of waves){m.onBeforeCompile=entry.compile;m.customProgramCacheKey=entry.cacheKey;m.needsUpdate=true}waves.clear();clearAllies();window.removeEventListener('keydown',onKey);fire.removeEventListener('click',onFire);fire.remove();hud.remove();engine.scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose()}};
}
