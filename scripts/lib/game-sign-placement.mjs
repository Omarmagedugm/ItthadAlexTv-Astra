import ts from 'typescript';

// Both faces and their supports stay inside the clear road corridor (|x| < 4.2),
// in front of the facades, with the boards overhead and spaced along the route.
export function keepSignsClear(code) {
  const source = ts.createSourceFile('game.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const billboard = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'jp');
  const game = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'qC');
  const region = game?.members.find(member => member.name?.getText(source) === 'regionSign');
  if (!billboard || !region) throw new Error('Missing embedded sign generators');
  const ad = `function jp(r,t,n,{box:a,label:o}){const c=n==="komeldikka";if(t%(c?4:3)!==0)return;const u=new oe;u.name="ChannelBillboard";u.position.set(0,0,14);r.add(u);const h=c?2.3:4.2,p=c?6.2:7.2;a(u,3.85,p/2,0,.18,p,.18,3752767);a(u,2.4,p,0,3.1,.18,.18,3752767);a(u,1,p,0,h+.2,h+.2,.2,14538942);const g=new Mt(new Vs(h,h),iC());g.position.set(1,p,.12);g.userData.sharedMap=!0;g.userData.ownedGeometry=!0;u.add(g);a(u,1,p+h/2+.16,.18,h+.3,.12,.6,3951426);if(!c)o(u,"صوت زعيم الثغر",1,p-h/2-.35,.12,h,.5,"#104b37","#f3e9ca")}`;
  const entrance = `regionSign(group,index){if(index<0)return;const d=index*60,local=d%Uf,region=x0(d).current,i=Mr.indexOf(region),entry=i?Mr[i-1].end:0;if(local!==entry)return;const z=-18,y=6.6;Xt(group,3.85,y/2,z,.24,y,.24,0x919a9d);Xt(group,1.95,y,z,4.2,.18,.18,0x919a9d);Xt(group,0,y,z,6.9,2.35,.18,0xf4f1df);Be(group,region.name,0,y,z+.12,6.55,2.02,"#0757a2","#ffffff")}`;
  const patches = [[billboard.getStart(source),billboard.end,ad],[region.getStart(source),region.end,entrance]];
  for (const [start,end,replacement] of patches.sort((a,b)=>b[0]-a[0])) code=code.slice(0,start)+replacement+code.slice(end);
  return code;
}
