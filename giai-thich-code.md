# GIẢI THÍCH TOÀN BỘ CODE - VKU 360 QUEST

Tài liệu này giải thích toàn bộ source code của dự án **VKU 360 Quest** một cách dễ hiểu nhất cho người mới bắt đầu lập trình web.

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Luồng chạy của ứng dụng](#3-luồng-chạy-của-ứng-dụng)
4. [index.html - Trang chính](#4-indexhtml---trang-chính)
5. [js/app/main.js - Điểm khởi đầu](#5-jsappmainjs---điểm-khởi-đầu)
6. [js/app/state.js - Quản lý trạng thái](#6-jsappstatejs---quản-lý-trạng-thái)
7. [js/app/i18n.js - Đa ngôn ngữ](#7-jsappi18njs---đa-ngôn-ngữ)
8. [js/firebase/index.js - Kết nối Firebase](#8-jsfirebaseindexjs---kết-nối-firebase)
9. [js/features/tour.js - Tour 360](#9-jsfeatourestourjs---tour-360)
10. [js/features/chat-guide.js - Chatbot AI](#10-jsfeatureschat-guidejs---chatbot-ai)
11. [js/features/auth.js - Đăng nhập/Đăng ký](#11-jsfeaturesauthjs---đăng-nhậpđăng-ký)
12. [js/features/home.js - Trang chủ](#12-jsfeatureshomejs---trang-chủ)
13. [js/features/events.js - Diễn đàn](#13-jsfeatureseventsjs---diễn-đàn)
14. [js/features/moments.js - Khoảnh khắc](#14-jsfeaturesmomentsjs---khoảnh-khắc)
15. [js/features/profile.js - Hồ sơ](#15-jsfeaturesprofilejs---hồ-sơ)
16. [js/features/map.js - Bản đồ](#16-jsfeaturesmapjs---bản-đồ)
17. [js/features/nickname.js - Đặt bí danh](#17-jsfeaturesnicknamejs---đặt-bí-danh)
18. [js/features/theme.js - Chủ đề sáng/tối](#18-jsfeaturesthemejs---chủ-đề-sángtối)
19. [js/ui/ - Giao diện dùng chung](#19-jsui---giao-diện-dùng-chung)
20. [js/utils/ - Tiện ích](#20-jsutils---tiện-ích)
21. [js/services/ - Dịch vụ](#21-jsservices---dịch-vụ)
22. [functions/index.js - Cloud Functions (Backend)](#22-functionsindexjs---cloud-functions-backend)
23. [CSS - Hệ thống giao diện](#23-css---hệ-thống-giao-diện)
24. [Công nghệ sử dụng](#24-công-nghệ-sử-dụng)
25. [Giải thích async/await cho người mới](#25-giải-thích-asyncawait-cho-người-mới)

---

## 1. Tổng quan dự án

**VKU 360 Quest** là website cho phép sinh viên tham quan khuôn viên trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU) thông qua ảnh panorama 360 độ.

**Tính năng chính:**
- Tham quan ảo bằng ảnh 360 độ (Khu V và Khu K)
- Hệ thống nhiệm vụ (quest) theo từng chặng
- Đăng ký/đăng nhập tài khoản
- Hồ sơ cá nhân với avatar và nickname
- Đăng khoảnh khắc (moments) kèm ảnh
- Chatbot AI hướng dẫn (dùng Google Gemini)
- Diễn đàn thảo luận
- Bảng xếp hạng, thành tựu
- Hỗ trợ 2 ngôn ngữ (Việt/Anh) và 2 chủ đề (sáng/tối)

**Kiến trúc tổng thể:**

```
Người dùng (Browser)
    │
    ├── HTML/CSS/JS thuần (Frontend tĩnh)
    │
    ├── Firebase Auth ──── Xác thực người dùng
    ├── Firestore ──────── Lưu dữ liệu (tiến trình, bài đăng...)
    ├── Storage ────────── Lưu ảnh (avatar, moment, forum)
    └── Cloud Functions ── Backend gọi Gemini API
```

---

## 2. Cấu trúc thư mục

```
best-web-design/
├── index.html              ← File HTML duy nhất (Single Page App)
├── pages/                  ← Các mảnh HTML được tải vào index.html
├── css/
│   ├── main.css            ← Gom tất cả CSS
│   ├── animations.css      ← Hiệu ứng chuyển động
│   └── features/           ← CSS theo từng tính năng
├── js/
│   ├── app/                ← Lõi ứng dụng (main, state, i18n)
│   ├── features/           ← Logic từng tính năng
│   ├── firebase/           ← Kết nối Firebase
│   ├── ui/                 ← Helper giao diện
│   ├── utils/              ← Tiện ích (nén ảnh...)
│   ├── services/           ← Xử lý dữ liệu forum
│   └── vendor/             ← Thư viện bên ngoài
├── data/                   ← Dữ liệu tĩnh (route, avatars)
├── assets/                 ← Ảnh panorama, bản đồ, pet
├── firebase/               ← Rules bảo mật Firestore/Storage
├── functions/              ← Code backend (Cloud Functions)
└── scripts/                ← Script hỗ trợ phát triển
```

---

## 3. Luồng chạy của ứng dụng

```
1. Mở index.html
2. Browser tải CSS + thư viện Pannellum + icon
3. Browser chạy js/app/main.js
4. main.js đợi DOM sẵn sàng (DOMContentLoaded)
5. main.js gọi loadPagePartials() → fetch các file trong pages/
6. Sau khi HTML được chèn vào → khởi tạo UI, theme, auth, chat
7. Firebase Auth kiểm tra trạng thái đăng nhập:
   ├── Đã đăng nhập → hiện trang chủ, tải tiến trình
   └── Chưa đăng nhập → hiện form đăng nhập
8. Khi bắt đầu tour → khởi tạo Pannellum viewer → hiển thị 360
```

---

## 4. index.html - Trang chính

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <!-- Font chữ Google -->
    <!-- Pannellum CSS (thư viện xem ảnh 360) -->
    <!-- Phosphor Icons (bộ icon) -->
    <!-- CSS của dự án -->
</head>
<body>
    <!-- Container cho ảnh 360 -->
    <div id="panorama"></div>

    <!-- Hiệu ứng viền tối xung quanh -->
    <div class="scene-vignette"></div>

    <!-- Nơi chứa toàn bộ giao diện (sẽ được JS chèn vào) -->
    <div id="screen-root"></div>

    <!-- Nhạc nền -->
    <audio id="ambient-audio" src="assets/audio/audio.mp3" loop></audio>

    <!-- Thông báo nhanh -->
    <div id="toast" class="toast hidden"></div>

    <!-- Thư viện -->
    <script src="pannellum.js"></script>
    <script src="confetti.js"></script>

    <!-- Entry point JavaScript -->
    <script type="module" src="js/app/main.js"></script>
</body>
</html>
```

**Giải thích:** File HTML này rất ngắn gọn. Nó chỉ tạo vài container rỗng, sau đó JavaScript sẽ tự động chèn nội dung vào `#screen-root` bằng cách tải các file HTML nhỏ từ thư mục `pages/`.

---

## 5. js/app/main.js - Điểm khởi đầu

Đây là file JavaScript **chạy đầu tiên**. Nó làm 4 việc chính:

### 5.1. Tải giao diện (loadPagePartials)

```javascript
const PAGE_PARTIALS = [
    "pages/homepage.html",
    "pages/quest.html",
    "pages/login.html",
    "pages/tour.html",
    // ...
];

async function loadPagePartials() {
    const root = document.getElementById("screen-root");
    const html = await Promise.all(
        PAGE_PARTIALS.map(async (partial) => {
            const response = await fetch(partial);
            return response.text();
        })
    );
    root.innerHTML = html.join("\n");
}
```

**Dễ hiểu:** Hàm này tải song song nhiều file HTML nhỏ, ghép chúng lại và chèn vào trang.

### 5.2. Khởi tạo giao diện (setupHomeUI)

Gắn sự kiện click cho các nút: menu mobile, nút bắt đầu tour, nút đăng xuất, nút chuyển trang...

### 5.3. Chuyển màn hình (showScreen)

```javascript
const APP_SCREENS = [
    "home-screen", "quest-screen", "leaderboard-screen",
    "library-screen", "events-screen", "profile-screen",
    "auth-screen", "avatar-screen", "tour-app"
];

function showScreen(nextScreenId) {
    // Ẩn tất cả màn hình khác
    // Hiện màn hình được yêu cầu với hiệu ứng fade
}
```

### 5.4. Kiểm tra đăng nhập

```javascript
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Đã đăng nhập → hiện trang chủ
        showScreen("home-screen");
        await bootTourShell(user);      // Tải tiến trình
        await renderHomeDashboard();    // Vẽ dashboard
    } else {
        // Chưa đăng nhập → hiện form login
        showScreen("auth-screen");
    }
});
```

---

## 6. js/app/state.js - Quản lý trạng thái

File này lưu **toàn bộ dữ liệu phiên làm việc** của người dùng.

### Đối tượng state

```javascript
export const state = {
    selectedAvatar: avatars[0],  // Nhân vật đang chọn
    customName: "Khách",         // Tên hiển thị
    currentStep: 0,              // Chặng đang đứng
    unlockedStep: 0,             // Chặng xa nhất đã mở khóa
    activeMapZone: "khu-v",      // Khu vực bản đồ hiện tại
};
```

### Các hàm quan trọng

| Hàm | Việc làm |
|-----|----------|
| `hydrateState()` | Đọc dữ liệu từ localStorage (offline) |
| `hydrateProgressFromFirebase()` | Đọc dữ liệu từ Firestore (online) |
| `saveProgressToFirebase()` | Lưu tiến trình lên server |
| `setCurrentStep(index)` | Cập nhật bước hiện tại |
| `setProfile(avatar, name)` | Đổi avatar và tên |
| `resetProgress()` | Xóa tiến trình, bắt đầu lại |

**Luồng dữ liệu:**
```
Người dùng thao tác → state thay đổi → lưu localStorage + Firestore
Mở lại app → đọc từ Firestore (hoặc localStorage nếu offline)
```

---

## 7. js/app/i18n.js - Đa ngôn ngữ

File này chứa **tất cả chuỗi văn bản** của ứng dụng bằng 2 ngôn ngữ.

```javascript
const TEXT = {
    vi: {
        "nav.dashboard": "Bảng điều khiển",
        "action.startTour": "Bắt đầu tour",
        "toast.loginSuccess": "Đăng nhập thành công!",
        // ... hàng trăm key khác
    },
    en: {
        "nav.dashboard": "Dashboard",
        "action.startTour": "Start tour",
        "toast.loginSuccess": "Login successful!",
        // ...
    }
};
```

### Hàm chính

```javascript
// Lấy text theo ngôn ngữ hiện tại
export function translate(key, params = {}) {
    const lang = getCurrentLanguage(); // "vi" hoặc "en"
    let text = TEXT[lang][key] || TEXT.vi[key] || key;
    // Thay thế {name} bằng giá trị thực
    for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    return text;
}
```

**Ví dụ sử dụng:**
```javascript
translate("toast.nicknameSet", { name: "SóiCôĐộc" })
// → "Xin chào, SóiCôĐộc! Hành trình bắt đầu! 🎉"
```

Khi người dùng đổi ngôn ngữ, app phát sự kiện `vku-language-change` và các component tự render lại.

---

## 8. js/firebase/index.js - Kết nối Firebase

File này khởi tạo **4 dịch vụ Firebase**:

```javascript
// 1. Firebase App (cấu hình project)
const app = initializeApp(firebaseConfig);

// 2. Auth (xác thực)
const auth = getAuth(app);

// 3. Firestore (database)
const db = getFirestore(app);

// 4. Storage (lưu file ảnh)
const storage = getStorage(app);

// 5. Cloud Functions (gọi backend)
const functions = getFunctions(app, "asia-southeast1");
```

Sau đó export tất cả hàm cần dùng để các file khác import.

---

## 9. js/features/tour.js - Tour 360

Đây là file **lớn nhất và quan trọng nhất** - điều khiển trải nghiệm tham quan 360.

### Khởi tạo viewer Pannellum

```javascript
function initViewer() {
    // Tạo cấu hình cho từng cảnh (scene)
    const pannellumScenes = {};
    route.forEach((scene) => {
        pannellumScenes[scene.id] = {
            panorama: scene.panorama,    // URL ảnh 360
            hotSpots: createHotspots()   // Các nút bấm trong ảnh
        };
    });

    // Khởi tạo trình xem 360
    viewer = pannellum.viewer("panorama", {
        default: { firstScene: route[state.currentStep].id },
        scenes: pannellumScenes
    });
}
```

### Chế độ Cinematic (tự động xoay)

```javascript
// Sau 10 giây không tương tác → ẩn UI, xoay camera chậm
idleTimer = setTimeout(() => {
    isCinematic = true;
    // Ẩn các thanh điều khiển
}, 10000);

// Xoay camera mỗi 30ms khi ở chế độ cinematic
setInterval(() => {
    if (isCinematic && viewer) {
        viewer.setYaw(viewer.getYaw() + 0.05);
    }
}, 30);
```

### Tải chặng mới (loadStep)

```javascript
function loadStep(index) {
    // Kiểm tra chặng hợp lệ
    if (index > state.unlockedStep + 1) {
        showToast("Điểm này chưa mở khóa");
        return;
    }
    // Cập nhật state
    setCurrentStep(index);
    // Bắn pháo hoa nếu là chặng mới
    if (isNewStep) confetti();
    // Chuyển cảnh panorama
    viewer.loadScene(route[index].id);
    // Cập nhật giao diện
    renderExperience();
}
```

### Hotspot (điểm tương tác trong 360)

```javascript
function createHotspots(index) {
    // Tạo nút "Đi tiếp" → chặng kế
    // Tạo nút "Quay lại" → chặng trước
    // Tạo Easter Eggs (điểm thông tin ẩn)
}
```

---

## 10. js/features/chat-guide.js - Chatbot AI

Tích hợp **Google Gemini** thông qua Firebase Cloud Functions.

### Cấu trúc giao diện

```
┌─────────────────────────────┐
│  [Linh vật GuguGaga]        │ ← Kéo thả được
│                             │
│  ┌───────────────────────┐  │
│  │ Bảng chat             │  │
│  │ - Tin nhắn user       │  │
│  │ - Tin nhắn guide      │  │
│  │ [Bản đồ][Lộ trình]   │  │ ← Quick actions
│  │ [Input] [Gửi]        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Gửi tin nhắn

```javascript
async function handleGuideSubmit(root, event) {
    // 1. Lấy nội dung người dùng gõ
    const message = input.value.trim();

    // 2. Hiển thị tin nhắn người dùng lên màn hình
    addGuideMessage(root, "user", message);

    // 3. Kiểm tra đăng nhập
    if (!auth?.currentUser) {
        addGuideMessage(root, "assistant", "Bạn đăng nhập trước nha");
        return;
    }

    // 4. Hiện hiệu ứng "đang gõ..."
    const thinking = addGuideMessage(root, "assistant", "", true);

    // 5. Gọi Cloud Function → Gemini AI
    const result = await guideCallable({
        message,
        history: buildGuideHistoryPayload(),
        currentScene: buildCurrentScenePayload(),
        progress: { currentStep, unlockedStep }
    });

    // 6. Hiển thị câu trả lời
    thinking.textContent = result.data.reply;
}
```

### Hoạt ảnh linh vật (Pet Animation)

Linh vật có các trạng thái: `idle`, `jumping`, `thinking`, `waving`, `failed`. Hoạt ảnh được điều khiển qua CSS spritesheet.

### Kéo thả (Drag & Drop)

Người dùng có thể kéo linh vật đến bất kỳ vị trí nào trên màn hình. Vị trí được lưu vào localStorage.

---

## 11. js/features/auth.js - Đăng nhập/Đăng ký

### Hỗ trợ 3 phương thức

1. **Email + Mật khẩu** (đăng nhập/đăng ký)
2. **Google Popup** (cửa sổ nhỏ)
3. **Google Redirect** (chuyển trang - dự phòng khi popup bị chặn)

### Luồng đăng nhập Email

```javascript
form.onsubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
    } else {
        await createUserWithEmailAndPassword(auth, email, password);
    }
};
```

### Xử lý lỗi thân thiện

```javascript
function getAuthErrorMessage(error) {
    const messages = {
        "auth/email-already-in-use": "Email này đã được đăng ký.",
        "auth/weak-password": "Mật khẩu cần tối thiểu 6 ký tự.",
        "auth/wrong-password": "Mật khẩu không đúng.",
        // ...
    };
    return messages[error.code] || "Đã xảy ra lỗi.";
}
```

---

## 12. js/features/home.js - Trang chủ

Trang chủ (dashboard) hiển thị **5 thành phần** tải song song:

```javascript
export async function renderHomeDashboard() {
    renderQuestSummary();       // Danh sách nhiệm vụ
    await Promise.all([
        renderLeaderboard(),    // Bảng xếp hạng
        renderLibrary(),        // Thư viện hành trình
        renderProfile(),        // Thông tin cá nhân
        renderAchievements(),   // Thành tựu/huy hiệu
        renderNotifications()   // Thông báo
    ]);
}
```

### Bảng xếp hạng

Lấy tiến trình **tất cả** người dùng từ Firestore, tính điểm và sắp xếp:
```javascript
score = (unlockedStep + 1) * 100 + currentStep * 10
```

### Hệ thống cache

Để tránh gọi Firebase quá nhiều, dashboard dùng cache 45 giây:
```javascript
const DASHBOARD_CACHE_TTL = 45_000; // 45 giây
```

---

## 13. js/features/events.js - Diễn đàn

Diễn đàn cho phép người dùng **tạo chủ đề** và **trả lời thảo luận**.

### Tạo chủ đề mới

```
Tiêu đề + Nội dung + Ảnh đính kèm (tùy chọn) + Danh mục
    → Upload ảnh lên Storage (nếu có)
    → Lưu chủ đề vào Firestore collection "forumThreads"
```

### Danh mục (categories)

- Sự kiện (event)
- Hỏi đáp (question)
- Câu lạc bộ (club)
- Thông báo (notice)

### Chi tiết chủ đề

Khi click vào một chủ đề → hiện nội dung + danh sách phản hồi + form trả lời.

---

## 14. js/features/moments.js - Khoảnh khắc

Cho phép người dùng **đăng ảnh và cảm nhận** tại mỗi chặng tour.

### Tạo khoảnh khắc

```javascript
async function createMoment(scene, { caption, mood, visibility, file }) {
    // 1. Upload ảnh (nếu có)
    if (file) {
        const upload = await uploadMomentImage(uid, momentId, file);
    }
    // 2. Lưu dữ liệu vào Firestore
    await setDoc(momentRef, {
        uid, caption, mood, visibility,
        sceneId: scene.id,
        imageUrl, createdAt: serverTimestamp()
    });
}
```

### Hệ thống cảm xúc (Reactions)

Mỗi khoảnh khắc có thể nhận 3 loại cảm xúc: 👍 (Thích), 💛 (Yêu thích), 🎉 (Chúc mừng).

```javascript
// Toggle: nhấn lần 1 → thả, nhấn lần 2 → gỡ
if (previousReaction === reaction) {
    await deleteDoc(reactionRef); // Gỡ
} else {
    await setDoc(reactionRef, { reaction, ... }); // Thả
}
```

### Quyền riêng tư

- `public`: Mọi người trong tour đều thấy
- `private`: Chỉ mình tác giả thấy

---

## 15. js/features/profile.js - Hồ sơ

Cho phép **upload avatar tùy chỉnh** lên Firebase Storage.

```javascript
async function handleAvatarUpload(event) {
    const file = input.files[0];
    // 1. Kiểm tra (phải là ảnh, tối đa 20MB)
    // 2. Nén ảnh xuống 512x512
    // 3. Upload lên Storage
    // 4. Lưu URL vào state và Firestore
    // 5. Cập nhật giao diện
}
```

---

## 16. js/features/map.js - Bản đồ

Hiển thị bản đồ 2D với các **điểm dừng (dots)** có thể nhấp.

```javascript
export function renderMap() {
    // Hiện ảnh bản đồ Khu V hoặc Khu K
    // Tạo các nút tại tọa độ (x%, y%) của mỗi chặng
    // Đánh dấu: ✓ đã đi, 📍 đang đứng, 🔒 chưa mở
    // Click vào dot đã mở → chuyển đến chặng đó
}
```

Mỗi chặng trong `data/route.js` có thuộc tính `mapCoords: { x, y }` để định vị trên bản đồ.

---

## 17. js/features/nickname.js - Đặt bí danh

Hiện modal bắt buộc đặt tên khi lần đầu sử dụng.

**Quy tắc:**
- Tối thiểu 2 ký tự
- Tối đa 24 ký tự
- Không được chỉ có khoảng trắng

**Gợi ý nhanh:** "Khám Phá Viên", "Sói Cô Độc", "VKU Pioneer"...

---

## 18. js/features/theme.js - Chủ đề sáng/tối

```javascript
const Theme = {
    getCurrent() { /* Đọc từ localStorage */ },
    set(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.apply(theme);
    },
    apply(theme) {
        // Thêm/xóa attribute data-theme="light" trên <html>
        // CSS sẽ tự đổi màu dựa trên attribute này
    },
    toggle() {
        // dark → light, light → dark
    }
};
```

---

## 19. js/ui/ - Giao diện dùng chung

### ui.js

```javascript
// Hiện thông báo nhanh (toast)
export function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2600);
}

// Giới hạn số trong khoảng [min, max]
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
```

### ui-utils.js

Tạo **skeleton loading** (khung xám nhấp nháy) khi dữ liệu đang tải.

### forum.js

Render HTML cho chủ đề diễn đàn, chi tiết thread và danh sách reply.

### html.js

Hàm escape HTML chống XSS (Cross-Site Scripting):
```javascript
export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}
```

---

## 20. js/utils/ - Tiện ích

### image-optimizer.js

Nén ảnh trước khi upload để tiết kiệm dung lượng:

```javascript
export async function optimizeImageForUpload(file, options) {
    // 1. Đọc file thành Image
    // 2. Vẽ lên Canvas với kích thước nhỏ hơn
    // 3. Xuất ra WebP (hoặc JPEG nếu browser không hỗ trợ)
    // 4. Giảm quality dần nếu file vẫn quá lớn
    // 5. Trả về File mới đã nén
}
```

**Ví dụ:** Ảnh gốc 5MB → sau nén còn ~200KB (WebP, 1600x1600, quality 82%).

---

## 21. js/services/ - Dịch vụ

### forum-service.js

Tách riêng logic **CRUD diễn đàn** ra khỏi giao diện:

| Hàm | Mô tả |
|-----|--------|
| `fetchForumThreads(db, category)` | Lấy danh sách chủ đề |
| `getForumThread(db, id)` | Lấy 1 chủ đề |
| `createForumThread(...)` | Tạo chủ đề mới |
| `createForumReply(...)` | Trả lời chủ đề |
| `deleteForumThread(...)` | Xóa chủ đề |
| `fetchForumReplies(db, threadId)` | Lấy danh sách reply |

---

## 22. functions/index.js - Cloud Functions (Backend)

Đây là **code chạy trên server** (không phải browser).

### Tại sao cần backend?

API key của Gemini là **bí mật**. Nếu đặt ở frontend, ai cũng có thể lấy và lạm dụng. Cloud Function giữ key an toàn bằng Firebase Secret.

### Hàm chatGuide

```javascript
exports.chatGuide = onCall(async (request) => {
    // 1. Kiểm tra đăng nhập
    if (!request.auth) throw new HttpsError("unauthenticated");

    // 2. Lấy dữ liệu từ request
    const { message, history, currentScene, progress } = request.data;

    // 3. Gọi Gemini API
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
            headers: { "x-goog-api-key": GEMINI_API_KEY.value() },
            body: JSON.stringify({
                systemInstruction: "Bạn là guide cho VKU 360 Quest...",
                contents: [{ role: "user", parts: [{ text: message }] }]
            })
        }
    );

    // 4. Trả lời
    return { reply: data.candidates[0].content.parts[0].text };
});
```

### CAMPUS_KNOWLEDGE

Backend chứa dữ liệu về **các phòng ban VKU** (tên, chức năng, liên hệ) để AI trả lời chính xác các câu hỏi về trường.

### Fallback (dự phòng)

Nếu Gemini hết quota hoặc lỗi, hàm `buildFallbackReply()` sẽ trả lời offline dựa trên từ khóa:
- Hỏi về phòng ban → tìm trong CAMPUS_KNOWLEDGE
- Hỏi về bản đồ/lộ trình → gợi ý dùng Map/Route
- Hỏi về hồ sơ → hướng dẫn kiểm tra Profile

---

## 23. CSS - Hệ thống giao diện

### Cấu trúc CSS

```
css/main.css               ← Import tất cả file khác theo thứ tự
css/animations.css         ← @keyframes cho hiệu ứng
css/features/00-base.css   ← Biến CSS, reset, font
css/features/01-home...    ← CSS cho từng trang/tính năng
css/features/10-light...   ← Override cho chế độ sáng
```

### Design Tokens (Biến CSS)

```css
:root {
    --bg-primary: #0b1326;       /* Nền tối chính */
    --gold: #fbbf24;             /* Màu nhấn vàng VKU */
    --bg-glass: rgba(19,27,46,0.75); /* Kính mờ */
    --motion-base: 260ms;        /* Thời gian chuyển động */
}
```

### Glassmorphism (Kính mờ)

Phong cách thiết kế chủ đạo:
```css
.glass-panel {
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
}
```

### Responsive

Sử dụng Media Queries và `clamp()` để tương thích mobile/desktop.

---

## 24. Công nghệ sử dụng

| Công nghệ | Vai trò |
|-----------|---------|
| HTML/CSS/JS thuần | Frontend (không dùng React/Vue) |
| ES Modules | Tổ chức code theo module |
| Pannellum | Hiển thị ảnh panorama 360 |
| Firebase Auth | Xác thực người dùng |
| Cloud Firestore | Database thời gian thực |
| Firebase Storage | Lưu trữ file ảnh |
| Cloud Functions | Backend serverless |
| Google Gemini | AI chatbot |
| Phosphor Icons | Bộ icon |
| Canvas Confetti | Hiệu ứng pháo hoa |
| Vercel Analytics | Thống kê truy cập |

---

## 25. Giải thích async/await cho người mới

### Vấn đề

JavaScript chạy **không đồng bộ**. Khi bạn yêu cầu dữ liệu từ server, browser không đứng đợi mà tiếp tục chạy code phía dưới.

### async

Đặt trước function để nói "hàm này có thao tác chờ đợi":

```javascript
async function layDuLieu() {
    // Bên trong có thể dùng await
}
```

### await

Nói "đợi cái này xong rồi mới chạy dòng tiếp theo":

```javascript
async function layDuLieu() {
    const response = await fetch("https://api.example.com/data");
    // Dòng này CHỈ chạy SAU KHI fetch xong
    const data = await response.json();
    return data;
}
```

### Promise.all - Chạy song song

```javascript
// CHẬM: chạy tuần tự (đợi cái 1 xong mới chạy cái 2)
const a = await fetchA(); // 2 giây
const b = await fetchB(); // 2 giây
// Tổng: 4 giây

// NHANH: chạy song song
const [a, b] = await Promise.all([fetchA(), fetchB()]);
// Tổng: 2 giây (chạy cùng lúc)
```

### Promise.allSettled - Song song, không sợ lỗi

```javascript
// Promise.all: 1 cái lỗi → TẤT CẢ lỗi
// Promise.allSettled: 1 cái lỗi → vẫn lấy được kết quả các cái khác

const [ketQua1, ketQua2] = await Promise.allSettled([
    fetchPublicMoments(),
    fetchOwnMoments()
]);
// Nếu fetchPublicMoments lỗi, vẫn có kết quả fetchOwnMoments
```

### void - "Chạy ngầm, không cần đợi"

```javascript
void checkAndPromptNickname();
// Nghĩa là: chạy hàm này nhưng KHÔNG đợi nó xong
// App tiếp tục chạy code phía dưới ngay lập tức
```

---

## TÓM TẮT KIẾN TRÚC

```
┌──────────────── FRONTEND (Browser) ────────────────┐
│                                                     │
│  index.html                                         │
│       │                                             │
│       ▼                                             │
│  js/app/main.js (Entry Point)                       │
│       │                                             │
│       ├── js/app/state.js (Dữ liệu phiên)          │
│       ├── js/app/i18n.js (Ngôn ngữ)                │
│       │                                             │
│       ├── js/features/tour.js (Tour 360)            │
│       ├── js/features/chat-guide.js (Chatbot)       │
│       ├── js/features/auth.js (Đăng nhập)           │
│       ├── js/features/home.js (Dashboard)           │
│       ├── js/features/events.js (Diễn đàn)          │
│       ├── js/features/moments.js (Khoảnh khắc)      │
│       ├── js/features/profile.js (Hồ sơ)           │
│       ├── js/features/map.js (Bản đồ)              │
│       ├── js/features/nickname.js (Bí danh)         │
│       └── js/features/theme.js (Sáng/Tối)          │
│                                                     │
│  js/firebase/index.js ─────────────────┐            │
│  js/ui/*.js (Helper giao diện)         │            │
│  js/utils/*.js (Nén ảnh)               │            │
│  js/services/*.js (Logic forum)        │            │
│                                        ▼            │
└────────────────────────────────── Firebase ─────────┘
                                        │
                                        ▼
┌──────────── BACKEND (Cloud Functions) ─────────────┐
│                                                     │
│  functions/index.js                                 │
│       │                                             │
│       ├── chatGuide() → Gemini API                  │
│       └── CAMPUS_KNOWLEDGE (dữ liệu VKU)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*Tài liệu được tạo để hỗ trợ thuyết trình và giải thích code cho ban giám khảo cuộc thi thiết kế web.*
