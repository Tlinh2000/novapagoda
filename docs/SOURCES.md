# Nguồn tham khảo và kinh văn

Đối chiếu ngày 31/10/2026. Nova Pagoda là quần thể sáng tác, tham khảo kiến trúc chùa Việt; không phải bản phục dựng đo đạc một di tích.

## Kiến trúc

- [Cục Di sản văn hóa: chùa Bút Tháp](https://dsvh.gov.vn/di-tich-kien-truc-nghe-thuat-chua-but-thap-huyen-thuan-thanh-tinh-bac-ninh-2980): tham khảo cách sắp các hạng mục tam quan, tiền đường, thiêu hương, thượng điện, hành lang và nhà tổ. Dự án diễn họa trục Tam quan → sân/Bái đường → Chính điện → Nhà Tổ, có giản lược để di chuyển trong game.
- [Sansatemple](https://sansatemple.com/): cảm hứng về không gian đi chùa online và tương tác. Không sao chép mã nguồn, model hay tranh từ website này.
- Happy Buddha: [Stanford 3D Scanning Repository](https://graphics.stanford.edu/data/3Dscanrep/). Không nhận đây là tượng tại chùa Việt.

## Dữ liệu kinh đã tích hợp

| Mục | Nội dung cụ thể trong game | Nguồn |
| --- | --- | --- |
| Dược Sư | Toàn phần chính kinh Hán văn; thêm đoạn 12 đại nguyện trích dịch tiếng Việt do dự án thực hiện | T14 n0450, Huyền Trang Hán dịch, [CBETA](https://cbetaonline.dila.edu.tw/en/T0450) |
| Tâm Kinh | Phần chính kinh Hán văn và phiên âm Hán Việt; không kèm hai lời tựa | T08 n0251, Huyền Trang Hán dịch, [CBETA](https://cbetaonline.dila.edu.tw/zh/T0251) |
| Chú Vãng Sinh | Trích phần đà la ni và phiên âm Hán Việt; không ghép truyện phụ lục thành lời chú | T12 n0368, Cầu Na Bạt Đà La Hán dịch, [CBETA](https://cbetaonline.dila.edu.tw/zh/T0368_001) |

Bản XML TEI P5 tải từ repository chính thức [cbeta-org/xml-p5](https://github.com/cbeta-org/xml-p5), giữ nguyên header và nội dung trong `client/data/sources/T0450.xml`, `T0251.xml`, `T0368.xml`. Header có ngày phiên bản và các bên đóng góp.

`canonical.js` trích các đoạn trong `cb:div type="jing"`. Bản đọc bỏ marker dòng, anchor và chú thích cách đọc, giữ chữ trong phần chính kinh. Phần XML khảo dị, lời tựa và lời người sao chép vẫn nằm trong file nguồn để đối chiếu. Bản Dược Sư mở đầu bằng 如是我聞 và kết thúc bằng 信受奉行; không gọi lời ghi của người sao chép là chính kinh.

Phần Việt 12 đại nguyện là trích dịch mới, không phải bản dịch đầy đủ của Hòa thượng nào. Phiên âm Hán Việt do dự án biên soạn từ văn bản Hán, có thể khác dị âm tại từng chùa. Không dùng một bản tóm tắt làm lời tụng. Nếu muốn nghi thức cụ thể, thay dữ liệu bằng bản đã được chùa lựa chọn và cho phép phân phối, ghi đầy đủ dịch giả/nguồn.

Các lời nguyện về bệnh khổ được trình bày như nội dung văn bản tôn giáo lịch sử. Game không có cơ chế chữa bệnh, điểm công đức hay cam kết kết quả tín ngưỡng. Thẻ lời lành là nội dung tự soạn, không phải kinh văn hoặc phương thức dự báo.

## Giấy phép

[CBETA Copyright](https://cbeta.org/copyright) hiện nêu CC BY-NC-SA 4.0 cho dữ liệu thuộc nhóm A, bao gồm Đại chính tạng, cùng yêu cầu ghi nguồn và thông tin phiên bản. Các phần dữ liệu dẫn xuất từ CBETA trong gói giữ điều kiện này. Xem `THIRD_PARTY_NOTICES.md`; giấy phép MIT của code không thay giấy phép kinh văn.

Âm thanh chuông/mõ/chim tự tổng hợp, giọng niệm mặc định là giọng máy của trình duyệt. Thêm bản thu chỉ khi có quyền sử dụng và ghi đúng người/đơn vị thực hiện.
