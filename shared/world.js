// Mét trong thế giới 3D. Dùng chung cho renderer, va chạm và máy chủ.
export const BOUNDS = { minX: -41, maxX: 41, minZ: -40, maxZ: 43 };
export const SPAWN = { x: 0, z: 28 };
export const SPEED = { walk: 3.4, run: 5.5 };
export const MAX_PLAYERS = 24;
export const LANDMARKS = [
  { id:'gate', name:'Tam quan', x:0, z:35, kind:'gate' },
  { id:'forecourt', name:'Bái đường', x:0, z:-5, kind:'house' },
  { id:'buddha', name:'Chính điện · Tam Bảo', x:0, z:-23, radius:9, kind:'buddha' },
  { id:'ancestor', name:'Nhà Tổ', x:0, z:-35, kind:'house' },
  { id:'monastery', name:'Nhà Tăng · khu tĩnh tu', x:29, z:-12, kind:'private' },
  { id:'bell', name:'Gác chuông', x:20, z:14, radius:4.8, kind:'bell' },
  { id:'drum', name:'Gác trống', x:-19, z:-2, radius:4.8, kind:'drum' },
  { id:'mother', name:'Nhà thờ Mẫu', x:-28, z:-20, kind:'house' },
  { id:'dining', name:'Trai đường', x:29, z:4, radius:7, kind:'dining' },
  { id:'stupas', name:'Vườn tháp', x:27, z:-31, kind:'garden' },
  { id:'pond', name:'Ao sen · hồ cá koi', x:-25, z:16, kind:'pond' },
  { id:'vending', name:'Quầy lưu niệm', x:29, z:29, radius:4.5, kind:'vending' }
  ,{ id:'incense', name:'Lư hương', x:0, z:-20, radius:3.1, kind:'ritual' }
  ,{ id:'lantern', name:'Bến hoa đăng', x:-25, z:24, radius:4.4, kind:'ritual' }
  ,{ id:'fortune', name:'Góc lời lành', x:8, z:23, radius:3.5, kind:'ritual' }
];
// Nhà Tăng có hàng rào; ao và bệ thờ có va chạm. Chính điện mở cửa từ sân.
export const COLLIDERS = [
  { x:-25,z:16,w:15,d:13 }, { x:29,z:-12,w:14,d:13 },
  { x:29,z:4,w:13,d:9 }, { x:-28,z:-20,w:14,d:12 },
  { x:0,z:-35,w:18,d:8 }, { x:0,z:-25,w:11,d:4 },
  { x:29,z:29,w:2.4,d:1.9 }, { x:32,z:29,w:2.4,d:1.9 },
  { x:0,z:-20,w:1.1,d:1.1 }, { x:8,z:23,w:1.8,d:1.25 },
  { x:-10.5,z:-10,w:.55,d:.55 },{ x:10.5,z:-10,w:.55,d:.55 },
  { x:-10.5,z:2,w:.55,d:.55 },{ x:10.5,z:2,w:.55,d:.55 },
  { x:-11.5,z:-21,w:.7,d:16 }, { x:11.5,z:-21,w:.7,d:16 },
  { x:0,z:-29,w:23,d:.8 },
  { x:-11,z:35,w:2,d:3 }, { x:-5,z:35,w:1,d:3 },
  { x:5,z:35,w:1,d:3 }, { x:11,z:35,w:2,d:3 }
];
export function canStand(x,z) {
  const r=.38;
  return Number.isFinite(x) && Number.isFinite(z) && x>BOUNDS.minX+r && x<BOUNDS.maxX-r && z>BOUNDS.minZ+r && z<BOUNDS.maxZ-r && !COLLIDERS.some(b=>Math.abs(x-b.x)<b.w/2+r && Math.abs(z-b.z)<b.d/2+r);
}
export function movePosition(p,dx,dz,dt,run=false) {
  const length=Math.hypot(dx,dz), speed=SPEED[run?'run':'walk'];
  if(length>1){dx/=length;dz/=length;}
  const x=p.x+dx*speed*dt,z=p.z+dz*speed*dt;
  // Trượt dọc chướng ngại thay vì xuyên qua tường.
  if(canStand(x,p.z))p.x=x;
  if(canStand(p.x,z))p.z=z;
  return p;
}
export function nearby(p,id) { const l=LANDMARKS.find(a=>a.id===id); return l && Math.hypot(p.x-l.x,p.z-l.z)<=(l.radius||4); }
export const ACTIONS = ['Idle','Walk','Run','Meditate','Prostrate','Greet','Laugh','Wave','Chant'];
export const ROLES = [
  {id:'male',name:'Phật tử nam',label:'Nam',color:'#889ba5',hair:true},
  {id:'female',name:'Phật tử nữ',label:'Nữ',color:'#9daaa5',hair:true},
  {id:'abbot',name:'Trụ trì',label:'Trụ trì',color:'#c99c45',hair:false},
  {id:'monastic',name:'Tu sĩ',label:'Tu sĩ',color:'#80949b',hair:false}
];
export const OUTFITS = [
  {id:'grey',name:'Áo lam',color:'#91a6ae',roles:['male','female','monastic']},
  {id:'brown',name:'Áo nâu',color:'#805b46',roles:['male','female','abbot','monastic']},
  {id:'saffron',name:'Cà sa vàng',color:'#d9a136',roles:['abbot','monastic']},
  {id:'dragon',name:'Huyền kim',color:'#28293d',roles:['abbot']},
  {id:'lotusgold',name:'Liên hoa',color:'#824742',roles:['abbot']},
  {id:'traditional',name:'Áo dài',color:'#b6c7b2',roles:['male','female']}
];
export const PRODUCTS = [
  {id:'water',name:'Nước suối',price:5,icon:'◈'},
  {id:'incense',name:'Nhang thơm',price:10,icon:'♧'},
  {id:'lotus',name:'Sen lưu niệm',price:20,icon:'❀'}
];
export function heightAt(x,z){return Math.abs(x)<11.8&&z< -12.8&&z> -29.2?.375:0;}
