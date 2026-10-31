export class TempleAudio {
  constructor(notify){this.notify=notify;this.enabled=false;this.chanting=false;this.woodTimer=null;this.ambientTimer=null;}
  unlock(){
    if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.bus=this.ctx.createGain();this.bus.connect(this.ctx.destination);}
    this.ctx.resume();
  }
  setEnabled(on){
    this.enabled=on;if(on){this.unlock();this.ambientTimer ||= setInterval(()=>{if(!this.enabled)return;if(Math.random()>.4)this.bird();else this.bell(.035);},6500);}
    else {this.stopChant();this.reader(false);}
    if(this.bus)this.bus.gain.setValueAtTime(on?1:0,this.ctx.currentTime);
  }
  tone(freq,start,duration,gain=.1,type='sine'){
    if(!this.enabled||!this.ctx)return;
    const osc=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime+start;
    osc.type=type;osc.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(g).connect(this.bus);osc.start(now);osc.stop(now+duration);
  }
  bell(volume=.18){for(const [f,a] of [[220,1],[442,.6],[616,.3],[1027,.13],[1331,.07]])this.tone(f,0,5,volume*a);}
  drum(){this.tone(82,0,.65,.28);this.tone(126,0,.25,.13);}
  wood(){this.tone(680,0,.11,.10);this.tone(1130,0,.06,.05);}
  bird(){for(let i=0;i<3;i++)this.tone(1800+i*240,i*.16,.14,.013);}
  reader(on){clearInterval(this.woodTimer);this.woodTimer=null;if(on){this.wood();this.woodTimer=setInterval(()=>this.wood(),1400);}}
  async chant(){
    this.stopChant();
    if(!this.enabled){this.setEnabled(true);document.dispatchEvent(new CustomEvent('sound-enabled'));}
    this.chanting=true;
    // Có thể đặt bản thu được cấp phép tại /assets/chant.mp3 để thay giọng máy.
    try{const r=await fetch('/api/audio');const {recording}=await r.json();if(!this.chanting)return;if(recording){this.recording ||= new Audio('/assets/chant.mp3');this.recording.loop=true;await this.recording.play();if(!this.chanting)this.recording.pause();return;}}catch{}
    if(!this.chanting)return;
    if(!('speechSynthesis' in window)){this.notify('Trình duyệt chưa hỗ trợ giọng đọc. Anh vẫn có thể niệm theo dòng chữ.');return;}
    const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.lang.startsWith('vi'));
    if(!voice)this.notify('Thiết bị chưa có giọng Việt; có thể bật giọng Việt trong cài đặt thiết bị.');
    const speak=()=>{
      if(!this.chanting)return;
      const u=new SpeechSynthesisUtterance('Nam Mô A Di Đà Phật');u.lang='vi-VN';u.rate=.68;u.pitch=.9;if(voice)u.voice=voice;
      u.onend=()=>{this.chantTimer=setTimeout(speak,1800);};
      u.onerror=()=>{this.chanting=false;this.notify('Giọng đọc chưa phát được. Hãy chạm nút Niệm Phật để thử lại.');};
      speechSynthesis.speak(u);
    };
    this.notify('Niệm Phật dùng giọng đọc của thiết bị; chạm Di chuyển để dừng.');speak();
  }
  stopChant(){this.chanting=false;clearTimeout(this.chantTimer);this.recording?.pause();if('speechSynthesis'in window)speechSynthesis.cancel();}
}
