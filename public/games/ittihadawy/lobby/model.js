import {cleanOutfit} from './catalog.js';
function buildMotorcycle(attach,box,api){
 const bike=attach();bike.name='IttihadMotorcycle';
 const green=0x087b46,gold=0xe9c64b,dark=0x161b19,tireCol=0x121514,chrome=0xd9e0dc,white=0xf5f6e9;
 const makeWheel=zPos=>{
  const w=new api.Group;w.position.set(0,.34,zPos);bike.add(w);
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,seg=box(w,0,Math.cos(a)*27/100,Math.sin(a)*27/100,.17,.12,.18,tireCol);
   seg.rotation.x=-a;
  }
  for(let i=0;i<4;i++){
   const spoke=box(w,0,0,0,.11,.48,.042,i%2===0?gold:chrome);
   spoke.rotation.x=i*Math.PI/4;
  }
  const hub=new api.Mesh(new api.Sphere(.11,12,10),new api.Material({color:gold,roughness:.35}));
  hub.scale.set(1.35,1,1);w.add(hub);
  return w;
 };
 const frontWheel=makeWheel(.78),rearWheel=makeWheel(-.72);
 box(bike,0,.43,0,.32,.28,.52,dark);
 box(bike,0,.45,.04,.38,.18,.34,chrome);
 for(const side of [-1,1]){
  box(bike,side*.19,.42,.04,.04,.14,.18,gold);
  const fork=box(bike,side*.13,.68,.64,.055,.68,.055,chrome);fork.rotation.x=-.36;
  const pipe=box(bike,side*.21,.34,-.42,.065,.065,.78,chrome);pipe.rotation.x=.14;
  box(bike,side*.21,.39,-.78,.08,.08,.18,dark);
  box(bike,side*.27,.36,-.08,.12,.04,.06,dark);
  const swing=box(bike,side*.14,.36,-.38,.045,.07,.62,dark);swing.rotation.x=.06;
 }
 const fender=box(bike,0,.62,.76,.21,.045,.36,green);fender.rotation.x=.25;
 const tankMat=new api.Material({color:green,roughness:.4});
 const tank=new api.Mesh(new api.Sphere(.25,16,12),tankMat);
 tank.scale.set(.95,.68,1.65);tank.position.set(0,.78,.24);bike.add(tank);
 box(bike,0,.92,.24,.12,.03,.54,gold);
 box(bike,0,.82,.24,.38,.04,.46,white);
 box(bike,0,.72,-.24,.34,.11,.56,dark);
 const tail=box(bike,0,.81,-.58,.28,.12,.3,green);tail.rotation.x=.18;
 box(bike,0,.88,-.58,.14,.025,.24,gold);
 const tailLight=box(bike,0,.81,-.73,.16,.065,.04,0xff2b2b);
 tailLight.material.emissive?.setHex(0xd91b1b);tailLight.material.emissiveIntensity=.9;
 const stem=box(bike,0,.94,.5,.12,.18,.12,dark);stem.rotation.x=-.3;
 box(bike,0,1.03,.46,.78,.045,.045,chrome);
 for(const side of [-1,1]){
  box(bike,side*.36,1.03,.46,.18,.062,.062,dark);
  box(bike,side*.39,1.03,.5,.14,.07,.03,green);
  box(bike,side*.34,1.13,.47,.025,.12,.025,chrome);
  box(bike,side*.37,1.19,.47,.11,.07,.03,gold);
 }
 const cowl=box(bike,0,.9,.65,.28,.22,.16,green);cowl.rotation.x=-.22;
 const shield=box(bike,0,1.04,.61,.24,.16,.03,0x102f31);shield.rotation.x=-.45;
 const lampMat=new api.Material({color:0xfff6cf,roughness:.2});
 lampMat.emissive?.setHex(0xf2d15c);lampMat.emissiveIntensity=1.2;
 const lamp=new api.Mesh(new api.Sphere(.11,14,10),lampMat);
 lamp.scale.set(1,1,.55);lamp.position.set(0,.88,.73);bike.add(lamp);
 bike.userData={frontWheel,rearWheel,lamp,tailLight};
 return bike;
}
function applyMotorcyclePose(player,data){
 const bike=data.motorcycleGroup;if(!bike)return;
 const now=performance.now()*.001;
 const inLobby=Math.abs(player.position.z-8.6)<.08&&Math.abs(player.rotation.y-Math.PI)>.4;
 const isJumping=!inLobby&&player.position.y>.08;
 const isSliding=!inLobby&&data.bodyPivot.position.y<-.4;
 const isAbility=!inLobby&&data.leftArmPivot.rotation.x<-1.85;
 const rumble=Math.sin(now*(inLobby?22:44))*(inLobby?.006:.014);
 data.bodyPivot.position.y=(isSliding?-.48:-.35)+rumble;
 data.bodyPivot.position.z=-.18;
 data.torsoPivot.rotation.x=isSliding?.58:(inLobby?.14:.24);
 data.leftLegPivot.rotation.set(-1.02,-.14,-.16);
 data.rightLegPivot.rotation.set(-1.02,.14,.16);
 data.leftShinPivot.rotation.x=1.24;
 data.rightShinPivot.rotation.x=1.24;
 if(!isAbility){
  data.leftArmPivot.rotation.set(isSliding?-1.22:-1.05,0,.14);
  data.leftForearmPivot.rotation.x=-.32;
 }
 data.rightArmPivot.rotation.set(isSliding?-1.22:-1.05,0,-.14);
 data.rightForearmPivot.rotation.x=-.32;
 if(data.mabkharaPivot){data.mabkharaPivot.rotation.x=1.05;data.mabkharaPivot.rotation.z=.14}
 const spin=now*(inLobby?3.2:22);
 if(bike.userData?.frontWheel)bike.userData.frontWheel.rotation.x=spin;
 if(bike.userData?.rearWheel)bike.userData.rearWheel.rotation.x=spin;
 bike.position.y=rumble*.5;
 bike.rotation.x=isJumping?-.18:0;
}
export function applyOutfit(player,outfit,api){
 player.userData.lastOutfit=outfit;player.userData.refreshPrototypeOutfit=()=>applyOutfit(player,player.userData.lastOutfit,api);
 const data=player.userData,ride=Boolean(outfit?.motorcycle??data.motorcycleEnabled),signature=JSON.stringify({outfit,ride});if(data.cosmeticSignature===signature)return;
 data.cosmeticSignature=signature;
 for(const group of data.cosmeticGroups||[]){group.removeFromParent();group.traverse(m=>{m.geometry?.dispose();m.material?.dispose()})}data.cosmeticGroups=[];
 data.motorcycleGroup=null;
 if(data.bodyPivot){data.bodyPivot.position.z=0;data.leftLegPivot?.rotation.set(0,0,0);data.rightLegPivot?.rotation.set(0,0,0)}
 const parts=data.cosmeticParts;if(!parts)return;
 for(const [slot,meshes] of Object.entries(parts)){
  if(!Array.isArray(meshes))continue;
  for(const mesh of meshes){if(!mesh.userData.outfitMaterial){mesh.material=mesh.material.clone();mesh.userData.outfitMaterial=true;mesh.userData.originalColor=mesh.material.color.getHex();}
   mesh.material.color.set(outfit[slot]?.item==='default'?mesh.userData.originalColor:outfit[slot].color);
  }
 }
 const attach=parent=>{const group=new api.Group,target=data.prototypeAccessoryAnchors?.get(parent);
  (target||parent||player).add(group);
  if(target){group.scale.setScalar(parent===data.headPivot?.7:.75);if(parent===data.headPivot)group.position.set(0,.005,-.07);else if(parent===data.torsoPivot)group.position.z=-.19}
  data.cosmeticGroups.push(group);return group};
 const box=(g,x,y,z,w,h,d,color)=>{const m=new api.Mesh(new api.Box(w,h,d),new api.Material({color,roughness:.65}));m.position.set(x,y,z);g.add(m);return m};
 const cap=outfit.cap;
 for(const mesh of data.prototypeHeadwear||[])mesh.visible=cap.item==='default';
 for(const mesh of data.prototypeEyewear||[])mesh.visible=outfit.glasses.item==='default';
 if(!data.originalHeadwear){data.originalHeadwear=[];data.headPivot.traverse(item=>{if(item===parts.originalCap||item.name==='LazoBackwardsCap')data.originalHeadwear.push({item,visible:item===parts.originalCap?parts.capVisible:item.visible})})}
 for(const saved of data.originalHeadwear)saved.item.visible=!data.prototypeRoot&&cap.item==='default'&&saved.visible;
 if(!data.originalEyewear)data.originalEyewear=data.headPivot.children.filter(item=>item.isMesh&&item.geometry?.parameters?.width&&item.position.z>=.35&&((item.geometry.parameters.width===.27&&item.geometry.parameters.height===.18)||(item.geometry.parameters.width===.07&&item.geometry.parameters.height===.035))).map(item=>({item,visible:item.visible}));
 for(const saved of data.originalEyewear)saved.item.visible=!data.prototypeRoot&&outfit.glasses.item==='default'&&saved.visible;
 if(cap.item!=='default'){
  const g=attach(data.headPivot),material=new api.Material({color:cap.color,roughness:.8});
  if(data.prototypeAccessoryAnchors){g.scale.setScalar(.58);g.position.set(0,.10,0)}
  const crown=new api.Mesh(new api.Sphere(.39,20,12,0,Math.PI*2,0,Math.PI/2),material);crown.position.y=.61;g.add(crown);
  box(g,0,.62,.32,.68,.045,.47,cap.color);
  if(cap.item!=='green-cap')box(g,0,.71,.37,.18,.1,.025,0xe9c64b);
 }
 if(outfit.glasses.item!=='default'){
  const g=attach(data.headPivot),color=outfit.glasses.color;
  for(const side of [-1,1]){box(g,side*.16,.49,.366,.255,.16,.05,color);box(g,side*.16,.49,.398,.205,.11,.018,0x102f31);box(g,side*.29,.49,.2,.035,.04,.33,color)}box(g,0,.49,.39,.1,.035,.035,color);
 }
 if(outfit.shorts.item!=='default')for(const leg of [data.leftLegPivot,data.rightLegPivot]){const g=attach(leg);box(g,.16,-.26,.02,.035,.38,.22,0xf3efe4)}
 if(outfit.shoes.item!=='default')for(const shin of [data.leftShinPivot,data.rightShinPivot]){const g=attach(shin);box(g,0,-.59,.08,.25,.045,.45,0xf5f2df);box(g,0,-.46,.2,.15,.035,.1,0xf5f2df)}
 const legendary=Object.values(outfit).some(v=>v?.item==='legendary-kit');
 if(legendary){const g=attach(data.torsoPivot);for(const side of [-1,1]){const stripe=box(g,side*.28,.55,.46,.045,.63,.025,0xe9c64b);stripe.material.emissive.setHex(0xb29436);stripe.onBeforeRender=()=>{stripe.material.emissiveIntensity=.4+.25*Math.sin(performance.now()/550)}}data.cosmeticAura=g;}
 if(outfit.shirt.item!=='default'){const g=attach(data.torsoPivot);for(const side of [-1,1])box(g,side*.12,.55,.46,.06,.65,.025,0xf1eee3);box(g,-.25,.75,.47,.13,.15,.035,0xe9c64b)}
 if(ride){
  data.motorcycleGroup=buildMotorcycle(()=>attach(player),box,api);
  if(!data.origUpdateMatrixWorld&&typeof player.updateMatrixWorld==='function'){
   data.origUpdateMatrixWorld=player.updateMatrixWorld.bind(player);
   player.updateMatrixWorld=function(force){
    if(data.motorcycleGroup&&data.motorcycleGroup.parent===player)applyMotorcyclePose(player,data);
    return data.origUpdateMatrixWorld(force);
   };
  }
 }
}
export function lobbyPose(engine,time){
 const p=engine.player,d=p.userData;
 engine.scoreboard.visible=false;engine.speedMat.opacity=0;engine.officers.forEach(o=>o.visible=false);
 p.visible=true;p.position.set(0,.03,8.6);p.rotation.set(0,(engine.lobbyYaw||0)+.12*Math.sin(time*.22),0);
 const phase={gamal:0,adel:1.8,hamido:3.6,lazo:5.2,islam:6}[engine.characterId]||0;
 d.bodyPivot.position.y=.025*Math.sin(time*2+phase);d.bodyPivot.rotation.z=.025*Math.sin(time*.7+phase);
 d.torsoPivot.rotation.set(0,.035*Math.sin(time*.6),.012*Math.sin(time));
 d.headPivot.rotation.set(.035*Math.sin(time*1.3),.11*Math.sin(time*.8+phase),0);
 for(const leg of [d.leftLegPivot,d.rightLegPivot])leg.rotation.x=0;
 for(const shin of [d.leftShinPivot,d.rightShinPivot])shin.rotation.x=.03;
 d.leftArmPivot.rotation.set(-.08+Math.sin(time+phase)*.035,0,.08);
 d.rightArmPivot.rotation.set(-.12,0,-.08);
 d.leftForearmPivot.rotation.x=-.12;d.rightForearmPivot.rotation.x=-.22;
 const gesture=Math.max(0,Math.sin(time*.42+phase)-.9)*10;
 if(engine.characterId==='adel')d.leftArmPivot.rotation.x-=gesture*1.8;
 else if(engine.characterId==='hamido')d.rightForearmPivot.rotation.x-=gesture*.9;
 else if(engine.characterId==='lazo')d.headPivot.rotation.z=gesture*.15;
 else d.leftForearmPivot.rotation.x-=gesture;
 const blink=Math.sin(time*1.7+phase)>.992?.08:.48;for(const eye of d.eyes||[])eye.scale.y=blink;
 engine.camera.fov=42;engine.camera.updateProjectionMatrix();
 const portrait=engine.camera.aspect<1,shortLandscape=!portrait&&typeof window!=='undefined'&&window.innerHeight<=600;
 engine.camera.position.set(Math.sin(time*.12)*.22,shortLandscape?2.1:1.5,portrait?17.6:shortLandscape?15.7:16.8);
 engine.camera.lookAt(shortLandscape?1.45:0,shortLandscape?.95:portrait?-.32:-.22,8.6);
}
