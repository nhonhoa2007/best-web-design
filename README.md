# VKU 360 Quest

VKU 360 Quest là website trải nghiệm tham quan khuôn viên VKU theo dạng 360 tour, nhiệm vụ tương tác và gamification. Dự án dùng frontend static bằng HTML/CSS/JavaScript kết hợp Firebase để có backend gọn nhẹ, phù hợp cho demo, thuyết trình và mở rộng dần sau này.

## Tính năng chính

- Tham quan khu V và khu K bằng ảnh panorama 360.
- Hệ thống nhiệm vụ theo từng chặng trong hành trình.
- Đăng ký, đăng nhập và đồng bộ tiến trình bằng Firebase Auth/Firestore.
- Hồ sơ người dùng, avatar, nickname và thành tích.
- Đăng khoảnh khắc, ảnh sự kiện và tương tác cộng đồng.
- Chat guide dùng Cloud Functions để gọi Gemini API an toàn từ backend.
- Hỗ trợ giao diện sáng/tối và đa ngôn ngữ.

## Kiến trúc

Kiến trúc hiện tại:

```text
Frontend static HTML/CSS/JS
  -> Firebase Auth
  -> Firestore / Storage
  -> Cloud Functions
  -> Gemini API
```

- Firebase Auth xử lý đăng ký, đăng nhập và danh tính người dùng.
- Firestore lưu tiến trình tour, moments, reactions, notifications, achievements và dữ liệu sự kiện.
- Firebase Storage lưu ảnh avatar, ảnh moment và ảnh sự kiện.
- Cloud Functions chứa các logic nhạy cảm, đặc biệt là function `chatGuide` gọi Gemini bằng Firebase Secret `GEMINI_API_KEY`.
- Firestore Rules và Storage Rules giới hạn quyền đọc/ghi để người dùng không sửa dữ liệu của người khác.

Dự án chưa dùng Express, NestJS, React hay Vite ở giai đoạn này để giữ quá trình phát triển và deploy đơn giản. Nếu sau này cần admin dashboard, cron job, payment hoặc nghiệp vụ phức tạp hơn, có thể mở rộng bằng Cloud Functions trước khi tách backend riêng.

## Cấu trúc thư mục

```text
best-web-design/
├─ index.html              # Entry HTML chính
├─ pages/                  # HTML partials cho từng màn hình
├─ css/
│  ├─ main.css             # File gom CSS theo thứ tự cascade
│  ├─ animations.css       # Animation dùng chung
│  └─ features/            # CSS chia theo từng nhóm tính năng
├─ js/
│  ├─ app/                 # Entry point, state, i18n
│  ├─ features/            # Logic từng tính năng: tour, profile, events...
│  ├─ firebase/            # Khởi tạo Firebase SDK và export API dùng chung
│  ├─ ui/                  # Helper giao diện dùng chung
│  ├─ utils/               # Tiện ích xử lý ảnh, dữ liệu phụ trợ
│  └─ vendor/              # Wrapper hoặc thư viện vendor cục bộ
├─ data/                   # Dữ liệu tĩnh: route, avatars
├─ assets/                 # Ảnh, panorama, map, pet sprite
├─ firebase/               # Firestore Rules và Storage Rules
├─ functions/              # Cloud Functions backend mỏng
├─ scripts/                # Script hỗ trợ xử lý dữ liệu/tài nguyên
└─ docs/                   # Tài liệu giải thích, kế hoạch, slide demo
```

Quy ước chính:

- Code dùng chung nằm trong `js/app`.
- Kết nối Firebase nằm trong `js/firebase`.
- Mỗi tính năng người dùng nên nằm trong `js/features`.
- CSS mới nên đặt vào `css/features` và import qua `css/main.css`.
- Dữ liệu tĩnh dùng nhiều nơi nên đặt trong `data`.
- Ảnh gốc dung lượng lớn nên tối ưu trước khi đưa vào `assets`.

## Chạy local

Cài dependency:

```bash
npm install
cd functions
npm install
cd ..
```

Chạy frontend static:

```bash
npm run dev
```

Mặc định script này dùng `serve` để mở thư mục hiện tại như một website static.

## Firebase

Các file cấu hình chính:

- `firebase.json`: cấu hình Firestore Rules, Storage Rules và Cloud Functions.
- `firebase/firestore.rules`: rule bảo vệ dữ liệu Firestore.
- `firebase/storage.rules`: rule bảo vệ file upload.
- `functions/index.js`: Cloud Functions, trong đó có `chatGuide`.

Deploy rules:

```bash
firebase deploy --only firestore:rules,storage
```

Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

Cloud Functions đang cấu hình Node.js 22 trong `functions/package.json`.

## Gemini API

Function `chatGuide` dùng Firebase Secret để đọc API key, tránh để key nhạy cảm ở frontend.

Thiết lập secret:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

Sau khi thiết lập hoặc đổi secret, deploy lại functions:

```bash
firebase deploy --only functions
```

## Ghi chú phát triển

- `index.html` tải các partial trong `pages/`, sau đó `js/app/main.js` khởi tạo ứng dụng.
- Firebase SDK hiện được import trực tiếp từ CDN trong `js/firebase/index.js`.
- `css/main.css` chỉ gom các file CSS theo thứ tự, cần giữ đúng thứ tự import để tránh lỗi cascade.
- Dữ liệu hành trình nằm trong `data/route.js`.
- Dữ liệu avatar nằm trong `data/avatars.js`.
- Các file panorama có thể rất nặng, nên ưu tiên dùng bản `.webp` đã tối ưu.

## Kiểm thử

Dự án hiện chưa có bộ test tự động đầy đủ. Trước khi deploy nên kiểm tra thủ công các luồng chính:

- Đăng ký, đăng nhập, đăng xuất.
- Tiếp tục tour và lưu tiến trình.
- Mở bản đồ, chuyển chặng và hoàn thành nhiệm vụ.
- Cập nhật hồ sơ, avatar, nickname.
- Upload ảnh moment/sự kiện.
- Gọi chat guide khi đã đăng nhập.
- Kiểm tra giao diện trên mobile và desktop.

## Deploy frontend

Frontend có thể deploy như website static trên Vercel, Firebase Hosting hoặc hosting tĩnh khác.

Nếu dùng Firebase Hosting, cần bổ sung cấu hình `hosting` trong `firebase.json`. Nếu dùng Vercel, giữ frontend static như hiện tại là đủ.
