import ts from 'typescript';

export function addMovingObstacles(code) {
  const movement='g.type==="dog"?1.35:.5';
  if(code.includes('["dog","tuktuk","motorcycle"].includes(g.type)')) {
    if(!code.includes(movement)) {
      if(code.includes('g.type==="dog"?4:2.7'))return code;
      throw new Error('Could not locate existing moving-obstacle motion');
    }
    return code.replace(movement,'g.type==="dog"?4:2.7').replace('Math.sin(a*1.8+g.at)*(g.type===','Math.sin(a*1.05+g.at)*(g.type===');
  }
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const game=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  if(!game)throw new Error('Could not locate game engine for moving obstacles');
  const replaceMethod=(name,from,to)=>{
    const method=game.members.find(m=>m.name?.getText(source)===name);
    if(!method)throw new Error(`Could not locate ${name} for moving obstacles`);
    const body=method.getText(source);
    if(body.split(from).length!==2)throw new Error(`Missing unique ${name} obstacle insertion point`);
    const next=body.replace(from,to);
    return [method.getStart(source),method.end,next];
  };
  const changes=[];
  changes.push(replaceMethod('getObject','else if(t==="block")Wx(u,{box:Xt,cylinder:Le,label:Be},14923837,!0);','else if(t==="tuktuk"){Xt(u,0,.82,0,1.65,.8,2.25,0xe8b52e);Xt(u,0,1.5,-.15,1.9,.16,1.65,0x246c4c);Xt(u,0,1.12,-.82,1.3,.46,.12,0x5e96a0);const wheels=[];for(const [x,z] of [[-.62,.72],[.62,.72],[0,-.83]]){const wheel=Le(u,x,.36,z,.31,.31,.18,0x242629,12);wheel.rotation.z=Math.PI/2;wheels.push(wheel)}const rider=ea(u,0,1.45,-.1,.22,0xb98566);Xt(u,0,1.05,-.1,.5,.55,.32,0x394d37);u.userData.movingWheels=wheels;u.userData.rider=rider;u.userData.riderBase=1.45}else if(t==="motorcycle"){const wheels=[];for(const z of[-.92,.83]){const wheel=Le(u,0,.36,z,.34,.34,.2,0x232629,14);wheel.rotation.z=Math.PI/2;wheels.push(wheel)}Xt(u,0,.72,0,.32,.23,1.05,0xd13e32);Xt(u,0,.91,-.2,.78,.17,.45,0x31353a);const rider=ea(u,0,1.48,-.08,.23,0xb88365);Xt(u,0,1.12,-.08,.5,.58,.35,0x354d70);u.userData.movingWheels=wheels;u.userData.rider=rider;u.userData.riderBase=1.48}else if(t==="dog"){const body=ea(u,0,.54,0,.42,0xb77b48,1.5,.75,.72),head=ea(u,0,.68,-.48,.28,0x9d6843),legs=[];for(const x of[-.22,.22])for(const z of[-.28,.27]){const leg=Xt(u,x,.23,z,.12,.48,.14,0x8a5838);legs.push(leg)}u.userData.dogBody=body;u.userData.dogHead=head;u.userData.dogLegs=legs}else if(t==="block")Wx(u,{box:Xt,cylinder:Le,label:Be},14923837,!0);'));
  changes.push(replaceMethod('spawn','let t=this.spawnAt,n=SC();for(let c of n){let u=Math.random(),h=u<.34?"low":u<.58?"high":u<.84?"block":"ball";','let t=this.spawnAt,n=SC(),zone=vr(t);for(let c of n){let u=Math.random(),h=u<.11?"dog":u<.34&&["komeldikka","karmouz","asafra"].includes(zone)?"tuktuk":u<.27?"motorcycle":u<.47?"low":u<.65?"high":u<.84?"block":"ball";'));
  changes.push(replaceMethod('tickRun','g.type==="ball"&&(g.group.position.x=g.lane*3+Math.sin(a*2+g.at)*.45,g.group.rotation.x+=t*2);','g.type==="ball"&&(g.group.position.x=g.lane*3+Math.sin(a*2+g.at)*.45,g.group.rotation.x+=t*2),["dog","tuktuk","motorcycle"].includes(g.type)&&(g.group.position.x=g.lane*3+Math.sin(a*1.8+g.at)*(g.type==="dog"?1.35:.5),(g.group.userData.movingWheels||[]).forEach(w=>w.rotation.x+=t*(g.type==="motorcycle"?8:5)),g.group.userData.rider&&(g.group.userData.rider.position.y=g.group.userData.riderBase+Math.sin(a*3+g.at)*.035),g.group.userData.dogLegs?.forEach((leg,i)=>leg.rotation.x=Math.sin(a*12+g.at+i)*.38));'));
  const collision='function MC(r,t,n){return r==="low"?t<1.05:r==="high"?!n:!0}';
  for(const [start,end,text] of changes.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+text+code.slice(end);
  if(code.split(collision).length!==2)throw new Error('Could not locate obstacle collision rules');
  code=code.replace(collision,'function MC(r,t,n){return r==="low"?t<1.05:r==="high"?!n:["dog","tuktuk","motorcycle"].includes(r)?t<1.45:!0}');
  return code;
}
