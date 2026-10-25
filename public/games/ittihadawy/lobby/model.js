import {cleanOutfit} from './catalog.js';
export function applyOutfit(player,outfit,api){
 const data=player.userData,signature=JSON.stringify(outfit);if(data.cosmeticSignature===signature)return;
 data.cosmeticSignature=signature;
 for(const group of data.cosmeticGroups||[]){group.removeFromParent();group.traverse(m=>{m.geometry?.dispose();m.material?.dispose()})}data.cosmeticGroups=[];
 const parts=data.cosmeticParts;if(!parts)return;
 for(const [slot,meshes] of Object.entries(parts)){
  if(!Array.isArray(meshes))continue;
  for(const mesh of meshes){if(!mesh.userData.outfitMaterial){mesh.material=mesh.material.clone();mesh.userData.outfitMaterial=true;mesh.userData.originalColor=mesh.material.color.getHex();}
   mesh.material.color.set(outfit[slot]?.item==='default'?mesh.userData.originalColor:outfit[slot].color);
  }
 }
 const attach=parent=>{const group=new api.Group;parent.add(group);data.cosmeticGroups.push(group);return group};
 const box=(g,x,y,z,w,h,d,color)=>{const m=new api.Mesh(new api.Box(w,h,d),new api.Material({color,roughness:.65}));m.position.set(x,y,z);g.add(m);return m};
 const cap=outfit.cap;
 if(!data.originalHeadwear){data.originalHeadwear=[];data.headPivot.traverse(item=>{if(item===parts.originalCap||item.name==='LazoBackwardsCap')data.originalHeadwear.push({item,visible:item===parts.originalCap?parts.capVisible:item.visible})})}
 for(const saved of data.originalHeadwear)saved.item.visible=cap.item==='default'&&saved.visible;
 if(!data.originalEyewear)data.originalEyewear=data.headPivot.children.filter(item=>item.isMesh&&item.geometry?.parameters?.width&&item.position.z>=.35&&((item.geometry.parameters.width===.27&&item.geometry.parameters.height===.18)||(item.geometry.parameters.width===.07&&item.geometry.parameters.height===.035))).map(item=>({item,visible:item.visible}));
 for(const saved of data.originalEyewear)saved.item.visible=outfit.glasses.item==='default'&&saved.visible;
 if(cap.item!=='default'){
  const g=attach(data.headPivot),material=new api.Material({color:cap.color,roughness:.8});
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
 const legendary=Object.values(outfit).some(v=>v.item==='legendary-kit');
 if(legendary){const g=attach(data.torsoPivot);for(const side of [-1,1]){const stripe=box(g,side*.28,.55,.46,.045,.63,.025,0xe9c64b);stripe.material.emissive.setHex(0xb29436);stripe.onBeforeRender=()=>{stripe.material.emissiveIntensity=.4+.25*Math.sin(performance.now()/550)}}data.cosmeticAura=g;}
 if(outfit.shirt.item!=='default'){const g=attach(data.torsoPivot);for(const side of [-1,1])box(g,side*.12,.55,.46,.06,.65,.025,0xf1eee3);box(g,-.25,.75,.47,.13,.15,.035,0xe9c64b)}
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
 const portrait=engine.camera.aspect<1;engine.camera.position.set(Math.sin(time*.12)*.25,2.5,portrait?16.7:15.7);engine.camera.lookAt(portrait?0:1.6,1.5,8.6);
}
