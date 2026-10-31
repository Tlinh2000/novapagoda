/** Original Nova Pagoda avatar, authored from primitives; no third-party art. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// GLTFExporter uses FileReader even when every asset is untextured.
if (!globalThis.FileReader) globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(r => { this.result = r; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(r => { this.result = `data:${blob.type};base64,${Buffer.from(r).toString('base64')}`; this.onloadend?.(); }); }
};
const bones = [], boneByName = {}, rig = new THREE.Group();
rig.name = 'NovaAvatar';
function bone(name, parent, x=0,y=0,z=0) {
  const b = new THREE.Bone(); b.name=name; b.position.set(x,y,z);
  (parent || rig).add(b); boneByName[name]=b; bones.push(b); return b;
}
const root=bone('Root',null), hips=bone('Hips',root,0,.94,0);
const spine=bone('Spine',hips,0,.16,0), chest=bone('Chest',spine,0,.22,0);
const neck=bone('Neck',chest,0,.25,0), head=bone('Head',neck,0,.16,0);
for(const [s,sign] of [['L',1],['R',-1]]) {
  const shoulder=bone(`${s}_Shoulder`,chest,sign*.25,.08,0);
  const arm=bone(`${s}_UpperArm`,shoulder,sign*.08,-.045,0);
  const forearm=bone(`${s}_Forearm`,arm,0,-.31,0);
  const hand=bone(`${s}_Hand`,forearm,0,-.27,0);
  bone(`${s}_Fingers`,hand,0,-.085,.012);
  bone(`${s}_Thumb`,hand,-sign*.045,-.035,.035);
  const thigh=bone(`${s}_Thigh`,hips,sign*.145,-.04,0);
  const calf=bone(`${s}_Calf`,thigh,0,-.42,0);
  const foot=bone(`${s}_Foot`,calf,0,-.40,0);
  bone(`${s}_Toe`,foot,0,-.02,.13);
  bone(`${s}_Eye`,head,sign*.077,.052,.208);
}
rig.updateMatrixWorld(true);
const skeleton=new THREE.Skeleton(bones);
const materials={
  Robe:new THREE.MeshStandardMaterial({name:'Robe',color:0x839aaf,roughness:.95}),
  Skin:new THREE.MeshStandardMaterial({name:'Skin',color:0xe6b88f,roughness:.9}),
  Hair:new THREE.MeshStandardMaterial({name:'Hair',color:0x30251f,roughness:1}),
  Sash:new THREE.MeshStandardMaterial({name:'Sash',color:0xdaa044,roughness:.85}),
  Face:new THREE.MeshStandardMaterial({name:'Face',color:0x3a2d28,roughness:1}),
  Shoes:new THREE.MeshStandardMaterial({name:'Shoes',color:0x554a41,roughness:1}),
  Collar:new THREE.MeshStandardMaterial({name:'Collar',color:0xacc0cc,roughness:1})
};
const parts=Object.fromEntries(Object.keys(materials).map(k=>[k,[]]));
const pos=new THREE.Vector3(), mat=new THREE.Matrix4(), q=new THREE.Quaternion();
function add(geo, material, boneName, at, scale=[1,1,1], rotation=[0,0,0], blend=null) {
  mat.compose(new THREE.Vector3(...at),q.setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
  geo.applyMatrix4(mat);
  // All parts are genuinely skinned, including the face and outfit accessories.
  const count=geo.attributes.position.count, indices=[], weights=[];
  for(let i=0;i<count;i++) {
    const a=bones.indexOf(boneByName[boneName]);
    if(blend) { const y=geo.attributes.position.getY(i), t=THREE.MathUtils.clamp((y-blend.min)/(blend.max-blend.min),0,1); indices.push(t<1?a:0,t>0?bones.indexOf(boneByName[blend.to]):0,0,0); weights.push(1-t,t,0,0); }
    else {indices.push(a,0,0,0);weights.push(1,0,0,0);}
  }
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  geo.deleteAttribute('uv'); // Asset không có texture; tránh lưu UV không dùng.
  parts[material].push(geo);
}
const sphere=(r=.1)=>new THREE.SphereGeometry(r,16,12);
const capsule=(r=.08,length=.2)=>new THREE.CapsuleGeometry(r,length,4,10);
const cyl=(top,bottom,h)=>new THREE.CylinderGeometry(top,bottom,h,14,5);
const world=(name)=>boneByName[name].getWorldPosition(new THREE.Vector3()).toArray();
// Loose tunic. Blending between hip and chest lets the garment bend with the spine.
add(cyl(.275,.33,.70),'Robe','Hips',[0,1.075,0],[1,1,.72],[0,0,0],{to:'Chest',min:.86,max:1.40});
add(cyl(.13,.15,.09),'Collar','Chest',[0,1.44,0],[1,1,.8]);
add(cyl(.285,.29,.055),'Robe','Chest',[0,1.41,0],[1,1,.72]);
// Diagonal stole is a separate skinned material, visible for the abbot role.
add(new THREE.BoxGeometry(.17,.67,.025,1,8,1),'Sash','Hips',[.045,1.12,.226],[1,1,1],[0,0,-.42],{to:'Chest',min:.84,max:1.43});
// Subtle tunic seams and buttons, using the light collar material.
for(let y=.94;y<1.39;y+=.115) add(sphere(.014),'Collar','Hips',[.06,y,.239],[1,1,.55],[0,0,0],{to:'Chest',min:.86,max:1.40});
add(capsule(.09,.10),'Skin','Neck',[0,1.56,0]);
add(sphere(.224),'Skin','Head',[0,1.785,0],[.88,1.10,.88]);
for(const [s,sign] of [['L',1],['R',-1]]) {
  const sh=world(`${s}_UpperArm`), el=world(`${s}_Forearm`), wr=world(`${s}_Hand`);
  add(capsule(.112,.21),'Robe',`${s}_UpperArm`,[sh[0],sh[1]-.14,0],[1,1,.9]);
  add(capsule(.09,.18),'Robe',`${s}_Forearm`,[el[0],el[1]-.11,0],[1,1,.9]);
  add(cyl(.092,.092,.045),'Collar',`${s}_Forearm`,[wr[0],wr[1]+.035,0],[1,1,.9]);
  add(sphere(.067),'Skin',`${s}_Hand`,[wr[0],wr[1]-.038,.009],[.76,1.1,.54]);
  add(capsule(.025,.045),'Skin',`${s}_Fingers`,[wr[0],wr[1]-.105,.014],[1.30,1,.75]);
  add(capsule(.020,.035),'Skin',`${s}_Thumb`,[wr[0]-sign*.047,wr[1]-.036,.029],[1,1,.85],[0,0,sign*.4]);
  add(capsule(.139,.23),'Robe',`${s}_Thigh`,[sign*.145,.725,0],[.90,1,.92]);
  add(capsule(.109,.23),'Robe',`${s}_Calf`,[sign*.145,.315,0],[.95,1,.95]);
  add(sphere(.11),'Shoes',`${s}_Foot`,[sign*.145,.067,.067],[.80,.50,1.55]);
  add(sphere(.045),'Skin','Head',[sign*.199,1.775,0],[.6,1,.65]);
  add(sphere(.027),'Face',`${s}_Eye`,world(`${s}_Eye`),[.72,1,.32]);
  add(capsule(.01,.05),'Face','Head',[sign*.077,1.883,.192],[1,1,.65],[0,0,sign*1.44]);
}
add(sphere(.031),'Skin','Head',[0,1.754,.218],[.65,1,.7]);
const mouthCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.042,1.702,.189),new THREE.Vector3(0,1.693,.200),new THREE.Vector3(.042,1.702,.189)]);
add(new THREE.TubeGeometry(mouthCurve,8,.008,5,false),'Face','Head',[0,0,0]);
// Hair can be hidden for monastics. Bun gives the female option a clear silhouette.
add(new THREE.SphereGeometry(.230,16,10,0,Math.PI*2,0,Math.PI*.53),'Hair','Head',[0,1.789,-.008],[.91,1.12,.91]);
add(sphere(.105),'Hair','Head',[0,1.838,-.20],[1,1,.8]);
for(const [name,geos] of Object.entries(parts)) {
  if(!geos.length) continue;
  const geometry=mergeGeometries(geos,false);
  const mesh=new THREE.SkinnedMesh(geometry,materials[name]); mesh.name=name;
  mesh.castShadow=true; mesh.frustumCulled=false;
  rig.add(mesh); mesh.bind(skeleton); mesh.normalizeSkinWeights();
}

const rest=Object.fromEntries(bones.map(b=>[b.name,{p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}]));
const rad=(x,y=0,z=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z));
function pose() {return Object.fromEntries(bones.map(b=>[b.name,{p:rest[b.name].p.clone(),q:rest[b.name].q.clone(),s:rest[b.name].s.clone()}]));}
function rotate(p,name,x,y=0,z=0){p[name].q.copy(rad(x,y,z));}
function prayer(p) {
  rotate(p,'L_UpperArm',-1.0,0,-.9); rotate(p,'R_UpperArm',-1.0,0,.9);
  rotate(p,'L_Forearm',-1.4); rotate(p,'R_Forearm',-1.4);
  rotate(p,'L_Hand',-.35); rotate(p,'R_Hand',-.35);
}
function closed(p,amount=.07){p.L_Eye.s.y=amount;p.R_Eye.s.y=amount;}
function idle(t=0) {const p=pose();rotate(p,'Chest',Math.sin(t*Math.PI*2)*.013);rotate(p,'L_UpperArm',.02,0,.07);rotate(p,'R_UpperArm',.02,0,-.07);return p;}
function meditation(t=0) {
  const p=pose();p.Hips.p.y=.48;
  // Set thigh and shin world directions, then convert to local rotations.
  const down=new THREE.Vector3(0,-1,0);
  for(const [s,sign] of [['L',1],['R',-1]]){
    const tq=new THREE.Quaternion().setFromUnitVectors(down,new THREE.Vector3(sign*.35,-.22,.18).normalize());
    const cq=new THREE.Quaternion().setFromUnitVectors(down,new THREE.Vector3(-sign*.40,-.02,.18).normalize());
    p[`${s}_Thigh`].q.copy(tq);p[`${s}_Calf`].q.copy(tq.clone().invert().multiply(cq));
    rotate(p,`${s}_Foot`,.1,sign*.75,0);
    rotate(p,`${s}_UpperArm`,-.40,0,-sign*.15);
    rotate(p,`${s}_Forearm`,-1.48,0,-sign*.53);
    rotate(p,`${s}_Hand`,-.1,0,sign*.3);
  }
  rotate(p,'Chest',Math.sin(t*Math.PI*2)*.012);closed(p);return p;
}
function locomotion(t,run=false){
  const p=idle(t),a=t*Math.PI*2,stride=run?.83:.51;
  p.Hips.p.y+=Math.abs(Math.sin(a))* (run?.075:.025);
  rotate(p,'Spine',run?.12:.04);rotate(p,'Head',run?-.08:-.025);
  for(const [s,sign] of [['L',1],['R',-1]]){
    rotate(p,`${s}_Thigh`,-Math.sin(a)*stride*sign);
    rotate(p,`${s}_Calf`,Math.max(0,Math.sin(a)*sign)* (run?1.35:.77)+.03);
    rotate(p,`${s}_UpperArm`,Math.sin(a)*stride*sign,0,sign*.07);
    rotate(p,`${s}_Forearm`,run?-1.12:-.12);
  }return p;
}
function kneel(bow=false){
  const p=pose();p.Hips.p.y=bow?.53:.62;const lean=bow?1.65:0;
  rotate(p,'Hips',lean);rotate(p,'Spine',bow?.32:0);rotate(p,'Head',bow?.12:.06);
  for(const [s,sign] of [['L',1],['R',-1]]){
    rotate(p,`${s}_Thigh`,(bow?-.65:-.95)-lean);rotate(p,`${s}_Calf`,2.19);rotate(p,`${s}_Foot`,bow?-.65:-.34);
    if(bow){rotate(p,`${s}_UpperArm`,-3.0,0,-sign*.22);rotate(p,`${s}_Forearm`,.2);rotate(p,`${s}_Hand`,-.15);}
  }
  if(!bow)prayer(p);closed(p,bow?.07:.6);return p;
}
// Bake a small ground correction into the hip track through kneeling transitions.
// This is asset authoring, not a runtime visual substitution for skeletal motion.
function groundKeys(keys) {
  const baked=[], duration=keys.at(-1)[0];
  for(let i=0;i<=Math.ceil(duration*10);i++) {
    const t=Math.min(duration,i/10);let j=0;
    while(j<keys.length-2&&keys[j+1][0]<t)j++;
    const [ta,pa]=keys[j],[tb,pb]=keys[j+1],u=(t-ta)/(tb-ta),p=pose();
    for(const b of bones){
      p[b.name].p.copy(pa[b.name].p).lerp(pb[b.name].p,u);
      p[b.name].q.copy(pa[b.name].q).slerp(pb[b.name].q,u);
      p[b.name].s.copy(pa[b.name].s).lerp(pb[b.name].s,u);
      b.position.copy(p[b.name].p);b.quaternion.copy(p[b.name].q);b.scale.copy(p[b.name].s);
    }
    rig.updateMatrixWorld(true);skeleton.update();let bottom=Infinity;
    rig.traverse(o=>{if(o.isSkinnedMesh){o.computeBoundingBox();bottom=Math.min(bottom,o.boundingBox.min.y);}});
    p.Hips.p.y+=Math.max(0,.007-bottom);baked.push([t,p]);
  }
  for(const b of bones){b.position.copy(rest[b.name].p);b.quaternion.copy(rest[b.name].q);b.scale.copy(rest[b.name].s);}
  rig.updateMatrixWorld(true);skeleton.update();return baked;
}
function clip(name,keys){
  if(name==='Prostrate')keys=groundKeys(keys);
  const times=keys.map(k=>k[0]), tracks=[];
  for(const b of bones){
    const rotations=[],positions=[],scales=[];
    for(const [,p] of keys){rotations.push(...p[b.name].q.toArray());positions.push(...p[b.name].p.toArray());scales.push(...p[b.name].s.toArray());}
    tracks.push(new THREE.QuaternionKeyframeTrack(`${b.name}.quaternion`,times,rotations));
    if(b===hips)tracks.push(new THREE.VectorKeyframeTrack(`${b.name}.position`,times,positions));
    if(b.name.endsWith('_Eye')) tracks.push(new THREE.VectorKeyframeTrack(`${b.name}.scale`,times,scales));
  }
  return new THREE.AnimationClip(name,times.at(-1),tracks);
}
const sampled=(duration,fn,n=24)=>Array.from({length:n+1},(_,i)=>[duration*i/n,fn(i/n)]);
const animations=[
  clip('Idle',sampled(3.8,idle)),
  clip('Walk',sampled(1.1,t=>locomotion(t))),
  clip('Run',sampled(.72,t=>locomotion(t,true))),
  clip('Meditate',sampled(4.4,meditation)),
  clip('Prostrate',[[0,idle()],[.75,(()=>{const p=pose();prayer(p);return p;})()],[1.8,kneel()],[2.45,kneel()],[3.2,kneel(true)],[4.0,kneel(true)],[4.8,kneel()],[5.35,kneel()],[6.35,(()=>{const p=pose();prayer(p);return p;})()],[7.2,idle()]]),
  clip('Greet',[[0,idle()],[.5,(()=>{const p=pose();prayer(p);return p;})()],[1.1,(()=>{const p=pose();prayer(p);rotate(p,'Chest',.18);rotate(p,'Head',.22);return p;})()],[1.9,(()=>{const p=pose();prayer(p);return p;})()],[2.7,idle()]]),
  clip('Laugh',[[0,idle()],...sampled(1.8,t=>{const p=pose();rotate(p,'Chest',.10+Math.sin(t*Math.PI*10)*.055);rotate(p,'Head',-.12+Math.sin(t*Math.PI*10)*.045);for(const [s,sg]of[['L',1],['R',-1]]){rotate(p,`${s}_UpperArm`,-.4,0,-sg*.2);rotate(p,`${s}_Forearm`,-1.6);}closed(p,.3);return p;},16).map(([t,p])=>[.3+t,p]),[2.5,idle()]]),
  clip('Wave',[[0,idle()],...sampled(1.8,t=>{const p=idle();rotate(p,'R_UpperArm',-.10,0,-2.2);rotate(p,'R_Forearm',-.1,0,-.1+Math.sin(t*Math.PI*8)*.4);rotate(p,'R_Hand',0,Math.sin(t*Math.PI*8)*.4,0);return p;},16).map(([t,p])=>[.35+t,p]),[2.65,idle()]])
];
rig.userData={author:'Nova Pagoda — original procedural art',license:'MIT',forward:'+Z',heightMeters:2.03,rig:'28-bone skinned humanoid',note:'Facial expression uses eye bones; no blendshapes. Hair and Sash mesh visibility can be set per role.'};
// Skin nodes ở gốc scene theo khuyến nghị glTF; không bọc thêm một node transform.
const exportScene=new THREE.Scene();exportScene.name=rig.name;exportScene.userData=rig.userData;
for(const child of [...rig.children])exportScene.add(child);
const glb=await new GLTFExporter().parseAsync(exportScene,{binary:true,animations,onlyVisible:false});
const output=fileURLToPath(new URL('../client/assets/avatar.glb',import.meta.url));await mkdir(new URL('../client/assets/',import.meta.url),{recursive:true});await writeFile(output,Buffer.from(glb));
// Read the binary back with the same loader used by the game; assert required structure.
const bytes=await readFile(output),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const skinned=[];asset.scene.traverse(o=>{if(o.isSkinnedMesh)skinned.push(o);});
for(const name of ['Idle','Walk','Run','Meditate','Prostrate','Greet','Laugh','Wave']) if(!asset.animations.find(a=>a.name===name))throw Error(`Missing ${name}`);
if(skinned.length<5||skinned.some(m=>m.skeleton.bones.length<20))throw Error('Invalid skin');
for(const a of asset.animations)if(!a.tracks.some(t=>t.name.endsWith('.quaternion')))throw Error(`Missing bone motion: ${a.name}`);
console.log(JSON.stringify({output,bytes:bytes.length,bones:skinned[0].skeleton.bones.length,skinnedMeshes:skinned.map(o=>o.name),clips:asset.animations.map(a=>({name:a.name,seconds:a.duration,tracks:a.tracks.length}))},null,2));
