# Kế hoạch Nội dung Đa phương tiện (Media Plan) - VKU 360 Quest

Dựa trên cấu trúc toàn bộ dự án `best-web-design` và dữ liệu lộ trình (`route.js`), hiện tại dự án đang tái sử dụng 3 ảnh 360 mẫu từ Pannellum cho toàn bộ 17 chặng. Để biến ứng dụng thành một sản phẩm thực tế, cao cấp và mang lại trải nghiệm "Wow", dưới đây là **Kế hoạch quy hoạch toàn diện về Ảnh tĩnh, Ảnh 360 và Video** cần được bổ sung.

---

## 1. Hệ thống Ảnh 360 (Nòng cốt của ứng dụng)

Đây là các bức ảnh Equirectangular (tỷ lệ 2:1) làm nền chính cho ứng dụng.
*Yêu cầu:* Độ phân giải tối thiểu `4096x2048`, xuất định dạng `.jpg` hoặc `.webp`, nên chụp vào ngày nắng đẹp, ít người (hoặc người đang hoạt động tự nhiên) để dễ dàng gắn hotspot.

### Lộ trình Khu V
- [ ] **`v-cong-chinh.jpg`**: Đứng giữa cổng chính nhìn vào trong, thấy rõ biển hiệu trường và trục đường đi thẳng vào các giảng đường.
- [ ] **`v-va.jpg`**: Đứng ở hành lang chính hoặc sân trước Giảng đường A Khu V. Cần thấy rõ bảng tên nhà.
- [ ] **`v-vb.jpg`**: Đứng giữa sân nhìn bao quát được khối Giảng đường B Khu V.
- [ ] **`v-bai-do-xe.jpg`**: Khu vực bãi đỗ xe, lấy góc thoáng để thấy được luồng đi bộ vào các tòa nhà.

### Lộ trình Khu K (Khu phức hợp lớn)
- [ ] **`k-hanh-chinh.jpg`**: Sảnh chính của Trung tâm Hành chính. Có thể chụp ngay trước cửa hoặc bên trong sảnh để sinh viên thấy được các quầy dịch vụ.
- [ ] **`k-hoi-truong.jpg`**: *Nên chụp bên trong* hội trường để thấy được sức chứa và độ hoành tráng, hoặc ngay quảng trường nhỏ phía trước.
- [ ] **`k-thu-vien.jpg`**: Khu vực sảnh chính hoặc không gian tự học mở của Viện eSTI / Thư viện.
- [ ] **`k-f.jpg`**: Trước tòa nhà Trung tâm Sinh viên (F), không gian sinh hoạt năng động.
- [ ] **`k-d1-d2.jpg`**: Trục đường giữa D1 và D2, bao quát được các bảng tên khoa.
- [ ] **`k-e.jpg`**: Khu E, nơi tập trung giảng đường và văn phòng.
- [ ] **`k-a.jpg`**, **`k-b.jpg`**, **`k-c.jpg`**: 3 ảnh 360 cho Cụm giảng đường A-B-C. Nên chụp dọc theo hành lang lớn nối giữa các tòa để định hình trục giao thông.
- [ ] **`k-dai-phun-nuoc.jpg`**: Đứng chính giữa đài phun nước, đây là mốc thị giác quan trọng (Central Hub) kết nối các ngả đường.
- [ ] **`k-the-thao.jpg`**: Bao quát khu vực nhà thi đấu hoặc sân bóng rổ/bóng chuyền.
- [ ] **`k-san-bong.jpg`**: Đứng giữa sân bóng đá / đường chạy điền kinh, tạo cảm giác rộng mở.
- [ ] **`k-ktx.jpg`**: Khuôn viên Ký túc xá, thấy rõ lối vào và các khối nhà.

---

## 2. Ảnh tĩnh (Static Images) & Ảnh minh họa chi tiết

Vì không phải góc nào cũng có thể hiện trên ảnh 360, khung Nhiệm vụ (`story-panel`) bên phải nên có một `<div class="story-gallery">` để hiển thị ảnh chi tiết cho từng chặng.

### Nhu cầu Ảnh tĩnh:
- **Ảnh thay thế (Fallback):** Hình nền mờ khi mạng yếu hoặc ảnh 360 đang tải.
- **Ảnh chi tiết (In-panel):** 
  - *Thư viện:* Ảnh góc đọc sách yên tĩnh, dàn máy tính, quầy mượn sách.
  - *Ký túc xá:* Ảnh phòng ngủ mẫu, căng tin, khu tự học.
  - *Hành chính:* Ảnh chụp màn hình hướng dẫn lấy số thứ tự hoặc giấy tờ mẫu.
  - *Sân bóng:* Khoảnh khắc một trận đấu sinh viên đang diễn ra.
- **Map & Radar:**
  - File `image_web/fullmap_khuV.jpg` và `image_web/fullmap_khuK.jpg` hiện tại cần đảm bảo chất lượng, có thể redraw sang dạng Vector/SVG hoặc 3D isometric để nhìn cao cấp hơn.
- **Easter Eggs:** Các icon hoặc badge nhỏ `.png` (như huy hiệu cúp, mảnh ghép) khi click vào hotspot bí mật.

---

## 3. Video ngắn (Short Videos) & Ảnh động (GIFs)

Để phá vỡ sự tĩnh lặng của giao diện, một số chặng nên được chèn video ngắn (chạy lặp loop, không tiếng, dạng B-roll 5-10s) ngay trong `story-panel`.

### Các video B-roll đề xuất:
- [x] **Video `khoi-dong.mp4`:** Đặt ở màn hình Đăng nhập (Lưu trữ trên Google Drive do file nặng ~800MB). Một đoạn flycam (fly-through) ngắn quét qua đỉnh các tòa nhà VKU lúc bình minh.
- [ ] **Video `sinh-hoat-F.mp4`:** Cảnh sinh viên đang nhảy múa hoặc sinh hoạt CLB (Sử dụng tại chặng *Trung tâm Sinh viên F*).
- [ ] **Video `hoc-tap.mp4`:** Cảnh gõ phím, lật sách, thảo luận nhóm (Sử dụng tại chặng *Giảng đường* hoặc *Thư viện*).
- [ ] **Video `the-thao.mp4`:** Một cú sút bóng lọt lưới hoặc một pha lên rổ (Sử dụng tại *Sân bóng*).

---

## 4. Kế hoạch Âm thanh (Audio Assets)

Bạn đã có chức năng bật/tắt Âm thanh môi trường, đây là danh sách file MP3 cần thu thập:
- [ ] **`ambient_gate.mp3`**: Tiếng xe cộ chạy từ xa, tiếng gió, tiếng sinh viên bước qua cổng.
- [ ] **`ambient_class.mp3`**: Tiếng lật sách, giảng bài vọng ra từ hành lang.
- [ ] **`ambient_library.mp3`**: Không gian cực kỳ yên tĩnh, tiếng điều hòa, tiếng lạch cạch gõ phím nhỏ.
- [ ] **`ambient_sports.mp3`**: Tiếng reo hò, tiếng bóng đập sàn, tiếng còi trọng tài.
- [ ] **`sfx_ui.mp3`**: Các file âm thanh cực ngắn: `ting.mp3` (khi mở khóa chặng mới), `click.mp3` (khi chọn đáp án/nhân vật), `camera.mp3` (khi người dùng sử dụng chức năng Đăng Khoảnh khắc).

---

## 5. Tổ chức Thư mục Đề xuất (Folder Structure)

Để code không bị lộn xộn khi import quá nhiều media, hãy tạo cấu trúc sau trong dự án:

```text
/best-web-design
│
├── /assets
│   ├── /panoramas         <-- Toàn bộ 17 ảnh 360 (ví dụ: v-cong.webp, k-ktx.webp)
│   ├── /images
│   │   ├── /maps          <-- Các bản đồ minimap
│   │   ├── /details       <-- Ảnh tĩnh cho story-panel
│   │   └── /ui            <-- Icon phụ, huy hiệu, logo
│   ├── /videos            <-- Các file mp4/webm b-roll ngắn (5MB max)
│   └── /audio             <-- File mp3 môi trường và SFX
│
└── /data
    └── route.js           <-- Cập nhật đường dẫn tới các file ở thư mục /assets
```

---

## 6. Hướng dẫn Tối ưu hóa trước khi Tích hợp
1. **Nén Ảnh 360:** Một ảnh 360 gốc có thể nặng 15MB. Bắt buộc phải đưa qua công cụ nén (như *Squoosh* hoặc lưu dưới dạng `.webp`) để giảm xuống dưới `3-4MB`/ảnh. Việc này quyết định tốc độ load trang.
2. **Nén Video:** Sử dụng video chuẩn `WebM` hoặc nén `MP4 H.264` băng thông thấp, bỏ hoàn toàn kênh Audio của video (vì ta đã có hệ thống âm thanh môi trường tách biệt).
3. **Lazy Loading:** Trong JS, chỉ load ảnh 360 của chặng hiện tại và tải ngầm (preload) chặng `n+1`. Các ảnh chi tiết trong `story-panel` nên dùng thẻ `<img loading="lazy">`.
