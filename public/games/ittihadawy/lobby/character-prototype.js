// Adapter for our own static, uncompressed GLB. Not a general-purpose glTF loader.
// Animation comes from the existing game pivots; gameplay logic stays untouched.
const downloads=new Map();
export function readPrototype(buffer){
 const view=new DataView(buffer);
 if(buffer.byteLength<28||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid character GLB');
 let document,bin;
 for(let offset=12;offset+8<=buffer.byteLength;){
  const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);offset+=8;
  if(offset+length>buffer.byteLength)throw Error('Truncated character GLB');
  if(type===0x4e4f534a)document=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset,length)));
  if(type===0x004e4942)bin=buffer.slice(offset,offset+length);
  offset+=length;
 }
 if(!document||!bin)throw Error('Missing GLB data');
 const accessor=index=>{
  const a=document.accessors[index],b=document.bufferViews[a.bufferView];
  const Type={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],width={SCALAR:1,VEC3:3}[a.type];
  if(!Type||!width||b.byteStride||a.sparse)throw Error('Unsupported prototype accessor');
  return new Type(bin,(b.byteOffset||0)+(a.byteOffset||0),a.count*width);
 };
 return {document,accessor};
}
function load(url){
 if(!downloads.has(url))downloads.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Character model HTTP '+r.status);return r.arrayBuffer()}).then(readPrototype).catch(error=>{downloads.delete(url);throw error}));
 return downloads.get(url);
}
const adelJoints={
 body:[null,[0,0,0],'bodyPivot'],torso:['body',[0,.82,0],'torsoPivot'],head:['torso',[0,1.48,0],'headPivot'],
 leftArm:['torso',[-.32,1.36,0],'leftArmPivot'],leftForearm:['leftArm',[-.51,1.01,.035],'leftForearmPivot'],
 rightArm:['torso',[.32,1.36,0],'rightArmPivot'],rightForearm:['rightArm',[.51,1.01,.035],'rightForearmPivot'],
 leftLeg:['body',[-.19,.84,0],'leftLegPivot'],leftShin:['leftLeg',[-.19,.47,0],'leftShinPivot'],
 rightLeg:['body',[.19,.84,0],'rightLegPivot'],rightShin:['rightLeg',[.19,.47,0],'rightShinPivot']
};
export function partJoint(name,y){
 const left=name.includes('_R'),side=left?'left':'right';
 if(/^(Trouser|Sneaker|Shoe|Lace)/.test(name))return side+(y>.47?'Leg':'Shin');
 if(/^Sleeve/.test(name))return side+'Arm';
 if(/^Arm_/.test(name))return side+(y>1.01?'Arm':'Forearm');
 if(/^(Hand|Finger|Thumb|Wristband)/.test(name))return side+'Forearm';
 if(/Horn|horn/.test(name))return 'rightForearm';
 if(/^(Jersey|Bead|Pendant)/.test(name))return 'torso';
 return 'head';
}
export function attachCharacterPrototype(player,api,{id,url,partJoint:jointForPart=partJoint}){
 const data=player.userData;
 if(data.characterId!==id||data.prototypeRequested)return;
 if(typeof location!=='undefined'&&new URLSearchParams(location.search).get(id+'Model')==='classic')return;
 data.prototypeRequested=true;data.prototypeStatus='loading';
 load(url).then(({document,accessor})=>{
  const joints=document.extras?.joints||adelJoints,scale=document.extras?.scale||1.4;
  if(data.prototypeDisposed)return;
  const root=new api.Group();root.name=id+'GLBPrototype';root.scale.setScalar(scale);
  const bones={},batches=new Map(),slots={shirt:[],shorts:[],shoes:[],headwear:[],eyewear:[]};
  for(const [key,[parent,position]] of Object.entries(joints)){
   const group=new api.Group();group.name=id+'_'+key;bones[key]=group;
   const origin=parent?joints[parent][1]:[0,0,0];group.position.set(...position.map((v,i)=>v-origin[i]));(parent?bones[parent]:root).add(group);
  }
  for(const mesh of document.meshes){for(const primitive of mesh.primitives){
   const positions=accessor(primitive.attributes.POSITION),indices=accessor(primitive.indices),normals=primitive.attributes.NORMAL!==undefined?accessor(primitive.attributes.NORMAL):null;
   for(let i=0;i<indices.length;i+=3){
    const y=(positions[indices[i]*3+1]+positions[indices[i+1]*3+1]+positions[indices[i+2]*3+1])/3;
    const bone=mesh.extras?.bone||jointForPart(mesh.name,y),slot=mesh.extras?.slot??(/^Jersey|^Sleeve/.test(mesh.name)?'shirt':/^Trouser/.test(mesh.name)?'shorts':/^Shoe|^Sneaker/.test(mesh.name)?'shoes':/^Headwrap/.test(mesh.name)?'headwear':'');
    if(!joints[bone]||!Object.hasOwn(slots,slot)&&slot!=='')throw Error('Unsupported character attachment');
    const key=bone+':'+primitive.material+':'+slot;
    if(!batches.has(key))batches.set(key,{bone,material:primitive.material,slot,positions:[],normals:[]});
    const batch=batches.get(key),origin=joints[bone][1];
    for(let k=0;k<3;k++)for(let c=0;c<3;c++){batch.positions.push(positions[indices[i+k]*3+c]-origin[c]);if(normals)batch.normals.push(normals[indices[i+k]*3+c]);}
   }
  }}
  for(const batch of batches.values()){
   const geometry=new api.Geometry();geometry.setAttribute('position',new api.Attribute(new Float32Array(batch.positions),3));if(batch.normals.length===batch.positions.length)geometry.setAttribute('normal',new api.Attribute(new Float32Array(batch.normals),3));else geometry.computeVertexNormals();geometry.computeBoundingSphere();
   const pbr=document.materials[batch.material].pbrMetallicRoughness;
   const material=new api.Material({roughness:1,metalness:0,side:2});material.color.setRGB(...pbr.baseColorFactor.slice(0,3));
   const mesh=new api.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;bones[batch.bone].add(mesh);if(batch.slot)slots[batch.slot].push(mesh);
  }
  // All original pivots remain live, but their rendered meshes are replaced.
  data.model.traverse(object=>{if(object.isMesh)object.visible=false});
  data.model.add(root);data.prototypeRoot=root;data.prototypeHeadwear=slots.headwear;data.prototypeEyewear=slots.eyewear;data.prototypeBones=bones;data.prototypeStatus='ready';
  for(const slot of ['shirt','shorts','shoes'])data.cosmeticParts[slot]=slots[slot];
  if(id==='lazo')data.prototypeAccessoryAnchors=new Map(Object.entries(joints).map(([key,[,,source]])=>[data[source],bones[key]]));
  // Reapply any outfit selected while the GLB was downloading.
  if(data.lastOutfit){data.cosmeticSignature=null;data.refreshPrototypeOutfit?.()}
  const update=root.updateMatrixWorld.bind(root);
  root.updateMatrixWorld=function(force){
   for(const [key,[,,source]] of Object.entries(joints))bones[key].rotation.copy(data[source].rotation);
   bones.body.position.copy(data.bodyPivot.position).multiplyScalar(1/scale);
   // These are rigid articulated parts, not a skinned character.
   return update(force);
  };
 }).catch(error=>{data.prototypeStatus='fallback';console.warn(id+' prototype: using original model',error)});
}
