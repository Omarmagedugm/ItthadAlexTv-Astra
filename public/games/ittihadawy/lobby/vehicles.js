// Reference-built meshes, in game units. Forward is +Z; wheels turn around X.
// No network assets or texture downloads are required.
const C={red:0x9e1821,yellow:0xf5ba16,black:0x17191b,rubber:0x181819,
 chrome:0xbcc5c9,engine:0x828a8e,seat:0x222124,glass:0x78959d,amber:0xf39119};
// Keep the spinning wheels separate; merge all rigid details by material.
function batchVehicle(root,wheels,api){
 if(!api.Geometry||!api.Attribute)return root;
 root.updateMatrixWorld(true);
 const wheelSet=new Set(wheels),originalGeometry=new Set();
 const merge=(target,skipWheels)=>{
  const batches=new Map(),inverse=target.matrixWorld.clone().invert(),meshes=[];
  const visit=node=>{if(skipWheels&&wheelSet.has(node))return;if(node.isMesh)meshes.push(node);for(const child of node.children)visit(child)};
  visit(target);
  for(const mesh of meshes){
   originalGeometry.add(mesh.geometry);
   const transformed=mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
   const geometry=transformed.index?transformed.toNonIndexed():transformed;
   if(!batches.has(mesh.material))batches.set(mesh.material,{positions:[],normals:[]});
   const batch=batches.get(mesh.material);
   batch.positions.push(...geometry.getAttribute('position').array);batch.normals.push(...geometry.getAttribute('normal').array);
   if(geometry!==transformed)geometry.dispose();transformed.dispose();mesh.removeFromParent();
  }
  for(const [material,batch] of batches){
   const geometry=new api.Geometry();geometry.setAttribute('position',new api.Attribute(new Float32Array(batch.positions),3));geometry.setAttribute('normal',new api.Attribute(new Float32Array(batch.normals),3));geometry.computeBoundingSphere();
   const mesh=new api.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);
  }
 };
 for(const wheel of wheels)merge(wheel,false);
 merge(root,true);for(const geometry of originalGeometry)geometry.dispose();
 return root;
}
function tools(api){
 const materials=new Map(),geometries=new Map();
 const mat=(color,metalness=0,roughness=.6)=>{const key=[color,metalness,roughness].join('/');if(!materials.has(key))materials.set(key,new api.Material({color,metalness,roughness}));return materials.get(key)};
 const mesh=(g,geometry,color,x,y,z,metal=0,rough=.6)=>{const m=new api.Mesh(geometry,mat(color,metal,rough));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
 const geometry=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)};
 const box=(g,x,y,z,w,h,d,color,metal=0)=>mesh(g,geometry(`b/${w}/${h}/${d}`,()=>new api.Box(w,h,d)),color,x,y,z,metal);
 const ball=(g,x,y,z,w,h,d,color,metal=0)=>{const m=mesh(g,geometry('sphere',()=>new api.Sphere(1,16,10)),color,x,y,z,metal);m.scale.set(w,h,d);return m};
 const cyl=(g,x,y,z,r,h,color,metal=0)=>api.Cylinder?mesh(g,geometry(`c/${r}/${h}`,()=>new api.Cylinder(r,r,h,20)),color,x,y,z,metal):ball(g,x,y,z,r,h/2,r,color,metal);
 const rod=(g,a,b,r,color=C.chrome)=>{const [dx,dy,dz]=b.map((v,i)=>v-a[i]),length=Math.hypot(dx,dy,dz);const m=cyl(g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,length,color,.65);m.rotation.x=Math.atan2(dz,dy);m.rotation.z=-Math.asin(dx/length);return m};
 const group=(parent,name,x=0,y=0,z=0)=>{const g=new api.Group;g.name=name;g.position.set(x,y,z);parent.add(g);return g};
 const wheel=(parent,x,y,z,r,width,spokes=false)=>{
  const g=group(parent,'VehicleWheel',x,y,z);
  const tire=cyl(g,0,0,0,r,width,C.rubber);tire.rotation.z=Math.PI/2;
  for(const side of [-1,1]){
   const rim=cyl(g,side*(width/2+.005),0,0,r*.76,.016,C.chrome,.8);rim.rotation.z=Math.PI/2;
   if(spokes){
    const inside=cyl(g,side*(width/2+.016),0,0,r*.67,.018,C.black);inside.rotation.z=Math.PI/2;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(g,[side*(width/2+.028),0,0],[side*(width/2+.028),Math.sin(a)*r*.7,Math.cos(a)*r*.7],.006)}
   }
   const hub=cyl(g,side*(width/2+.035),0,0,r*.25,.035,C.engine,.6);hub.rotation.z=Math.PI/2;
  }
  return g;
 };
 const fender=(parent,x,y,z,r,width,color,start=-1.12,end=1.12)=>{
  const g=group(parent,'CurvedMudguard',x,y,z);
  for(let i=0;i<9;i++){const a=start+(end-start)*(i+.5)/9,m=box(g,0,Math.cos(a)*r,Math.sin(a)*r,width,.035,r*(end-start)/9*1.12,color,.35);m.rotation.x=a}
  return g;
 };
 return {box,ball,cyl,rod,group,wheel,fender};
}

export function createReferenceMotorcycle(api){
 const bike=new api.Group;bike.name='IttihadMotorcycle';
 const {box,ball,rod,group,wheel,fender}=tools(api);
 const frontWheel=wheel(bike,0,.34,.78,.34,.12,true),rearWheel=wheel(bike,0,.34,-.72,.34,.13,true);
 fender(bike,0,.34,.78,.375,.18,C.chrome);fender(bike,0,.34,-.72,.38,.18,C.black,-1.4,.55);
 // Twin downtubes, swingarm, chrome fork and rubber fork gaiters.
 for(const side of [-1,1]){
  const x=side*.13;
  rod(bike,[x,.79,.37],[x,.30,.09],.025,C.black);
  rod(bike,[x,.30,.09],[x,.35,-.72],.024,C.black);
  rod(bike,[x,.35,-.72],[x,.74,-.49],.027);
  rod(bike,[x,.34,.78],[x,.91,.47],.023);
  rod(bike,[x,.67,.60],[x,.89,.48],.042,C.black);
  for(let i=0;i<5;i++)box(bike,x,.69+i*.036,.59-i*.019,.10,.018,.075,C.black);
  rod(bike,[x,.72,-.35],[x,.37,-.69],.036);
  for(let i=0;i<6;i++)box(bike,x,.43+i*.04,-.63+i*.04,.10,.018,.085,C.engine);
  box(bike,side*.23,.37,-.12,.17,.035,.09,C.black);
 }
 // Air-cooled engine with visible cooling fins and silver crankcase.
 ball(bike,0,.42,-.05,.18,.16,.20,C.engine,.65);
 const cylinder=group(bike,'AirCooledEngine',0,.56,.07);cylinder.rotation.x=-.16;
 box(cylinder,0,0,0,.25,.22,.23,C.engine,.6);
 for(let i=0;i<6;i++)box(cylinder,0,-.1+i*.04,0,.29,.012,.27,C.chrome,.7);
 rod(bike,[.13,.55,.18],[.23,.25,.32],.029);
 rod(bike,[.23,.25,.32],[.24,.25,-.41],.029);
 rod(bike,[.24,.25,-.41],[.24,.34,-.93],.057);
 box(bike,.24,.34,-.94,.075,.07,.025,C.black);
 // Red teardrop tank, silver stripe and long stitched black saddle.
 ball(bike,0,.79,.20,.21,.145,.33,C.red,.3);
 box(bike,0,.923,.19,.06,.016,.09,C.chrome,.6);
 for(const side of [-1,1]){
  ball(bike,side*.188,.79,.19,.018,.09,.235,C.chrome,.45);
  ball(bike,side*.202,.796,.19,.012,.075,.22,C.red,.3);
  box(bike,side*.207,.806,.18,.012,.012,.27,0xe1dfd9);
  box(bike,side*.15,.64,-.40,.075,.18,.32,C.red,.3);
  box(bike,side*.192,.66,-.41,.012,.025,.20,C.chrome);
 }
 box(bike,0,.755,-.39,.34,.13,.76,C.seat);
 ball(bike,0,.82,-.39,.17,.035,.37,C.seat);
 for(let i=0;i<5;i++)box(bike,0,.848,-.64+i*.10,.31,.006,.008,0x3a3738);
 // Rear luggage rack and grab rails.
 for(const side of [-1,1]){
  rod(bike,[side*.21,.69,-.49],[side*.21,.88,-.75],.018);
  rod(bike,[side*.21,.88,-.75],[side*.21,.88,-1.01],.018);
 }
 for(const z of [-.79,-.89,-.99])rod(bike,[-.21,.88,z],[.21,.88,z],.014);
 box(bike,0,.72,-.86,.23,.10,.055,0x9c1019);
 box(bike,0,.59,-.90,.17,.10,.025,0xededdf);
 // Square chrome headlight, amber indicators, bars and high oval mirrors.
 box(bike,0,.93,.60,.31,.25,.17,C.chrome,.7);
 box(bike,0,.93,.694,.25,.19,.018,0xe4e9df);
 for(const side of [-1,1]){
  rod(bike,[side*.1,1.00,.46],[side*.28,1.08,.34],.017);
  rod(bike,[side*.28,1.08,.34],[side*.40,1.08,.34],.026,C.black);
  rod(bike,[side*.27,1.09,.36],[side*.34,1.39,.40],.009);
  ball(bike,side*.34,1.41,.40,.045,.075,.024,C.black);
  ball(bike,side*.34,1.41,.424,.034,.061,.003,C.chrome,.7);
  box(bike,side*.22,.93,.61,.10,.09,.09,C.amber);
  box(bike,side*.21,.72,-.82,.08,.065,.06,C.amber);
 }
 box(bike,0,1.065,.46,.22,.075,.13,C.black);
 bike.userData={frontWheel,rearWheel,referenceVehicle:'red-commuter-motorcycle'};
 return batchVehicle(bike,[frontWheel,rearWheel],api);
}

export function createReferenceTuktuk(api){
 const tuk=new api.Group;tuk.name='AlexandriaYellowTuktuk';
 const {box,ball,rod,group,wheel,fender}=tools(api);
 // Three wheels, one at the front, two under the passenger bench.
 const wheels=[wheel(tuk,-.66,.33,-.69,.33,.20),wheel(tuk,.66,.33,-.69,.33,.20),wheel(tuk,0,.33,.96,.33,.18)];
 box(tuk,0,.46,-.16,1.39,.13,1.95,C.black);
 box(tuk,0,.64,-.91,1.42,.55,.15,C.yellow);
 for(const side of [-1,1]){
  box(tuk,side*.70,.64,-.52,.09,.52,.78,C.yellow);
  box(tuk,side*.70,.48,.20,.09,.16,.64,C.yellow);
  fender(tuk,side*.66,.33,-.69,.40,.26,C.yellow);
  box(tuk,side*.67,.43,.25,.17,.04,.45,C.black);
  for(let i=0;i<3;i++)box(tuk,side*.752,.61+i*.11,-.62,.016,.018,.60,0xd99c0c);
 }
 // Open sides, dark bench and separate driver seat.
 box(tuk,0,.84,-.64,1.16,.15,.48,C.seat);
 box(tuk,0,1.12,-.86,1.16,.53,.12,C.seat);
 box(tuk,0,.83,.14,.50,.13,.39,C.seat);
 const driverBack=box(tuk,0,1.05,-.07,.50,.37,.10,C.seat);driverBack.rotation.x=-.08;
 // Black canvas canopy: rounded shoulders and a domed top.
 box(tuk,0,1.85,-.28,1.34,.12,1.68,C.black);
 for(const side of [-1,1]){
  ball(tuk,side*.59,1.80,-.28,.14,.12,.84,C.black);
  box(tuk,side*.72,1.48,-.85,.045,.66,.30,C.black);
  rod(tuk,[side*.65,.88,-.08],[side*.65,1.81,-.08],.022,C.black);
  rod(tuk,[side*.65,1.48,-.82],[side*.65,1.48,.38],.017,C.black);
  rod(tuk,[side*.65,1.16,-.82],[side*.65,1.16,.36],.017,C.black);
 }
 box(tuk,0,1.45,-1.07,1.40,.73,.055,C.black);
 box(tuk,0,1.51,-1.103,.65,.33,.012,C.glass);
 // Yellow windshield arch and the black lower nose.
 const nose=group(tuk,'FrontCab',0,0,0);
 ball(nose,0,.85,.68,.64,.43,.25,C.black);
 box(nose,0,.72,.71,1.13,.53,.18,C.black);
 box(nose,0,1.13,.65,1.22,.20,.13,C.yellow);
 box(nose,0,1.50,.62,1.19,.67,.09,C.yellow);
 const glass=box(nose,0,1.50,.675,1.03,.52,.018,C.glass);glass.rotation.x=.08;
 box(nose,0,1.77,.67,1.03,.065,.018,0x282b2d);
 for(const side of [-1,1]){
  rod(nose,[side*.57,1.18,.70],[side*.57,1.77,.64],.045,C.yellow);
  ball(nose,side*.45,.96,.882,.115,.115,.055,C.black);
  ball(nose,side*.45,.96,.93,.075,.075,.014,0xe8e7d8,.35);
  rod(nose,[side*.58,1.30,.57],[side*.76,1.57,.61],.016,C.black);
  ball(nose,side*.77,1.61,.61,.071,.12,.038,C.black);
  rod(nose,[side*.1,1.28,.3],[side*.32,1.29,.3],.018,C.black);
 }
 box(nose,0,1.13,.73,.35,.075,.025,0xea6a32);
 box(nose,0,.88,.953,.12,.13,.025,C.chrome);
 for(let i=0;i<3;i++)box(nose,0,.65+i*.045,.908,.27,.012,.012,0x08090a);
 rod(nose,[.38,1.27,.704],[.13,1.48,.714],.011,C.black);
 rod(nose,[0,.34,.96],[0,.79,.72],.047,C.engine);
 fender(nose,0,.33,.96,.41,.36,C.black);
 // Visible battery under the driver's seat, with six red caps.
 box(tuk,-.43,.64,.35,.32,.25,.28,0xd1d2ca);
 box(tuk,-.43,.77,.35,.33,.025,.29,0xe4e3d9);
 for(let i=0;i<3;i++)for(const z of [.27,.43])box(tuk,-.54+i*.105,.795,z,.055,.035,.045,0xbb2528);
 tuk.userData.movingWheels=wheels;tuk.userData.referenceVehicle='yellow-black-egyptian-tuktuk';
 return batchVehicle(tuk,wheels,api);
}

export function createReferenceMicrobus(api){
 const van=new api.Group;van.name='AlexandriaWhiteMicrobus';
 const {box,ball,rod,wheel,fender}=tools(api),white=0xe8eceb,glass=0x283d49;
 const wheels=[];
 for(const x of [-.78,.78])for(const z of [-1.13,1.13])wheels.push(wheel(van,x,.37,z,.37,.20));
 box(van,0,.43,0,1.62,.16,3.25,C.black);
 box(van,0,.83,0,1.69,.72,3.37,white);
 box(van,0,1.46,-.16,1.63,.62,2.91,white);
 ball(van,0,1.81,-.17,.81,.10,1.45,white);
 box(van,0,1.79,-.17,1.53,.08,2.84,white);
 // Long glazed passenger compartment and separate front doors.
 for(const side of [-1,1]){
  const x=side*.827;
  for(const [z,d] of [[-.95,.81],[-.06,.83]]){
   box(van,x,1.45,z,.025,.52,d,C.black);
   box(van,x+side*.016,1.45,z,.014,.45,d-.075,glass);
   box(van,x+side*.026,1.45,z,.014,.44,.018,C.engine);
  }
  box(van,x,1.45,.79,.026,.52,.64,C.black);
  box(van,x+side*.016,1.45,.79,.014,.45,.56,glass);
  for(const z of [-.51,.43])box(van,x+side*.021,1.04,z,.014,.92,.012,0x87918f);
  box(van,x+side*.024,1.00,.40,.025,.16,.044,C.black);
  box(van,x+side*.024,1.09,.55,.025,.035,.16,C.black);
  box(van,x+side*.024,1.02,-.97,.025,.065,.71,C.black);
  box(van,x+side*.024,.69,-.12,.018,.025,2.96,0xc2cac8);
  box(van,side*.97,1.36,1.14,.19,.16,.14,C.chrome,.65);
  rod(van,[side*.79,1.23,1.13],[side*.96,1.34,1.14],.025,C.black);
  for(const z of [-1.13,1.13])fender(van,side*.78,.37,z,.43,.25,white);
 }
 // Sloping windshield over the short cab-forward bonnet.
 const surround=box(van,0,1.49,1.34,1.56,.61,.055,C.black);surround.rotation.x=-.30;
 const windshield=box(van,0,1.49,1.377,1.43,.51,.015,glass);windshield.rotation.x=-.30;
 const bonnet=box(van,0,1.10,1.55,1.65,.28,.34,white);bonnet.rotation.x=-.16;
 for(const side of [-1,1]){
  rod(van,[side*.15,1.26,1.46],[side*.52,1.30,1.45],.012,C.black);
  box(van,side*.60,.98,1.718,.32,.22,.035,C.chrome,.6);
  box(van,side*.60,1.01,1.742,.27,.13,.014,0xe2e5df);
  box(van,side*.60,.91,1.742,.27,.035,.014,C.amber);
  box(van,side*.65,.59,1.73,.17,.12,.035,C.black);
  box(van,side*.65,.59,1.75,.12,.075,.014,0xe0e3df);
 }
 box(van,0,.99,1.73,.71,.20,.03,C.chrome,.7);
 box(van,0,.99,1.75,.65,.15,.018,C.black);
 for(let i=0;i<3;i++)box(van,0,.94+i*.047,1.764,.63,.012,.009,C.chrome,.7);
 box(van,0,.76,1.73,1.67,.045,.025,C.black);
 box(van,0,.59,1.72,.86,.13,.025,C.black);
 for(const x of [-.32,-.16,0,.16,.32])box(van,x,.59,1.745,.035,.12,.01,white);
 box(van,0,.55,1.765,.31,.12,.025,0xd7e1db);
 // Rear hatch, broad glass, wiper and vertical red/white tail lamps.
 box(van,0,1.43,-1.69,1.49,.64,.025,C.black);
 box(van,0,1.43,-1.709,1.36,.52,.014,glass);
 box(van,0,.99,-1.70,.72,.07,.028,C.black);
 box(van,0,.83,-1.715,.39,.17,.025,0xf3f0dc);
 rod(van,[0,1.20,-1.73],[.47,1.22,-1.73],.012,C.black);
 for(const side of [-1,1]){
  box(van,side*.76,1.00,-1.71,.14,.42,.035,0x9f1520);
  box(van,side*.76,1.01,-1.733,.12,.10,.014,0xe5e4dc);
  box(van,side*.76,1.15,-1.733,.12,.06,.014,0xef3031);
 }
 box(van,0,.55,-1.74,1.63,.16,.09,white);
 van.userData.wheels=wheels;van.userData.referenceVehicle='white-passenger-microbus';
 return batchVehicle(van,wheels,api);
}

export function createReferenceDog(api){
 const dog=new api.Group;dog.name='AlexandriaBaladiDog';
 const {box,ball,cyl,group}=tools(api);
 const coat=0xc98b52,saddle=0x7a4926,cream=0xe8caa5,dark=0x1f1916,collar=0x0b7a43,gold=0xf2c94c,tongue=0xd95b66;
 const body=group(dog,'DogBody',0,0,0);
 // Deep chest, lean waist, hindquarters and dark saddle coat
 ball(body,0,.56,.20,.25,.23,.28,coat);
 ball(body,0,.57,-.08,.22,.20,.30,coat);
 ball(body,0,.58,-.32,.23,.22,.24,coat);
 ball(body,0,.69,-.04,.19,.11,.42,saddle);
 ball(body,0,.46,.08,.18,.12,.38,cream);
 // Neck and Ittihad green collar with gold tag
 const neck=ball(body,0,.69,.34,.16,.18,.16,coat);neck.rotation.x=.35;
 const ring=cyl(body,0,.67,.36,.165,.06,collar,.2);ring.rotation.x=Math.PI/2+.35;
 ball(body,0,.55,.45,.045,.045,.025,gold,.75);
 // Sculpted Baladi head, pointed ears, snout, nose and eyes
 const head=group(dog,'DogHead',0,.78,.46);
 ball(head,0,.04,0,.19,.17,.19,coat);
 ball(head,0,.11,-.02,.15,.10,.15,saddle);
 box(head,0,-.01,.20,.15,.11,.24,coat);
 ball(head,0,-.02,.22,.085,.065,.14,cream);
 box(head,0,-.08,.17,.12,.045,.18,dark);
 box(head,0,-.065,.23,.065,.022,.09,tongue);
 ball(head,0,.03,.33,.048,.04,.045,dark);
 for(const side of [-1,1]){
  ball(head,side*.095,.07,.13,.034,.036,.03,0xffffff);
  ball(head,side*.098,.07,.152,.02,.022,.018,dark);
  const ear=group(head,'DogEar',side*.12,.16,-.03);
  ear.rotation.z=-side*.22;ear.rotation.x=.18;
  box(ear,0,.10,0,.085,.20,.055,saddle);
  box(ear,0,.09,.018,.05,.14,.025,0xc47d6e);
 }
 // Articulated four legs with thighs, shins and paws
 const legs=[];
 for(const [x,z,isFront] of [[-.17,.24,true],[.17,.24,true],[-.18,-.30,false],[.18,-.30,false]]){
  const leg=group(dog,'DogLeg',x,.48,z);
  ball(leg,0,-.08,0,.075,.14,isFront?.075:.095,coat);
  box(leg,0,-.26,isFront?.01:-.01,.065,.24,.065,coat);
  box(leg,0,-.41,.02,.075,.065,.11,cream);
  legs.push(leg);
 }
 // Upward-curved wagging Baladi tail
 const tail=group(dog,'DogTail',0,.66,-.50);
 const t1=box(tail,0,.10,-.08,.055,.22,.055,saddle);t1.rotation.x=-.65;
 const t2=box(tail,0,.24,-.16,.045,.16,.045,cream);t2.rotation.x=-.25;
 dog.userData={dogBody:body,dogHead:head,dogLegs:legs,dogTail:tail,referenceVehicle:'alexandria-baladi-dog'};
 return dog;
}

