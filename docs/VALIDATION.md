# Kiểm tra bản bàn giao

Môi trường tạo gói: Node 24.22.1, Linux; ngày 31/10/2026.

## Đã chạy thành công

- `npm ci --no-audit --no-fund`: cài theo lockfile.
- `npm run generate:avatar`: xuất GLB rồi đọc lại bằng GLTFLoader; 28 xương, 7 skinned mesh, 8 clip, khoảng 595 KiB.
- `npm run generate:statue`: chuyển OBJ nguồn sang GLB; 98.601 tam giác, 1.775.116 byte.
- GLB Validator của Khronos: avatar và tượng đều **0 error, 0 warning** sau sửa node gốc và trọng số xương.
- `npm run build`: kiểm tra cú pháp JS/module, tài nguyên bắt buộc, GLB header/skin/tên clip.
- `npm test`: 17 kiểm tra đều qua; dùng nhiều Socket.io client thật nối tới HTTP server trên cổng local ngẫu nhiên.

Các trường hợp: chữ ký token; tạo/vào/cách ly phòng; server giới hạn di chuyển; va chạm ao/nhà; khoảng cách niệm/mua; phát động tác; lời mời và nhận kết bạn; quyền upload/giải mã/resize ảnh; xu/túi đồ; khôi phục ID từ guest key; mật khẩu Trụ trì sai/đúng; niệm gần tượng; thắp hương/cooldown/cách ly; seed hoa đăng cho người vào sau; sinh lời lành trên server; cấu trúc kinh thật và route các asset/module trên cùng origin.

## Giới hạn xác minh

Đã mở preview trong Chrome của môi trường làm việc. `canvas.getContext('webgl2')` trả null; giao diện báo WebGL 2 chưa bật. Vì vậy không thể xác nhận trực quan cảnh GPU, tư thế/va chạm vải/camera, shadow hay particle runtime trong trình duyệt này. Không thay bằng Canvas để mô tả là đã kiểm thử WebGL. Chưa đo FPS trên desktop GPU hoặc điện thoại thật.

Kiểm tra cấu trúc GLB và keyframe chứng minh asset có skin/clip thực, không tự chứng minh chất lượng chuyển động. Cần kiểm tra hình ảnh trên trình duyệt có WebGL 2 trước khi coi bản game đạt chất lượng phát hành.

Chưa deploy vào Render/GitHub của người dùng, chưa thử MongoDB Atlas từ xa, chưa load test 24 người/room. Hướng dẫn và manifest được chuẩn bị cho bước triển khai đó. Không cung cấp URL onrender giả như một dịch vụ đã chạy.

## Tự nghiệm thu trên máy có WebGL 2

1. Tạo `.env` từ mẫu, `npm ci`, `npm start`; mở localhost.
2. Chọn từng vai/áo; preview phải đổi tương ứng. Trụ trì sai mật khẩu phải bị chặn; đúng mật khẩu phải có halo.
3. Hai cửa sổ khác hồ sơ vào cùng link phòng: di chuyển, chat, vẫy tay, thiền và lạy phải thấy nhau. Chờ lạy hoàn tất rồi đứng lại; kiểm tra tay/chân ở camera trước/bên.
4. Đi qua tam quan vào Bái đường và Chính điện; ao, bệ và tường phải chặn nhân vật. Kiểm tra kéo xoay camera và cuộn.
5. Gần tượng mở tủ kinh; kiểm tra nguyên văn/phiên âm/trích dịch, chữ xuống dòng và nguồn. Bật mõ/niệm rồi tắt âm.
6. Dâng hương, thả đèn; người khác cùng phòng phải thấy; người khác phòng không thấy. Người vào cùng phòng muộn phải thấy đèn chưa hết hạn.
7. Đổi tranh trong mảng; kiểm tra ảnh local. Thử upload bằng mã admin khi có MongoDB; restart rồi kiểm tra còn ảnh/hồ sơ.
8. Deploy Render, mở HTTPS trên hai thiết bị thật. Đọc `/health`, thử reconnect sau một lần redeploy và theo dõi CPU/FPS trước khi tăng số người.
