// Experimental cel shading for the existing 3D world. Textured artwork is preserved.
export function installCartoonStyle(scene) {
 const objects=new WeakSet(),materials=new WeakSet();
 const styleMaterial=material=>{
  if(!material||materials.has(material)||!material.isMeshStandardMaterial||material.map||material.transparent)return;
  materials.add(material);
  material.roughness=1;
  material.metalness=0;
  const previous=material.onBeforeCompile;
  const previousKey=material.customProgramCacheKey.bind(material);
  const key=previousKey();
  material.onBeforeCompile=function(shader,renderer){
   previous.call(this,shader,renderer);
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    float cartoonLight = max(dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722)), 0.001);
    float cartoonBand = floor(clamp(cartoonLight, 0.0, 2.0) * 4.0 + 0.5) / 4.0;
    outgoingLight *= max(cartoonBand, 0.15) / cartoonLight;
    float cartoonRim = abs(dot(normalize(normal), normalize(vViewPosition)));
    outgoingLight *= mix(0.3, 1.0, smoothstep(0.08, 0.22, cartoonRim));
    #include <opaque_fragment>
   `);
  };
  material.customProgramCacheKey=()=>key+'|ittihad-cartoon-v1';
  material.needsUpdate=true;
 };
 const visit=object=>{
  if(!object||objects.has(object))return;
  objects.add(object);
  if(object.isMesh){for(const material of Array.isArray(object.material)?object.material:[object.material])styleMaterial(material)}
  const add=object.add;
  object.add=function(...children){for(const child of children)visit(child);return add.apply(this,children)};
  for(const child of object.children||[])visit(child);
 };
 visit(scene);
}
