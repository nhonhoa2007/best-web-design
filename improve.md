# Đề xuất cải tiến UX/UI và chức năng

## Tổng quan hiện trạng

Project hiện là web tĩnh cho trải nghiệm "VKU 360 Quest": người dùng đăng nhập bằng Firebase Auth, chọn avatar, đi qua 17 chặng trong Khu V và Khu K, xem panorama 360 bằng Pannellum, theo dõi tiến độ, mở khóa các điểm trên danh sách lộ trình và bản đồ nhỏ.

Điểm mạnh hiện có:

- Ý tưởng gamified campus tour rõ ràng, phù hợp với tân sinh viên và khách tham quan.
- Bố cục desktop có đủ các vùng chính: topbar, lộ trình, nội dung chặng, bản đồ.
- Có lưu tiến độ, avatar, tên nhân vật và trạng thái mở khóa.
- Có bản đồ nhỏ dạng overlay trên mobile, giúp không chiếm quá nhiều diện tích màn hình nhỏ.

Những vấn đề cần ưu tiên:

- Ảnh 360 đang dùng ảnh demo từ bên ngoài, chưa phản ánh đúng VKU.
- Tiến độ đang lưu bằng `localStorage`, chưa gắn với từng tài khoản Firebase.
- Nội dung tiếng Việt/copy cần được chuẩn hóa lại để tránh lỗi mã hóa và tăng tính thực dụng.
- Đăng nhập/đăng ký còn thiếu trạng thái loading, quên mật khẩu, thông báo lỗi thân thiện.
- Dữ liệu lộ trình đang nằm trực tiếp trong `script.js`, khó bảo trì khi nội dung tăng.

## Ưu tiên 1: Cải thiện nền tảng trải nghiệm

### 1. Thay ảnh 360 demo bằng media thật của VKU

Hiện `PANORAMAS` đang trỏ tới ảnh mẫu của Pannellum. Đây là điểm làm trải nghiệm mất độ tin cậy nhất.

Nên làm:

- Chụp/thu thập ảnh 360 thật cho từng điểm quan trọng, ít nhất 5-7 điểm đầu tiên.
- Nếu chưa có đủ ảnh 360, dùng ảnh thật dạng full-width/spotlight cho từng địa điểm thay vì lặp lại ảnh demo.
- Thêm màn hình loading riêng khi panorama đang tải, có tên địa điểm và tiến độ tải ảnh.
- Thêm fallback khi lỗi mạng: hiển thị bản đồ + nội dung chặng, không để nền trống hoặc dùng ảnh sai địa điểm.

### 2. Sửa và chuẩn hóa tiếng Việt

Trong file hiện có có dấu hiệu nội dung bị lỗi mã hóa khi đọc qua terminal. Cần mở trên trình duyệt và kiểm tra thực tế.

Nên làm:

- Đảm bảo tất cả file lưu UTF-8.
- Chuẩn hóa lại toàn bộ text: tiêu đề, placeholder, toast, mission, notes.
- Giảm các câu "nên/cần bổ sung" trong nội dung tour vì đó là ghi chú nội bộ, không phải nội dung cho người dùng cuối.
- Viết lại copy theo hướng hướng dẫn trực tiếp: "Từ đây, bạn có thể đi đến...", "Đây là nơi sinh viên thường...", "Mẹo tìm phòng...".

### 3. Làm trạng thái đăng nhập rõ ràng hơn

Form auth hiện dùng chung đăng nhập/đăng ký, nhưng thiếu các trạng thái quan trọng.

Nên làm:

- Thêm loading state cho nút submit để tránh bấm lặp.
- Dịch lỗi Firebase sang tiếng Việt để người dùng hiểu được: email sai, mật khẩu yếu, tài khoản đã tồn tại.
- Thêm "Quên mật khẩu".
- Thêm tùy chọn "Tiếp tục không đăng nhập" nếu mục tiêu là cho khách tham quan trải nghiệm nhanh.
- Sau khi đăng nhập thành công, nếu có tiến độ cũ thì đưa ra lựa chọn "Tiếp tục" hoặc "Bắt đầu lại" rõ ràng hơn.

### 4. Lưu tiến độ theo tài khoản

Firebase hiện chỉ dùng Auth, còn tiến độ lưu `localStorage`. Nếu người dùng đổi máy/trình duyệt thì mất tiến độ.

Nên làm:

- Thêm Firestore collection theo `uid` để lưu avatar, customName, currentStep, unlockedStep, updatedAt.
- Đồng bộ `localStorage` như cache offline, nhưng ưu tiên dữ liệu mới nhất trên cloud khi đăng nhập.
- Khi logout không nên xóa tiến độ local nếu chưa đồng bộ, nhưng cần tách tiến độ theo user.

## Ưu tiên 2: Cải thiện UX/UI

### 1. Tăng khả năng định hướng trong tour

Người dùng cần biết mình đang ở đâu, vừa đi qua đâu và tiếp theo là gì.

Nên làm:

- Thêm breadcrumb ngắn: `Khu K / Chặng 7 / Thư viện`.
- Hiển thị "Điểm tiếp theo" trong story panel trước nút đi tiếp.
- Trên minimap, vẽ đường nối giữa các điểm đã mở khóa để người dùng thấy lộ trình.
- Cho phép hover/focus route step để highlight dot tương ứng trên bản đồ.
- Thêm nút "Xem tổng quan" để mở bản đồ lớn cả 2 khu sau khi hoàn thành.

### 2. Cải thiện bố cục mobile

Mobile hiện có overlay bản đồ, nhưng story, route list và nút điều hướng có thể bị dài.

Nên làm:

- Biến route list thành bottom sheet/collapsible section trên mobile.
- Giữ sticky action bar gọn hơn: `Quay lại`, `Đi tiếp`, `Bản đồ`.
- Giảm độ cao avatar cards và rút ngắn copy trong màn hình chọn avatar trên mobile.
- Đảm bảo `tour-app` scroll mượt, không bị xung đột với gesture của Pannellum.
- Thêm safe-area padding cho iPhone có notch/home indicator.

### 3. Tạo hệ thống trạng thái rõ ràng

Nên phân biệt 4 trạng thái của mỗi điểm: khóa, có thể mở, đang xem, đã hoàn thành.

Nên làm:

- Đổi màu/icon riêng cho "có thể mở" thay vì chỉ khóa/đã xem.
- Nút `Đi tiếp` nên đổi text theo ngữ cảnh: `Mở khóa chặng tiếp theo`, `Sang Khu K`, `Hoàn thành tour`.
- Khi sang từ Khu V sang Khu K, thêm transition screen ngắn để tạo cảm giác đạt milestone.
- Sau mỗi chặng, hiển thị toast hoặc micro-feedback về điểm/phần thưởng một cách nhất quán.

### 4. Tăng tính truy cập và khả dụng

Nên làm:

- Thêm focus ring rõ ràng cho tất cả button, map dot, route step.
- Thêm `aria-current` cho route step hiện tại.
- Thêm `aria-expanded` cho nút mở bản đồ mobile.
- Dùng `aria-live` riêng cho toast, tránh đọc lại cả main app.
- Kiểm tra contrast của text muted trên nền glass, nhất là trên ảnh 360 sáng.
- Thêm phím tắt cơ bản: mũi tên trái/phải để lùi/tiến, `M` mở bản đồ.

## Ưu tiên 3: Mở rộng chức năng

### 1. Sổ tay khám phá

Biến mission thành hành động thật thay vì chỉ đọc.

Nên làm:

- Mỗi chặng có câu hỏi ngắn hoặc checkbox nhiệm vụ.
- Lưu câu trả lời/ghi chú của người dùng.
- Cuối tour xuất "Sổ tay VKU của bạn" gồm các điểm đã đi, ghi chú và mẹo đã học.

### 2. Tìm kiếm và lọc địa điểm

Sau khi mở khóa nhiều điểm, người dùng cần quay lại nhanh.

Nên làm:

- Thêm search trong route list.
- Lọc theo loại: học tập, hành chính, thư viện, thể thao, ký túc xá.
- Cho phép đánh dấu yêu thích một địa điểm.

### 3. Nội dung theo đối tượng

Một tour có thể phục vụ nhiều nhóm người dùng.

Nên làm:

- Cho chọn mục tiêu lúc bắt đầu: tân sinh viên, phụ huynh, khách tham quan, sinh viên cần tìm phòng.
- Nội dung mission/notes thay đổi theo mục tiêu.
- Thêm "tour nhanh 5 phút" và "tour đầy đủ".

### 4. Thành tích và kết thúc tour

Màn hình chúc mừng hiện có, nhưng có thể gia tăng giá trị sau khi hoàn thành.

Nên làm:

- Hiển thị tổng thời gian, số điểm đã xem, khu đã hoàn thành.
- Tạo huy hiệu theo khu: `Đã khám phá Khu V`, `Đã khám phá Khu K`.
- Cho chia sẻ kết quả bằng ảnh/card.
- Thêm CTA sau tour: xem lại bản đồ, tải hướng dẫn tân sinh viên, liên hệ phòng ban.

## Ưu tiên 4: Cải thiện kỹ thuật để dễ bảo trì

### 1. Tách dữ liệu tour ra file riêng

`route` hiện nằm trực tiếp trong `script.js`, làm file JS dài và khó sửa nội dung.

Nên làm:

- Tạo `data/route.js` hoặc `data/route.json`.
- Tạo schema rõ ràng cho scene: id, zone, title, media, mapCoords, body, notes, mission, tags.
- Tạo validate nhỏ khi load để phát hiện thiếu mapCoords/media/title.

### 2. Giảm lặp listener và quản lý state gọn hơn

Một số hàm render có thể bị gọi nhiều lần và gắn listener lại.

Nên làm:

- Gắn event listener một lần trong `bindControls`.
- Dùng event delegation cho avatar cards, route list và map dots.
- Tách state update và render thành các hàm rõ: `setCurrentStep`, `setActiveZone`, `saveProgress`.

### 3. Bảo mật và cấu hình

Firebase apiKey trên frontend không phải bí mật tuyệt đối, nhưng cần đi kèm rules đúng.

Nên làm:

- Đưa Firebase config sang file cấu hình riêng hoặc biến build nếu chuyển sang bundler.
- Kiểm tra Firebase Auth domains và Firestore rules.
- Nếu dùng Firestore, chỉ cho user đọc/ghi document của chính `uid`.

### 4. Kiểm thử cơ bản

Nên làm:

- Thêm checklist test thủ công: đăng ký, đăng nhập, bắt đầu tour, resume, restart, logout, mobile map, hoàn thành tour.
- Nếu chuyển sang build tool, thêm Playwright smoke test cho các flow chính.
- Test responsive ở 375px, 768px, 1366px.

## Lộ trình đề xuất

### Giai đoạn 1: Làm trải nghiệm đáng tin

- Sửa tiếng Việt/copy.
- Thay ảnh demo bằng ảnh thật hoặc fallback đúng địa điểm.
- Thêm loading/error state cho panorama và auth.
- Sửa lưu tiến độ theo user hoặc ít nhất tách `localStorage` theo email/uid.

### Giai đoạn 2: Làm tour dễ dùng hơn

- Cải thiện minimap, route highlight, breadcrumb.
- Tối ưu mobile layout.
- Thêm trạng thái milestone khi chuyển khu.
- Chuẩn hóa icon/màu cho từng trạng thái điểm.

### Giai đoạn 3: Tăng giá trị sản phẩm

- Thêm sổ tay khám phá và mission tương tác.
- Thêm search/filter địa điểm.
- Thêm tour nhanh/tour theo đối tượng.
- Nâng cấp màn hình hoàn thành thành kết quả có thể chia sẻ.

## Ý tưởng chức năng bổ sung

### 1. Chế độ tour theo mục tiêu

Cho người dùng chọn mục tiêu trước khi bắt đầu để nội dung tour phù hợp hơn.

- `Tân sinh viên`: tập trung tìm phòng học, thư viện, hành chính, ký túc xá.
- `Phụ huynh`: tập trung cơ sở vật chất, môi trường học tập, khu sinh hoạt.
- `Khách tham quan`: tập trung giới thiệu tổng quan, điểm nổi bật, câu chuyện về trường.
- `Sinh viên đang tìm đường`: tập trung chỉ đường nhanh, bản đồ, mốc nhận diện.

### 2. Tour nhanh và tour đầy đủ

Không phải người dùng nào cũng muốn đi hết 17 chặng.

- Tour nhanh 5 phút: chỉ đi qua các điểm quan trọng nhất.
- Tour đầy đủ: giữ trải nghiệm mở khóa từng chặng như hiện tại.
- Tour tự chọn: người dùng chọn trước các địa điểm muốn xem.
- Gợi ý tuyến đường dựa trên thời gian người dùng có: 5 phút, 10 phút, 20 phút.

### 3. Sổ tay khám phá cá nhân

Biến tour từ trải nghiệm xem thành trải nghiệm có lưu lại kết quả.

- Mỗi địa điểm có một nhiệm vụ nhỏ hoặc câu hỏi nhanh.
- Người dùng có thể ghi chú riêng cho từng địa điểm.
- Cuối tour tạo trang tổng kết: các điểm đã đi, ghi chú, mẹo quan trọng.
- Cho phép tải/xem lại sổ tay sau khi đăng nhập.

### 4. Tìm kiếm địa điểm

Giúp người dùng quay lại nhanh khi đã mở nhiều chặng.

- Ô tìm kiếm theo tên địa điểm: thư viện, ký túc xá, giảng đường A.
- Gợi ý kết quả khi đang gõ.
- Lọc theo nhóm: học tập, hành chính, sinh hoạt, thể thao, ký túc xá.
- Khi chọn kết quả, tự mở đúng khu trên bản đồ và highlight vị trí.

### 5. Chỉ đường trong khuôn viên

Tăng tính thực dụng cho sinh viên mới.

- Hiển thị "Từ đây đi đâu tiếp?" ở mỗi địa điểm.
- Gợi ý đường đến điểm kế tiếp bằng các mốc dễ nhớ.
- Cho phép chọn điểm bắt đầu và điểm đến trong danh sách địa điểm đã có.
- Nếu chưa làm được định tuyến thật, có thể dùng hướng dẫn dạng text: "Từ cổng chính đi thẳng, rẽ phải tại...".

### 6. Bản đồ tương tác nâng cao

Minimap hiện mới hiển thị dot. Có thể nâng cấp thành công cụ định hướng chính.

- Vẽ đường nối giữa các điểm đã mở khóa.
- Click vào dot để xem preview nhanh: tên, ảnh nhỏ, mô tả ngắn, nút đi tới.
- Cho phép phóng to/thu nhỏ bản đồ.
- Có chế độ xem toàn khu sau khi hoàn thành tour.

### 7. Hệ thống nhiệm vụ và điểm thưởng

Làm rõ yếu tố game trong "Quest".

- Mỗi chặng có điểm thưởng riêng.
- Có nhiệm vụ đơn giản: đọc thông tin, trả lời câu hỏi, tìm mốc trên bản đồ.
- Có huy hiệu khi hoàn thành từng khu.
- Có thanh tiến độ theo khu và tổng tiến độ toàn tour.

### 8. Checklist cho tân sinh viên

Đây là chức năng có giá trị thực tế cao.

- Checklist "Ngày đầu đến trường": tìm phòng học, biết thư viện, biết phòng hành chính, biết khu gửi xe.
- Checklist "Trước khi nhập học": giấy tờ, tài khoản, lịch học, ký túc xá.
- Mỗi checklist có thể liên kết với một địa điểm trong tour.
- Lưu trạng thái hoàn thành theo tài khoản.

### 9. Nội dung đa phương tiện cho từng điểm

Mỗi địa điểm nên có nhiều lớp nội dung, không chỉ đoạn mô tả.

- Ảnh thật của địa điểm.
- Video ngắn 10-20 giây.
- Audio giới thiệu nếu muốn tạo cảm giác tour guide.
- Link ngoài: website khoa/phòng ban, biểu mẫu, fanpage, tài liệu hướng dẫn.

### 10. Chế độ quản trị nội dung

Nếu tour cần cập nhật thường xuyên, nên có cách sửa nội dung không cần sửa code.

- Admin đăng nhập và chỉnh sửa tên địa điểm, mô tả, ghi chú, tọa độ bản đồ.
- Upload/thay ảnh địa điểm.
- Bật/tắt địa điểm trong tour.
- Sắp xếp lại thứ tự chặng.
- Xem trước nội dung trước khi xuất bản.

### 11. Đồng bộ tiến độ nhiều thiết bị

Khi đã có Firebase Auth, nên dùng tài khoản để lưu trải nghiệm dài hạn.

- Lưu tiến độ tour trên Firestore theo `uid`.
- Khi đổi máy, người dùng vẫn tiếp tục được tour cũ.
- Có lịch sử lần xem gần nhất.
- Có nút "Xóa tiến độ" hoặc "Bắt đầu lại" rõ ràng.

### 12. Chia sẻ kết quả sau tour

Tạo động lực hoàn thành và giúp sản phẩm dễ lan truyền.

- Tạo thẻ kết quả sau tour: tên người dùng, avatar, số điểm đã khám phá, huy hiệu.
- Cho phép tải ảnh kết quả.
- Cho phép copy link chia sẻ.
- Nếu dùng cho sự kiện tuyển sinh, có thể thêm QR/link dẫn đến trang thông tin tuyển sinh.

### 13. Đăng khoảnh khắc tại địa điểm

Cho người dùng đăng một khoảnh khắc cá nhân khi đang ở một vị trí trong tour, giống nhật ký/album trải nghiệm theo bản đồ.

Luồng người dùng đề xuất:

- Khi đang xem một địa điểm, có nút `Đăng khoảnh khắc`.
- Người dùng có thể thêm ảnh, caption ngắn, cảm xúc và gắn địa điểm hiện tại.
- Bài đăng được hiển thị trong tab `Khoảnh khắc` của địa điểm đó.
- Trên bản đồ, địa điểm nào có khoảnh khắc sẽ có badge nhỏ hoặc icon ảnh.
- Người dùng có thể xem lại toàn bộ khoảnh khắc của mình trong trang cá nhân.

Chức năng nên có:

- Đăng ảnh kèm mô tả ngắn.
- Gắn tự động với `sceneId`, tên khu, tên địa điểm và thời gian đăng.
- Cho phép chọn quyền riêng tư: chỉ mình tôi, bạn bè/lớp, công khai trong tour.
- Cho phép sửa/xóa khoảnh khắc của chính mình.
- Cho phép thả cảm xúc hoặc lưu khoảnh khắc yêu thích nếu bật chế độ cộng đồng.
- Có bộ lọc theo địa điểm, khu, thời gian hoặc người đăng.

Giá trị UX:

- Làm tour có cảm giác sống động hơn vì mỗi địa điểm có dấu ấn thật từ người dùng.
- Tạo động lực quay lại địa điểm đã đi.
- Phù hợp cho tân sinh viên lưu lại ngày đầu đến trường.
- Có thể dùng trong sự kiện tuyển sinh, tham quan campus hoặc hoạt động check-in.

Gợi ý kỹ thuật:

- Lưu metadata bài đăng trong Firestore: `uid`, `sceneId`, `zone`, `caption`, `imageUrl`, `visibility`, `createdAt`.
- Lưu ảnh trong Firebase Storage, giới hạn dung lượng và định dạng ảnh.
- Nếu bài đăng công khai, cần có cơ chế báo cáo nội dung xấu và ẩn bài.
- Nên nén ảnh trước khi upload để giảm dung lượng.
- Nếu muốn xác thực người dùng thật sự đang ở địa điểm đó, có thể thêm check GPS hoặc QR code tại địa điểm, nhưng nên để đây là bước nâng cao.
