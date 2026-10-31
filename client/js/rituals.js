import * as T from 'three';

/** Hiệu ứng dựa trên seed + thời gian server: người vào muộn thấy cùng đèn đang trôi. */
export class RitualEffects {
  constructor(scene) { this.scene=scene; this.items=new Map(); }
  clear() { for(const id of [...this.items.keys()])this.remove(id); }
  add(event) {
    if(this.items.has(event.id))return;
    const group=new T.Group(), mesh=(geo,color,x,y,z)=>{
      const o=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.65,
        emissive:color,emissiveIntensity:color===0xffd472?.65:0}));
      o.position.set(x,y,z);group.add(o);return o;
    };
    if(event.kind==='lantern') {
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        const p=mesh(new T.SphereGeometry(1,9,6),0xd58a89,Math.cos(a)*.16,.09,Math.sin(a)*.16);
        p.scale.set(.12,.08,.27);p.rotation.y=-a+Math.PI/2;
      }
      mesh(new T.CylinderGeometry(.055,.07,.13,10),0xffd472,0,.2,0);
      mesh(new T.SphereGeometry(.045,8,6),0xffd472,0,.3,0).scale.y=1.6;
    } else {
      for(let i=-1;i<=1;i++)mesh(new T.CylinderGeometry(.012,.012,.72,6),0x9d5746,i*.09,.36,0);
      const a=new Float32Array(60*3);
      const smoke=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(a,3)),
        new T.PointsMaterial({color:0xe6dfd0,size:.065,transparent:true,opacity:.45,depthWrite:false}));
      group.add(smoke);group.userData.smoke=smoke;
    }
    this.scene.add(group);this.items.set(event.id,{event,group});
  }
  update(serverNow) {
    for(const [id,{event:e,group:g}] of this.items) {
      if(serverNow>=e.expiresAt){this.remove(id);continue;}
      const age=Math.max(0,(serverNow-e.at)/1000), phase=(e.seed%1000)/1000*Math.PI*2;
      if(e.kind==='lantern') {
        g.position.set(-25+Math.sin(phase+age*.035)*5.6,.12+Math.sin(age*1.5+phase)*.024,16+Math.cos(phase+age*.035)*4.5);
        g.rotation.y=phase+age*.07;
      } else {
        g.position.set(e.x+(e.seed%7-3)*.13,1.1,e.z);
        const a=g.userData.smoke.geometry.attributes.position;
        for(let i=0;i<a.count;i++){
          const t=(age*.32+i*.031)%2.4;
          a.setXYZ(i,Math.sin(t*3+phase)*t*.12,.7+t,Math.cos(t*2+phase)*t*.09);
        }
        a.needsUpdate=true;
      }
    }
  }
  remove(id) {
    const item=this.items.get(id);if(!item)return;
    item.group.removeFromParent();item.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.items.delete(id);
  }
}
