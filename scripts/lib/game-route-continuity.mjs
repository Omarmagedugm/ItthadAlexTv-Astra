import ts from 'typescript';

export function renderRecoveredDistrict(engine,group,index,zone) {
  const entry=Mr.find(r=>r.id===zone),previous=Mr[Mr.indexOf(entry)-1];
  const local=Math.floor((((index*60)%Uf+Uf)%Uf-(previous?.end||0))/60);
  Yx(group,index,{box:Xt,cylinder:Le,label:Be});
  if(entry.sea)Xt(group,-62,-.5,0,74,.2,60,3772317);
  if(zone==='montaza') {
    // One enlarged original palace on the right, with gardens along the whole zone.
    Xt(group,30,-.12,0,48,.18,60,0x568444);
    for(const x of [9,15,48])for(const z of [-23,-9,9,23]) {
      Le(group,x,2,z,.24,.32,4,0x775238,8);
      ea(group,x,5.1,z,1.7,0x397347,1,1.5,1);
    }
    if(local===5) {
      const palace=new oe;group.add(palace);
      palace.scale.set(1.45,1.45,1.35);
      dC(palace,'montaza',{box:Xt,cylinder:Le,label:Be});
    }
    Kp(group,new Set(br.values()));return;
  }
  if(zone==='gomrok')addRegionDetails(group,entry,local,{box:Xt,cylinder:Le,label:Be,ball:ea});
  for(const z of [-22,6]) {
    engine.light(group,7,z);
    // Keep the bridge, towers and monument free of generic facade overlaps.
    if(local!==5||zone==='gleem'||zone==='gomrok')engine.building(group,12,z,16,index+z);
    if(!entry.sea)engine.building(group,-27,z,16,index-z);
  }
  if(local===5) {
    if(zone==='stanley')cC(group,{box:Xt,cylinder:Le,label:Be});
    else if(zone==='mansheya')tC(group,{box:Xt,cylinder:Le,label:Be});
    else if(zone!=='gomrok')dC(group,zone,{box:Xt,cylinder:Le,label:Be});
  }
  if(entry.sea&&zone!=='gomrok')Zx(group,index,{box:Xt,ball:ea,cylinder:Le});
  Kp(group,new Set(br.values()));
}

export function restoreRouteContinuity(code) {
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  const segment=engine?.members.find(n=>n.name?.getText(source)==='segment');
  if(!segment)throw new Error('Missing scene dispatcher');
  let text=segment.getText(source);
  if(!text.includes('renderRecoveredDistrict(this')) {
    const anchor='o=vr(Math.max(0,a+30));';
    if(!text.includes(anchor))throw new Error('Missing route dispatcher anchor');
    text=text.replace(anchor,anchor+'if(["stanley","gleem","sanstefano","mansheya","gomrok","montaza"].includes(o)){renderRecoveredDistrict(this,t,n,o);return}');
  }
  text=text.replace('["stanley","gleem","sanstefano","memorial"].includes(o)', '["stanley","gleem","sanstefano","mansheya","gomrok","montaza"].includes(o)');
  if(!text.includes('addRegionDetails(t,{id:o},n')) {
    const anchor='oC(t,n,{box:Xt,cylinder:Le,label:Be}),';
    if(!text.includes(anchor))throw new Error('Missing Kom el Dikka dispatcher');
    text=text.replace(anchor,anchor+'addRegionDetails(t,{id:o},n,{box:Xt,cylinder:Le,label:Be,ball:ea}),');
  }
  const updates=[[segment.getStart(source),segment.end,text]];
  const existing=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='renderRecoveredDistrict');
  if(existing)updates.push([existing.getStart(source),existing.end,renderRecoveredDistrict.toString()]);
  // Open pavement space for the cart and cafe without altering running lanes.
  const alley=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='oC');
  let alleyText=alley.getText(source);
  if(!alleyText.includes('v=h*12.3')) {
    if(!alleyText.includes('v=h*8.3,_=h*5.4'))throw new Error('Missing alley facade positions');
    alleyText=alleyText.replace('v=h*8.3,_=h*5.4','v=h*12.3,_=h*9.4');
    alleyText=alleyText.replace('n(r,h*5,.02,0,1,.25,60,10327173)','n(r,h*7,.02,0,5,.25,60,10327173)');
    updates.push([alley.getStart(source),alley.end,alleyText]);
  }
  // A recovered Sidi Gaber stop must not inherit Misr Station's sign.
  const scenery=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ZR');
  let sceneryText=scenery.getText(source).replace('c(m,"محطة مصر",','c(m,t.id==="sidigaber"?"محطة سيدي جابر":"محطة مصر",');
  if(!sceneryText.includes('if(t.id==="misrstation")return;')) {
    const anchor='addRegionDetails(r,t,n,{box:a,cylinder:o,label:c,ball:u});';
    if(!sceneryText.includes(anchor))throw new Error('Missing station scenery anchor');
    sceneryText=sceneryText.replace(anchor,anchor+'if(t.id==="misrstation")return;');
  }
  updates.push([scenery.getStart(source),scenery.end,sceneryText]);
  for(const [start,end,replacement] of updates.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+replacement+code.slice(end);
  if(!existing)code+='\n'+renderRecoveredDistrict.toString();
  return code;
}
