import ts from 'typescript';

export function lowerStadiumSigns(code) {
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const stadium=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='XC');
  const banner=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addStadiumFanBanner');
  const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  const segment=engine?.members.find(n=>n.name?.getText(source)==='segment');
  if(!stadium||!banner||!segment)throw new Error('Missing stadium signs');
  let stands=stadium.getText(source);
  const original='for(const u of[-23,23]){const h=o(r,"الاتحاد سيد البلد",8.7,2,u,8,1);h.rotation.y=-Math.PI/2;const p=bf(r,8.66,2,u-4.7,.8,1.05);p.rotation.y=-Math.PI/2}';
  const hung='for(const u of[-20,20]){const h=o(r,"الاتحاد سيد البلد",9.65,1.25,u,14,1.1);h.name="StadiumLowerSlogan";h.rotation.y=-Math.PI/2;for(const z of[u-6,u+6])n(r,9.7,1.85,z,.05,.3,.05,3885382)}';
  if(!stands.includes(hung)){
    if(!stands.includes(original))throw new Error('Unexpected stadium sign layout');
    stands=stands.replace(original,hung);
  }
  let imageBanner=banner.getText(source).replace('banner.position.set(9.7,2.9,0)','banner.position.set(9.7,1.25,0)');
  imageBanner=imageBanner.replace('function addStadiumFanBanner(group,index){','function addStadiumFanBanner(group,index,layout){');
  imageBanner=imageBanner.replace('new Vs(18,1.9)','new Vs(layout?.width||18,(layout?.width||18)*1.9/18)');
  imageBanner=imageBanner.replace('banner.rotation.y=-Math.PI/2;banner.position.set(9.7,1.25,0);','banner.rotation.y=layout?.rotation??-Math.PI/2;banner.position.set(layout?.x??9.7,layout?.y??1.25,layout?.z??0);');
  let scene=segment.getText(source).replace('Be(t,"الاتحاد سيد البلد",12,4,0,10,1.1),','');
  if(!scene.includes('addGateCelebration(t)')) {
    const anchor='addGateGrandstands(t,{box:Xt,cylinder:Le,crowd:kC});';
    if(!scene.includes(anchor))throw new Error('Missing gate stands');
    scene=scene.replace(anchor,anchor+'addGateCelebration(t);');
  }
  const old=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='addGateCelebration');
  const updates=[[stadium,stands],[banner,imageBanner],[segment,scene]];
  if(old)updates.push([old,addGateCelebration.toString()]);
  for(const [node,text] of updates.sort((a,b)=>b[0].getStart(source)-a[0].getStart(source)))code=code.slice(0,node.getStart(source))+text+code.slice(node.end);
  if(!old)code+='\n'+addGateCelebration.toString();
  return code;
}

export function addGateCelebration(group) {
  // The original uploaded artwork faces the approaching player, on the front rails.
  addStadiumFanBanner(group,0,{x:-29.7,y:1.65,z:-5.9,width:24,rotation:0});
  addStadiumFanBanner(group,0,{x:14.2,y:1.1,z:-5.9,width:12,rotation:0});
  const supporters=[];
  for(const [left,right] of [[-49,-10],[10,19]])for(let x=left;x<right;x+=1.35) {
    supporters.push([x,4.5,-14.7]);
    for(const side of [-1,1]) {
      const arm=Xt(group,x+side*.3,5.35,-14.7,.13,.75,.13,0x087c45);
      arm.rotation.z=-side*.55;
    }
  }
  kC(group,supporters);
  for(const x of [-46,-34,-20,11,17]) {
    Le(group,x,7,-14,.07,.09,5.2,0xe5e0c9,8);
    const flag=Xt(group,x+1.3,8.6,-14,2.6,1.7,.06,0x078341);
    flag.userData.flag=true;
    Xt(group,x+1.3,8.6,-13.96,2.6,.48,.025,0xf2eee0);
  }
  // Unlit flame cores and translucent halos remain bright without costly shadow lights.
  for(const x of [-42,-26,-13,13,18]) {
    Le(group,x,5.9,-13,.08,.1,.8,0x454540,8);
    for(const [radius,color,opacity] of [[.85,0xff5522,.12],[.5,0xffa130,.3],[.18,0xfff1a3,1]]) {
      const glow=ea(group,x,6.45,-13,radius,color,1,1.4,1);
      glow.material=new pi({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
      glow.userData.ownedMaterial=true;
    }
    for(let i=0;i<3;i++) {
      const smoke=ea(group,x+i*.2,7.2+i*.7,-13,.35+i*.17,0xc5c3b6,1,1.2,1);
      smoke.material=new pi({color:0xc5c3b6,transparent:true,opacity:.18-i*.035,depthWrite:false});
      smoke.userData.ownedMaterial=true;
    }
  }
}
