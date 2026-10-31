# Nhân vật, rig và animation

## Bản có sẵn trong dự án

`client/assets/avatar.glb` là mô hình nguyên gốc tạo bằng `scripts/generate-avatar.mjs`, gồm 28 xương, 7 mesh có skin và 8 clip. Đây là chuyển động xương thật: vertex có `JOINTS_0`/`WEIGHTS_0`, skin có inverse bind matrices; Three.js dùng `AnimationMixer` để biến dạng mesh. Không cần tài khoản Mixamo để chơi bản này.

Phong cách là mô hình giản lược, khoảng 2,03 m theo đơn vị cảnh; thân áo, tay áo, quần, bàn tay và đầu được dựng có khối. Đây là art khởi đầu do mã nguồn tạo, chưa phải nhân vật người thật, vải mô phỏng hoặc chuyển động ghi lại từ diễn viên. `Laugh` có chuyển động thân, đầu và mắt; chưa có blendshape miệng cười. Đừng ghi tính năng blendshape là đã hoàn thành.

| Clip (phải giữ đúng tên) | Thời lượng | Cách chạy | Nội dung xương |
| --- | --- | --- | --- |
| `Idle` | 3,8 s | Lặp | Thở nhẹ, vai thả lỏng |
| `Walk` | 1,1 s | Lặp | Hông, đùi, cẳng chân, cánh tay vung đối xứng |
| `Run` | 0,72 s | Lặp | Sải chân lớn hơn, tay gập và thân hơi nghiêng |
| `Meditate` | 4,4 s | Lặp sau crossfade | Hông hạ thấp, đùi mở và cẳng chân bắt chéo, tay đặt trước đùi, xương mắt khép |
| `Prostrate` | 7,2 s | Một lần | Đứng → chắp tay → quỳ → gập thân và đầu sát sàn → trở về quỳ → đứng |
| `Greet` | 2,7 s | Một lần | Hai bàn tay đưa về giữa, thân và đầu cúi nhẹ, trở lại đứng |
| `Laugh` | 2,5 s | Một lần | Tay trước bụng, thân và đầu nhấp nhẹ, mắt khép một phần |
| `Wave` | 2,65 s | Một lần | Vai đưa tay lên, khuỷu tay và cổ tay vẫy, hạ tay |

Tư thế trước và sau các clip một lần là đứng nghỉ. Khi chơi `Meditate`, crossfade từ clip hiện tại để có giai đoạn hạ người; khi rời thiền, crossfade lại `Idle`. Không di chuyển nhân vật giữa chu trình lạy. Mỗi client phát clip và hiệu chỉnh phase theo actionAt/giờ server trong animations.js; vị trí đi bộ được server kiểm tra riêng.

## Mesh và trang phục

| Mesh / material | Mục đích |
| --- | --- |
| `Robe` | Thân áo, tay áo và quần; thay `material.color` cho áo lam, nâu, vàng, dài |
| `Skin` | Da, đầu, cổ, bàn tay và tai |
| `Hair` | Tóc tối màu và búi tóc; ẩn với Trụ trì / Tu sĩ |
| `Sash` | Dải áo khoác chéo; bật với cà sa |
| `Face` | Mắt, mày, nét miệng |
| `Shoes` | Hài / dép kín màu tối |
| `Collar` | Cổ, viền tay và khuy áo |

Nam và Nữ là lựa chọn trình bày nhân vật; Tu sĩ là vai trang phục. Trụ trì cần mật khẩu xác minh ở server và có halo/phụ kiện riêng, không cấp quyền quản trị. Bộ hiện tại dùng chung một topology và thay tóc, màu, dải cà sa, tỷ lệ. Khi muốn áo dài hoặc cà sa có đường cắt, tà áo và nếp vải riêng hoàn chỉnh, thay mesh trang phục trong Blender bằng cùng rig, rồi weight paint và xuất lại GLB. Không nên mô tả đổi màu là đã có mô phỏng trang phục may riêng.

Clone mỗi avatar bằng `SkeletonUtils.clone(gltf.scene)`, sau đó clone material trước khi đổi màu. `scene.clone()` thông thường không tái liên kết skeleton đúng cho nhiều nhân vật. Dùng `AnimationMixer` riêng cho mỗi clone. Forward của asset này là `+Z`; đặt chân ở `y = 0`.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const gltf = await new GLTFLoader().loadAsync('/assets/avatar.glb');
const avatar = SkeletonUtils.clone(gltf.scene);
const mixer = new THREE.AnimationMixer(avatar);
const clip = gltf.animations.find(c => c.name === 'Prostrate');
const action = mixer.clipAction(clip);
action.setLoop(THREE.LoopOnce, 1);
action.clampWhenFinished = true;
action.reset().fadeIn(0.2).play();
// Trong vòng render: mixer.update(deltaSeconds).
```

## Tạo lại và kiểm tra file

Từ thư mục gốc sau `npm install`:

```bash
npm run generate:avatar
npm run build
```

Lệnh tạo lại còn đọc binary bằng `GLTFLoader` và kiểm tra đủ clip, đủ xương và mesh có skin. Kết quả ban đầu: 28 xương, 7 skinned mesh, 31 track/clip, khoảng 595 KiB. Kiểm tra trực quan cả chu trình từ camera bên cạnh trước khi thay thế asset; skin hợp lệ không tự bảo đảm chất lượng dáng người.

## Dùng Mixamo cho bản nâng cấp

Adobe cho phép dùng nhân vật/animation Mixamo trong game và miễn phí với Adobe ID; hãy đọc điều khoản hiện hành trước khi chọn asset. Asset nguyên gốc đi kèm dự án không chứa dữ liệu tải từ Mixamo. [FAQ chính thức](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html), kiểm tra 31/10/2026.

1. Dùng nhân vật humanoid trung tính, tách rõ đầu, thân, tay và chân. Với nhân vật mới, đặt T-pose/A-pose tại gốc cảnh, tránh áo quá rộng và phụ kiện cản auto-rig.
2. Vào [Mixamo](https://www.mixamo.com/), đăng nhập Adobe ID, `Upload Character`. Nhân vật rig sẵn cần FBX; hệ thống hỗ trợ upload FBX/OBJ/ZIP cho bước auto-rig. Đặt các mốc cổ tay, khuỷu tay, đầu gối và háng theo hướng dẫn rồi xác nhận. Xem [hướng dẫn Adobe](https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html).
3. Trong `Animations`, tìm bằng từ khóa `Walking`, `Running`, `Waving`, `Laughing`, `Standing Greeting`. Đây là gợi ý từ khóa tìm kiếm; danh mục và tên clip có thể thay đổi. Xem thử trên chính nhân vật, chỉnh tốc độ và khoảng tay, rồi tải FBX. Hướng dẫn [chọn và chỉnh animation](https://helpx.adobe.com/creative-cloud/help/animate-characters-mixamo.html).
4. Giữ chuyển động đi/chạy tại chỗ: vị trí trên bản đồ do server cập nhật; không để root motion trong FBX kéo nhân vật thêm một lần nữa. Tải nhân vật có skin một lần; các clip tiếp theo có thể dùng tùy chọn không kèm skin nếu UI cung cấp.
5. Không mặc định thư viện có đúng lạy Phật hay kiết già. Các chuyển động này cần người làm animation sửa thủ công trong Blender, dựa trên tư thế tôn nghiêm và kiểm tra gối, bàn chân, bàn tay chạm nhau.

## Sửa trong Blender và xuất GLB

Theo [Blender Manual — glTF 2.0](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html), glTF hỗ trợ skinning, keyframe và shape key. Khi dùng phiên bản Blender khác, tên tùy chọn có thể đổi.

- Import FBX hoặc GLB; chỉnh scale về mét, chân nằm trên mặt phẳng sàn. Không đổi tên xương sau khi retarget các clip.
- Nếu bộ xương animation khác bộ xương nhân vật, retarget và bake lên cùng armature. Chỉ ghép tên Action không tự chuyển chuyển động giữa hai rig.
- Tạo tám Action theo đúng tên trong bảng. Lưu / stash các Action hoặc đưa vào NLA; trong export chọn chế độ Actions/NLA tương ứng, bật Skinning và sampling để bake chuyển động được điều khiển bằng constraint.
- Export `glTF 2.0` → `GLB`, xuất mesh, armature, animation cần thiết. Nếu dùng khuôn mặt, xuất Shape Keys và animation của chúng. Import lại file đã xuất để kiểm tra đủ tám clip.

Đây là checklist chuyên môn bổ sung để sửa nghi lễ: ở `Meditate`, đặt hai bàn chân trên/chéo trước đùi, giữ cột sống thẳng, vai thả; ở `Prostrate`, đánh dấu các key pose đứng, quỳ, tay chạm đất, trán sát đất, nâng người và đứng lại, điều chỉnh foot/hand IK, rồi bake constraint. Mô hình áo dài cần weight paint tránh tà xuyên đùi khi quỳ. Chạy thử từ camera trước, bên và sau với sàn có lưới, đặc biệt ở các frame chuyển tiếp.

Nếu thêm `mouthSmile` / `eyeBlinkLeft` / `eyeBlinkRight`, đặt keyframe `morphTargetInfluences` trong clip `Laugh`. Bone animation vẫn là phần chính; blendshape chỉ bổ sung biểu cảm. Gắn phụ kiện cầm tay vào bone bàn tay sau khi tải GLB để chúng đi theo animation.

## Tài liệu kỹ thuật

- [Three.js SkinnedMesh](https://threejs.org/docs/#api/en/objects/SkinnedMesh)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Three.js AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- [Three.js SkeletonUtils](https://threejs.org/docs/#examples/en/utils/SkeletonUtils)
- [Định dạng glTF 2.0 — Khronos](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
