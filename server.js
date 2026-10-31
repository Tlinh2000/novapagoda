import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'node:fs';
import { Server } from 'socket.io';
import { createStore, ownProfile } from './server/store.js';
import { signToken, verifyToken, cleanText, secretEqual } from './server/auth.js';
import { ROLES, OUTFITS, PRODUCTS, SPAWN, MAX_PLAYERS, movePosition, nearby } from './shared/world.js';

const root=path.dirname(fileURLToPath(import.meta.url));
export async function createGame(options={}) {
  const env={...process.env,...options.env};
  const secret=env.SESSION_SECRET||randomBytes(48).toString('hex');
  if(env.NODE_ENV==='production'&&secret.length<32)throw Error('SESSION_SECRET cần tối thiểu 32 ký tự.');
  if(env.NODE_ENV==='production'&&!env.SESSION_SECRET)throw Error('Thiếu SESSION_SECRET trong Environment.');
  const store=await createStore(env.MONGODB_URI,env.MONGODB_DB);
  const app=express(),http=createServer(app);
  app.set('trust proxy',1);
  app.use(helmet({crossOriginEmbedderPolicy:false,contentSecurityPolicy:{directives:{
    defaultSrc:["'self'"],scriptSrc:["'self'","'unsafe-inline'"],styleSrc:["'self'","'unsafe-inline'"],
    imgSrc:["'self'",'data:','blob:','https:'],connectSrc:["'self'",...(env.CLIENT_ORIGIN?[env.CLIENT_ORIGIN]:[])],
    upgradeInsecureRequests: env.NODE_ENV==='production'?[]:null
  }}}));
  app.use((req,res,next)=>{
    if(env.CLIENT_ORIGIN&&req.headers.origin===env.CLIENT_ORIGIN){
      res.set('Access-Control-Allow-Origin',env.CLIENT_ORIGIN);res.set('Vary','Origin');
      res.set('Access-Control-Allow-Headers','Content-Type, Authorization, X-Admin-Token');
      res.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    }
    if(req.method==='OPTIONS')return res.sendStatus(204);next();
  });
  app.use('/api',rateLimit({windowMs:60000,limit:100,standardHeaders:'draft-8',legacyHeaders:false}));
  app.use(express.json({limit:'12kb'}));
  // Mật khẩu vai ẩn chỉ nằm trong Environment của máy chủ, không đưa vào client.
  const roleAttempts=rateLimit({windowMs:60000,limit:12,standardHeaders:'draft-8',legacyHeaders:false,
    message:{error:'Bạn thử đăng nhập quá nhiều lần. Hãy chờ một phút.'}});
  app.get('/health',(_req,res)=>res.json({ok:true,persistence:store.durable?'mongodb':'memory'}));
  app.get('/api/config',(_req,res)=>res.json({durable:store.durable,maxPlayers:MAX_PLAYERS,version:'1.0.0'}));
  app.get('/api/audio',(_req,res)=>res.json({recording:fs.existsSync(path.join(root,'client/assets/chant.mp3'))}));
  const authorize=(req,res,next)=>{
    const id=verifyToken(req.headers.authorization?.replace(/^Bearer /,''),secret);
    if(!id)return res.status(401).json({error:'Phiên đã hết hạn, hãy vào chùa lại.'});req.profileId=id;next();
  };
  app.post('/api/profile',roleAttempts,async(req,res)=>{
    const {guestKey,name,role,outfit}=req.body;
    if(!/^[a-f0-9]{64}$/.test(guestKey||''))return res.status(400).json({error:'Khóa hồ sơ không hợp lệ.'});
    const validRole=ROLES.find(r=>r.id===role),validOutfit=OUTFITS.find(o=>o.id===outfit&&o.roles.includes(role));
    const display=cleanText(name,24);
    if(!display||!validRole||!validOutfit)return res.status(400).json({error:'Hãy nhập tên, chọn vai trò và áo phù hợp.'});
    if(role==='abbot'&&!secretEqual(req.body.abbotPassword,env.ABBOT_PASSWORD))
      return res.status(403).json({error:'Mật khẩu Trụ trì chưa đúng hoặc máy chủ chưa cấu hình ABBOT_PASSWORD.'});
    const keyHash=createHash('sha256').update(guestKey).digest('hex');
    const p=await store.profileByKey(keyHash,{name:display,role,outfit});
    res.json({profile:ownProfile(p),token:signToken(p._id,secret),durable:store.durable});
  });
  const rooms=new Map(),players=new Map(),effects=new Map();
  const currentEffects=room=>(effects.get(room)||[]).filter(e=>e.expiresAt>Date.now());
  const io=new Server(http,{
    maxHttpBufferSize:16384,pingTimeout:20000,
    cors:env.CLIENT_ORIGIN?{origin:env.CLIENT_ORIGIN}:undefined,
    allowRequest:(req,cb)=>{
      const origin=req.headers.origin;
      let same=false;try{same=new URL(origin).host===req.headers.host;}catch{}
      cb(null,!origin||same||origin===env.CLIENT_ORIGIN);
    }
  });
  const roomName=code=>'pagoda:'+code;
  const pack=p=>({id:p.id,name:p.name,role:p.role,outfit:p.outfit,x:p.x,z:p.z,rotation:p.rotation,action:p.action,actionAt:p.actionAt});
  const broadcastRoster=room=>io.to(roomName(room)).emit('roster',[...players.values()].filter(p=>p.room===room).map(pack));
  const notifyProfile=async id=>{
    const p=await store.get(id);for(const s of io.sockets.sockets.values())if(s.data.id===id)s.emit('profile',ownProfile(p));
  };
  app.get('/api/friends',authorize,async(req,res)=>{
    const p=await store.get(req.profileId);if(!p)return res.sendStatus(404);
    const lookup=async id=>{
      const q=await store.get(id);const live=[...players.values()].find(a=>a.id===id);
      return q?{id,name:q.name,online:!!live,room:live?.room}:null;
    };
    res.json({friends:(await Promise.all(p.friends.map(lookup))).filter(Boolean),incoming:(await Promise.all(p.incoming.map(lookup))).filter(Boolean)});
  });
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:3*1024*1024,files:1}});
  app.post('/api/paintings/:slot',authorize,(req,res,next)=>{
    if(!secretEqual(req.headers['x-admin-token'],env.ADMIN_TOKEN))return res.status(403).json({error:'Cần mã quản trị. Vai trò Trụ trì không cấp quyền tải tranh.'});
    if(!['left','right'].includes(req.params.slot))return res.status(400).json({error:'Vị trí tranh không hợp lệ.'});next();
  },upload.single('image'),async(req,res)=>{
    if(!req.file)return res.status(400).json({error:'Hãy chọn ảnh JPEG, PNG hoặc WebP.'});
    try {
      const image=sharp(req.file.buffer,{limitInputPixels:32e6,animated:false});
      const meta=await image.metadata();
      if(!['jpeg','png','webp'].includes(meta.format))return res.status(415).json({error:'Chỉ chấp nhận JPEG, PNG, WebP.'});
      const data=await image.rotate().resize(768,1024,{fit:'cover'}).jpeg({quality:84}).toBuffer();
      await store.savePainting(req.params.slot,{data,contentType:'image/jpeg',by:req.profileId});
      io.emit('painting',{slot:req.params.slot,version:Date.now()});res.json({ok:true,durable:store.durable});
    }catch{return res.status(400).json({error:'Ảnh không đọc được hoặc vượt 32 megapixel.'});}
  });
  app.get('/api/paintings/:slot',async(req,res)=>{
    if(!['left','right'].includes(req.params.slot))return res.sendStatus(404);
    const p=await store.getPainting(req.params.slot);if(!p)return res.sendStatus(404);
    res.set('Content-Type',p.contentType).set('Cache-Control','no-cache');
    res.send(Buffer.isBuffer(p.data)?p.data:Buffer.from(p.data.value()));
  });
  // Kiểm tra tranh tồn tại trước khi yêu cầu texture, tránh lỗi 404 ở client.
  app.get('/api/paintings',async(_req,res)=>res.json({slots:(await Promise.all(['left','right'].map(async slot=>(await store.getPainting(slot))?slot:null))).filter(Boolean)}));
  io.use(async(socket,next)=>{
    try {
      const id=verifyToken(socket.handshake.auth.token,secret);if(!id)return next(Error('Phiên đăng nhập không hợp lệ.'));
      const p=await store.get(id);if(!p)return next(Error('Hồ sơ không tồn tại.'));
      socket.data.id=id;socket.data.profile=p;next();
    }catch{next(Error('Không kết nối được dữ liệu.'));}
  });
  io.on('connection',socket=>{
    const counters=new Map();
    const limited=(key,ms)=>{const now=Date.now();if(now-(counters.get(key)||0)<ms)return true;counters.set(key,now);return false;};
    const safe=fn=>async(data={},ack=()=>{})=>{
      const reply=typeof ack==='function'?ack:()=>{};
      try{await fn(data&&typeof data==='object'?data:{},reply);}
      catch{reply({error:'Máy chủ bận, vui lòng thử lại.'});}
    };
    socket.on('join',safe(async(data,ack)=>{
      if(limited('join',1000))return ack({error:'Chờ một giây rồi thử lại.'});
      const profile=socket.data.profile;
      // Một nhân vật / hồ sơ trong cùng thời điểm, tab cũ được thông báo rõ.
      const old=players.get(profile._id);
      if(old&&old.socket!==socket.id){io.to(old.socket).emit('replaced');io.sockets.sockets.get(old.socket)?.disconnect(true);}
      let code=String(data.room||'').toUpperCase().trim();
      if(code&&!/^[A-Z0-9]{6}$/.test(code))return ack({error:'Mã phòng gồm 6 chữ/số.'});
      if(!code)do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
      if((rooms.get(code)||0)>=MAX_PLAYERS)return ack({error:'Phòng đã đủ 24 người.'});
      const current=players.get(profile._id);
      if(current){socket.leave(roomName(current.room));const left=(rooms.get(current.room)||1)-1;if(left>0)rooms.set(current.room,left);else{rooms.delete(current.room);effects.delete(current.room);}players.delete(profile._id);broadcastRoster(current.room);}
      const p={...pack({...profile,id:profile._id}),...SPAWN,id:profile._id,socket:socket.id,room:code,rotation:Math.PI,action:'Idle',actionAt:Date.now(),input:{dx:0,dz:0,run:false},lastInput:0};
      players.set(p.id,p);rooms.set(code,(rooms.get(code)||0)+1);socket.join(roomName(code));
      ack({room:code,self:pack(p),serverNow:Date.now(),effects:currentEffects(code),players:[...players.values()].filter(q=>q.room===code).map(pack)});
      broadcastRoster(code);io.to(roomName(code)).emit('system',profile.name+' vừa đến chùa.');
    }));
    socket.on('input',data=>{
      if(limited('input',30))return;
      const p=players.get(socket.data.id);if(!p||p.socket!==socket.id||!data||!Number.isFinite(data.dx)||!Number.isFinite(data.dz))return;
      p.input={dx:Math.max(-1,Math.min(1,data.dx)),dz:Math.max(-1,Math.min(1,data.dz)),run:!!data.run};p.lastInput=Date.now();
      if(Math.hypot(data.dx,data.dz)>.1&&p.lockUntil>Date.now())return;
      if(Math.hypot(data.dx,data.dz)>.1)p.action=p.input.run?'Run':'Walk';
    });
    socket.on('action',safe(async({action},ack)=>{
      if(limited('action',500))return ack({error:'Hãy chọn động tác chậm lại một chút.'});
      const p=players.get(socket.data.id);if(!p||p.lockUntil>Date.now())return ack({error:'Hãy đợi hoàn tất động tác.'});
      if(!['Meditate','Prostrate','Greet','Laugh','Wave','Chant','Idle'].includes(action))return ack({error:'Động tác không hợp lệ.'});
      if(action==='Chant'&&!nearby(p,'buddha'))return ack({error:'Hãy đến gần tượng Phật trong chính điện.'});
      p.action=action;p.actionAt=Date.now();p.input={dx:0,dz:0,run:false};
      if(action==='Prostrate')p.rotation=Math.PI;
      const duration={Prostrate:7600,Greet:3000,Laugh:2800,Wave:3000}[action];
      p.lockUntil=duration?Date.now()+duration:0;p.until=duration?Date.now()+duration:0;
      io.to(roomName(p.room)).emit('action',{id:p.id,action,at:p.actionAt});ack({ok:true});
    }));
    socket.on('chat',safe(async({text},ack)=>{
      if(limited('chat',1200))return ack({error:'Hãy gửi chậm lại một chút.'});
      const p=players.get(socket.data.id),message=cleanText(text);if(!p||!message)return ack({error:'Tin nhắn đang trống hoặc bạn chưa vào phòng.'});
      io.to(roomName(p.room)).emit('chat',{id:p.id,name:p.name,text:message,at:Date.now()});ack({ok:true});
    }));
    socket.on('interact',safe(async({id,product},ack)=>{
      if(limited('interact',1200))return ack({error:'Vui lòng chờ một chút.'});
      const p=players.get(socket.data.id);if(!p||!nearby(p,id))return ack({error:'Hãy đứng gần công trình để tương tác.'});
      if(['bell','drum'].includes(id)){
        io.to(roomName(p.room)).emit('sound',{id,x:p.x,z:p.z,by:p.name});return ack({ok:true});
      }
      if(id==='vending'){
        const item=PRODUCTS.find(a=>a.id===product);if(!item)return ack({error:'Sản phẩm không tồn tại.'});
        const q=await store.buy(p.id,item);if(!q)return ack({error:'Chưa đủ xu trải nghiệm.'});
        await notifyProfile(p.id);return ack({ok:true,message:'Đã nhận '+item.name+' vào túi đồ.'});
      }
      ack({ok:true});
    }));
    // Ba tương tác thưởng. Server xác minh vị trí, thời gian chờ và sinh kết quả.
    // Client không được tự chọn vị trí hoa đăng hay phát hiệu ứng sang phòng khác.
    socket.on('ritual',safe(async({kind,wish},ack)=>{
      const p=players.get(socket.data.id);
      if(!['incense','lantern','fortune'].includes(kind))return ack({error:'Tương tác không hợp lệ.'});
      if(!p||!nearby(p,kind))return ack({error:'Hãy đến gần vị trí tương tác.'});
      if(p.lockUntil>Date.now())return ack({error:'Hãy hoàn tất động tác hiện tại.'});
      if(limited('ritual:'+kind,kind==='fortune'?8000:6000))return ack({error:'Chờ vài giây để nhường lượt cho mọi người.'});
      if(kind==='fortune') {
        const sayings=[
          'Một lời nói dịu dàng có thể làm nhẹ cả một ngày.',
          'Việc cần làm hôm nay: lắng nghe một người cho trọn vẹn.',
          'Bình an bắt đầu từ một bước chân biết mình đang bước.',
          'Hãy dành thời gian hỏi thăm người đã chăm sóc mình.',
          'Gieo một việc lành nhỏ, không cần chờ được ghi nhận.',
          'Chậm lại một nhịp trước khi đáp lời trong lúc nóng giận.',
          'Điều đang có cũng xứng đáng được trân trọng.',
          'Giúp một người bằng việc mình có thể làm ngay.'
        ];
        const value=randomBytes(4).readUInt32BE()%sayings.length;
        return ack({ok:true,number:value+1,message:sayings[value]});
      }
      const now=Date.now(),event={id:randomBytes(12).toString('hex'),kind,by:p.name,
        wish:cleanText(wish,100),at:now,expiresAt:now+(kind==='lantern'?90000:45000),
        seed:randomBytes(4).readUInt32BE(),x:kind==='lantern'?-25:0,z:kind==='lantern'?20:-20};
      effects.set(p.room,[...currentEffects(p.room),event].slice(-48));
      io.to(roomName(p.room)).emit('ritual',event);ack({ok:true});
    }));
    socket.on('friend:request',safe(async({id},ack)=>{
      if(limited('friend',1500))return ack({error:'Vui lòng chờ một chút.'});
      const p=players.get(socket.data.id),q=players.get(id);
      if(!p||!q||q.room!==p.room||id===p.id)return ack({error:'Chọn một người đang ở cùng phòng.'});
      await store.request(p.id,id);await notifyProfile(id);ack({ok:true});
    }));
    socket.on('friend:accept',safe(async({id},ack)=>{
      if(await store.accept(socket.data.id,id)){await notifyProfile(id);await notifyProfile(socket.data.id);ack({ok:true});}
      else ack({error:'Lời mời không còn hiệu lực.'});
    }));
    socket.on('disconnect',()=>{
      const p=players.get(socket.data.id);if(!p||p.socket!==socket.id)return;
      players.delete(p.id);const count=(rooms.get(p.room)||1)-1;
      if(count>0)rooms.set(p.room,count);else{rooms.delete(p.room);effects.delete(p.room);}
      broadcastRoster(p.room);
    });
  });
  let tick=0;
  const timer=setInterval(()=>{
    const now=Date.now();
    for(const p of players.values()){
      if(p.until&&now>p.until){p.action='Idle';p.until=0;p.actionAt=now;}
      if(p.lockUntil>now)continue;
      const input=now-p.lastInput<900?p.input:{dx:0,dz:0};
      if(Math.hypot(input.dx,input.dz)>.05){movePosition(p,input.dx,input.dz,.05,input.run);p.rotation=Math.atan2(input.dx,input.dz);p.action=input.run?'Run':'Walk';}
      else if(['Walk','Run'].includes(p.action))p.action='Idle';
    }
    if(++tick%2===0)for(const code of rooms.keys())io.to(roomName(code)).emit('snapshot',{at:now,players:[...players.values()].filter(p=>p.room===code).map(pack)});
  },50);timer.unref();
  app.use('/vendor/three',express.static(path.join(root,'node_modules/three/build'),{maxAge:'7d'}));
  app.use('/vendor/addons',express.static(path.join(root,'node_modules/three/examples/jsm'),{maxAge:'7d'}));
  app.use('/shared',express.static(path.join(root,'shared')));
  app.use(express.static(path.join(root,'client')));
  app.use((err,_req,res,_next)=>{
    if(err?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'Ảnh tối đa 3 MB.'});
    console.error('[request]',err?.name||'Error');res.status(500).json({error:'Có lỗi máy chủ. Hãy thử lại.'});
  });
  return {app,http,io,store,players,async close(){clearInterval(timer);await new Promise(r=>io.close(r));await store.close();}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const game=await createGame();
  const portArgument=process.argv.indexOf('--port');
  const port=Number(process.env.PORT)||(portArgument>=0?Number(process.argv[portArgument+1]):0)||3000;
  game.http.listen(port,'0.0.0.0',()=>console.log(`Nova Pagoda · port ${port} · ${game.store.durable?'MongoDB':'THỬ NGHIỆM: bộ nhớ tạm, mất sau restart'}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await game.close();process.exit(0);});
}
