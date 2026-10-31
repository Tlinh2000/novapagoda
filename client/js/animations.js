import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';

/** Animation xương thật từ clips GLB; nhân vật mới clone rig riêng bằng SkeletonUtils.
 * at là thời điểm server bắt đầu. Snapshot dùng để đồng bộ phase cho người vào muộn.
 */
export class AvatarAnimations {
  constructor(model, clips) {
    this.model=model; this.mixer=new AnimationMixer(model);
    this.actions=new Map(clips.map(clip=>[clip.name,this.mixer.clipAction(clip)]));
    this.name=''; this.startedAt=0;
  }
  play(name, at=0, serverNow=Date.now()) {
    if(name===this.name && (!at || at===this.startedAt)) return;
    const clipName=name==='Chant'?'Meditate':name;
    const next=this.actions.get(clipName)||this.actions.get('Idle');
    if(!next) return;
    const once=['Prostrate','Wave','Greet','Laugh'].includes(clipName);
    if(next!==this.current || once) {
      next.reset().setLoop(once?LoopOnce:LoopRepeat, once?1:Infinity);
      next.clampWhenFinished=once;
      next.enabled=true; next.setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      if(at) {
        const elapsed=Math.max(0,(serverNow-at)/1000), duration=next.getClip().duration;
        next.time=once?Math.min(elapsed,Math.max(0,duration-.001)):elapsed%duration;
      }
      if(this.current && this.current!==next) this.current.crossFadeTo(next,.25,false);
      this.current=next;
    }
    this.name=name; this.startedAt=at;
  }
  update(dt) { this.mixer.update(dt); }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model); }
}
