import { Vector3 } from 'three';

/** Overlay HTML đi theo điểm đầu nhân vật trong cảnh 3D.
 * textContent bảo đảm tên/tin nhắn là chữ, không thực thi HTML người chơi gửi.
 */
export class BubbleChat {
  constructor(container, name, abbot=false) {
    this.element = document.createElement('div');
    this.element.className = 'nameplate' + (abbot ? ' abbot-name' : '');
    this.speech = document.createElement('span');
    this.speech.className = 'speech';
    const caption = document.createElement('b');
    caption.textContent = (abbot ? '✦ ' : '') + name;
    this.element.append(this.speech, caption);
    container.append(this.element);
    this.point = new Vector3();
  }
  say(text, duration=5500) {
    clearTimeout(this.timer);
    this.speech.textContent = text;
    this.speech.classList.remove('visible');
    // Bật lại animation khi nhận hai tin nhắn liền nhau.
    void this.speech.offsetWidth;
    this.speech.classList.add('visible');
    this.timer = setTimeout(() => this.speech.classList.remove('visible'), duration);
  }
  update(position, camera, width, height, heightAbove=2.42) {
    this.point.copy(position); this.point.y += heightAbove;
    this.point.project(camera);
    // Loại cả điểm nằm phía sau camera; không tạo bubble trên HUD khi quay lưng.
    this.element.hidden = this.point.z < -1 || this.point.z > 1 || Math.abs(this.point.x)>1.1 || Math.abs(this.point.y)>1.1;
    this.element.style.transform = `translate(${(this.point.x*.5+.5)*width}px,${(-this.point.y*.5+.5)*height}px) translate(-50%,-100%)`;
  }
  dispose() { clearTimeout(this.timer); this.element.remove(); }
}
