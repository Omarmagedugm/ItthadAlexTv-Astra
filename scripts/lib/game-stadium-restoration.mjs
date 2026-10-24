import ts from 'typescript';

// Match XC's original eight concrete tiers, seat batching and rail materials.
export function addGateGrandstands(group, { box, cylinder, crowd }) {
  const spectators=[];
  for (const [left,right] of [[-52,-7.4],[7.4,21]]) {
    const width=right-left, center=(left+right)/2;
    for(let row=0;row<8;row++) {
      const y=row*.62,z=-7-row*1.15;
      box(group,center,y-.12,z,width,.5,1.2,15656920);
      // Solid tier risers support the seats and close sightlines under the stands.
      if(row>0)box(group,center,(y-.37)/2,z,width,y-.37,1.15,15656920);
      for(let x=left+.65;x<right-.4;x+=1.1) {
        if(Math.abs(x-center)<1.2)continue;
        spectators.push([x,y,z]);
      }
      box(group,center,y+.11,z,2,.16,1.16,16183519);
    }
    box(group,center,4.8,-16.2,width,1.3,.38,15919317);
    for(let x=left+.4;x<right;x+=2)cylinder(group,x,1.28,-6.3,.035,.035,1.5,3885382,6);
    box(group,center,1.95,-6.3,width,.07,.07,3885382);
  }
  crowd(group,spectators,{seats:true});
}

export function restoreStadium(code) {
  if(code.includes('function addGateGrandstands('))return code;
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const engine=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='qC');
  const method=engine?.members.find(n=>n.name?.getText(source)==='segment');
  if(!method)throw new Error('Cannot locate stadium scene dispatcher');
  let text=method.getText(source);
  const marker='o=vr(Math.max(0,a+30));';
  if(!text.includes(marker)||!text.includes('p=YR(o);'))throw new Error('Unexpected stadium scene dispatcher');
  text=text.replace(marker,marker+'const stadiumChunk=((n%(Uf/60))+(Uf/60))%(Uf/60);if(o==="stadium"&&stadiumChunk===5){Xt(t,0,-.25,0,10,.4,60,11033929);Xt(t,-24,-.18,0,34,.15,60,4684867);XC(t,n,{box:Xt,cylinder:Le,label:Be});this.gate(t);addGateGrandstands(t,{box:Xt,cylinder:Le,crowd:kC});Kp(t,new Set(br.values()));return}if(o==="stadium"&&stadiumChunk===6)o="gate";');
  text=text.replace('p=YR(o);','p=o==="stadium"||o==="gate"?null:YR(o);');
  return code.slice(0,method.getStart(source))+text+code.slice(method.end)+'\n'+addGateGrandstands.toString();
}
