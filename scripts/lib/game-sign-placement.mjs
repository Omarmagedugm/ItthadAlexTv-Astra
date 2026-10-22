import ts from 'typescript';

// Region markers stay clear of facades. Ads use the median/side of the alley,
// a smaller face, long spacing, and distance culling before reaching the camera.
export function keepSignsClear(code) {
  const source = ts.createSourceFile('game.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const billboard = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'jp');
  const game = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'qC');
  const region = game?.members.find(member => member.name?.getText(source) === 'regionSign');
  if (!billboard || !region) throw new Error('Missing embedded sign generators');
  const ad = `function jp(r,t,n,{box:a,label:o}){if(t<0||t%18!==0)return;const c=n==="komeldikka",u=new oe;u.name="ChannelBillboard";u.userData.channelAd=true;u.position.set(c?3.15:-6.5,0,0);r.add(u);const h=c?1.5:2.7,p=c?4.6:3.8;a(u,0,p/2,0,.16,p,.16,3752767);a(u,0,p,0,h+.2,h+.2,.16,14538942);const g=new Mt(new Vs(h,h),iC());g.position.set(0,p,.1);g.userData.sharedMap=!0;g.userData.ownedGeometry=!0;u.add(g);a(u,0,p+h/2+.12,.1,h+.3,.1,.35,3951426);if(!c)o(u,"صوت زعيم الثغر",0,p-h/2-.28,.1,h,.4,"#104b37","#f3e9ca");u.traverse(part=>{if(part.isMesh)part.userData.noBatch=true})}`;
  const entrance = `regionSign(group,index){if(index<0)return;const d=index*60,local=d%Uf,region=x0(d).current,i=Mr.indexOf(region),entry=i?Mr[i-1].end:0;if(local!==entry)return;const z=-18,y=6.6;Xt(group,3.85,y/2,z,.24,y,.24,0x919a9d);Xt(group,1.95,y,z,4.2,.18,.18,0x919a9d);Xt(group,0,y,z,6.9,2.35,.18,0xf4f1df);Be(group,region.name,0,y,z+.12,6.55,2.02,"#0757a2","#ffffff")}`;
  const patches = [[billboard.getStart(source),billboard.end,ad],[region.getStart(source),region.end,entrance]];
  for (const [start,end,replacement] of patches.sort((a,b)=>b[0]-a[0])) code=code.slice(0,start)+replacement+code.slice(end);
  // Keep the entire ad (including frame/support) in one cullable group.
  const batchGuard='if(!o.isMesh||o.isInstancedMesh||!t.has(o.material))return;';
  if(code.includes(batchGuard))code=code.replace(batchGuard,'if(!o.isMesh||o.userData.noBatch||o.isInstancedMesh||!t.has(o.material))return;');
  if(!code.includes('updateAdVisibility(){')) {
    const updated=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    const engine=updated.statements.find(node=>ts.isClassDeclaration(node)&&node.name?.text==='qC');
    const update=engine.members.find(member=>member.name?.getText(updated)==='updateWorld');
    const method=update.getText(updated);
    const visibility='updateAdVisibility(){for(const segment of this.segments)for(const ad of segment.group.children){if(!ad.userData.channelAd)continue;const z=segment.group.position.z+ad.position.z;ad.visible=z<=-12&&z>=-160}}';
    code=code.slice(0,update.getStart(updated))+method.slice(0,-1)+'this.updateAdVisibility()}'+visibility+code.slice(update.end);
  }
  return code;
}
