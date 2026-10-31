# Asset: tải ở đâu và đặt tên thế nào

## File đã kèm sẵn

| Đường dẫn | Nội dung | Nguồn/quyền |
| --- | --- | --- |
| `client/assets/avatar.glb` | Nhân vật phong cách giản lược, 28 xương và tám animation | Dự án tự tạo, MIT |
| `client/assets/models/buddha-detail.glb` | Tượng quét Happy Buddha, vật liệu vàng | Stanford Computer Graphics Laboratory; phi thương mại, có ghi nguồn |
| `source-assets/happy.obj` | Bản OBJ nguồn của tượng để chuyển lại GLB | Mirror common-3d-test-models của Alec Jacobson, dữ liệu Stanford |
| `client/assets/paintings/lotus.svg` | Tranh sen Liên Hoa | Dự án tự vẽ bằng vector, MIT |
| `client/assets/paintings/bodhi.svg` | Tranh lá bồ đề | Dự án tự vẽ bằng vector, MIT |

Game tải đủ những file này mà không cần đăng nhập vào Mixamo/Sketchfab. Các bộ đồ dùng cùng một rig: lam, nâu, áo dài có hai tà; tu sĩ có cà sa; Trụ trì có dải khoác, thân áo Huyền kim/Liên hoa, vòng hạt và halo. Chưa có mô phỏng vải vật lý hay facial blendshape.

## Tượng Phật có chi tiết thật

Happy Buddha là dữ liệu quét laser của **Brian Curless và Marc Levoy / Stanford Computer Graphics Laboratory**. [Trang dữ liệu gốc](https://graphics.stanford.edu/data/3Dscanrep/), [giới thiệu model](https://graphics.stanford.edu/software/scanview/models/happybuddha.html), [mirror OBJ dùng trong gói](https://github.com/alecjacobson/common-3d-test-models/blob/master/data/happy.obj).

Mô hình được đổi từ OBJ sang GLB, gộp đỉnh trùng, tính normal trơn, đưa về chiều cao 1m và dùng vật liệu vàng. Không có animation hoặc mô phỏng phá hủy tượng. Trong game nó đặt cạnh bệ thờ tại `(5.2,0.82,-25.3)`, cao 3,7m; tượng Thích Ca trung tâm vẫn là hình khối dự án tự tạo. Không gọi model quét này là tượng Thích Ca hoặc bản quét di tích Việt Nam.

Tạo lại từ file nguồn có sẵn:

```bash
npm ci
npm run generate:statue
```

## Thay bằng tượng / công trình của bạn

1. Tải model GLB từ nguồn có giấy phép phù hợp. Có thể tìm qua [Smithsonian 3D](https://3d.si.edu/) (kiểm tra quyền trên từng object), hoặc model tác giả cho phép tải từ Sketchfab. Dữ liệu thương mại phải có quyền tương ứng; không coi mọi kết quả tìm kiếm là miễn phí.
2. Mở bằng Blender. Nếu tải OBJ/FBX hoặc gói GLTF rời, giữ đủ texture và chuyển bằng File → Export → glTF 2.0 → GLB. Đổi phần mở rộng file không phải là chuyển đổi định dạng.
3. Với tượng tĩnh: đưa trục thẳng đứng về +Y, mặt hướng +Z, bỏ camera/đèn đi kèm, ưu tiên một hoặc vài material. Dùng texture 1K–2K và giảm lưới sau khi so sánh chất lượng.
4. Đặt tên `buddha.glb`, chép vào `client/assets/models/`.
5. Sửa `BUDDHA_MODEL` trong `client/data/models.js`:

```js
export const BUDDHA_MODEL = {
  url:'/assets/models/buddha.glb',
  height:5.5, rotationY:0,
  position:[0,.82,-25.4], replaceMain:true
};
```

Loader đo bounding box, tự căn đáy về cao độ đã chỉ định và scale theo chiều cao. Nếu model quay lưng, sửa `rotationY:Math.PI`. GLB Draco/KTX2 cần cấu hình decoder tương ứng; loader hiện kèm hỗ trợ GLB thường, không tự tải decoder CDN. Khi dùng asset nén, hoặc export GLB thường, hoặc chủ động thêm DRACOLoader/KTX2Loader và các decoder từ cùng phiên bản Three.js.

`PagodaWorld.house()/roof()/buddha()` là cấu trúc để thay thêm công trình bằng GLTFLoader. Khi đổi vị trí nhà hoặc bệ, sửa collider ở `shared/world.js` tương ứng.

## Nhân vật từ Mixamo

Nguồn phù hợp: [Mixamo của Adobe](https://www.mixamo.com/), model humanoid do bạn làm trong Blender, hoặc model được cho phép dùng trong game. Adobe mô tả thư viện dùng cho game trong [FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html).

Mixamo thường cung cấp FBX cho quy trình này. Tải một nhân vật có skin, các clip cùng rig; đưa qua Blender để đặt tên Action và export GLB. Quy trình chi tiết ở `ANIMATIONS.md`. Việc đổi rig cần retarget/bake; tên clip giống nhau chưa đủ để bộ xương khác nhau chạy đúng.

Đặt các file, nếu muốn mỗi vai có model riêng:

```text
client/assets/models/male.glb
client/assets/models/female.glb
client/assets/models/monastic.glb
client/assets/models/abbot.glb
```

Sửa `AVATAR_MODELS` trong `data/models.js` cho khớp. Code mặc định dùng `/assets/avatar.glb` cho cả bốn vai để chạy ngay. Giữ tên material `Robe`, `Collar`, `Sash`, `Hair` nếu muốn hệ thống đổi màu/ẩn tóc mặc định làm việc. Với rig không có `Chest`/`Hips`, chuyển phần gắn phụ kiện/áo dài trong `avatar.js` sang tên xương thực tế của model.

Tên clips bắt buộc: `Idle`, `Walk`, `Run`, `Meditate`, `Prostrate`, `Greet`, `Wave`, `Laugh`. Nên có đủ tám clips trong mỗi GLB. Đi/chạy phải là animation in place vì server đã di chuyển root ngoài cảnh.

## Tranh và âm thanh

Thay trực tiếp mảng URL ở `client/data/paintings.js`. Nên đưa ảnh của bạn vào assets để tránh hotlink và CORS. Có thể thêm slot kèm position/width/height/rotationY; UI upload quản trị hiện quản lý hai slot trái/phải.

Bản mặc định có tranh sen và bồ đề do dự án tự vẽ, không nhận là ảnh chụp hiện vật/tranh cổ. Nếu cần tranh có các hình tượng cụ thể, thay bằng ảnh được phép dùng. Tệp âm thanh niệm Phật tùy chọn là `client/assets/chant.mp3`; chuông/mõ/chim hiện được tổng hợp bằng Web Audio, chưa kèm bản thu của tăng ni.
