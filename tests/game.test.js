import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import sharp from 'sharp';
import { createGame } from '../server.js';
import { signToken, verifyToken } from '../server/auth.js';
import { canStand, movePosition } from '../shared/world.js';

let game,base,a,b,c,pa,pb,pc;
const clients=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const once=(s,event)=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Timed out: '+event)),5000);s.once(event,x=>{clearTimeout(t);resolve(x);});});
const emit=(s,event,data)=>new Promise((resolve,reject)=>s.timeout(5000).emit(event,data,(err,r)=>err?reject(err):resolve(r)));
async function profile(name,key){const r=await fetch(base+'/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guestKey:key.repeat(64),name,role:'male',outfit:'grey'})});assert.equal(r.status,200);return r.json();}
async function connect(p){const s=io(base,{auth:{token:p.token},autoConnect:false});clients.push(s);const ready=once(s,'connect');s.connect();await ready;return s;}
before(async()=>{
  game=await createGame({env:{MONGODB_URI:'',SESSION_SECRET:'test-secret-with-at-least-32-characters',ADMIN_TOKEN:'administrator-test-token',ABBOT_PASSWORD:'Tlinh2006@',NODE_ENV:'test',CLIENT_ORIGIN:''}});
  await new Promise(r=>game.http.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+game.http.address().port;
  pa=await profile('Linh','a');pb=await profile('Bạn','b');pc=await profile('Khách','c');
  a=await connect(pa);b=await connect(pb);c=await connect(pc);
});
after(async()=>{for(const s of clients)s.disconnect();await game.close();});
test('Token giả hoặc sửa chữ ký bị từ chối',()=>{
  const s='a-secret';const token=signToken('profile-id',s);assert.equal(verifyToken(token,s),'profile-id');assert.equal(verifyToken(token+'x',s),null);assert.equal(verifyToken(token,'other'),null);
});
test('Tạo và vào phòng theo mã; phòng khác được cách ly',async()=>{
  const joined=await emit(a,'join',{});assert.match(joined.room,/^[A-F0-9]{6}$/);pa.room=joined.room;
  assert.equal((await emit(b,'join',{room:pa.room})).players.length,2);
  const separate=await emit(c,'join',{});assert.notEqual(separate.room,pa.room);
  let leaked=false;c.on('chat',()=>leaked=true);const received=once(b,'chat');
  await emit(a,'chat',{text:'Xin chào <script>!'});const chat=await received;
  assert.equal(chat.text,'Xin chào script!');await delay(100);assert.equal(leaked,false);
});
test('Server tự tính di chuyển; bỏ qua tọa độ giả, tốc độ hữu hạn',async()=>{
  const p=game.players.get(pa.profile.id),old=p.z;
  a.emit('input',{dx:0,dz:-1,x:9999,z:9999});await delay(220);
  assert.ok(p.z<old);assert.ok(old-p.z<1.2);assert.ok(Math.abs(p.x)<1);
  a.emit('input',{dx:0,dz:0});await delay(70);
});
test('Không được niệm Phật hoặc mua đồ khi còn xa',async()=>{
  assert.match((await emit(a,'action',{action:'Chant'})).error,/gần/);
  assert.match((await emit(a,'interact',{id:'vending',product:'water'})).error,/gần/);
});
test('Va chạm ngăn xuyên ao và nhà tăng; có thể đi trong sân',()=>{
  assert.equal(canStand(-25,16),false);assert.equal(canStand(29,-12),false);assert.equal(canStand(0,18),true);
  const p={x:17,z:-12};for(let i=0;i<100;i++)movePosition(p,1,0,.05,true);assert.ok(p.x<22);
});
test('Động tác có phát cho bạn cùng phòng',async()=>{
  await delay(550);const received=once(b,'action');assert.equal((await emit(a,'action',{action:'Wave'})).ok,true);assert.equal((await received).action,'Wave');
});
test('Kết bạn cần lời mời và sự chấp nhận',async()=>{
  assert.ok((await emit(b,'friend:accept',{id:pa.profile.id})).error);
  assert.equal((await emit(a,'friend:request',{id:pb.profile.id})).ok,true);
  assert.equal((await emit(b,'friend:accept',{id:pa.profile.id})).ok,true);
  const friends=await fetch(base+'/api/friends',{headers:{Authorization:'Bearer '+pb.token}}).then(r=>r.json());assert.equal(friends.friends[0].id,pa.profile.id);
});
test('Vai trò Trụ trì không vượt quyền tải tranh; validate dữ liệu và resize ảnh thật',async()=>{
  const headers={Authorization:'Bearer '+pa.token};
  const forbidden=await fetch(base+'/api/paintings/left',{method:'POST',headers});assert.equal(forbidden.status,403);
  const invalid=new FormData();invalid.append('image',new Blob(['<svg>bad</svg>'],{type:'image/svg+xml'}),'bad.svg');
  const bad=await fetch(base+'/api/paintings/left',{method:'POST',headers:{...headers,'X-Admin-Token':'administrator-test-token'},body:invalid});assert.ok([400,415].includes(bad.status));
  const source=await sharp({create:{width:120,height:160,channels:3,background:'#b9a66c'}}).png().toBuffer();
  const form=new FormData();form.append('image',new Blob([source],{type:'image/png'}),'painting.png');
  const saved=await fetch(base+'/api/paintings/left',{method:'POST',headers:{...headers,'X-Admin-Token':'administrator-test-token'},body:form});assert.equal(saved.status,200);
  const bytes=Buffer.from(await fetch(base+'/api/paintings/left').then(r=>r.arrayBuffer()));const metadata=await sharp(bytes).metadata();assert.equal(metadata.width,768);assert.equal(metadata.height,1024);assert.equal(metadata.format,'jpeg');
});
test('Mua bằng xu ảo được trừ tiền và ghi đúng túi đồ trên server',async()=>{
  const player=game.players.get(pb.profile.id);player.x=27;player.z=30;
  await delay(1300);const r=await emit(b,'interact',{id:'vending',product:'lotus'});assert.equal(r.ok,true);
  const p=await game.store.get(pb.profile.id);assert.equal(p.coins,80);assert.equal(p.inventory.lotus,1);
});
test('Khóa hồ sơ trả lại cùng ID; máy chủ không tiết lộ keyHash',async()=>{
  const same=await profile('Linh mới','a');assert.equal(same.profile.id,pa.profile.id);assert.equal('keyHash' in same.profile,false);
});
test('Vai Trụ trì bị chặn khi thiếu/sai mật khẩu; cấp vai khi đúng ở backend',async()=>{
  const register=password=>fetch(base+'/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guestKey:'d'.repeat(64),name:'Trụ trì',role:'abbot',outfit:'dragon',abbotPassword:password})});
  assert.equal((await register(undefined)).status,403);
  assert.equal((await register('incorrect')).status,403);
  const response=await register('Tlinh2006@');assert.equal(response.status,200);
  const p=await response.json();assert.equal(p.profile.role,'abbot');assert.equal(p.profile.outfit,'dragon');
  assert.equal('abbotPassword' in p.profile,false);
  const s=await connect(p),joined=await emit(s,'join',{room:pa.room});
  assert.equal(joined.self.role,'abbot');assert.equal(joined.self.outfit,'dragon');
});
test('Chặn niệm Phật từ xa; chấp nhận khi đứng gần tượng',async()=>{
  const p=game.players.get(pa.profile.id);p.lockUntil=0;p.until=0;p.x=1.5;p.z=-20;p.input={dx:0,dz:0};
  const r=await emit(a,'action',{action:'Chant'});assert.equal(r.ok,true);assert.equal(p.action,'Chant');
});
test('Thắp hương xác minh khoảng cách, phát đúng phòng và có cooldown',async()=>{
  const p=game.players.get(pa.profile.id);p.x=0;p.z=28;p.lockUntil=0;p.input={dx:0,dz:0};
  assert.match((await emit(a,'ritual',{kind:'incense'})).error,/gần/);
  p.x=1.5;p.z=-20;
  let leaked=false;const listener=()=>leaked=true;c.on('ritual',listener);
  const received=once(b,'ritual');assert.equal((await emit(a,'ritual',{kind:'incense'})).ok,true);
  const event=await received;assert.equal(event.kind,'incense');assert.ok(event.expiresAt>event.at);
  assert.match((await emit(a,'ritual',{kind:'incense'})).error,/Chờ/);
  await delay(80);assert.equal(leaked,false);c.off('ritual',listener);
});
test('Hoa đăng có seed ổn định và được trả cho người vào phòng sau',async()=>{
  const p=game.players.get(pb.profile.id);p.lockUntil=0;p.input={dx:0,dz:0};p.x=-25;p.z=24;
  const received=once(a,'ritual');assert.equal((await emit(b,'ritual',{kind:'lantern',wish:'Bình an <img>'})).ok,true);
  const event=await received;assert.equal(event.kind,'lantern');assert.ok(Number.isInteger(event.seed));assert.equal(event.wish,'Bình an img');
  await delay(1000);const joined=await emit(c,'join',{room:pa.room});
  assert.ok(joined.effects.some(e=>e.id===event.id&&e.seed===event.seed));assert.ok(joined.serverNow>0);
});
test('Rút lời lành sinh kết quả trên server; bỏ qua nội dung và chỉ số giả',async()=>{
  const p=game.players.get(pb.profile.id);p.x=8;p.z=25;p.input={dx:0,dz:0};
  const r=await emit(b,'ritual',{kind:'fortune',number:9999,message:'cheat'});
  assert.equal(r.ok,true);assert.ok(r.number>=1&&r.number<=8);assert.notEqual(r.message,'cheat');
});
test('Dữ liệu kinh là văn bản thật có nguồn; mỗi bài có lựa chọn phiên bản',async()=>{
  const {SUTRAS}=await import('../client/data/sutras.js');
  assert.equal(SUTRAS.length,3);const drug=SUTRAS.find(s=>s.id==='medicine');
  const chinese=drug.versions.find(v=>v.id==='han').paragraphs.join('');
  assert.ok(chinese.startsWith('如是我聞'));assert.ok(chinese.endsWith('信受奉行。'));
  assert.ok(chinese.length>5000);assert.equal(drug.versions[0].paragraphs.length,14);
});
test('Các tài nguyên và module cần thiết phục vụ được trên cùng địa chỉ game',async()=>{
  for(const file of ['/','/js/animations.js','/js/bubble-chat.js','/js/rituals.js','/data/models.js','/data/paintings.js','/data/sources/T0450.xml','/assets/avatar.glb','/assets/models/buddha-detail.glb','/assets/paintings/lotus.svg','/vendor/three/three.module.js','/vendor/three/three.core.js','/vendor/addons/loaders/GLTFLoader.js']){
    const response=await fetch(base+file);assert.equal(response.status,200,file);assert.ok(Number(response.headers.get('content-length'))>0,file);
  }
});
