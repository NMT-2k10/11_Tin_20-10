# Flower Garden – bản web trên máy để custom

Bản nâng cấp dựa trên dự án Flower Garden trong Downloads. Đầu hoa ở vườn và bó hoa đã được dựng lại bằng Three.js; nội dung quà, ảnh, nhạc và thư tiếp tục dùng cấu hình hiện tại. Trang tham khảo ban đầu:
https://graden-flowers--flowers-2d5e3.asia-southeast1.hosted.app/?isPreview=true&autoplay=0&muted=1

## Mở web

Nhấp đúp **MO-WEB.cmd**. Web mở trong trình duyệt mặc định khi server sẵn sàng.
Hoặc mở Terminal trong thư mục này, chạy `npm start`, rồi truy cập **http://127.0.0.1:5180**.
Giữ cửa sổ lệnh mở trong khi xem. Nhấn Ctrl+C để tắt server.

Không cần `npm install`. Chỉ cần Node.js, đã có trên máy tại thời điểm tạo.
Ảnh, font, nhạc, CSS và JavaScript dùng cho bản màu hồng này đều đã lưu trong thư mục. Server không chuyển tiếp sang website mẫu khi thiếu file.

## Màn cuối — không gian lời chúc và ảnh rơi

Sau thư và màn chúc mừng, bấm **Xem điều bất ngờ tiếp theo →**.
Mở riêng bằng **MO-XEM-MAN-CUOI.cmd**, hoặc truy cập **http://127.0.0.1:5180/falling/index.html** khi server đang chạy.

Màn này dựng theo chuyển động và bố cục của https://fallinglove.onrender.com/: quả cầu hạt hồng và dải ngân hà, nhấn giữ một giây để bắt đầu, hạt ghép thành lời chúc rồi bung ra, chuyển sang không gian ảnh, lời chúc phát sáng và trái tim rơi nhiều lớp.

- Kéo để xoay, cuộn chuột để thu phóng, chạm ảnh để xem lớn.
- **Album ảnh** mở toàn bộ ảnh; dùng nút mũi tên hoặc phím ←/→ để chuyển, Esc để đóng.
- **Tạm dừng** dừng chuyển động. Khi mở ảnh lớn, chuyển động tự tạm dừng.
- Nhạc lấy từ `music.loop`. Màn cuối lấy toàn bộ ảnh trong thư mục `album/`, luân phiên trong hiệu ứng rơi và hiển thị đầy đủ trong **Album ảnh**. Thêm ảnh rồi tải lại trang để cập nhật; chạy `npm run build` để cập nhật bản tĩnh. Khi thư mục trống, màn cuối dùng ảnh từ `chapters` trong `gift.json`.
- Sửa chữ ghép hạt ở `falling.intro`, lời chúc rơi ở `falling.wishes` trong `gift.json`.
- Mã màn cuối nằm trong `public/falling/`. Font Mali có giấy phép OFL kèm trong `public/falling/fonts/`.
- Trình duyệt không có WebGL sẽ hiện album ảnh thay thế.

Sau khi cập nhật, tắt cửa sổ chạy server cũ, mở lại launcher rồi nhấn Ctrl+F5. Chạy `npm run build` để xuất lại bản tĩnh.

## Bó hoa chi tiết — cập nhật

Mở **MO-XEM-BO-HOA.cmd** để xem ngay cả bó hoa, hoặc **MO-WEB.cmd** để xem toàn bộ món quà. Bản xem bó hoa dừng ở cảnh hoàn chỉnh; bấm vào trang để sang thư.

Phần bó hoa dùng ảnh chất liệu thực vật có chi tiết cao trên bề mặt cong nhẹ của Three.js. Giữ nguyên ảnh kỷ niệm ở giữa hoa. Hoa trong vườn mở đầu và trang mô hình hoa đơn không nằm trong lần chỉnh này.

| File | Nội dung |
| --- | --- |
| public/botanical/bouquet-atlas.png | Bộ ảnh hoa hồng hồng/kem, lá và nơ được tạo cho dự án; nền trong suốt |
| public/bouquet-materials.js | Ánh xạ ảnh hoa lên mesh cong, viền ảnh kỷ niệm |
| public/botanical/wrap-front.svg | Nếp gấp, vân giấy, bóng lớp giấy phía trước |
| public/botanical/wrap-back.svg | Giấy gói và giấy lót phía sau |
| src/gift-experience.js | Bố cục, thân, lá, nơ, thẻ treo và chuyển cảnh |

Atlas chia 2×2: trên trái hoa hồng, trên phải hoa kem, dưới trái lá, dưới phải nơ. Đây là tài nguyên tạo bằng AI theo phong cách ảnh chụp, không phải ảnh chụp một bó hoa thật. Mô hình bó hoa dùng kỹ thuật ảnh trên bề mặt có độ sâu; không phải mô hình quét 3D toàn bộ từng cánh.

Thư mục **backups/before-bouquet-detail/** lưu hai file code trước lần cập nhật này.

## Hoa Three.js

- Mở món quà: **http://127.0.0.1:5180/** sau khi chạy MO-WEB.cmd.
- Trang mô hình hoa đơn trước đây, riêng với bản bó hoa mới: **http://127.0.0.1:5180/flower-preview.html**.
- Sửa màu, độ nhám, các lớp cánh và ánh sáng ở **public/flower-model.js**.
- Sửa góc nghiêng theo chuột, giới hạn độ phân giải, ánh xạ vị trí ở **public/flowers-3d.js**.
- Hai component gốc **src/gift-experience.js** và **src/growing-garden.js** điều khiển chuyển cảnh và vị trí hoa.
- Three.js **0.166.1** và giấy phép MIT được lưu tại **public/vendor/**. Không cần tải CDN khi mở web.

Hoa ở vườn mở đầu dùng lưới 3D có độ cong, màu chuyển theo cánh, gân bề mặt và bóng đổ. Các ảnh kỷ niệm được vẽ lên mặt giữa hoa và giữ chiều thẳng đứng. Thân và giấy bó trong luồng quà vẫn dùng thiết kế gốc; đây không phải mô hình hoa quét 3D từ ảnh thật.

Renderer dùng một WebGL context chung và giới hạn 30 khung hình/giây, dừng vẽ khi tab ẩn, tôn trọng prefers-reduced-motion. Nếu WebGL không hoạt động, trang hiển thị lại ảnh hoa gốc.

Sau khi chỉnh file, nhấn **Ctrl+F5**. Chạy **npm run build** để cập nhật dist.

## Mở code

Mở **Flower-Garden.code-workspace** bằng VS Code, hoặc chọn File → Open Folder → thư mục này.

| File / thư mục | Sửa gì ở đây |
| --- | --- |
| `gift.json` | Lời chào, tên người nhận, chữ ký, lời chúc, nội dung thư, đường dẫn ảnh và nhạc |
| `public/gift/photos/` | 12 ảnh `p01.jpg` đến `p12.jpg`; thay file cùng tên để đổi ảnh |
| `public/music/` | `intro.m4a` mở đầu, `loop.m4a` nhạc nền |
| `public/growing-garden/pink/` | Hình bông hoa, cánh hoa |
| `public/gift/flowers/` | Hình lá trang trí |
| `custom.css` | CSS riêng để đổi giao diện; hiện để trống |
| `src/page.mjs` | Khung HTML và cách đưa nội dung `gift.json` vào trang |
| `public/bootstrap.js` | Khởi chạy component với nội dung của bạn |
| `src/gift-experience.js` | Code đã format: các màn quà, bó hoa, thư và chuyển cảnh |
| `src/growing-garden.js` | Code đã format của vườn hoa |
| `src/styles.css` | CSS gốc đã format |
| `public/_next/static/chunks/` | Bản build gốc và các thư viện; bản gốc được giữ để tham khảo |
| `server.mjs` | Server cục bộ chỉ lắng nghe tại 127.0.0.1 |

Sau khi sửa `gift.json`, ảnh, CSS, `src/gift-experience.js` hoặc `src/growing-garden.js`, lưu file rồi nhấn Ctrl+R. Sau khi sửa code server/khung trang, tắt và chạy lại server.
JSON phải có dấu ngoặc kép và không có dấu phẩy thừa ở cuối danh sách.

## Âm thanh

Nhạc bắt đầu khi bấm **Chạm để mở quà**: phát `public/music/intro.m4a` một lần rồi lặp `public/music/loop.m4a`. Nút góc trên bên phải dùng để bật/tắt nhạc. Khi mở thư, âm lượng tự giảm.

Phần phát nhạc nằm trong `public/gift-audio.js`, dùng trình phát âm thanh của trình duyệt. Nếu trình duyệt chặn phát, bấm **Bấm để bật nhạc 🎵**. Có thể thay hai file nhạc hoặc sửa đường dẫn `music` trong `gift.json`.

Sau khi cập nhật bản sửa âm thanh, đóng cửa sổ chạy web cũ, mở lại `MO-WEB.cmd` rồi nhấn **Ctrl+F5** trên trang.

## Bản build tĩnh

Chạy `npm run build` để xuất toàn bộ trang vào `dist/`. Khi chỉnh nội dung, chạy lại lệnh để cập nhật bản xuất.
Bản này dùng đường dẫn từ gốc `/`, phù hợp phục vụ qua HTTP ở gốc tên miền. Không mở `dist/index.html` trực tiếp bằng `file://`.

## Mã nguồn lấy được

Đây là **mã JavaScript/CSS công khai đã biên dịch của trang**, cùng một bộ khởi chạy cục bộ và cấu hình dễ sửa. Không phải repository React/Next.js nguyên bản trước khi biên dịch; tên biến trong các file gốc đã được rút gọn. Có thể mở, format và chỉnh các file JavaScript đó bằng VS Code.

Không có backend hay tài khoản quản trị của website gốc. `gift.json` và `custom.css` là các chỗ thuận tiện nhất để bắt đầu custom. Các bảng màu khác còn được nhắc trong code gốc nhưng chỉ tài nguyên của bảng màu hồng hiện tại được tải về.

Nguồn mẫu và tài nguyên: **lovegift.online**. Các file thư viện giữ nguyên thông tin bản quyền có sẵn trong build. `tools/download-assets.mjs` chỉ dùng để khôi phục file bị thiếu, không cần chạy để sử dụng bản hiện tại.
