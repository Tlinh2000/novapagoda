import * as T from 'three';
import { PagodaWorld } from './world.js';
import { Avatar, loadAvatars } from './avatar.js';
import { TempleAudio } from './audio.js';
import { RitualEffects } from './rituals.js';
import { SUTRAS } from '../data/sutras.js';
import { ROLES, OUTFITS, LANDMARKS, PRODUCTS, canStand, movePosition, nearby, heightAt } from '/shared/world.js';

const $=id=>document.getElementById(id);
const safeStorage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
const state={role:'male',outfit:'grey',profile:null,token:null,socket:null,room:new URLSearchParams(location.search).get('room')||'',joined:false,ready:false,avatars:new Map(),keys:new Set(),joy:{x:0,y:0},run:false,path:[],lastInput:0,modal:null,lockUntil:0,action:'Idle',overview:false,serverOffset:0};
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),5500);}
const audio=new TempleAudio(toast);
const modal=$('modal');
function openModal(title,kind){state.modal=kind;state.path=[];state.keys.clear();state.joy={x:0,y:0};$('modal-content').replaceChildren();$('modal-eyebrow').textContent=title;if(!modal.open)modal.showModal();return $('modal-content');}
function node(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
function button(text,handler,className='secondary'){const e=node('button',text,className);e.type='button';e.addEventListener('click',handler);return e;}
$('modal-close').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal){const b=modal.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)modal.close();}});
modal.addEventListener('close',()=>{state.modal=null;audio.reader(false);});
function fatal(message){const box=node('div',null,'error-block');box.append(node('h2','Chưa mở được khuôn viên 3D'),node('p',message),button('Tải lại trang',()=>location.reload(),'primary'));document.body.append(box);}
let renderer,scene,camera,world,asset,previewRenderer,previewScene,previewCamera,previewAvatar,rituals;
const cameraTarget=new T.Vector3(0,0,-2),cameraOffset=new T.Vector3(28,35,36),pointer=new T.Vector2(),ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),aim=new T.Vector3();
let previewAngle=.35,previewDragging=false,previewLastX=0,zoom=1;
let cameraYaw=.24, cameraPitch=.42;
function setupRenderer(){
  const mainCanvas=document.createElement('canvas'),context=mainCanvas.getContext('webgl2',{antialias:true});
  if(!context)throw Error('WebGL 2 chưa bật. Hãy bật tăng tốc đồ họa trong trình duyệt.');
  renderer=new T.WebGLRenderer({canvas:mainCanvas,context,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.35:1.75));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
  renderer.shadowMap.enabled=!matchMedia('(pointer:coarse)').matches;renderer.shadowMap.type=T.PCFSoftShadowMap;$('stage').prepend(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color(0xbac7b6);scene.fog=new T.Fog(0xbac7b6,65,140);
  camera=new T.PerspectiveCamera(50,innerWidth/innerHeight,.1,240);camera.position.copy(cameraOffset).add(cameraTarget);camera.lookAt(cameraTarget);
  scene.add(new T.HemisphereLight(0xfff6df,0x6b806c,2.5));
  const sun=new T.DirectionalLight(0xffedcb,3);sun.position.set(-25,48,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-48;sun.shadow.camera.right=48;sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;sun.shadow.camera.far=110;sun.shadow.normalBias=.12;sun.shadow.bias=-.00015;scene.add(sun);
  world=new PagodaWorld(scene);rituals=new RitualEffects(scene);
  previewRenderer=new T.WebGLRenderer({canvas:$('preview'),antialias:true,alpha:true});previewRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));previewRenderer.outputColorSpace=T.SRGBColorSpace;previewRenderer.toneMapping=T.ACESFilmicToneMapping;
  previewScene=new T.Scene();previewScene.add(new T.HemisphereLight(0xfffae8,0x6f826a,2.6));const pl=new T.DirectionalLight(0xfff4d8,3.1);pl.position.set(3,5,4);previewScene.add(pl);
  previewCamera=new T.OrthographicCamera(-1.4,1.4,1.2,-1.2,.1,20);previewCamera.position.set(0,1.35,4.2);previewCamera.lookAt(0,1.1,0);
  const disc=new T.Mesh(new T.CylinderGeometry(.63,.67,.035,48),new T.MeshStandardMaterial({color:0xc5cbb8,roughness:1}));disc.position.y=-.025;previewScene.add(disc);
  new ResizeObserver(resize).observe($('preview').parentElement);addEventListener('resize',resize);resize();
}
function resize(){
  if(!renderer)return;renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  if(previewRenderer){const b=$('preview').getBoundingClientRect();if(b.width&&b.height){previewRenderer.setSize(b.width,b.height,false);previewCamera.left=-1.25*b.width/b.height;previewCamera.right=1.25*b.width/b.height;previewCamera.updateProjectionMatrix();}}
}
function updatePreview(){
  if(!asset)return;previewAvatar?.dispose();previewAvatar=new Avatar(asset,{role:state.role,outfit:state.outfit},previewScene);previewAvatar.root.rotation.y=previewAngle;
}
function creatorOptions(){
  $('abbot-lock').hidden=state.role!=='abbot';
  $('roles').replaceChildren(...ROLES.map(r=>{const b=button(r.label,()=>{state.role=r.id;const allowed=OUTFITS.filter(o=>o.roles.includes(state.role));if(!allowed.some(o=>o.id===state.outfit))state.outfit=state.role==='abbot'?'saffron':allowed[0].id;creatorOptions();updatePreview();},r.id===state.role?'selected':'');b.setAttribute('aria-pressed',r.id===state.role);return b;}));
  $('outfits').replaceChildren(...OUTFITS.filter(o=>o.roles.includes(state.role)).map(o=>{
    const b=button('',()=>{state.outfit=o.id;creatorOptions();updatePreview();},o.id===state.outfit?'selected':'');
    const thumb=node('span',null,'outfit-thumb');thumb.style.background=o.color;b.append(thumb,node('span',o.name));b.setAttribute('aria-label','Xem trước '+o.name);b.setAttribute('aria-pressed',o.id===state.outfit);return b;
  }));
}
$('preview').addEventListener('pointerdown',e=>{previewDragging=true;previewLastX=e.clientX;$('preview').setPointerCapture(e.pointerId);});
$('preview').addEventListener('pointermove',e=>{if(previewDragging){previewAngle+=(e.clientX-previewLastX)*.016;previewLastX=e.clientX;}});
$('preview').addEventListener('pointerup',()=>previewDragging=false);$('preview').addEventListener('pointercancel',()=>previewDragging=false);

function guestKey(){let key=safeStorage.get('nova-key');if(!/^[a-f0-9]{64}$/.test(key||'')){key=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');safeStorage.set('nova-key',key);}return key;}
async function api(url,options={}){
  const res=await fetch(url,{...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(state.token?{Authorization:'Bearer '+state.token}:{}),...options.headers}});
  let data;try{data=await res.json();}catch{throw Error('Máy chủ chưa sẵn sàng. Render có thể đang khởi động, hãy thử lại sau khoảng một phút.');}
  if(!res.ok)throw Error(data.error||'Không kết nối được máy chủ.');return data;
}
function send(event,data={}){
  if(!state.socket?.connected){toast('Đang nối lại máy chủ, hãy chờ một chút.');return Promise.resolve(null);}
  return new Promise(resolve=>state.socket.timeout(9000).emit(event,data,(err,result)=>{if(err){toast('Máy chủ phản hồi chậm, hãy thử lại.');resolve(null);}else{if(result?.error)toast(result.error);resolve(result);}}));
}
$('create-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.ready)return;
  $('enter').disabled=true;$('enter').firstChild.textContent='Đang mở cổng chùa… ';
  try{
    const result=await api('/api/profile',{method:'POST',body:JSON.stringify({guestKey:guestKey(),name:$('display-name').value,role:state.role,outfit:state.outfit,abbotPassword:$('abbot-password').value})});
    state.profile=result.profile;state.token=result.token;$('abbot-password').value='';state.room=$('join-code').value.trim().toUpperCase();
    safeStorage.set('nova-appearance',JSON.stringify({name:state.profile.name,role:state.role,outfit:state.outfit}));
    state.socket?.disconnect();connect();
  }catch(err){toast(err.message);$('enter').disabled=false;$('enter').firstChild.textContent='Bước vào sân chùa ';}
});
function synchronize(list){
  const ids=new Set(list.map(p=>p.id));for(const [id,av]of state.avatars)if(!ids.has(id)){av.dispose();state.avatars.delete(id);}
  for(const p of list){
    let av=state.avatars.get(p.id);if(!av){av=new Avatar(asset,p,scene,$('labels'));state.avatars.set(p.id,av);if(p.id===state.profile.id)av.label?.classList.add('self');}
    av.target.set(p.x,heightAt(p.x,p.z),p.z);av.targetRotation=p.rotation;
    if(p.id!==state.profile.id){av.setAction(p.action,p.actionAt,Date.now()+state.serverOffset);}
  }
  $('online-count').textContent=list.length+' người trong chùa';
}
function joinRoom(){
  state.socket.timeout(12000).emit('join',{room:state.room},(err,result)=>{
    if(err||result?.error){toast(result?.error||'Không vào được phòng, hãy thử lại.');$('enter').disabled=false;$('enter').firstChild.textContent='Bước vào sân chùa ';return;}
    state.room=result.room;state.serverOffset=result.serverNow-Date.now();rituals.clear();for(const effect of result.effects||[])rituals.add(effect);state.joined=true;document.body.classList.add('playing');$('welcome').hidden=true;$('game-ui').hidden=false;
    $('room-code').textContent='PHÒNG '+state.room;$('room-button').disabled=false;$('connection').textContent='Đã kết nối';$('connection').classList.remove('offline');
    history.replaceState(null,'','?room='+state.room);synchronize(result.players);
    state.avatars.get(state.profile.id)?.root.position.set(result.self.x,heightAt(result.self.x,result.self.z),result.self.z);resize();
    if(!safeStorage.get('nova-help-shown')){setTimeout(showHelp,600);safeStorage.set('nova-help-shown','1');}
    if(matchMedia('(pointer:coarse)').matches)$('chat-panel').classList.add('collapsed');
  });
}
function connect(){
  state.socket=window.io({auth:{token:state.token},reconnection:true,reconnectionDelay:1000,reconnectionDelayMax:5000});
  state.socket.on('connect',joinRoom);
  state.socket.on('connect_error',err=>{
    toast(err.message||'Chưa nối được máy chủ.');$('connection').textContent='Chưa kết nối';$('connection').classList.add('offline');$('enter').disabled=false;
    if(state.joined&&/Phiên|Hồ sơ/.test(err.message)){state.socket.disconnect();const c=openModal('VÀO LẠI KHUÔN VIÊN','reconnect');c.append(node('h2','Phiên chơi cần mở lại'),node('p','Máy chủ vừa đổi phiên hoặc khởi động lại. Tải lại để nhận phiên mới, tên và lựa chọn áo trên trình duyệt vẫn được giữ.'),button('Vào lại chùa',()=>location.reload(),'primary'));}
  });
  state.socket.on('disconnect',reason=>{$('connection').textContent='Đang nối lại…';$('connection').classList.add('offline');state.keys.clear();state.path=[];audio.stopChant();if(reason==='io server disconnect')toast('Phiên đã đóng. Tải lại trang để vào lại.');});
  state.socket.on('replaced',()=>{toast('Hồ sơ này đang được mở ở một tab khác.');state.joined=false;});
  state.socket.on('roster',list=>{synchronize(list);if(state.modal==='friends')showFriends();});
  state.socket.on('snapshot',snapshot=>{
    state.serverOffset=T.MathUtils.lerp(state.serverOffset,snapshot.at-Date.now(),.08);
    synchronize(snapshot.players);const own=snapshot.players.find(p=>p.id===state.profile.id),av=self();if(!own||!av)return;
    const distance=av.root.position.distanceTo(av.target);if(distance>3)av.root.position.copy(av.target);else if(distance>.22)av.root.position.lerp(av.target,.28);
    if(!movingInput()&&!state.path.length){av.setAction(own.action,own.actionAt,Date.now()+state.serverOffset);state.action=own.action;}
    $('chant-line').hidden=own.action!=='Chant';
    if(own.action!=='Chant'&&audio.chanting)audio.stopChant();
    if(state.action==='Chant'&&!nearby({x:av.root.position.x,z:av.root.position.z},'buddha'))audio.stopChant();
    updateDock();
  });
  state.socket.on('action',({id,action,at})=>{
    const av=state.avatars.get(id);av?.setAction(action,at,Date.now()+state.serverOffset);
    if(id===state.profile.id){state.action=action;state.path=[];state.keys.clear();state.lockUntil=Date.now()+({Prostrate:7600,Greet:3000,Laugh:2800,Wave:3000}[action]||0);updateDock();}
  });
  state.socket.on('chat',data=>{appendChat(data.name,data.text);state.avatars.get(data.id)?.say(data.text);});
  state.socket.on('system',text=>appendChat('',text));state.socket.on('notice',toast);
  state.socket.on('profile',profile=>{state.profile=profile;if(state.modal==='friends')showFriends();if(state.modal==='bag')showBag();});
  state.socket.on('sound',({id,x,z,by})=>{const av=self();if(av&&Math.hypot(av.root.position.x-x,av.root.position.z-z)<28){id==='bell'?audio.bell():audio.drum();toast(by+(id==='bell'?' vừa thỉnh chuông.':' vừa gõ trống.'));}});
  state.socket.on('ritual',event=>{rituals.add(event);toast(event.by+(event.kind==='lantern'?' vừa thả một hoa đăng.':' vừa dâng một nén hương.'));});
  state.socket.on('painting',({slot,version})=>world.setPainting(slot,'/api/paintings/'+slot+'?v='+version));
}
function self(){return state.profile?state.avatars.get(state.profile.id):null;}
const actionList=[['Meditate','♧','Ngồi thiền'],['Prostrate','♙','Lạy Phật'],['Greet','♢','Xá chào'],['Wave','☷','Vẫy tay'],['Laugh','☺','Cười'],['Idle','↟','Đứng dậy']];
for(const [id,icon,label]of actionList){const b=button('',()=>perform(id),'');b.dataset.action=id;b.append(node('span',icon),node('small',label));$('action-dock').append(b);}
function updateDock(){for(const b of $('action-dock').children)b.classList.toggle('selected',b.dataset.action===state.action);}
async function perform(action){
  if(!state.joined)return;
  const result=await send('action',{action});if(result?.ok){if(action==='Chant'){audio.chant();$('chant-line').hidden=false;}else{audio.stopChant();$('chant-line').hidden=true;}}
}
function appendChat(name,text){const p=node('p');if(name)p.append(node('b',name+': '));else p.className='system';p.append(document.createTextNode(text));$('chat-log').append(p);while($('chat-log').children.length>80)$('chat-log').firstChild.remove();$('chat-log').scrollTop=$('chat-log').scrollHeight;}
$('chat-form').addEventListener('submit',async e=>{e.preventDefault();const text=$('chat-input').value.trim();if(!text)return;const result=await send('chat',{text});if(result?.ok)$('chat-input').value='';});
$('chat-toggle').onclick=()=>$('chat-panel').classList.toggle('collapsed');
$('room-button').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/?room='+state.room);toast('Đã sao chép link mời. Gửi link này cho bạn bè để cùng vào phòng '+state.room+'.');}catch{const c=openModal('MỜI BẠN','invite');c.append(node('h2','Cùng về chùa'),node('p','Gửi link dưới đây cho bạn:'));const input=node('input');input.readOnly=true;input.value=location.origin+'/?room='+state.room;c.append(input);input.select();}};

function showHelp(){
  const c=openModal('MỘT VÒNG QUANH CHÙA','help');c.append(node('h2','Chào mừng bạn về chùa.'));
  const list=node('ol');for(const text of ['Máy tính: WASD / mũi tên hoặc chạm sân để đi. Giữ Shift để chạy. Kéo chuột xoay camera, cuộn để đổi khoảng cách.','Điện thoại: kéo cần tròn bên trái để di chuyển. Chạm Chạy để đổi tốc độ. Kéo nhân vật trong bước tạo hình để xoay xem áo.','Đến gần chuông, trống, quầy lưu niệm hoặc tượng Phật để thấy nút tương tác. Tụng niệm và đọc kinh mở trong bán kính 9 mét quanh tượng.','Phím 1: thiền; 2: lạy; 3: vẫy tay; 4: cười; 5: đứng dậy. E: tương tác gần nhất; Enter: chat. Di chuyển để rời tư thế thiền.','Đến lư hương trước tượng, bến hoa đăng ở ao sen và góc lời lành để thử ba tương tác. Nhấn mã phòng để mời bạn cùng vào.','Bật Âm thanh để nghe tiếng chuông và chim. Niệm Phật dùng giọng đọc của thiết bị hoặc bản thu riêng do quản trị viên đặt.'])list.append(node('li',text));c.append(list);
  c.append(node('p','Đây là khuôn viên chùa Việt được sáng tác theo mô tả, không phải bản đo đạc của một di tích thật. Xin giữ lời nói và hành vi phù hợp với không gian chung.','note'));
  c.append(button('Tản bộ thôi',()=>modal.close(),'primary'));
}
$('help-button').onclick=showHelp;
function peopleRow(person,actionText,handler){const r=node('div',null,'people-row');r.append(node('span','♧','person-icon'));const text=node('div');text.append(node('b',person.name),node('small',person.online?'Đang ở phòng '+person.room:'Chưa online'));r.append(text);if(actionText)r.append(button(actionText,handler));return r;}
async function showFriends(){
  const c=openModal('GẶP NHAU Ở SÂN CHÙA','friends');c.append(node('h2','Bạn đồng hành'),node('p','Mời bạn bằng link phòng hoặc kết bạn với người đang cùng ghé thăm.'));
  c.append(button('Sao chép link phòng '+state.room,()=>$('room-button').click(),'primary'));
  try{
    const data=await api('/api/friends');if(state.modal!=='friends')return;
    if(data.incoming.length){c.append(node('h3','Lời mời kết bạn'));for(const p of data.incoming)c.append(peopleRow(p,'Đồng ý',async()=>{await send('friend:accept',{id:p.id});showFriends();}));}
    c.append(node('h3','Bạn bè của bạn'));
    if(!data.friends.length)c.append(node('p','Chưa có bạn trong danh sách. Hãy gửi một lời mời bên dưới.'));
    for(const p of data.friends)c.append(peopleRow(p,p.room&&p.room!==state.room?'Vào phòng':null,()=>{state.room=p.room;modal.close();joinRoom();}));
    c.append(node('h3','Đang cùng ghé chùa'));
    for(const [id,av]of state.avatars)if(id!==state.profile.id)c.append(peopleRow({...av.profile,id,online:true,room:state.room},data.friends.some(a=>a.id===id)?'Đã kết bạn':'Kết bạn',async()=>{const r=await send('friend:request',{id});if(r?.ok)toast('Đã gửi lời mời kết bạn.');}));
    if(state.avatars.size===1)c.append(node('p','Bạn đang ghé thăm một mình. Chia sẻ link phòng để bạn bè vào cùng.'));
  }catch(err){c.append(node('p',err.message));}
}
$('friends-button').onclick=showFriends;
function showBag(){const c=openModal('NHỮNG MÓN NHỎ MANG THEO','bag');c.append(node('h2','Túi đồ của bạn'),node('p',(state.profile?.coins||0)+' xu trải nghiệm · không có giá trị tiền tệ.'));for(const p of PRODUCTS)c.append(node('p',p.icon+' '+p.name+': '+(state.profile?.inventory?.[p.id]||0)));c.append(node('p','Mỗi hồ sơ mới có 100 xu để thử quầy lưu niệm ngoài sân.','note'));}
$('bag-button').onclick=showBag;
function showShop(){const c=openModal('MỘT MÓN QUÀ TỪ CHUYẾN ĐI','shop');c.append(node('h2','Góc lưu niệm'),node('p','Bạn có '+state.profile.coins+' xu trải nghiệm.'));const grid=node('div',null,'product-grid');for(const p of PRODUCTS){const card=node('div',null,'product');card.append(node('span',p.icon,'product-icon'),node('b',p.name),node('small',p.price+' xu'),button('Nhận món này',async()=>{const r=await send('interact',{id:'vending',product:p.id});if(r?.ok){toast(r.message);showShop();}},'primary'));grid.append(card);}c.append(grid,node('p','Vật phẩm được giữ trong túi đồ; thao tác này không thanh toán tiền thật.','note'));}

function showReader(id='medicine',versionId=null){
  const av=self();if(!av||!nearby({x:av.root.position.x,z:av.root.position.z},'buddha'))return toast('Hãy đến gần tượng Phật để mở tủ kinh.');
  const c=openModal('TỦ KINH · NOVA PAGODA','reader');c.append(node('h2','Một trang kinh, một tâm an'));
  const tabs=node('div',null,'sutra-tabs');
  for(const s of SUTRAS)tabs.append(button(s.shortName,()=>showReader(s.id),id===s.id?'selected':''));
  c.append(tabs);
  const s=SUTRAS.find(a=>a.id===id)||SUTRAS[0],v=s.versions.find(a=>a.id===versionId)||s.versions[0];
  const versions=node('div',null,'reader-versions');
  for(const item of s.versions)versions.append(button(item.label,()=>showReader(s.id,item.id),item.id===v.id?'primary':'secondary'));
  c.append(versions);
  const text=node('article',null,'sutra-text');text.lang=v.lang;text.append(node('h3',s.title),node('div',v.context,'note'));
  for(const p of v.paragraphs)text.append(node('p',p,v.lang==='zh-Hant'?'cjk':''));
  const source=node('div',null,'source');source.append(node('p',s.canonicalId));
  const link=node('a','Đối chiếu bản kinh tại CBETA ↗');link.href=s.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';
  source.append(link,node('p',s.sourceTitle+' · CBETA / CC BY-NC-SA 4.0. Xem ghi nguồn trong gói mã.'));
  text.append(source);c.append(text);
  const controls=node('div',null,'reader-controls');let readerOn=false;
  controls.append(button(state.action==='Chant'?'Dừng niệm Phật':'Niệm Phật',async e=>{await perform(state.action==='Chant'?'Idle':'Chant');e.currentTarget.textContent=state.action==='Chant'?'Dừng niệm Phật':'Niệm Phật';},'primary'));
  controls.append(button('♫ Tiếng mõ',e=>{readerOn=!readerOn;if(readerOn&&!audio.enabled){audio.setEnabled(true);updateSound();}audio.reader(readerOn);e.currentTarget.textContent=readerOn?'♫ Tắt tiếng mõ':'♫ Tiếng mõ';}));c.append(controls);
}
async function showRitual(kind){
  if(kind==='incense'){
    const c=openModal('DÂNG MỘT NÉN TÂM HƯƠNG','ritual');
    c.append(node('h2','Một khoảnh khắc lắng lòng'),node('p','Nhẹ nhàng dâng hương trước chính điện. Bạn bè trong phòng sẽ cùng nhìn thấy làn khói.'));
    c.append(button('Thắp hương',async()=>{const r=await send('ritual',{kind});if(r?.ok)modal.close();},'primary'));return;
  }
  if(kind==='lantern'){
    const c=openModal('ÁNH SÁNG TRÊN AO SEN','ritual');c.append(node('h2','Thả một đèn hoa đăng'),node('p','Gửi một điều ước thiện lành rồi nhìn ánh đèn trôi trên mặt nước.'));
    const input=node('input');input.maxLength=100;input.className='ritual-wish';input.placeholder='Một lời chúc bình an…';c.append(input);
    c.append(button('Thả hoa đăng',async()=>{const r=await send('ritual',{kind,wish:input.value});if(r?.ok){if(input.value.trim())appendChat('Lời nguyện của bạn',input.value.trim());modal.close();}},'primary'));return;
  }
  const r=await send('ritual',{kind});if(!r?.ok)return;
  const c=openModal('GÓC LỜI LÀNH','ritual');c.append(node('h2','Một lời gửi hôm nay'));
  const card=node('div',null,'ritual-card');card.append(node('span',String(r.number).padStart(2,'0'),'ritual-number'),node('p',r.message));
  c.append(card,node('p','Thẻ được chọn ngẫu nhiên từ lời nhắc do Nova Pagoda biên soạn. Hãy mang một điều nhỏ đẹp vào ngày của bạn.','note'));
  c.append(button('Mang theo lời nhắc',()=>modal.close(),'primary'));
}
$('read-button').onclick=()=>showReader();
let currentContext=null;
async function interact(){
  if(!currentContext)return;
  if(currentContext.id==='buddha')return showReader();
  if(currentContext.kind==='ritual')return showRitual(currentContext.id);
  if(currentContext.id==='vending')return showShop();
  if(currentContext.id==='dining'){const c=openModal('TRAI ĐƯỜNG','dining');c.append(node('h2','Một bữa chay thanh đạm'),node('p','Khu vực sinh hoạt và dùng cơm chay của chùa. Không gian trưng bày hiện có thể quan sát từ sân.'));return;}
  if(!audio.enabled){audio.setEnabled(true);updateSound();}await send('interact',{id:currentContext.id});
}
$('interact-button').onclick=interact;
function updateContext(){
  const av=self();if(!av)return;const p={x:av.root.position.x,z:av.root.position.z};
  currentContext=LANDMARKS.filter(l=>l.radius&&nearby(p,l.id)).sort((a,b)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(p.x-b.x,p.z-b.z))[0]||null;
  $('context').hidden=!currentContext;
  if(currentContext){$('context-name').textContent=currentContext.name;$('interact-button').firstChild.textContent=({bell:'Thỉnh chuông ',drum:'Gõ trống ',buddha:'Niệm Phật ',incense:'Thắp hương ',lantern:'Thả hoa đăng ',fortune:'Rút lời lành ',vending:'Mở quầy ',dining:'Tìm hiểu '})[currentContext.id];$('read-button').hidden=currentContext.id==='buddha'||!nearby(p,'buddha');$('read-button').textContent='Niệm Phật / Đọc kinh';}
  const l=LANDMARKS.map(l=>({...l,dist:Math.hypot(p.x-l.x,p.z-l.z)})).sort((a,b)=>a.dist-b.dist)[0];
  $('location-name').textContent=l.dist<11?l.name:'Sân chùa';$('location-desc').textContent=l.kind==='private'&&l.dist<11?'Khu riêng của tăng ni · xin giữ yên lặng':'Một bước chân, một nhịp thở';
}
function updateSound(){$('sound-button').classList.toggle('active',audio.enabled);$('sound-button').querySelector('small').textContent=audio.enabled?'Đang bật':'Âm thanh';}
$('sound-button').onclick=()=>{audio.setEnabled(!audio.enabled);updateSound();if(audio.enabled){audio.bell(.07);toast('Âm thanh đã bật.');}else toast('Đã tắt âm thanh.');};document.addEventListener('sound-enabled',updateSound);

function showMap(){
  const c=openModal('KHUÔN VIÊN CHÙA','map');c.append(node('h2','Đi chậm, ngắm một vòng'),node('p','Chạm một lối trống trên bản đồ để đi tới đó.'));
  const canvas=node('canvas',null,'map-canvas');canvas.width=canvas.height=600;c.append(canvas);const ctx=canvas.getContext('2d'),scale=6.2,px=x=>300+x*scale,pz=z=>280+z*scale;
  ctx.fillStyle='#e2e7d7';ctx.fillRect(0,0,600,600);ctx.fillStyle='#d3c8ab';ctx.fillRect(px(-12),pz(-10),24*scale,45*scale);ctx.fillRect(px(-36),pz(-10),72*scale,6*scale);
  for(const l of LANDMARKS){const w=l.kind==='buddha'?22:l.kind==='pond'?15:10,d=l.kind==='buddha'?15:l.kind==='pond'?13:7;ctx.fillStyle=l.kind==='pond'?'#8fae9b':l.kind==='garden'?'#b9c9a3':'#b9916c';ctx.beginPath();ctx.roundRect(px(l.x-w/2),pz(l.z-d/2),w*scale,d*scale,5);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#43543d';ctx.font='12px Arial';ctx.fillText(l.name.replace(' · khu tĩnh tu',''),px(l.x),pz(l.z)+d*scale/2+15);}
  for(const [id,av]of state.avatars){ctx.fillStyle=id===state.profile.id?'#4f7444':'#dba574';ctx.beginPath();ctx.arc(px(av.root.position.x),pz(av.root.position.z),6,0,Math.PI*2);ctx.fill();}
  canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=((e.clientX-r.left)/r.width*600-300)/scale,z=((e.clientY-r.top)/r.height*600-280)/scale;if(canStand(x,z)){navigateTo(x,z);modal.close();}else toast('Hãy chọn một khoảng sân trống.');};
  c.append(button(state.overview?'Trở về góc nhìn gần':'Ngắm toàn cảnh',()=>{state.overview=!state.overview;resize();modal.close();}));
}
$('map-button').onclick=showMap;
function showAdmin(){
  const c=openModal('GÓC QUẢN TRỊ','admin');c.append(node('h2','Thay tranh trong chính điện'),node('p','Tranh do quản trị viên thay sẽ hiển thị cho mọi phòng. Mỗi ảnh tối đa 3 MB, JPEG / PNG / WebP; ảnh được cắt dọc 3:4.'));
  const form=node('form'),select=node('select');for(const [id,text]of [['left','Tranh bên trái · Quan Âm'],['right','Tranh bên phải · Đại Thế Chí']]){const o=node('option',text);o.value=id;select.append(o);}const key=node('input');key.type='password';key.placeholder='ADMIN_TOKEN từ Render';key.autocomplete='off';const file=node('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.required=true;
  const preview=node('img');preview.style.cssText='display:none;max-width:150px;max-height:200px;margin-top:15px;border-radius:8px';let blobUrl;
  file.onchange=()=>{if(blobUrl)URL.revokeObjectURL(blobUrl);if(file.files[0]){blobUrl=URL.createObjectURL(file.files[0]);preview.src=blobUrl;preview.style.display='block';}};
  const submit=node('button','Lưu tranh','primary');submit.type='submit';submit.style.marginTop='15px';form.append(node('label','Vị trí tranh'),select,node('label','Mã quản trị'),key,node('label','Ảnh thay thế'),file,preview,submit);
  form.onsubmit=async e=>{e.preventDefault();if(!file.files[0])return;if(file.files[0].size>3*1024*1024)return toast('Ảnh tối đa 3 MB.');submit.disabled=true;try{const body=new FormData();body.append('image',file.files[0]);const r=await api('/api/paintings/'+select.value,{method:'POST',headers:{'X-Admin-Token':key.value},body});toast(r.durable?'Đã lưu tranh và đồng bộ cho mọi người.':'Đã thay tranh tạm; cần MongoDB để giữ sau restart.');key.value='';modal.close();}catch(err){toast(err.message);}finally{submit.disabled=false;}};
  c.append(form,node('p','Vai trò Trụ trì là lựa chọn nhân vật. Quyền quản trị được kiểm tra riêng trên máy chủ.','note'));
}
$('settings-button').onclick=showAdmin;

// Tìm đường A* trên lưới 1 m, dùng cùng va chạm với server; không dịch chuyển tức thời.
function navigateTo(tx,tz){
  if(Date.now()<state.lockUntil){toast('Hãy đợi nhân vật hoàn tất động tác.');return;}
  const av=self();if(!av)return;if(!canStand(tx,tz))return toast('Hãy chọn một khoảng sân trống.');
  const start={x:Math.round(av.root.position.x),z:Math.round(av.root.position.z)},goal={x:Math.round(tx),z:Math.round(tz)},key=p=>p.x+','+p.z;
  if(!canStand(goal.x,goal.z)){toast('Điểm này quá sát chướng ngại.');return;}
  const open=[{...start,g:0,f:0}],known=new Map(),closed=new Set();known.set(key(start),open[0]);let end;
  for(let count=0;open.length&&count<5500;count++){
    open.sort((a,b)=>a.f-b.f);const cur=open.shift(),ck=key(cur);if(closed.has(ck))continue;closed.add(ck);
    if(cur.x===goal.x&&cur.z===goal.z){end=cur;break;}
    for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const n={x:cur.x+dx,z:cur.z+dz},nk=key(n);if(closed.has(nk)||!canStand(n.x,n.z)||!canStand(cur.x+dx,cur.z)||!canStand(cur.x,cur.z+dz))continue;
      const g=cur.g+Math.hypot(dx,dz);if(known.has(nk)&&known.get(nk).g<=g)continue;
      const next={...n,g,f:g+Math.hypot(goal.x-n.x,goal.z-n.z),parent:cur};known.set(nk,next);open.push(next);
    }
  }
  if(!end)return toast('Chưa tìm thấy lối đi; hãy chọn điểm trên sân.');
  const path=[];while(end.parent){path.unshift({x:end.x,z:end.z});end=end.parent;}
  // Giữ các góc rẽ, bỏ điểm thẳng hàng để không lắc qua lại ở từng ô khi FPS thấp.
  const turns=path.filter((p,i)=>i===path.length-1||i===0||(p.x-path[i-1].x)!==(path[i+1].x-p.x)||(p.z-path[i-1].z)!==(path[i+1].z-p.z));
  turns.push({x:tx,z:tz});state.path=turns;audio.stopChant();
}
let downPoint=null;
$('stage').addEventListener('pointerdown',e=>{if(!state.joined)return;downPoint={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,rotate:e.button===2};$('stage').setPointerCapture(e.pointerId);});
$('stage').addEventListener('pointerup',e=>{
  if(downPoint?.rotate){downPoint=null;return;}
  if(!downPoint||Math.hypot(downPoint.x-e.clientX,downPoint.y-e.clientY)>10||!state.joined||modal.open){downPoint=null;return;}downPoint=null;
  pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);if(ray.ray.intersectPlane(ground,aim))navigateTo(aim.x,aim.z);
});
$('stage').addEventListener('contextmenu',e=>e.preventDefault());
$('stage').addEventListener('pointermove',e=>{if(!downPoint||!state.joined||state.overview)return;if(downPoint.rotate||Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y)>10){cameraYaw-=(e.clientX-downPoint.lastX)*.006;cameraPitch=T.MathUtils.clamp(cameraPitch+(e.clientY-downPoint.lastY)*.004,.10,1.1);}downPoint.lastX=e.clientX;downPoint.lastY=e.clientY;});
$('stage').addEventListener('pointercancel',()=>downPoint=null);
$('stage').addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.0006,.65,1.75);resize();},{passive:false});
function typing(){return ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);}
addEventListener('keydown',e=>{
  if(typing()||modal.open||!state.joined)return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  if(e.key==='Enter'){e.preventDefault();$('chat-input').focus();return;}
  const hotkeys={'1':'Meditate','2':'Prostrate','3':'Wave','4':'Laugh','5':'Idle'};
  if(hotkeys[e.key]&&!e.repeat)perform(hotkeys[e.key]);
  if(e.key.toLowerCase()==='e'&&!e.repeat)interact();
  state.keys.add(e.key.toLowerCase());if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))state.path=[];
});
addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{state.keys.clear();state.joy={x:0,y:0};state.path=[];});
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.keys.clear();state.path=[];state.joy={x:0,y:0};audio.stopChant();state.socket?.emit('input',{dx:0,dz:0});}});
let joystickId=null;
$('joystick').addEventListener('pointerdown',e=>{joystickId=e.pointerId;$('joystick').setPointerCapture(e.pointerId);state.path=[];updateJoy(e);});
$('joystick').addEventListener('pointermove',e=>{if(joystickId===e.pointerId)updateJoy(e);});
function updateJoy(e){const b=$('joystick').getBoundingClientRect();let x=(e.clientX-b.left-b.width/2)/34,y=(e.clientY-b.top-b.height/2)/34;const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;state.joy={x,y};$('joystick-thumb').style.transform=`translate(${x*27}px,${y*27}px)`;}
for(const type of ['pointerup','pointercancel'])$('joystick').addEventListener(type,()=>{joystickId=null;state.joy={x:0,y:0};$('joystick-thumb').style.transform='';});
$('run-button').onclick=()=>{state.run=!state.run;$('run-button').classList.toggle('active',state.run);};
function movingInput(){return Math.hypot(state.joy.x,state.joy.y)>.1||['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(k=>state.keys.has(k));}
function inputDirection(){
  let sx=state.joy.x,sy=state.joy.y;
  if(!typing()&&!modal.open){if(state.keys.has('a')||state.keys.has('arrowleft'))sx-=1;if(state.keys.has('d')||state.keys.has('arrowright'))sx+=1;if(state.keys.has('w')||state.keys.has('arrowup'))sy-=1;if(state.keys.has('s')||state.keys.has('arrowdown'))sy+=1;}
  const angle=state.overview ? .573 : cameraYaw;
  let dx=Math.cos(angle)*sx+Math.sin(angle)*sy,dz=-Math.sin(angle)*sx+Math.cos(angle)*sy;
  const av=self();if(state.path.length&&av&&!movingInput()){
    while(state.path.length&&Math.hypot(state.path[0].x-av.root.position.x,state.path[0].z-av.root.position.z)<.65)state.path.shift();
    if(state.path.length){dx=state.path[0].x-av.root.position.x;dz=state.path[0].z-av.root.position.z;const n=Math.hypot(dx,dz);dx/=n;dz/=n;}
  }
  const n=Math.max(1,Math.hypot(dx,dz));return {dx:dx/n,dz:dz/n,run:state.run||state.keys.has('shift')};
}
let last=performance.now(),contextTick=0;
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;const av=self();
  if(state.joined&&av){
    const input=(modal.open||!state.socket?.connected||Date.now()<state.lockUntil)?{dx:0,dz:0}:inputDirection();
    if(Math.hypot(input.dx,input.dz)>.05){const p={x:av.root.position.x,z:av.root.position.z};movePosition(p,input.dx,input.dz,dt,input.run);av.root.position.set(p.x,heightAt(p.x,p.z),p.z);av.targetRotation=Math.atan2(input.dx,input.dz);av.setAction(input.run?'Run':'Walk');state.action=input.run?'Run':'Walk';if(audio.chanting){audio.stopChant();$('chant-line').hidden=true;}}
    if(now-state.lastInput>60){state.socket?.emit('input',input);state.lastInput=now;}
    const wanted=state.overview?new T.Vector3(0,0,-2):av.root.position;
    cameraTarget.lerp(wanted,1-Math.exp(-3*dt));
    if(++contextTick%8===0)updateContext();
    document.querySelector('.action-caption').textContent=state.path.length?'ĐANG TẢN BỘ ĐẾN ĐIỂM BẠN CHỌN':'DÀNH MỘT KHOẢNH KHẮC CHO TÂM';
  }
  if(!state.joined){camera.position.set(36,26,49);camera.lookAt(-2,0,-10);}
  else if(state.overview){camera.position.copy(cameraTarget).add(new T.Vector3(40,63,62));camera.lookAt(cameraTarget);}
  else {const distance=9.5*zoom,up=1.3;camera.position.set(cameraTarget.x+Math.sin(cameraYaw)*Math.cos(cameraPitch)*distance,cameraTarget.y+up+Math.sin(cameraPitch)*distance,cameraTarget.z+Math.cos(cameraYaw)*Math.cos(cameraPitch)*distance);camera.lookAt(cameraTarget.x,cameraTarget.y+up,cameraTarget.z);}
  rituals?.update(Date.now()+state.serverOffset);
  for(const [id,a]of state.avatars)a.update(dt,camera,innerWidth,innerHeight,id===state.profile?.id);
  world?.update(now/1000,av?{x:av.root.position.x,z:av.root.position.z}:null,state.action==='Chant');
  renderer?.render(scene,camera);
  if(previewAvatar&&!state.joined){if(!previewDragging)previewAngle+=dt*.16;previewAvatar.root.rotation.y=previewAngle;previewAvatar.update(dt,previewCamera,300,170,true);previewRenderer.render(previewScene,previewCamera);}
}
async function boot(){
  try{
    try{const saved=JSON.parse(safeStorage.get('nova-appearance'));if(saved&&ROLES.some(r=>r.id===saved.role)){state.role=saved.role;state.outfit=saved.outfit;$('display-name').value=saved.name;}}catch{}
    $('join-code').value=state.room;creatorOptions();setupRenderer();requestAnimationFrame(frame);
    asset=await loadAvatars();updatePreview();$('preview-status').hidden=true;$('enter').disabled=false;state.ready=true;
    
    try{const config=await api('/api/config');$('connection').textContent=config.durable?'Sẵn sàng đón bạn':'Chế độ thử nghiệm';
      if(!config.durable)appendChat('','Hồ sơ và ảnh máy chủ đang lưu tạm. Cấu hình MongoDB để giữ sau restart.');
      const pictures=await api('/api/paintings');for(const slot of pictures.slots)world.setPainting(slot,'/api/paintings/'+slot);
    }catch(err){$('connection').textContent='Chưa kết nối';toast(err.message);}
  }catch(err){console.error(err);fatal('Thiết bị cần hỗ trợ WebGL 2. Hãy thử Safari hoặc Chrome mới, kiểm tra kết nối và tải lại trang. Chi tiết: '+err.message);}
}
boot();
