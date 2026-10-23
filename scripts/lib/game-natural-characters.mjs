// Refine the existing animated models; retain their joints and ability attachments.
export function naturalCharacterPatch(code) {
  const swap=(from,to)=>{
    if(code.split(from).length!==2)throw new Error('Missing unique character target: '+from.slice(0,80));
    code=code.replace(from,to);
  };
  const surfaces=`const naturalSurfaceCache=new Map;function naturalSurface(kind){if(naturalSurfaceCache.has(kind))return naturalSurfaceCache.get(kind);const canvas=document.createElement("canvas");canvas.width=canvas.height=128;const ctx=canvas.getContext("2d"),pixels=ctx.createImageData(128,128);let seed=31;for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(1664525*seed+1013904223)>>>0;const grain=(seed>>>24)/255,value=kind==="cloth"?118+((x%3===0||y%3===0)?16:0)+grain*8:122+grain*12,i=(y*128+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);const texture=new ns(canvas);texture.wrapS=texture.wrapT=Ja;texture.repeat.set(kind==="cloth"?4:2,kind==="cloth"?4:2);naturalSurfaceCache.set(kind,texture);return texture}`;
  swap('function jx(r="gamal"){',surfaces+'function jx(r="gamal"){');
  swap('new dn(.36,20,20)','new dn(.36,32,24)');
  const refinements=`
// Smaller head, longer legs and softer facial proportions based on the references.
gt.scale.setScalar(.84);S.position.y=1.27;
for(const leg of [Ca,D]){leg.position.y=1.23;leg.scale.y=1.1}
for(const eye of [F,yt]){eye.scale.set(.86,.48,.46);eye.userData.naturalEyeY=.48}
for(const pupil of [bt,vt]){pupil.scale.set(.62,.62,.4);pupil.position.z=.338;pupil.userData.naturalEyeY=.62}
Ft.color.setHex(0xe2dfd6);Ot.color.setHex(0x30271f);At.color.setHex(0x704d43);
for(const brow of [Et,Tt]){brow.scale.set(.9,.6,.55);brow.position.y=.515;brow.position.z=.32}
dt.scale.set(.72,1.25,.95);dt.position.z=.335;
for(const cheek of [ve,G])cheek.scale.set(.82,.82,.62);
for(const ear of [st,Ct])ear.scale.multiplyScalar(.85);
pt.position.z=t==="adel"?.365:.34;
u.roughness=.83;u.metalness=0;u.bumpMap=naturalSurface("skin");u.bumpScale=.006;
for(const fabric of [g,m,v,_,E]){fabric.roughness=.94;fabric.metalness=0;fabric.bumpMap=naturalSurface("cloth");fabric.bumpScale=.009}
x.roughness=.8;x.metalness=0;
if(t==="gamal"){
 u.color.setHex(0xb78c6c);h.color.setHex(0x676359);p.color.setHex(0xaaa595);
 kt.scale.set(.88,1.16,.91);le.scale.set(.96,.68,.72);
 L.scale.set(.55,1,.65);b.scale.set(.55,1,.65);
 for(const moustache of [tt,ft])moustache.scale.set(1,.72,.75);
 Kt.scale.set(1,.83,1);m.color.setHex(0x296a50);g.color.setHex(0x20583c);
}else if(t==="adel"){
 u.color.setHex(0xc39177);kt.scale.set(1.07,1.1,.98);
 ve.scale.set(1.12,.95,.65);G.scale.set(1.12,.95,.65);
 N.scale.set(1.4,1,1.3);m.color.setHex(0x267650);
}else if(t==="hamido"){
 u.color.setHex(0xb98a68);kt.scale.set(.98,1.13,.96);
 h.color.setHex(0x433b32);m.color.setHex(0x277c50);v.color.setHex(0xe7e5dc);
 for(const side of [-1,1]){const moustache=new Mt(new dn(.06,12,8),h);moustache.scale.set(1,.25,.35);moustache.position.set(side*.048,.3,.345);gt.add(moustache)}
}
`;
  swap('return n.userData={characterId:t,hornCarry:Ut',refinements+'return n.userData={characterId:t,hornCarry:Ut');
  swap('c.mouthMesh.scale.y=a.invincible>0?.95:.65+Math.sin(t*3)*.05', 'c.mouthMesh.scale.y=a.invincible>0?.48:.23+Math.sin(t*3)*.025');
  swap('for(const v of[...c.eyes,...c.pupils])v.scale.y=m', 'for(const v of[...c.eyes,...c.pupils])v.scale.y=m*(v.userData.naturalEyeY||1)');
  swap('this.scene.add(new sb(14084351,6713421,2)),this.sun=new xx(16770224,3.1)', 'this.scene.add(new sb(0xdce7ed,0x777566,1.55)),this.sun=new xx(0xfff1db,2.4)');
  swap('this.fill=new xx(9160152,1.1)', 'this.fill=new xx(0xc2d5e2,.65)');
  return code;
}
