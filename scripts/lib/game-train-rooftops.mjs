import ts from 'typescript';

export function addTrainRooftopGameplay(code) {
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  if(!engine)throw new Error('Could not locate game engine for train rooftop obstacles');
  const getObject=engine.members.find(m=>m.name?.getText(source)==='getObject');
  const spawn=engine.members.find(m=>m.name?.getText(source)==='spawn');
  if(!getObject||!spawn)throw new Error('Could not locate train obstacle creation methods');
  // Restore normal street obstacles; the player now runs between ground-level trains.
  const replace=(text,from,to)=>text.includes(to)?text.replace(to,from):text;
  let objectText=getObject.getText(source);
  objectText=replace(objectText,'t==="low"){Xt(u,0,.55,0,1.9,1.1,.55,14190398);','t==="low"){if(vr(a)==="misrstation"){Xt(u,0,.55,0,1.75,1.1,1.1,0xb57837);Xt(u,0,1.12,0,1.35,.12,.8,0xe5c484)}else{Xt(u,0,.55,0,1.9,1.1,.55,14190398);');
  objectText=replace(objectText,'p.rotation.z=-.4}}else if(t==="high"){','p.rotation.z=-.4}}}else if(t==="high"){');
  objectText=replace(objectText,'else if(t==="high"){for(let h of[-1.05,1.05])Xt(u,h,1.3,0,.12,2.6,.2,Me.green);Xt(u,0,2.1,0,2.25,.75,.3,Me.green),Be(u,"ازحلق ↓",0,2.1,.16,1.6,.44)}','else if(t==="high"){if(vr(a)==="misrstation"){for(const x of[-1.15,1.15])Xt(u,x,1.25,0,.18,2.5,.3,0xd6ad42);Xt(u,0,2.42,0,2.5,.25,.5,0xe5c484)}else{for(let h of[-1.05,1.05])Xt(u,h,1.3,0,.12,2.6,.2,Me.green);Xt(u,0,2.1,0,2.25,.75,.3,Me.green),Be(u,"ازحلق ↓",0,2.1,.16,1.6,.44)}}');
  objectText=replace(objectText,'else if(t==="block")Wx(u,{box:Xt,cylinder:Le,label:Be},14923837,!0);','else if(t==="block"){if(vr(a)==="misrstation"){Xt(u,0,.85,0,2.4,1.7,1.8,0x9b583e);Xt(u,0,.92,0,2.5,.16,.2,0xd8bd83)}else Wx(u,{box:Xt,cylinder:Le,label:Be},14923837,!0)}');
  let spawnText=spawn.getText(source);
  spawnText=replace(spawnText,'h=u<.11?"dog":u<.34&&["komeldikka","karmouz","asafra"].includes(zone)?"tuktuk":u<.27?"motorcycle":u<.47?"low":u<.65?"high":u<.84?"block":"ball";','h=zone==="misrstation"?(u<.3?"low":u<.55?"high":u<.82?"block":"ball"):u<.11?"dog":u<.34&&["komeldikka","karmouz","asafra"].includes(zone)?"tuktuk":u<.27?"motorcycle":u<.47?"low":u<.65?"high":u<.84?"block":"ball";');
  const updates=[[getObject.getStart(source),getObject.end,objectText],[spawn.getStart(source),spawn.end,spawnText]];
  for(const [start,end,text] of updates.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+text+code.slice(end);
  return code;
}
