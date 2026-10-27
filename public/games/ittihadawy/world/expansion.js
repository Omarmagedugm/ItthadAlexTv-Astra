import {EVENTS,canPlayZombie,weatherAt,crossedPlayer,eventComplete} from './rules.js';

// Receives the existing engine's Three classes: no second renderer or Three download.
export function installExpansion(Engine,A) {
 const proto=Engine.prototype;
 if(proto.expansionInstalled)return;
 proto.expansionInstalled=true;
 const oldTick=proto.tickParticles,oldReset=proto.reset,oldDestroy=proto.destroy,oldGet=proto.getObject;
 proto.setGameMode=function(mode){
  this.gameMode=mode==='zombie'&&canPlayZombie(this.lobbyProfile)?'zombie':'runner';
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
 const {Group,Mesh,Box,Material,Color,Geometry,Attribute,LineMaterial,Lines}=A;
 const root=new Group();root.name='IttihadawyExpansion';engine.scene.add(root);
 const geometries=new Set(),materials=new Set();
 const geometry=(...size)=>{const g=new Box(...size);geometries.add(g);return g};
 const material=options=>{const m=new Material(options);materials.add(m);return m};
 const cube=geometry(1,1,1),debrisMat=material({color:0x716c60,roughness:1}),darkMat=material({color:0x283237,roughness:1});
 const glowMat=material({color:0xffd395,emissive:0xffbd67,emissiveIntensity:0,transparent:true,opacity:0});
 const wetMat=material({color:0x8eaeb7,metalness:.65,roughness:.12,transparent:true,opacity:0,depthWrite:false});
 const rainGeo=new Geometry(),rainData=new Float32Array(120*6);geometries.add(rainGeo);
 rainGeo.setAttribute('position',new Attribute(rainData,3));
 const rainMat=new LineMaterial({color:0xc7e4f2,transparent:true,opacity:0,depthWrite:false});materials.add(rainMat);
 const rain=new Lines(rainGeo,rainMat);rain.frustumCulled=false;root.add(rain);
 const drops=Array.from({length:120},()=>({x:Math.random()*24-12,y:Math.random()*16,z:-Math.random()*90}));
 const fixtures=[],rubble=[],puddles=[],poles=[],cracks=[];
 const waves=new Map();
 function box(parent,mat,x,y,z,sx,sy,sz){const mesh=new Mesh(cube,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 for(let i=0;i<12;i++){
  const x=i%2?8:-8,z=-10-Math.floor(i/2)*22;
  fixtures.push(box(root,glowMat,x,4.6,z,.45,.18,.6));
  poles.push(box(root,darkMat,x,2.3,z,.09,4.6,.09));
  const puddle=box(root,wetMat,(i%3-1)*3,.018,-5-i*11,1.6,.012,4);puddles.push(puddle);
 }
 for(let i=0;i<28;i++){
  const x=(i%2?1:-1)*(5.5+(i%4)*.8),z=-i*5;
  const mesh=box(root,i%3?debrisMat:darkMat,x,.15+(i%3)*.1,z,.45+(i%3)*.35,.3+(i%3)*.2,.8);
  mesh.rotation.set(.1*i,.8*i,.2*i);rubble.push(mesh);
 }
 for(let i=0;i<12;i++){const crack=box(root,darkMat,(i%3-1)*3,.028,-i*12,.045,.012,1.5);crack.rotation.y=.7+i;cracks.push(crack)}
 const enemies=[],skin=material({color:0x739277,roughness:1}),cloth=material({color:0x594b62,roughness:1});
 for(let i=0;i<8;i++){
  const group=new Group();root.add(group);
  box(group,cloth,0,1,0,.65,.8,.38);box(group,skin,0,1.65,0,.44,.46,.43);
  const legs=[-1,1].map(side=>box(group,darkMat,side*.18,.38,0,.22,.75,.25));
  const arms=[-1,1].map(side=>box(group,skin,side*.42,1.1,.24,.18,.2,.8));
  group.visible=false;enemies.push({group,legs,arms,active:false,hp:1});
 }
 const shotMat=material({color:0xb9ffb3,emissive:0x70ff77,emissiveIntensity:2});
 const shots=Array.from({length:12},()=>{const mesh=box(root,shotMat,0,1,0,.07,.07,.8);mesh.visible=false;return mesh});
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
  fireClock=manual?.22:Math.max(.23,.65-squad*.07);
  const targets=enemies.filter(e=>e.active&&e.group.position.z<0&&e.group.position.z>-70&&Math.abs(e.group.position.x-engine.player.position.x)<1.5).sort((a,b)=>b.group.position.z-a.group.position.z);
  const shot=shots.find(s=>!s.visible);if(shot){shot.visible=true;shot.position.set(engine.player.position.x,1.25,-1);shot.userData.life=.12}
  if(targets[0]){const target=targets[0];target.hp-=squad;if(target.hp<=0){target.active=false;target.group.visible=false;kills++;engine.run.points+=40;engine.puff(target.group.position.x,1,target.group.position.z,true);if(kills%8===0&&squad<5){squad++;engine.cb.toast('انضم فرد من نفس شخصيتك للفريق!')}}}
  engine.sound.tone(360,.045,'triangle',.018);
 }
 function reset(){clock=0;spawnClock=0;fireClock=0;kills=0;squad=1;lastRegion='';event=null;for(const enemy of enemies){enemy.active=false;enemy.group.visible=false}for(const shot of shots)shot.visible=false;for(const ally of allies)ally.visible=false;}
 function tick(dt){
  const playing=engine.state==='PLAYING',zombie=engine.gameMode==='zombie';
  hud.hidden=!playing;fire.hidden=!(playing&&zombie);
  if(playing)clock+=dt;
  weather=weatherAt(clock);
  tint.set(weather.sky).lerp(nextTint.set(weather.nextSky),weather.blend);
  engine.scene.background.copy(tint);engine.scene.fog.color.copy(tint).lerp(nextTint.set(0x8ca4ad),weather.rain*.35);
  engine.scene.fog.near=95;engine.scene.fog.far=205-weather.rain*25;
  engine.sun.intensity=2.4-weather.night*1.5-weather.rain*.5;engine.fill.intensity=.65+weather.night*.2;
  glowMat.emissiveIntensity=weather.night*2;glowMat.opacity=weather.night*.95;wetMat.opacity=weather.rain*.24;
  rainMat.opacity=weather.rain*.45;
  const count=engine.opts.quality==='low'?40:120;rainGeo.setDrawRange(0,count*2);
  for(let i=0;i<count;i++){
   const d=drops[i];if(playing){d.y-=dt*(14+weather.wind*8);d.x+=dt*weather.wind*5;if(d.y<0){d.y=16;d.x=Math.random()*24-12}if(d.x>12)d.x=-12}
   const p=i*6;rainData[p]=d.x;rainData[p+1]=d.y;rainData[p+2]=d.z;rainData[p+3]=d.x-weather.wind*.35;rainData[p+4]=d.y+.7;rainData[p+5]=d.z;
  }
  rainGeo.attributes.position.needsUpdate=true;rain.visible=weather.rain>.01;
  for(const [i,mesh] of rubble.entries()){mesh.visible=zombie&&playing;mesh.position.z=((engine.run.distance+i*5)%140)-135}
  for(const [i,mesh] of puddles.entries())mesh.position.z=((engine.run.distance+i*11)%140)-135;
  for(const [i,mesh] of fixtures.entries()){mesh.position.z=((engine.run.distance+Math.floor(i/2)*22)%140)-135;poles[i].position.z=mesh.position.z;poles[i].rotation.z=zombie?(i%2?.12:-.12):0}
  for(const [i,mesh] of cracks.entries()){mesh.visible=zombie&&playing;mesh.position.z=((engine.run.distance+i*12)%140)-135}
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
   engine.cb.toast((EVENTS[region.id]?.[0]||region.name)+' — اجمع ٦ عملات وتفادى ٣ عوائق');
  }
  if(event.remaining>0){event.remaining=Math.max(0,event.remaining-dt);if(eventComplete(event,engine.run)){event.complete=true;event.remaining=0;engine.run.points+=250;engine.cb.toast('تم تحدي المنطقة! +٢٥٠ نقطة')}}
  if(zombie){
   fireClock=Math.max(0,fireClock-dt);spawnClock-=dt;
   if(spawnClock<=0){const enemy=enemies.find(e=>!e.active);if(enemy){enemy.active=true;enemy.hp=1+Math.floor(kills/12);enemy.group.position.set((Math.floor(Math.random()*3)-1)*3,0,-85);enemy.group.visible=true}spawnClock=Math.max(.8,2.6-kills*.025)}
   for(const enemy of enemies){if(!enemy.active)continue;enemy.group.visible=true;const previous=enemy.group.position.z;enemy.group.position.z+=(engine.run.speed+3)*dt;enemy.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(clock*9+i*Math.PI)*.45);
    if(engine.run.smoke>0&&enemy.group.position.z>-16){enemy.active=false;enemy.group.visible=false;kills++;engine.run.points+=40;continue}
    if(crossedPlayer(previous,enemy.group.position.z)&&Math.abs(enemy.group.position.x-engine.player.position.x)<.9&&engine.run.y<1.6){
     enemy.active=false;enemy.group.visible=false;
     if(engine.run.invincible<=0&&engine.run.boostTime<=0){if(squad>1)squad--;else{engine.run.gap=Math.max(0,engine.run.gap-25);if(engine.run.gap<=0)engine.end()}engine.run.invincible=1.2;engine.sound.tone(100,.1,'triangle',.04)}
    }else if(enemy.group.position.z>8){enemy.active=false;enemy.group.visible=false}
   }
   shoot();
   if(allyCharacter!==engine.characterId){clearAllies();allyCharacter=engine.characterId}
   while(allies.length<squad-1){const ally=A.character(engine.characterId);ally.scale.setScalar(.68);engine.scene.add(ally);allies.push(ally)}
   allies.forEach((ally,i)=>{ally.visible=i<squad-1;ally.position.set(engine.player.position.x+(i%2?1:-1)*(.75+Math.floor(i/2)*.55),engine.run.y,1.2+Math.floor(i/2));ally.rotation.y=Math.PI;engine.animatePerson(ally,engine.time+i*.06,true)});
   for(const shot of shots)if(shot.visible){shot.position.z-=dt*150;shot.userData.life-=dt;if(shot.userData.life<=0)shot.visible=false}
  }
  uiClock+=dt;if(uiClock>.2){uiClock=0;const text=weather.label+(weather.rain>.65?' • نوة شتوية':weather.rain>.1?' • أمطار':' • صافي');if(text!==lastHud){status.textContent=text;lastHud=text}challenge.textContent=(zombie?'حرب الزومبي • الفريق '+squad+' • هزمت '+kills+' | ':'')+(event.remaining>0?EVENTS[region.id]?.[0]+' • '+Math.ceil(event.remaining)+'ث • 🪙 '+Math.min(6,engine.run.coins-event.coins)+'/٦ • '+Math.min(3,engine.run.avoided-event.avoided)+'/٣':event.complete?'تحدي المنطقة مكتمل ✓':'التحدي التالي في المنطقة الجاية')}
 }
 return {get event(){return event},tick,reset,destroy(){for(const [m,entry] of waves){m.onBeforeCompile=entry.compile;m.customProgramCacheKey=entry.cacheKey;m.needsUpdate=true}waves.clear();clearAllies();window.removeEventListener('keydown',onKey);fire.removeEventListener('click',onFire);fire.remove();hud.remove();engine.scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose()}};
}
