# Nova Pagoda · Về chùa cùng nhau

Game web 3D nhiều người: Three.js + Node.js + Socket.io, giao diện tiếng Việt. **Một Render Web Service phục vụ cả game lẫn multiplayer.** Không phải tạo thêm Render Static Site và không phải đổi URL Socket.io trong JavaScript.

Đây là bộ mã nguồn chạy bằng Node, kèm model và hướng dẫn. Chưa có dịch vụ Render được tạo trong tài khoản của bạn. Link chơi thật chỉ xuất hiện sau khi bạn hoàn thành mục 5.

## 1. Trong gói này có gì?

- Lobby: nhập tên; chọn Nam, Nữ, Tu sĩ, Trụ trì; xem preview nhân vật 3D xoay và đổi trang phục trước khi chơi.
- Trụ trì: máy chủ kiểm tra `ABBOT_PASSWORD`; đặt giá trị `Tlinh2006@` theo yêu cầu. Bộ áo Huyền kim/Liên hoa, vòng kim sắc và hạt hào quang. Đây là vai nhân vật, quyền thay tranh có mã quản trị riêng.
- Bản đồ: Tam quan, sân, Bái đường, Chính điện, Nhà Tổ; thêm gác chuông, gác trống, vườn tháp, ao sen, cá koi bơi tự động, vườn hoa và hai máy bán hàng.
- Tượng trung tâm tự dựng; tượng quét 3D **Happy Buddha của Stanford** đặt cạnh bệ thờ, có sẵn file GLB. Đây là mẫu đồ họa học tập; không phải mô hình đo đạc từ một chùa Việt Nam có thật.
- WASD/mũi tên, chạm sân tìm đường, camera theo sau xoay bằng kéo chuột, joystick cảm ứng. Giữ Shift để chạy.
- Chat phòng + bong bóng trên đầu; chuyển động xương thật từ GLB: đi, chạy, thiền, lạy, chào, vẫy tay, cười ôm bụng.
- Đến gần tượng hiện **Niệm Phật**; mở tủ kinh làm mờ nền. Có Dược Sư toàn văn Hán và trích dịch 12 đại nguyện, Tâm Kinh Hán/phiên âm, Chú Vãng Sinh Hán/phiên âm. Không gắn nhãn toàn kinh Việt cho đoạn trích.
- Ba tương tác thưởng: **thắp hương có khói**, **thả hoa đăng cùng phòng**, **rút thẻ lời nhắc thiện lành**. Thẻ tự soạn, không tiền cược.
- Thỉnh chuông/gõ trống, quầy dùng xu ảo, túi đồ và kết bạn.
- MongoDB Atlas tùy chọn để giữ hồ sơ, bạn bè, túi đồ, tranh upload sau khi Render restart.

Mục tiêu cấu hình: **tối đa 24 người/phòng**, một server. Đây là giới hạn lập trình, chưa phải kết quả đo tải hay cam kết FPS. Chuyển động là animation có xương do dự án biên soạn, không phải dữ liệu motion capture Mixamo tải sẵn.

## 2. Cấu trúc dự án

```text
nova-pagoda/
├── server.js                  Backend đầy đủ: HTTP, Socket.io, vai ẩn, tương tác
├── package.json
├── package-lock.json
├── render.yaml                Cấu hình Render Blueprint
├── .node-version
├── .env.example               Mẫu để tạo .env ở máy bạn
├── .gitignore
├── README.md                  Đọc file này trước
├── THIRD_PARTY_NOTICES.md      Giấy phép dữ liệu và mô hình
├── client/
│   ├── index.html             Lobby, preview, HUD, chat, dialog
│   ├── style.css
│   ├── js/
│   │   ├── app.js             Scene, camera, input, socket client, các menu
│   │   ├── world.js           Kiến trúc, ánh sáng cảnh quan, cá, tượng, tranh
│   │   ├── avatar.js          GLTFLoader, clone rig, áo, hào quang
│   │   ├── animations.js      AnimationMixer, crossfade, phase theo server
│   │   ├── bubble-chat.js     Bong bóng chat riêng biệt
│   │   ├── rituals.js         Khói hương và hoa đăng có thời hạn
│   │   └── audio.js           Chuông, mõ và giọng đọc thiết bị
│   ├── data/
│   │   ├── models.js          Đường dẫn GLB và cấu hình tượng
│   │   ├── paintings.js       Mảng URL tranh — đổi ảnh ở đây
│   │   ├── sutras.js          Nội dung kinh, phiên bản, thông tin nguồn
│   │   ├── canonical.js       Nội dung Hán trích từ XML nguồn
│   │   └── sources/           XML CBETA nguyên bản, giữ header
│   └── assets/
│       ├── avatar.glb         28 xương, 7 skinned mesh, 8 clips
│       ├── lotus.svg
│       ├── paintings/         Hai tranh vector tự thiết kế
│       └── models/buddha-detail.glb
├── server/
│   ├── auth.js                Token phiên, lọc chữ, so sánh mật khẩu
│   └── store.js               Lưu MongoDB hoặc bộ nhớ thử nghiệm
├── shared/world.js            Va chạm, vị trí, tốc độ; client và server cùng dùng
├── source-assets/happy.obj    Nguồn tượng quét, để tạo lại GLB
├── scripts/                   Tạo GLB, kiểm tra build
├── tests/game.test.js         Kiểm tra nhiều client và HTTP
└── docs/                      Kiến trúc, animation, asset, nguồn, kiểm thử
```

## 3. Chạy thử trên Windows

### Cài công cụ một lần

1. Cài [Node.js](https://nodejs.org/) bản 22 hoặc 24; gói dự án pin `24.22.1`.
2. Cài [Git](https://git-scm.com/downloads) nếu muốn đưa code lên GitHub bằng lệnh.
3. Có thể cài [VS Code](https://code.visualstudio.com/) để sửa file và mở Terminal dễ hơn.
4. Giải nén ZIP. Mở đúng thư mục mà bên trong thấy `server.js` và `package.json`, không mở thư mục cấp trên.

### Tạo cấu hình rồi chạy

Mở VS Code → File → Open Folder → chọn `nova-pagoda` → Terminal → New Terminal.

Trong PowerShell chạy lần lượt:

```powershell
Copy-Item .env.example .env
npm ci
npm run build
npm start
```

macOS/Linux dùng `cp .env.example .env` thay cho lệnh đầu. Nếu Windows chặn `npm.ps1`, dùng `npm.cmd ci`, `npm.cmd run build`, `npm.cmd start` trong chính cửa sổ đó.

Khi thấy dòng `Nova Pagoda · port 3000`, giữ Terminal mở và vào **http://localhost:3000**. Nhập tên, xem áo rồi bắt đầu. Mật khẩu Trụ trì trong `.env.example` đã đặt theo yêu cầu. `.env` được Git bỏ qua; không kéo file này lên GitHub.

Không nhấp đúp `client/index.html`: game cần máy chủ để nạp module và Socket.io.

Chưa có MongoDB vẫn chơi được. Nhãn “Chế độ thử nghiệm” nghĩa là dữ liệu server đang lưu tạm; tên/áo trong trình duyệt vẫn được nhớ, nhưng xu, bạn bè, ảnh upload có thể mất sau restart.

Để thử hai người trên cùng máy: mở game bằng cửa sổ thường và cửa sổ ẩn danh (hoặc hai trình duyệt). Cửa sổ thứ nhất tạo phòng và nhấn mã phòng góc trên để sao chép link. Cửa sổ thứ hai dán link đó. Hai tab thường cùng trình duyệt dùng chung hồ sơ, vì vậy tab mới sẽ thay thế tab cũ.

## 4. Đưa code lên GitHub từ `git init`

1. Đăng nhập [GitHub](https://github.com/). Chọn **+ → New repository**.
2. Đặt tên `nova-pagoda`; Private hoặc Public đều được nếu bạn cho Render truy cập repo.
3. Để dễ push lần đầu, **không** chọn tạo README, `.gitignore` hay License trên GitHub. Gói code đã có các file này.
4. Chọn Create repository. Sao chép URL repo HTTPS do GitHub hiển thị.
5. Trong Terminal đang mở ở thư mục chứa `package.json`, chạy:

```bash
git init
git add .
git commit -m "Build Nova Pagoda multiplayer"
git branch -M main
git remote add origin https://github.com/TEN-GITHUB/nova-pagoda.git
git push -u origin main
```

Thay `TEN-GITHUB` bằng tên tài khoản thật. Nếu Git yêu cầu xác thực, làm theo cửa sổ đăng nhập của Git; không viết token vào file dự án. Nếu Git hỏi tên/email để commit, điền bằng `git config user.name "Tên của bạn"` và `git config user.email "Email GitHub của bạn"`, rồi chạy lại `git commit`.

6. Mở repo trên GitHub. Phải thấy ngay **server.js, package.json, package-lock.json, client/** ở trang chính. Nếu tất cả nằm dưới một thư mục con `nova-pagoda/`, ở bước Render cần đặt Root Directory là `nova-pagoda`.

**Không dùng Git vẫn được:** GitHub → Add file → Upload files → kéo toàn bộ nội dung bên trong thư mục dự án lên → Commit changes. Đừng chỉ upload ZIP; Render cần các file đã giải nén. Đảm bảo `.gitignore`, `.node-version` được tải lên; `package.json` đã có khoảng Node dự phòng.

## 5. Deploy lên Render — chỉ tạo một Web Service

Theo luồng Node/Express chính thức của Render, đã đối chiếu 31/10/2026:

1. Đăng nhập [Render Dashboard](https://dashboard.render.com/).
2. Chọn **New + → Web Service**. Không chọn Static Site.
3. Kết nối GitHub, cấp quyền đọc repo `nova-pagoda`, rồi chọn repo đó.
4. Điền đúng các ô:

| Ô trên Render | Giá trị |
| --- | --- |
| Name | `nova-pagoda` hoặc tên chưa ai dùng |
| Language / Runtime | `Node` |
| Branch | `main` |
| Region | Chọn khu vực gần người chơi, nếu tài khoản có lựa chọn phù hợp |
| Root Directory | **Để trống** nếu `package.json` nằm ở trang chính repo |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instance Type | Free để thử, nếu gói này có sẵn trong tài khoản |

5. Mở **Environment Variables**, thêm:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.22.1` — chỉ là số phiên bản, không nhập URL tài liệu |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên ít nhất 32 ký tự |
| `ABBOT_PASSWORD` | `Tlinh2006@` |
| `ADMIN_TOKEN` | Chuỗi bí mật khác để thay tranh qua UI |
| `MONGODB_URI` | Tùy chọn; để trống nếu chưa dùng MongoDB |
| `MONGODB_DB` | `nova_pagoda` |

Để tạo chuỗi ngẫu nhiên, trên máy chạy:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Chạy hai lần, lấy hai chuỗi khác nhau cho `SESSION_SECRET` và `ADMIN_TOKEN`. Không đưa chúng vào `client/` hay commit `.env`.

6. Chọn **Deploy Web Service**. Chờ Build/Deploy thành công và trạng thái **Live**. Logs phải có dòng `Nova Pagoda · port ...`.
7. Nhấn địa chỉ HTTPS Render hiển thị ở đầu trang service. **Đây là link chơi game.** Không vào trang `render.com/docs/...` để chơi và không tự đoán tên miền trước khi Render cấp.
8. Vào game → nhấn mã phòng → gửi link cho bạn bè. Bạn bè mở chính link đó rồi nhập tên để vào cùng phòng.

URL trong ví dụ `https://TEN-DICH-VU.onrender.com` chỉ là mẫu, không phải dịch vụ đã được tạo. Socket client dùng `io()` cùng origin nên tự dùng endpoint HTTPS/WSS của địa chỉ hiện tại. Server đã dùng `process.env.PORT` và bind `0.0.0.0` theo yêu cầu Render.

**Render Blueprint (cách khác):** New + → Blueprint → chọn repo → dùng `render.yaml`. Blueprint sinh sẵn `SESSION_SECRET`/`ADMIN_TOKEN`; bạn điền `ABBOT_PASSWORD`. Có thể để `MONGODB_URI` trống khi thử. Chọn một trong hai cách tạo service, không làm cả hai.

Gói Free hiện có cơ chế nghỉ sau 15 phút không có inbound traffic và có thể cần khoảng một phút để khởi động lại; các WebSocket cũng có thể đứt khi deploy/restart. Socket.io đã có nối lại. Phòng đang chơi và hoa đăng là dữ liệu realtime tạm, không khôi phục sau server restart.

## 6. Giữ hồ sơ và tranh sau restart (MongoDB tùy chọn)

1. Tạo cluster tại [MongoDB Atlas](https://www.mongodb.com/atlas). Có thể chọn gói miễn phí nếu tài khoản/khu vực có.
2. Database Access → tạo database user riêng cho game; chỉ cần quyền đọc/ghi database `nova_pagoda`.
3. Network Access → cho phép outbound IP của Render service (tìm trong thông tin Connect/Networking của service theo giao diện tài khoản). Cho phép thêm IP máy bạn nếu chạy local. Không cần mở toàn Internet mặc định.
4. Connect → Drivers → sao chép connection string `mongodb+srv://...`. Thay user, mật khẩu, database; mã hóa ký tự đặc biệt trong mật khẩu theo hướng dẫn Atlas.
5. Render → Environment → đặt `MONGODB_URI`, `MONGODB_DB=nova_pagoda` → Save/redeploy.
6. Mở `/health` trên chính địa chỉ game; `persistence` phải là `mongodb`. Trong lobby nhãn đổi sang “Sẵn sàng đón bạn”.

Không dùng file JSON/SQLite ghi vào ổ Render để lưu lâu dài. Server không ghi ảnh upload vào ổ đĩa: ảnh được kiểm tra, đổi thành JPEG và lưu vào MongoDB nếu cấu hình.

## 7. Cách chơi và vị trí tương tác

| Điều khiển | Kết quả |
| --- | --- |
| WASD / mũi tên | Đi theo góc camera |
| Chạm sân | Tự tìm đường đến điểm chọn, có va chạm |
| Kéo chuột trên cảnh / giữ chuột phải | Xoay camera; cuộn để đổi khoảng cách |
| Shift | Chạy |
| `1`, `2`, `3`, `4`, `5` | Thiền, lạy, vẫy, cười, đứng |
| `E` | Dùng tương tác gần nhất |
| Enter | Đặt con trỏ vào khung chat |
| Cần tròn trên điện thoại | Di chuyển; kéo vùng cảnh để xoay góc nhìn |
| Mã phòng góc trên | Sao chép link mời bạn |

Các mốc dùng tọa độ `(x,z)`, đơn vị mét: tượng `(0,-23)`, lư hương `(0,-20)`, bến đèn `(-25,24)`, góc lời lành `(8,23)`, chuông `(20,14)`, quầy `(29,29)`. Nút xuất hiện khi đến gần. Server kiểm tra khoảng cách trước khi phát sinh tương tác.

Nhấn Niệm Phật gần tượng để mở tủ kinh. Trong cửa sổ này chọn bài/phiên bản, bật Niệm Phật hoặc tiếng mõ. Niệm Phật dùng giọng tổng hợp của thiết bị; muốn có bản thu riêng được phép dùng, đặt file `client/assets/chant.mp3`, commit và deploy lại.

## 8. Thay tranh, model, trang phục

- **Thay ảnh bằng file:** chép JPEG/PNG/WebP vào `client/assets/paintings/`, đổi `url` trong `client/data/paintings.js`, commit và push. File của repo sống qua redeploy.
- **Thay ảnh bằng link:** đặt URL HTTPS trong mảng đó. Nguồn ảnh cần cho phép CORS; ảnh cùng domain game ít lỗi hơn.
- **Thay ảnh qua UI:** vào game → ⚙ → chọn trái/phải → nhập `ADMIN_TOKEN` → chọn ảnh ≤3 MB → Lưu. Muốn giữ sau restart cần MongoDB. Tranh upload đã lưu sẽ ưu tiên hơn tranh file cấu hình; đổi sang database mới/xóa bản override có chủ đích nếu muốn quay về tranh cấu hình.
- **Nhân vật:** đã có `avatar.glb` đủ chuyển động. Đổi đường dẫn từng vai trong `data/models.js`. Model mới phải có rig và đúng tên clips; chỉ đổi tên file FBX thành `.glb` không chuyển được định dạng.
- **Tượng:** đã có `buddha-detail.glb`. Đổi URL, chiều cao, góc xoay và vị trí tại `BUDDHA_MODEL` trong `data/models.js`; `replaceMain:true` sẽ thay tượng giữa. Xem `docs/ASSETS.md` để tải nguồn và chuyển định dạng.
- **Nâng cấp Mixamo:** xem `docs/ANIMATIONS.md`; download FBX → import Blender → ghép/retarget cùng armature → đặt tên Action → export GLB. Không mặc định Mixamo có đúng động tác lạy/kiết già cần dùng.

Một phần asset/kinh trong bản học tập này có điều kiện phi thương mại. Đọc `THIRD_PARTY_NOTICES.md` trước khi phát hành có thu tiền; thay bằng asset được cấp phép tương ứng khi cần.

## 9. Khi gặp lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Render báo không thấy package.json | Kiểm tra Root Directory; phải trỏ vào thư mục chứa package.json |
| `npm ci` báo lockfile không khớp | Trên máy chạy `npm install`, commit cả package.json và package-lock.json |
| Render báo thiếu SESSION_SECRET | Thêm biến trong Environment, chuỗi ≥32 ký tự; Save/redeploy |
| Không chọn được Trụ trì | Đặt `ABBOT_PASSWORD` trên backend đúng `Tlinh2006@`, không thêm khoảng trắng |
| Nhập Node version bị lỗi | Value phải là `24.22.1`, không phải `https://render.com/docs/node-version` |
| Trắng cảnh hoặc báo WebGL 2 chưa bật | Bật tăng tốc đồ họa trong Chrome/Edge rồi khởi động lại trình duyệt; cập nhật driver nếu cần |
| Xoay tròn khi mở link Render | Đợi service khởi động; xem Logs/Health trước khi sửa URL |
| Hai máy vào mà không thấy nhau | Dùng cùng link có `?room=...`, không tự tạo hai phòng |
| Hai tab liên tục thay phiên | Mở cửa sổ ẩn danh cho người chơi thử thứ hai |
| Mất ảnh/đồ sau restart | Kết nối MongoDB để lưu bền vững; phòng và hiệu ứng vẫn là dữ liệu tạm |
| Ảnh ngoài không xuất hiện | Chuyển ảnh vào assets/paintings hoặc dùng nguồn cho phép CORS |
| Không nghe niệm | Bật Âm thanh và kiểm tra giọng tiếng Việt; có thể dùng chant.mp3 có giấy phép |

Sau khi sửa:

```bash
npm run build
npm test
git add .
git commit -m "Update Nova Pagoda"
git push
```

Render triển khai lại nhánh liên kết theo cấu hình Auto Deploy. Người chơi có thể cần tải lại trang sau khi cập nhật lớn.

## 10. Kiến trúc và kết quả kiểm tra

Xem `docs/ARCHITECTURE.md` để đọc mô hình phòng và authority máy chủ; `docs/VALIDATION.md` ghi kết quả và giới hạn. Build đã kiểm tra JavaScript, GLB có skin và đủ clip; 17 kiểm tra tự động đã qua ở phiên bản bàn giao. Trình duyệt kiểm thử trong môi trường tạo gói không có WebGL 2, nên chưa kiểm chứng trực quan cảnh/animation hay đo FPS trên GPU/điện thoại thật. Chưa deploy vào tài khoản Render của bạn và chưa kiểm tra MongoDB từ xa.

Nguồn chính thức: [Render Node/Express](https://render.com/docs/deploy-node-express-app), [Render WebSocket](https://render.com/docs/websocket), [Free instances](https://render.com/docs/free), [Node version](https://render.com/docs/node-version), [Three.js](https://threejs.org/docs/), [Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html). Nguồn văn hóa và kinh ở `docs/SOURCES.md`.
