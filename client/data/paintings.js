/** Đổi URL/file ở đây, rồi commit và deploy lại. Dùng ảnh do bạn sở hữu/được phép sử dụng.
 * URL ngoài cần HTTPS và máy chủ ảnh phải cho phép CORS. File nội bộ ổn định hơn.
 * Có thể thêm slot: { id:'ten-slot', url:'...', position:[x,y,z], width:3, height:4 }.
 */
export const PAINTINGS = [
  { id:'left', url:'/assets/paintings/lotus.svg', position:[-7.2,4,-28.70], width:3.3, height:4.5 },
  { id:'right', url:'/assets/paintings/bodhi.svg', position:[7.2,4,-28.70], width:3.3, height:4.5 }
];
