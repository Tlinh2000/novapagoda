import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PAINTINGS } from '../data/paintings.js';
import { BUDDHA_MODEL } from '../data/models.js';

const palette={grass:0xa4b39b,leaf:0x718970,darkLeaf:0x55765f,wood:0x654938,red:0xa45e43,roof:0x9b5945,stone:0xd8cfb8,wall:0xe6d9b6,gold:0xc59a50};
export class PagodaWorld {
  constructor(scene,quality='balanced') {
    this.scene=scene;this.root=new T.Group();scene.add(this.root);
    this.materials=new Map();this.roofs=[];this.fish=[];this.paintings={};this.quality=quality;
    this.build();this.batchStatue();this.batch();this.loadPaintingConfig();this.loadBuddhaModel();
  }
  mat(color,extra={}) {
    const key=String(color)+JSON.stringify(extra);
    if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color,roughness:.85,...extra}));
    return this.materials.get(key);
  }
  mesh(geo,color,x=0,y=0,z=0,parent=this.root,extra={}) {
    const m=new T.Mesh(geo,color?.isMaterial?color:this.mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  box(w,h,d,color,x,y,z,parent=this.root){return this.mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent);}
  ellipsoid(rx,ry,rz,color,x,y,z,parent=this.root){const m=this.mesh(new T.SphereGeometry(1,12,8),color,x,y,z,parent);m.scale.set(rx,ry,rz);return m;}
  cyl(r1,r2,h,color,x,y,z,parent=this.root,n=12){return this.mesh(new T.CylinderGeometry(r1,r2,h,n),color,x,y,z,parent);}
  curve(points,r,color,parent=this.root){return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,r,6,false),color,0,0,0,parent);}
  roof(x,z,w,d,y,rise,parent=this.root) {
    const group=new T.Group();group.userData.dynamic=true;group.position.set(x,0,z);parent.add(group);
    const positions=[],uv=[],idx=[],nx=20,nz=18;
    const at=(u,v)=>[u*w/2,y+rise*(1-Math.abs(v))+.65*Math.abs(v)**5+.65*Math.abs(u)**8,v*d/2];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=i/nx*2-1,v=j/nz*2-1;positions.push(...at(u,v));uv.push(i/nx*9,j/nz*7);}
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    const mat=new T.MeshStandardMaterial({color:palette.roof,roughness:.95,side:T.DoubleSide,transparent:true,opacity:1,map:this.roofTexture()});
    this.mesh(g,mat,0,0,0,group);this.roofs.push({group,material:mat,x,z,w,d});
    for(const v of [-1,1])this.curve(Array.from({length:13},(_,i)=>at(i/6-1,v)),.12,palette.gold,group);
    this.curve([[-w/2,y+rise+.6,0],[0,y+rise+.16,0],[w/2,y+rise+.6,0]],.13,palette.gold,group);
    for(const u of [-1,1])for(const v of [-1,1]){
      const a=at(u,v);this.curve([a,[a[0]+u*.5,a[1]+.25,a[2]+v*.25],[a[0]+u*.65,a[1]+.85,a[2]+v*.35]],.1,palette.gold,group);
    }
    return group;
  }
  roofTexture(){
    if(this.tile)return this.tile;
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#d6b7a1';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#946b56';ctx.lineWidth=3;
    for(let y=0;y<160;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();for(let x=-16;x<144;x+=32){ctx.beginPath();ctx.moveTo(x+(y%64?16:0),y);ctx.lineTo(x+(y%64?16:0),y+32);ctx.stroke();}}
    this.tile=new T.CanvasTexture(c);this.tile.wrapS=this.tile.wrapT=T.RepeatWrapping;this.tile.colorSpace=T.SRGBColorSpace;return this.tile;
  }
  label(text,x,y,z,width=6,parent=this.root){
    const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');
    ctx.fillStyle='rgba(251,247,231,.95)';ctx.beginPath();ctx.roundRect(0,0,512,96,20);ctx.fill();
    ctx.font='500 27px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#4d5949';ctx.fillText(text,256,49);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:true}));s.position.set(x,y,z);s.scale.set(width,width*96/512,1);parent.add(s);return s;
  }
  house(x,z,w,d,title,{open=false,large=false}={}) {
    const p=new T.Group();p.position.set(x,0,z);this.root.add(p);
    this.box(w+1,.24,d+1,palette.stone,0,0,0,p);
    this.box(w,.35,d,0xb8a98d,0,.2,0,p);
    const height=large?6:3.6;
    this.box(w,.4,.35,palette.wood,0,height, d/2,p);
    this.box(w,height,.35,palette.wall,0,height/2,-d/2,p);
    for(const sign of [-1,1])this.box(.3,height,d,palette.wall,sign*w/2,height/2,0,p);
    for(let i=0;i<=4;i++){
      const px=-w/2+i*w/4;
      if(!(open&&i===2))this.cyl(.19,.24,height,palette.red,px,height/2,d/2-.5,p);
      this.box(.65,.17,.65,palette.stone,px,.42,d/2-.5,p);
      if(!open&&i<4){this.box(w/4-.45,height*.72,.16,palette.wood,px+w/8,height*.42,d/2-.5,p);}
    }
    if(large)for(let i=0;i<5;i++)this.cyl(.2,.26,height,palette.red,-w/2+i*w/4,height/2,-d/2+1,p);
    this.roof(x,z,w+2.6,d+2.5,height+.3,large?3:1.8);
    if(large)this.roof(x,z-1,w*.72,d*.65,height+2.5,2);
    this.label(title,x,large?4.7:2.8,z+d/2+.1,large?7:5.4);
  }
  pavilion(x,z,title,drum=false){
    this.box(6,.3,6,palette.stone,x,.1,z);
    for(const u of [-2,2])for(const v of [-2,2])this.cyl(.2,.25,4.3,palette.red,x+u,2.2,z+v);
    this.roof(x,z,7,6.8,4.3,1.5);this.roof(x,z,4.8,4.8,6,1.2);
    if(drum){const m=this.cyl(1,1,1.5,0x8a4a39,x,2,z,undefined,20);m.rotation.x=Math.PI/2;for(const v of [-.77,.77]){const n=this.cyl(.93,.93,.06,0xd6b77c,x,2,z+v,undefined,20);n.rotation.x=Math.PI/2;}this.box(.25,1.3,.3,palette.wood,x-1.2,.8,z);this.box(.25,1.3,.3,palette.wood,x+1.2,.8,z);}
    else {this.cyl(.55,1.1,1.8,0x9f8654,x,2.4,z,undefined,20);this.cyl(1.2,1.2,.15,0xb1965d,x,1.5,z,undefined,20);this.mesh(new T.TorusGeometry(.28,.07,6,20),palette.gold,x,3.6,z);}
    this.label(title,x,1,z+3.4,4.2);
  }
  gate(){
    for(const x of [-11,-5,5,11]){
      this.box(x===-5||x===5?1:2,5.4,2.7,palette.wall,x,2.7,35);
      this.box(1.5,.3,3,palette.stone,x,.2,35);
    }
    this.box(24,1.6,3,palette.wall,0,5.3,35);
    this.roof(0,35,25,5.3,6.15,1.8);
    this.box(9,2.5,3.2,palette.wall,0,8,35);
    for(let x=-3;x<=3;x+=1.5)this.box(.6,1.4,.15,palette.wood,x,8,36.65);
    this.roof(0,35,11.5,5.2,9.3,1.8);
    this.label('NOVA TỰ',0,5.3,36.65,5);
    for(const s of [-1,1])this.box(27,1.9,.6,palette.wall,s*27,1,35);
  }
  buddha(x,y,z,scale=1,small=false){
    const p=new T.Group();p.userData.dynamic=true;p.position.set(x,y,z);p.scale.setScalar(scale);this.root.add(p);
    const gold=this.mat(0xdab565,{metalness:.48,roughness:.38}),robe=this.mat(0xc99a43,{metalness:.25,roughness:.52});
    this.cyl(2.1,2.35,.55,0x996f3b,0,.2,0,p,24);
    for(let k=0;k<16;k++){
      const a=k*Math.PI*2/16;const petal=this.ellipsoid(.43,.27,.85,gold,Math.cos(a)*1.55,.55,Math.sin(a)*1.55,p);petal.rotation.y=-a+Math.PI/2;
    }
    this.cyl(1.8,2,.25,gold,0,.75,0,p,24);
    this.ellipsoid(1.35,.4,.75,robe,-.45,1.1,.25,p).rotation.z=-.15;
    this.ellipsoid(1.35,.4,.75,robe,.45,1.1,.25,p).rotation.z=.15;
    this.ellipsoid(.85,1.22,.57,robe,0,2.05,-.2,p);
    this.ellipsoid(.38,.14,.23,gold,-.36,1.13,.86,p).rotation.z=.2;
    this.ellipsoid(.38,.14,.23,gold,.36,1.13,.86,p).rotation.z=-.2;
    this.curve([[-.63,2.8,-.08],[-1.03,2.1,.06],[-.85,1.55,.65],[-.12,1.53,.86]],.22,robe,p);
    this.curve([[.63,2.8,-.08],[1.03,2.1,.06],[.85,1.55,.65],[.12,1.53,.86]],.22,gold,p);
    this.ellipsoid(.33,.1,.22,gold,-.06,1.54,.84,p);this.ellipsoid(.33,.1,.22,gold,.06,1.66,.84,p);
    this.cyl(.25,.3,.4,gold,0,3.08,-.2,p);
    this.ellipsoid(.63,.8,.58,gold,0,3.75,-.19,p);
    for(const s of [-1,1]){
      this.ellipsoid(.15,.46,.12,gold,s*.64,3.6,-.18,p);
      this.curve([[s*.12,3.82,.36],[s*.26,3.78,.39],[s*.4,3.82,.3]],.026,0x7a5c2a,p);
      this.curve([[s*.11,4.04,.33],[s*.27,4.07,.35],[s*.42,4,.25]],.025,0xa08039,p);
    }
    this.ellipsoid(.1,.18,.14,gold,0,3.68,.37,p);
    this.curve([[-.17,3.43,.31],[0,3.4,.37],[.17,3.43,.31]],.025,0x9a6c32,p);
    this.ellipsoid(.52,.35,.5,0xa97f39,0,4.32,-.2,p);
    this.ellipsoid(.23,.26,.24,gold,0,4.63,-.2,p);
    if(!small)for(let row=0;row<5;row++)for(let k=0;k<14;k++){
      const a=k*Math.PI*2/14,r=Math.sin((row+1)/6*Math.PI/2)*.51;
      this.ellipsoid(.055,.055,.055,gold,Math.cos(a)*r,4.6-row*.105,-.2+Math.sin(a)*r,p);
    }
    const halo=this.mesh(new T.TorusGeometry(2.05,.07,8,64),this.mat(0xe9ce83,{emissive:0x6e4b15,emissiveIntensity:.3,metalness:.5}),0,3.2,-1.02,p);
    this.mesh(new T.TorusGeometry(2.25,.025,6,64),gold,0,3.2,-1.03,p);
    for(let k=0;k<32;k++){const a=k*Math.PI*2/32;const ray=this.box(.035,.25,.035,gold,Math.cos(a)*2.39,3.2+Math.sin(a)*2.39,-1.03,p);ray.rotation.z=a-Math.PI/2;}
    // Nếp áo được tạo thành đường cong trên vai và thân tượng.
    for(let i=0;i<5;i++)this.curve([[-.65+i*.1,2.7,-.02],[-.55+i*.19,2.05,.39],[-.7+i*.3,1.35,.62]],.023,0xb58535,p);
    return p;
  }
  painting(side,x){
    const c=document.createElement('canvas');c.width=384;c.height=512;const ctx=c.getContext('2d');
    const bg=ctx.createLinearGradient(0,0,0,512);bg.addColorStop(0,'#86968e');bg.addColorStop(1,'#d7cfac');ctx.fillStyle=bg;ctx.fillRect(0,0,384,512);
    ctx.strokeStyle='#ece0ad';ctx.lineWidth=6;ctx.strokeRect(12,12,360,488);
    ctx.fillStyle='#e1d5a2';ctx.beginPath();ctx.arc(192,136,85,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=side==='left'?'#f0e7ce':'#bd9c64';ctx.beginPath();ctx.moveTo(178,180);ctx.quadraticCurveTo(90,242,91,414);ctx.quadraticCurveTo(192,460,293,414);ctx.quadraticCurveTo(270,235,207,180);ctx.fill();
    ctx.fillStyle='#e3bf8e';ctx.beginPath();ctx.ellipse(192,151,31,44,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5b5742';ctx.beginPath();ctx.moveTo(159,146);ctx.quadraticCurveTo(147,82,192,83);ctx.quadraticCurveTo(240,87,225,146);ctx.quadraticCurveTo(213,110,192,106);ctx.quadraticCurveTo(173,110,159,146);ctx.fill();
    ctx.strokeStyle='#a68a51';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(160,233);ctx.quadraticCurveTo(145,310,186,332);ctx.moveTo(222,233);ctx.quadraticCurveTo(240,310,198,332);ctx.stroke();
    ctx.fillStyle='#d6b779';for(let i=0;i<7;i++){ctx.save();ctx.translate(192,425);ctx.rotate((i-3)*.28);ctx.beginPath();ctx.ellipse(0,-25,20,52,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    const mat=new T.MeshStandardMaterial({map:tex,roughness:.95});
    const m=this.mesh(new T.PlaneGeometry(3.3,4.5),mat,x,4,-28.72);m.userData.dynamic=true;this.paintings[side]=m;
    for(const s of [-1,1]){this.box(.12,4.8,.15,palette.gold,x+s*1.73,4,-28.64);this.box(3.55,.12,.15,palette.gold,x,4+s*2.33,-28.64);}
  }
  tree(x,z,s=1,frangipani=false){
    this.cyl(.16*s,.3*s,3*s,palette.wood,x,1.5*s,z);
    for(let k=0;k<4;k++){
      const a=k*Math.PI/2,tx=x+Math.cos(a)*1.05*s,tz=z+Math.sin(a)*1.05*s;
      const branch=this.curve([[x,1.8*s,z],[tx,3*s,tz]],.11*s,palette.wood);
      this.ellipsoid(1.6*s,1.35*s,1.55*s,k%2?palette.leaf:palette.darkLeaf,tx,3.8*s,tz);
      if(frangipani)for(let j=0;j<3;j++)this.ellipsoid(.16,.08,.16,0xffeed2,tx+Math.sin(j*2)*s,4.8*s,tz+Math.cos(j*2)*s);
    }
  }
  lotus(x,z,s=1){
    const leaf=this.cyl(.6*s,.6*s,.025,0x718d69,x,.11,z,undefined,12);
    for(let k=0;k<7;k++){
      const a=k*Math.PI*2/7;const p=this.ellipsoid(.12*s,.23*s,.26*s,0xd4a5a1,x+Math.cos(a)*.15*s,.3*s,z+Math.sin(a)*.15*s);p.rotation.y=-a+Math.PI/2;p.rotation.z=.25;
    }
    this.ellipsoid(.1*s,.12*s,.1*s,0xdec286,x,.4*s,z);
  }
  pond(){
    this.box(16,.22,14,palette.stone,-25,-.14,16);
    const geo=new T.PlaneGeometry(14.6,12.6,1,1);
    this.water=new T.ShaderMaterial({transparent:true,uniforms:{uTime:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){float r=sin(vUv.x*72.+uTime*.6+sin(vUv.y*35.))*cos(vUv.y*62.-uTime*.5);vec3 c=mix(vec3(.31,.48,.43),vec3(.57,.71,.62),r*.18+.45);gl_FragColor=vec4(c,.82);}'});
    const water=this.mesh(geo,this.water,-25,.045,16);water.rotation.x=-Math.PI/2;water.userData.dynamic=true;
    for(let k=0;k<10;k++){
      const fish=new T.Group();fish.userData.dynamic=true;this.root.add(fish);
      this.ellipsoid(.17,.1,.5,k%3?0xd3b281:0xa45f42,0,0,0,fish);
      this.ellipsoid(.18,.105,.18,0xf1e2c0,0,0,.19,fish);
      this.ellipsoid(.25,.025,.15,0xcfb08b,0,0,-.5,fish);
      this.fish.push({mesh:fish,phase:k*.63,r:2+k*.31});
    }
    for(let k=0;k<7;k++)this.lotus(-30+(k%3)*2.7,12+Math.floor(k/3)*3,.8);
    // Cầu đá nhỏ ở bờ nam ao.
    this.box(10,.25,2.2,palette.stone,-25,.3,23.3);
    for(const z of [22.4,24.2]){this.box(10,.15,.12,palette.stone,-25,1.15,z);for(let x=-29;x<=-21;x+=2)this.box(.14,1,.14,palette.stone,x,.7,z);}
    this.label('AO SEN',-25,1.3,25.2,4);
  }
  lantern(x,z,y=2.5){
    this.cyl(.35,.35,.7,0xc38453,x,y,z,undefined,12);this.cyl(.4,.4,.1,palette.gold,x,y+.38,z);this.cyl(.4,.4,.1,palette.gold,x,y-.38,z);
    this.curve([[x,y-.4,z],[x,y-.8,z]],.025,palette.gold);
  }
  build(){
    this.box(110,.5,110,palette.grass,0,-.25,0).material.userData.baseLayer=100;
    this.box(23,.1,44,0xd8ceb6,0,-.04,10).material.userData.baseLayer=99;
    this.box(70,.08,6,0xd8ceb6,0,-.03,-8);
    this.box(8,.08,25,0xd8ceb6,23,-.03,22);
    const joints=[];
    for(let z=-10;z<33;z+=2.4)joints.push(-11.5,.016,z,11.5,.016,z);
    for(let x=-11.5;x<=11.5;x+=2.3)joints.push(x,.016,-10,x,.016,32);
    const l=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(joints,3)),new T.LineBasicMaterial({color:0xb4a992,transparent:true,opacity:.35}));this.root.add(l);
    this.gate();this.house(0,-21,23,16,'CHÍNH ĐIỆN',{open:true,large:true});
    this.box(12,.65,4.8,palette.wood,0,.4,-25.5);this.mainStatue=this.buddha(0,.8,-25.4,1.18);
    // Bái đường thoáng bốn phía nối tiếp sân và chính điện, lối giữa luôn thông.
    this.roof(0,-4,25,14,5.3,2.6);
    for(const x of [-10.5,10.5])for(const z of [-10,2])this.cyl(.22,.27,5.3,palette.red,x,2.65,z);
    this.label('BÁI ĐƯỜNG',0,4.3,3.1,6);
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      this.box(1.3,.07,1.05,0xb8b59a,-8+col*4,.43,-15.8-row*2.2);
      this.cyl(.4,.42,.11,0x87927a,-8+col*4,.52,-15.8-row*2.2,undefined,14);
    }
    // Lư hương: tương tác thắp hương tạo khói qua RitualEffects, đồng bộ server.
    this.cyl(.45,.3,.65,0xb18b4c,0,.76,-20);
    for(const x of [-.55,.55])this.mesh(new T.TorusGeometry(.22,.06,7,16),palette.gold,x,.95,-20);
    this.painting('left',-7.2);this.painting('right',7.2);
    this.label('Nam mô Bổn Sư Thích Ca Mâu Ni Phật',0,1.05,-22.8,7);
    for(const x of [-4,4]){
      this.cyl(.4,.6,.4,0xbfa372,x,1.01,-23);this.cyl(.06,.07,1,0xb79b66,x,1.6,-23);
      for(let k=0;k<4;k++)this.ellipsoid(.18,.17,.15,0xcb9f87,x+Math.cos(k*1.7)*.3,2.2+Math.sin(k)*.2,-23+Math.sin(k*1.7)*.3);
    }
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      this.box(1.45,.09,1.12,0xb4a579,-8.1+col*3.25,.025,-7+row*3.4);
      this.cyl(.4,.44,.14,0x8b9679,-8.1+col*3.25,.13,-7+row*3.4,undefined,16);
    }
    this.house(0,-35,17,7,'NHÀ TỔ');this.house(29,-12,13,12,'NHÀ TĂNG');
    this.house(-28,-20,13,11,'NHÀ THỜ MẪU');this.house(29,4,12,8,'TRAI ĐƯỜNG');
    this.label('Khu tĩnh tu · xin giữ yên lặng',29,1.8,-4.6,7);
    for(let x=22;x<=36;x+=1.2)this.box(.12,1.25,.15,palette.wood,x,.6,-5.4);
    this.box(14,.15,.15,palette.wood,29,1.05,-5.4);
    this.pavilion(20,14,'GÁC CHUÔNG');this.pavilion(-19,-2,'GÁC TRỐNG',true);this.pond();
    for(let k=0;k<5;k++){
      const x=21+(k%3)*5,z=-29-Math.floor(k/3)*7;
      this.box(2.5,.3,2.5,palette.stone,x,.1,z);this.cyl(.9,1.1,2,palette.wall,x,1.2,z,undefined,6);
      for(let j=0;j<3;j++){this.cyl(1.2-j*.18,1.5-j*.18,.3,palette.roof,x,2.3+j*.6,z,undefined,6);this.cyl(.7-j*.18,.8-j*.18,.4,palette.wall,x,2.6+j*.6,z,undefined,6);}
      this.cyl(.03,.3,.7,palette.gold,x,4.2,z,undefined,8);
    }
    this.label('VƯỜN THÁP',28,1.4,-24.8,5);
    // Máy trải nghiệm chỉ tiêu xu ảo, không có cổng thanh toán.
    this.box(2.25,3.5,1.7,0x617b6a,29,1.75,29);this.box(1.6,2.3,.08,0xb9d1c1,28.8,2,29.9);
    for(let k=0;k<3;k++)for(let j=0;j<3;j++)this.cyl(.13,.13,.4,[0xcbb172,0x948d70,0xd4c8a0][k],28.3+k*.45,1.4+j*.65,30);
    this.box(.55,.35,.1,0x364f43,29, .5,29.9);this.label('GÓC LƯU NIỆM',30.7,4.3,29,6);
    this.box(2.25,3.5,1.7,0x976953,32,1.75,29);this.box(1.6,2.3,.08,0xcdd6b3,31.8,2,29.9);
    for(let k=0;k<3;k++)for(let j=0;j<3;j++)this.cyl(.13,.13,.4,[0xd8bb73,0x86a28b,0xbd8f75][k],31.3+k*.45,1.4+j*.65,30);
    this.box(.55,.35,.1,0x364f43,32,.5,29.9);
    // Ống thẻ tự soạn: một lời nhắc sống đẹp, không có điểm số hay mua vận may.
    this.box(1.8,.12,1.25,palette.wood,8,.85,23);
    for(const x of [7.4,8.6])for(const z of [22.6,23.4])this.box(.09,.85,.09,palette.wood,x,.42,z);
    this.cyl(.24,.21,.52,0x9e553a,8,1.15,23);
    for(let i=0;i<14;i++)this.box(.025,.65,.045,0xe2c08c,7.8+(i%5)*.09,1.4+(i%3)*.04,22.9+Math.floor(i/5)*.08);
    this.label('GÓC LỜI LÀNH',8,2.2,23,4);
    // Bồn hoa thấp: geometry được gộp theo material trong batch().
    for(const [x,z] of [[-17,30],[17,30],[-35,5],[17,7]]){
      this.cyl(1.8,1.9,.25,palette.stone,x,.05,z,undefined,18);
      for(let i=0;i<19;i++){
        const a=i*2.399,r=Math.sqrt(i/19)*1.5,fx=x+Math.cos(a)*r,fz=z+Math.sin(a)*r;
        this.cyl(.025,.025,.45,palette.leaf,fx,.3,fz,undefined,5);
        for(let k=0;k<5;k++)this.ellipsoid(.11,.045,.16,[0xc8829b,0xe2c981,0xe7d9c7][i%3],fx+Math.cos(k*1.257)*.1,.55,fz+Math.sin(k*1.257)*.1);
      }
    }
    for(let i=0;i<20;i++){
      const a=i*Math.PI*2/20,x=Math.cos(a)*46,z=Math.sin(a)*45;
      this.tree(x,z,1+(i%3)*.24,i%3===0);
    }
    for(const [x,z] of [[-15,28],[15,28],[-15,-11],[15,-11],[-36,2],[37,20],[-36,-33]])this.tree(x,z,1,true);
    for(const x of [-12.8,12.8])for(let z=4;z<30;z+=8){
      this.cyl(.06,.08,3.1,palette.wood,x,1.5,z);this.lantern(x,z,3.1);
      this.box(2,.25,1.2,0xb6ac8e,x,0,z+2);for(let k=0;k<3;k++)this.ellipsoid(.35,.25,.35,0x899b79,x+(k-1)*.55,.3,z+2);
    }
    for(let k=0;k<7;k++){
      const m=this.mesh(new T.SphereGeometry(1,12,8),this.mat(k%2?0x8fa38f:0x9caf9d),-60+k*20,-3,-61);m.scale.set(23,11+k%3*3,13);
    }
    this.particles=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(48*3),3)),new T.PointsMaterial({color:0xe4ca8e,size:.11,transparent:true,opacity:.8,depthWrite:false}));
    this.particles.userData.dynamic=true;this.particles.visible=false;this.root.add(this.particles);
  }
  batch(){
    this.root.updateMatrixWorld(true);const batches=new Map(),remove=[];
    this.root.traverse(o=>{
      if(!o.isMesh||Array.isArray(o.material))return;
      let p=o;while(p&&p!==this.root){if(p.userData.dynamic)return;p=p.parent;}
      let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();
      for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);
      if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
      const key=o.material.uuid;if(!batches.has(key))batches.set(key,{mat:o.material,geos:[]});batches.get(key).geos.push(g);remove.push(o);
    });
    for(const {mat,geos} of batches.values()){
      const merged=mergeGeometries(geos,false);if(!merged)continue;
      const mesh=new T.Mesh(merged,mat);mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);for(const g of geos)g.dispose();
    }
    for(const o of remove){o.removeFromParent();o.geometry.dispose();}
  }
  batchStatue(){
    // Gộp riêng tượng để vẫn bật/tắt được khi thay bằng GLB chi tiết.
    const root=this.mainStatue;root.updateMatrixWorld(true);
    const inv=root.matrixWorld.clone().invert(),byMaterial=new Map(),old=[];
    root.traverse(o=>{
      if(!o.isMesh)return;
      let g=o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));
      if(g.index)g=g.toNonIndexed();
      const entry=byMaterial.get(o.material)||[];entry.push(g);byMaterial.set(o.material,entry);old.push(o);
    });
    for(const [material,geos] of byMaterial){
      const combined=mergeGeometries(geos,false);if(!combined)continue;
      const m=new T.Mesh(combined,material);m.castShadow=true;m.receiveShadow=true;root.add(m);
      geos.forEach(g=>g.dispose());
    }
    for(const o of old){o.removeFromParent();o.geometry.dispose();}
  }
  setPainting(slot,url){
    const mesh=this.paintings[slot];if(!mesh)return;
    new T.TextureLoader().load(url,tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=2;mesh.material.map?.dispose();mesh.material.map=tex;mesh.material.needsUpdate=true;},undefined,()=>console.warn('Không tải được tranh; giữ tranh dự phòng:',slot));
  }
  loadPaintingConfig(){
    for(const item of PAINTINGS){
      if(!this.paintings[item.id]){
        const m=this.mesh(new T.PlaneGeometry(item.width||3.3,item.height||4.5),0xe8d3a4,...item.position);
        m.userData.dynamic=true;if(item.rotationY)m.rotation.y=item.rotationY;this.paintings[item.id]=m;
      }
      this.setPainting(item.id,item.url);
    }
  }
  async loadBuddhaModel(){
    if(!BUDDHA_MODEL.url)return;
    try {
      const asset=await new GLTFLoader().loadAsync(BUDDHA_MODEL.url),model=asset.scene;
      model.rotation.y=BUDDHA_MODEL.rotationY||0;
      const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
      if(!size.y)throw Error('Tượng không có chiều cao.');
      model.scale.setScalar(BUDDHA_MODEL.height/size.y);
      const scaled=new T.Box3().setFromObject(model),center=scaled.getCenter(new T.Vector3());
      const [x,y,z]=BUDDHA_MODEL.position||[0,.82,-25.4];
      model.position.set(x-center.x,y-scaled.min.y,z-center.z);
      model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      if(BUDDHA_MODEL.replaceMain)this.mainStatue.visible=false;this.scene.add(model);
    }catch(error){console.warn('Giữ tượng tự dựng vì chưa nạp được GLB:',error.message);}
  }
  update(time,player,chant=false){
    this.water.uniforms.uTime.value=time;
    for(const f of this.fish){const a=time*.16+f.phase;f.mesh.position.set(-25+Math.sin(a)*f.r,-.025,16+Math.cos(a)*f.r*.7);f.mesh.rotation.y=Math.atan2(Math.cos(a),-Math.sin(a)*.7);}
    for(const r of this.roofs){const inside=player&&Math.abs(player.x-r.x)<r.w/2+1&&Math.abs(player.z-r.z)<r.d/2+1;const target=inside?.12:1;r.material.opacity=T.MathUtils.lerp(r.material.opacity,target,.07);r.material.depthWrite=r.material.opacity>.5;}
    this.particles.visible=chant&&!!player;
    if(this.particles.visible){const a=this.particles.geometry.attributes.position;for(let i=0;i<a.count;i++){const phase=i*2.399+time*.13,r=.6+(i%8)*.18;a.setXYZ(i,player.x+Math.cos(phase)*r,.3+((time*.3+i*.13)%3),player.z+Math.sin(phase)*r);}a.needsUpdate=true;}
  }
}
