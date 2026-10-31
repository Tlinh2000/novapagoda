import { CANONICAL } from './canonical.js';

/** Nguồn: CBETA T0450, T0251, T0368; XML gốc được giữ nguyên trong ./sources.
 * Bản Việt mười hai đại nguyện là phần trích dịch riêng của dự án, không phải toàn kinh Việt.
 * Phiên âm Tâm Kinh và Vãng Sinh do dự án chép theo chữ Hán, có thể khác nghi thức từng chùa.
 * Dữ liệu dẫn xuất từ CBETA: CC BY-NC-SA 4.0; xem THIRD_PARTY_NOTICES.md.
 */
export const SUTRAS = [
  {
    id:'medicine', title:'Kinh Dược Sư', shortName:'Dược Sư', priority:1,
    canonicalId:'T14, no.450 · 藥師琉璃光如來本願功德經 · Huyền Trang Hán dịch',
    sourceTitle:'CBETA · XML TEI P5 · bản cập nhật 30/01/2025',
    sourceUrl:'https://cbetaonline.dila.edu.tw/en/T0450',
    versions:[
      {id:'vi',label:'12 đại nguyện · Việt',lang:'vi',context:'Trích dịch mười hai đại nguyện từ T0450, do Nova Pagoda biên dịch. Đây là một đoạn của kinh, không phải toàn văn tiếng Việt.',paragraphs:[
        'Đức Phật bảo Mạn Thù Thất Lợi: Về phương Đông, vượt qua số cõi Phật bằng mười lần cát sông Hằng, có thế giới tên Tịnh Lưu Ly. Đức Phật ở đó hiệu là Dược Sư Lưu Ly Quang Như Lai. Khi thực hành đạo Bồ Tát, Ngài đã phát mười hai đại nguyện:',
        'Nguyện thứ nhất: Khi ta chứng Vô thượng Chánh đẳng Chánh giác trong đời sau, ánh sáng nơi thân chiếu khắp vô lượng thế giới. Thân trang nghiêm bằng ba mươi hai tướng tốt và tám mươi vẻ đẹp. Nguyện cho mọi loài hữu tình đều được như ta, không khác.',
        'Nguyện thứ hai: Khi ta thành đạo, thân như lưu ly, trong ngoài sáng suốt, thanh tịnh không vết nhơ; ánh sáng rộng lớn, công đức cao dày, thân an trụ, lưới sáng trang nghiêm hơn cả mặt trời và mặt trăng. Chúng sinh trong chốn tối tăm đều được soi sáng, tùy nguyện đi đến nơi cần đến và làm các công việc.',
        'Nguyện thứ ba: Khi ta thành đạo, dùng vô lượng trí tuệ và phương tiện khiến mọi hữu tình đều được vật dụng thụ hưởng không cùng tận; không để chúng sinh chịu thiếu thốn.',
        'Nguyện thứ tư: Khi ta thành đạo, những hữu tình đi theo đường tà đều được an trụ nơi đạo Bồ đề; người tu theo thừa Thanh văn và Độc giác đều được dẫn vào Đại thừa.',
        'Nguyện thứ năm: Khi ta thành đạo, vô lượng hữu tình tu phạm hạnh trong giáo pháp của ta đều giữ giới không thiếu khuyết, đầy đủ ba nhóm giới thanh tịnh. Nếu có người phạm giới, khi nghe danh hiệu ta thì lại được thanh tịnh, không rơi vào đường ác.',
        'Nguyện thứ sáu: Khi ta thành đạo, những hữu tình thân thể yếu kém, các căn không đầy đủ, thiếu sáng suốt, mù, điếc, câm, chân tay co quắp, lưng còng hoặc chịu nhiều bệnh khổ, khi nghe danh hiệu ta đều được thân tướng đoan chính, trí tuệ sáng suốt, các căn đầy đủ, không còn bệnh khổ.',
        'Nguyện thứ bảy: Khi ta thành đạo, những hữu tình bị nhiều bệnh bức bách, không nơi nương tựa, không thầy thuốc, không thuốc men, không thân thích và nhà cửa, nghèo khó nhiều khổ, nếu danh hiệu ta đến tai thì bệnh khổ được tiêu trừ, thân tâm an vui, gia thuộc và vật dụng đầy đủ, cho đến chứng được Vô thượng Bồ đề.',
        'Nguyện thứ tám: Khi ta thành đạo, nếu có người nữ bị những khổ não của thân nữ bức bách, rất muốn lìa bỏ và nguyện bỏ thân nữ, khi nghe danh hiệu ta thì được chuyển thành thân nam, đủ tướng trượng phu, cho đến chứng Vô thượng Bồ đề.',
        'Nguyện thứ chín: Khi ta thành đạo, khiến các hữu tình thoát lưới ma và mọi sự trói buộc của ngoại đạo. Nếu rơi vào rừng rậm các ác kiến, đều được dẫn dắt đến chánh kiến, dần tu hạnh Bồ Tát và sớm chứng Vô thượng Chánh đẳng Bồ đề.',
        'Nguyện thứ mười: Khi ta thành đạo, những hữu tình bị phép vua bắt giữ, trói buộc, đánh đập, giam cầm, sắp chịu hình phạt, hoặc bị vô số tai nạn và sự lăng nhục làm thân tâm sầu khổ, nếu nghe danh hiệu ta thì nhờ sức phúc đức và uy thần của ta mà được thoát mọi ưu khổ.',
        'Nguyện thứ mười một: Khi ta thành đạo, những hữu tình khổ vì đói khát, do cầu miếng ăn mà tạo nghiệp ác, nếu nghe danh hiệu ta và chuyên tâm thọ trì, trước hết ta cho thức ăn tốt đẹp để thân được no đủ, rồi dùng pháp vị giúp họ an vui rốt ráo.',
        'Nguyện thứ mười hai: Khi ta thành đạo, những hữu tình nghèo không có áo mặc, bị muỗi mòng và nóng lạnh bức bách ngày đêm, nếu nghe danh hiệu ta và chuyên tâm thọ trì thì tùy điều mong muốn, được y phục tốt đẹp cùng các vật trang nghiêm, tràng hoa, hương xoa và các thứ âm nhạc, thảy đều đầy đủ.',
        'Mạn Thù Thất Lợi! Đó là mười hai đại nguyện vi diệu mà đức Dược Sư Lưu Ly Quang Như Lai đã phát khi thực hành đạo Bồ Tát.'
      ]},
      {id:'han',label:'Toàn kinh · Hán văn',lang:'zh-Hant',context:'Toàn văn chính kinh T0450 từ “Như thị ngã văn” đến “Tín thọ phụng hành”. Mốc dòng, chú thích khảo dị và lời ghi của người sao chép được ẩn trong bản đọc; XML gốc giữ nguyên ở /data/sources/T0450.xml.',paragraphs:CANONICAL.T0450}
    ]
  },
  {
    id:'heart',title:'Bát Nhã Ba La Mật Đa Tâm Kinh',shortName:'Tâm Kinh',priority:2,
    canonicalId:'T08, no.251 · 般若波羅蜜多心經 · Huyền Trang Hán dịch',
    sourceTitle:'CBETA · T0251 · Phiên âm Hán Việt do dự án biên soạn',
    sourceUrl:'https://cbetaonline.dila.edu.tw/zh/T0251',
    versions:[
      {id:'am',label:'Phiên âm Hán Việt',lang:'vi',context:'Phiên âm phần chính kinh T0251. Không kèm lời tựa và phần khai kinh, hồi hướng của các nghi thức về sau.',paragraphs:[
        'Quán Tự Tại Bồ Tát hành thâm Bát nhã ba la mật đa thời, chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.',
        'Xá Lợi Tử! Sắc bất dị không, không bất dị sắc; sắc tức thị không, không tức thị sắc. Thọ, tưởng, hành, thức diệc phục như thị.',
        'Xá Lợi Tử! Thị chư pháp không tướng, bất sinh bất diệt, bất cấu bất tịnh, bất tăng bất giảm. Thị cố không trung vô sắc, vô thọ, tưởng, hành, thức; vô nhãn, nhĩ, tỷ, thiệt, thân, ý; vô sắc, thanh, hương, vị, xúc, pháp; vô nhãn giới, nãi chí vô ý thức giới. Vô vô minh diệc vô vô minh tận, nãi chí vô lão tử diệc vô lão tử tận. Vô khổ, tập, diệt, đạo; vô trí diệc vô đắc.',
        'Dĩ vô sở đắc cố, Bồ đề tát đỏa y Bát nhã ba la mật đa cố, tâm vô quái ngại. Vô quái ngại cố, vô hữu khủng bố, viễn ly điên đảo mộng tưởng, cứu cánh Niết bàn. Tam thế chư Phật y Bát nhã ba la mật đa cố, đắc A nậu đa la tam miệu tam bồ đề.',
        'Cố tri Bát nhã ba la mật đa thị đại thần chú, thị đại minh chú, thị vô thượng chú, thị vô đẳng đẳng chú, năng trừ nhất thiết khổ, chân thật bất hư. Cố thuyết Bát nhã ba la mật đa chú, tức thuyết chú viết:',
        'Yết đế, yết đế, ba la yết đế, ba la tăng yết đế, bồ đề, tát bà ha.'
      ]},
      {id:'han',label:'Nguyên văn Hán',lang:'zh-Hant',context:'Phần chính kinh T0251 theo CBETA; không đưa hai lời tựa vào nội dung tụng.',paragraphs:CANONICAL.T0251}
    ]
  },
  {
    id:'rebirth',title:'Chú Vãng Sinh',shortName:'Vãng Sinh',priority:3,
    canonicalId:'T12, no.368 · 拔一切業障根本得生淨土神呪 · Cầu Na Bạt Đà La Hán dịch',
    sourceTitle:'CBETA · T0368 · Phần đà la ni; không ghép thiên truyện phụ lục',
    sourceUrl:'https://cbetaonline.dila.edu.tw/zh/T0368_001',
    versions:[
      {id:'am',label:'Phiên âm Hán Việt',lang:'vi',context:'Phiên âm phần chú truyền thống. Các nghi thức có thể có dị âm; nguồn Hán được đặt ở tab bên cạnh để đối chiếu.',paragraphs:[
        'Nam mô A di đa bà dạ, đa tha già đa dạ, đa địa dạ tha.',
        'A di rị đô bà tỳ, a di rị đa, tất đam bà tỳ.',
        'A di rị đa, tỳ ca lan đế, a di rị đa, tỳ ca lan đa.',
        'Già di nị, già già na, chỉ đa ca lệ, ta bà ha.'
      ]},
      {id:'han',label:'Nguyên văn Hán',lang:'zh-Hant',context:'Trích riêng phần đà la ni của T0368. Bỏ số câu và ghi chú cách đọc trong bản hiển thị; bản XML gốc không thay đổi.',paragraphs:[CANONICAL.T0368[0]]}
    ]
  }
];
