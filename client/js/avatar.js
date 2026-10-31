import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { OUTFITS, heightAt } from '/shared/world.js';
import { AVATAR_MODELS } from '../data/models.js';
import { BubbleChat } from './bubble-chat.js';
import { AvatarAnimations } from './animations.js';

/** Tải mỗi URL đúng một lần; mọi người dùng chung geometry nhưng clone bộ xương riêng. */
export async function loadAvatars() {
  const loader=new GLTFLoader(), cache=new Map();
  for(const url of new Set(Object.values(AVATAR_MODELS))) cache.set(url,await loader.loadAsync(url));
  return { forRole:role=>cache.get(AVATAR_MODELS[role]||AVATAR_MODELS.male) };
}
export class Avatar {
  constructor(assets,profile,scene,labels=null) {
    const asset=assets.forRole(profile.role);
    this.profile=profile; this.root=new T.Group(); this.model=clone(asset.scene);
    this.root.add(this.model); scene.add(this.root); this.owned=[];
    this.model.scale.setScalar(profile.role==='female'?.96:1);
    const outfit=OUTFITS.find(a=>a.id===profile.outfit)||OUTFITS[0];
    this.model.traverse(o=>{
      if(!o.isMesh)return;
      o.castShadow=true; o.frustumCulled=false;
      const tint=mat=>{
        const copy=mat.clone();
        if(['Robe','Collar'].includes(copy.name))copy.color.set(outfit.color);
        if(copy.name==='Collar')copy.color.multiplyScalar(1.18);
        return copy;
      };
      o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);
      const name=Array.isArray(o.material)?'':o.material.name;
      if(name==='Sash')o.visible=profile.role==='abbot'||profile.outfit==='saffron';
      if(name==='Hair')o.visible=['male','female'].includes(profile.role);
    });
    if(profile.outfit==='traditional') {
      const hips=this.model.getObjectByName('Hips');
      for(const sign of [-1,1]) {
        const panel=new T.Mesh(new T.PlaneGeometry(.57,.72),new T.MeshStandardMaterial({color:outfit.color,side:T.DoubleSide}));
        panel.position.set(0,-.34,sign*.245); hips?.add(panel); this.owned.push(panel);
      }
    }
    this.animation=new AvatarAnimations(this.model,asset.animations);
    this.target=new T.Vector3(profile.x||0,profile.x===undefined?0:heightAt(profile.x,profile.z),profile.z||0);
    this.root.position.copy(this.target); this.targetRotation=profile.rotation||0;
    if(profile.role==='abbot')this.addRegalia(outfit.color);
    if(labels) {
      this.chat=new BubbleChat(labels,profile.name,profile.role==='abbot');
      this.label=this.chat.element;
    }
    this.setAction('Idle');
  }
  addRegalia(color) {
    const chest=this.model.getObjectByName('Chest'); if(!chest)return;
    const gold=new T.MeshStandardMaterial({color:0xf3cf75,metalness:.65,roughness:.28});
    // Vòng hạt và hai mảng kim sắc gắn vào xương ngực, đi theo animation.
    const beads=new T.Mesh(new T.TorusGeometry(.245,.028,7,32),gold);
    beads.rotation.x=Math.PI/2; beads.position.set(0,.08,.01);chest.add(beads);this.owned.push(beads);
    const cloak=new T.Mesh(new T.ConeGeometry(.4,.8,24,1,true),new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.72}));
    cloak.rotation.x=Math.PI;cloak.position.set(0,-.13,-.04);chest.add(cloak);this.owned.push(cloak);
    const ring=new T.Mesh(new T.TorusGeometry(.44,.016,7,64),gold.clone());
    ring.position.set(0,1.76,-.24);this.root.add(ring);this.owned.push(ring);
    const points=new Float32Array(90*3);
    this.aura=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(points,3)),
      new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
        uniforms:{uRatio:{value:Math.min(devicePixelRatio,2)}},
        vertexShader:'uniform float uRatio;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(55.*uRatio/max(1.,-p.z),1.5,12.);gl_Position=projectionMatrix*p;}',
        fragmentShader:'void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(1.,.76,.28,(1.-d)*.8);}'}));
    this.aura.frustumCulled=false;this.root.add(this.aura);this.owned.push(this.aura);this.auraTime=0;
  }
  setAction(name,at=0,serverNow=Date.now()) {this.animation.play(name,at,serverNow);this.action=name;}
  say(text) {this.chat?.say(text);}
  update(dt,camera,width,height,local=false) {
    this.animation.update(dt);
    if(!local)this.root.position.lerp(this.target,1-Math.exp(-12*dt));
    const diff=T.MathUtils.euclideanModulo(this.targetRotation-this.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
    this.root.rotation.y+=diff*(1-Math.exp(-12*dt));
    if(this.aura) {
      this.auraTime+=dt;const a=this.aura.geometry.attributes.position;
      for(let i=0;i<a.count;i++) {
        const phase=i*2.399+this.auraTime*.5,r=.6+(i%9)*.05;
        a.setXYZ(i,Math.cos(phase)*r,(this.auraTime*.35+i*.107)%2.65,Math.sin(phase)*r);
      }
      a.needsUpdate=true;
    }
    this.chat?.update(this.root.position,camera,width,height);
  }
  dispose() {
    this.chat?.dispose();this.animation.dispose();this.root.removeFromParent();
    this.model.traverse(o=>{if(o.isMesh)for(const mat of [].concat(o.material))mat.dispose();});
    for(const o of this.owned){o.geometry.dispose();for(const mat of [].concat(o.material))mat.dispose();}
  }
}
