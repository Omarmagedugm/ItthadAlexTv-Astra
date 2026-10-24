import ts from 'typescript';

export function renderOriginalLandmarks(engine,group,index,zone) {
  const route=Mr.find(r=>r.id===zone),previous=Mr[Mr.indexOf(route)-1];
  const offset=((index*60)%Uf+Uf)%Uf-(previous?.end||0),local=Math.floor(offset/60);
  Yx(group,index,{box:Xt,cylinder:Le,label:Be});
  Xt(group,zone==='shatby'?-85:-62,-.5,0,74,.2,60,3772317);
  for(const z of [-22,6]){engine.light(group,7,z);engine.palm(group,-21,z)}
  if(zone==='shatby') {
    sC(group,{box:Xt,cylinder:Le,label:Be});
    Xt(group,-34,-.16,0,36,.2,60,0xc6c3ad);
    if(local===1)addShatbyReferenceBuilding(group,{box:Xt,cylinder:Le,ball:ea});
    const legacy=9+local;
    if(local<5){
      $R(group,legacy,{box:Xt,cylinder:Le});
      Xy(group,legacy,{box:Xt,cylinder:Le,label:Be});
      if(local===1)engine.club(group);
      if(local===3)hC(group,{box:Xt,cylinder:Le,label:Be});
    }else for(const z of [-22,6])engine.building(group,12,z,16,index+z);
    nC(group,index,{box:Xt,cylinder:Le,label:Be},local<5);
  }else {
    if(local===5){if(zone==='bahary')engine.citadel(group);else engine.library(group);}
    if(zone==='bahary'||local<4||local>6)for(const z of [-22,6])engine.building(group,12,z,16,index+z);
    nC(group,index,{box:Xt,cylinder:Le,label:Be},false);
  }
  if(zone!=='shatby'||local!==1)Zx(group,index,{box:Xt,ball:ea,cylinder:Le});
  Kp(group,new Set(br.values()));
}

export function restoreOriginalLandmarks(code) {
  if(code.includes('function renderOriginalLandmarks(')) {
    const parsed=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    const updates=[];
    for(const fn of [renderOriginalLandmarks,addShatbyReferenceBuilding]) {
      const old=parsed.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===fn.name);
      if(old)updates.push([old.getStart(parsed),old.end,fn.toString()]);
      else code+='\n'+fn.toString();
    }
    for(const [start,end,text] of updates.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+text+code.slice(end);
    return code.replace('if(o==="shatby"||o==="azareeta"){renderOriginalLandmarks', 'if(o==="shatby"||o==="azareeta"||o==="bahary"){renderOriginalLandmarks');
  }
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  const segment=engine?.members.find(m=>m.name?.getText(source)==='segment');
  if(!segment)throw new Error('Missing landmark dispatcher');
  let text=segment.getText(source),needle='o=vr(Math.max(0,a+30));';
  if(!text.includes(needle))throw new Error('Missing landmark insertion point');
  text=text.replace(needle,needle+'if(o==="shatby"||o==="azareeta"||o==="bahary"){renderOriginalLandmarks(this,t,n,o);return}');
  return code.slice(0,segment.getStart(source))+text+code.slice(segment.end)+'\n'+renderOriginalLandmarks.toString()+'\n'+addShatbyReferenceBuilding.toString();
}


export function addShatbyReferenceBuilding(group,{box,cylinder,ball}) {
  // Opposite the original club: long red facade, cream arches and central dome.
  const stone=0xe0d7bf,red=0x934e43,glass=0x324949;
  box(group,-34,4.9,0,17,9.8,52,red);
  box(group,-24.9,.7,0,1.2,1.4,53,stone);
  for(const y of [4.8,8.2,10])box(group,-24.8,y,0,1,.3,53,stone);
  for(const z of [-24,-20,-16,-12,-8,8,12,16,20,24]) {
    box(group,-24.7,3,z,.2,3.6,2.1,glass);
    for(const side of [-1,1])cylinder(group,-24.4,3,z+side*1.25,.12,.15,4.2,stone,8);
    for(let i=0;i<9;i++) {
      const angle=i*Math.PI/8;
      const arch=box(group,-24.3,5.1+Math.sin(angle)*1.25,z+Math.cos(angle)*1.25,.4,.32,.5,stone);
      arch.rotation.x=angle-Math.PI/2;
    }
    box(group,-24.6,9,z,.22,1.2,1.2,glass);
  }
  box(group,-31,6.1,0,13,12.2,12,stone);
  for(const z of [-4,0,4]) {
    box(group,-24.35,2.4,z,.18,4.8,2.5,0x293b39);
    box(group,-24.3,7.2,z,.18,2.8,2.4,glass);
    for(let i=0;i<9;i++) {
      const angle=i*Math.PI/8;
      const arch=box(group,-24.1,8.6+Math.sin(angle)*1.3,z+Math.cos(angle)*1.3,.4,.35,.5,stone);
      arch.rotation.x=angle-Math.PI/2;
    }
  }
  cylinder(group,-31,12.4,0,4.6,4.6,1.4,stone,24);
  ball(group,-31,13.4,0,4.5,stone,1,.9,1);
  cylinder(group,-31,17.5,0,1.05,1.2,2.8,stone,16);
  ball(group,-31,19,0,1.15,stone,1,.65,1);
  for(const z of [-5.5,5.5])box(group,-24,6,z,.5,12,.7,stone);
}
