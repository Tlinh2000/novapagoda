/** Một GLB chứa mesh, rig và các clips. Đổi đường dẫn theo từng vai nếu cần.
 * Tên clip: Idle, Walk, Run, Meditate, Prostrate, Greet, Wave, Laugh.
 * Model thay thế cần cùng chuẩn đơn vị (mét), +Y lên và +Z hướng mặt.
 */
export const AVATAR_MODELS = {
  male:'/assets/avatar.glb', female:'/assets/avatar.glb',
  monastic:'/assets/avatar.glb', abbot:'/assets/avatar.glb'
};
// Để null: dùng tượng tự dựng. Thay bằng '/assets/models/buddha.glb' để dùng tượng chi tiết.
export const BUDDHA_MODEL = {
  url:'/assets/models/buddha-detail.glb', height:3.7, rotationY:Math.PI,
  position:[5.2,.82,-25.3], replaceMain:false
};
