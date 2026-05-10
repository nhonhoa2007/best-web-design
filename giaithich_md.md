# Giải thích toàn bộ code JavaScript - VKU 360 Quest

Tài liệu này giải thích các file `.js` trong project `VKU 360 Quest` bằng tiếng Việt có dấu. Nội dung tập trung vào 4 việc:

1. File nào chịu trách nhiệm gì.
2. Từng biến quan trọng được đặt để làm gì.
3. Từng hàm chính vận hành ra sao.
4. Vì sao dùng `async`, `await`, `Promise.all`, `Promise.allSettled`, `void` ở các vị trí tương ứng.

Khi nhắc đến tên file, tên hàm, tên biến, tài liệu dùng đúng tên trong code, ví dụ: `js/app/main.js`, `loadPagePartials()`, `PAGE_PARTIALS`, `hydrateProgressFromFirebase()`, `state.currentStep`.

> Lưu ý encoding: trong source hiện tại có nhiều chuỗi tiếng Việt bị mojibake, ví dụ dạng `KhÃ¡ch`, `ÄÄƒng nháº­p`. Đây là vấn đề mã hóa text, không phải lỗi logic JavaScript. Trước khi demo chính thức nên chuẩn hóa file về UTF-8 và sửa lại nội dung hiển thị.

---

## 1. Tổng quan kiến trúc JavaScript

Project là một web tĩnh dùng ES Module. File HTML chính là `index.html`, trong đó dòng quan trọng nhất là:

```html
<script type="module" src="js/app/main.js"></script>
```

Điều này nghĩa là `js/app/main.js` là entry point của frontend. Browser chạy file này đầu tiên, sau đó `main.js` import những module còn lại.

Các nhóm file JavaScript chính:

| Nhóm | File | Vai trò |
| --- | --- | --- |
| Entry/app | `js/app/main.js` | Khởi động app, nạp HTML partial, bind UI, nghe trạng thái đăng nhập |
| State | `js/app/state.js` | Lưu trạng thái tour, avatar, nickname, tiến độ |
| i18n | `js/app/i18n.js` | Dịch giao diện VI/EN, format số/ngày, lấy text route/avatar |
| Firebase | `js/firebase/index.js` | Khởi tạo Firebase Auth, Firestore, Storage, Functions |
| Data | `data/route.js`, `data/avatars.js` | Dữ liệu route tour và avatar |
| UI helper | `js/ui/ui.js`, `js/ui/ui-utils.js` | Toast, clamp, skeleton loading |
| Feature | `js/features/*.js` | Logic từng tính năng: tour, map, moments, events, profile, home, auth, chat |
| Backend | `functions/index.js` | Cloud Function `chatGuide` gọi Gemini API |
| Script phụ | `skills/react-components/scripts/validate.js` | Script validate component React trong thư mục skill |

---

## 2. Luồng chạy tổng thể của app

Khi người dùng mở website:

1. `index.html` tạo các container rỗng như `#screen-root`, `#panorama`, `#toast`.
2. Browser tải CSS, Pannellum, confetti, icon library.
3. Browser chạy `js/app/main.js`.
4. `main.js` đợi event `DOMContentLoaded`.
5. `main.js` gọi `loadPagePartials()` để fetch các file trong `pages/*.html`.
6. Sau khi các partial được chèn vào `#screen-root`, app mới bind event cho form, button, menu, tour, profile, events.
7. Nếu Firebase Auth có user, `onAuthStateChanged()` gọi nhánh đăng nhập:
   - hiện `home-screen`
   - load tiến độ bằng `bootTourShell(user)`
   - kiểm tra nickname bằng `checkAndPromptNickname()`
   - render dashboard bằng `renderHomeDashboard()`
   - render album sự kiện bằng `renderEventGallery()`
8. Nếu chưa đăng nhập, app hiện `auth-screen`.
9. Khi user bắt đầu tour, `startTour()` trong `js/features/tour.js` khởi tạo Pannellum viewer và gọi `loadStep()`.

---

## 3. Vì sao project dùng `async` và `await`

JavaScript chạy trên browser theo kiểu không chặn giao diện. Những thao tác mất thời gian như fetch file HTML, đọc Firestore, upload ảnh, gọi Cloud Function đều trả về `Promise`.

### `async`

Đặt `async` trước function để function đó có thể dùng `await` bên trong và luôn trả về một `Promise`.

Ví dụ trong `js/app/main.js`:

```js
document.addEventListener("DOMContentLoaded", async () => {
    await loadPagePartials();
});
```

Callback phải là `async` vì bên trong cần `await loadPagePartials()`.

### `await`

`await` tạm dừng phần logic hiện tại cho đến khi Promise hoàn tất. Nó không làm đơ toàn bộ trình duyệt.

Ví dụ trong `js/app/state.js`:

```js
const snapshot = await getDoc(progressRef);
```

Phải `await` vì app không thể dùng `snapshot.data()` trước khi Firestore trả document về.

### `Promise.all`

Dùng khi nhiều việc độc lập có thể chạy song song.

Ví dụ trong `renderHomeDashboard()` của `js/features/home.js`:

```js
await Promise.all([
    renderLeaderboard(),
    renderLibrary(),
    renderProfile(),
    renderAchievements(),
    renderNotifications()
]);
```

Leaderboard, library, profile, achievements, notifications không cần đợi nhau. Chạy song song giúp dashboard nhanh hơn.

### `Promise.allSettled`

Dùng khi muốn nhiều Promise chạy song song nhưng không muốn một Promise lỗi làm hỏng toàn bộ.

Ví dụ trong `fetchMomentsForScene()` của `js/features/moments.js`:

```js
const [publicResult, ownResult] = await Promise.allSettled([
    getDocs(publicQuery),
    getDocs(ownQuery)
]);
```

Nếu query public moments lỗi nhưng query own moments thành công, app vẫn hiển thị được bài của user.

### `void`

Dùng khi cố ý gọi một hàm async nhưng không cần đợi kết quả.

Ví dụ trong `js/app/main.js`:

```js
void checkAndPromptNickname();
```

App muốn hiện modal nickname nếu cần, nhưng không muốn khóa toàn bộ quá trình render dashboard trong lúc chờ user nhập tên.

---

## 4. File `js/app/main.js`

`js/app/main.js` là entry point của frontend.

### Các import trong `js/app/main.js`

`import { auth, onAuthStateChanged } from "../firebase/index.js";`

- `auth` là Firebase Auth instance.
- `onAuthStateChanged()` dùng để nghe user đã đăng nhập hay chưa.

`import { setupAuthUI } from "../features/auth.js";`

- Lấy hàm bind form đăng nhập/đăng ký.

`import { setupGuideChat } from "../features/chat-guide.js";`

- Tạo widget chat AI.

`import { bindEventControls, renderEventGallery } from "../features/events.js";`

- `bindEventControls()` bind form upload ảnh sự kiện.
- `renderEventGallery()` render album ảnh sự kiện.

`import { renderHomeDashboard } from "../features/home.js";`

- Render dashboard trang chủ.

`import { applyTranslations, mountLanguageSwitchers, t } from "./i18n.js";`

- `mountLanguageSwitchers()` chèn nút VI/EN.
- `applyTranslations()` dịch text static.
- `t()` lấy text theo key.

`import { checkAndPromptNickname } from "../features/nickname.js";`

- Kiểm tra user đã có nickname chưa.

`import { bindProfileControls } from "../features/profile.js";`

- Bind upload avatar và logout trong profile.

`import { hydrateProgressFromFirebase, hydrateState } from "./state.js";`

- `hydrateProgressFromFirebase()` load tiến độ từ Firestore.
- `hydrateState()` load tiến độ từ localStorage.

`import { bindControls, preloadPanoramas, renderAvatarOptions, renderResumeButton, startTour } from "../features/tour.js";`

- Nhóm hàm phục vụ tour.

`import Theme from "../features/theme.js";`

- Import default object `Theme`.

### Biến `PAGE_PARTIALS`

```js
const PAGE_PARTIALS = [
    "pages/homepage.html",
    "pages/quest.html",
    ...
];
```

`PAGE_PARTIALS` là danh sách file HTML partial cần nạp. Project không đặt toàn bộ HTML trong `index.html`, mà chia từng màn hình vào `pages/*.html`.

Tên `PAGE_PARTIALS` hợp lý vì biến này chứa đường dẫn partial, không phải id màn hình.

### Biến `APP_SCREENS`

```js
const APP_SCREENS = [
    "home-screen",
    "quest-screen",
    ...
];
```

`APP_SCREENS` là danh sách id DOM của các màn hình. Hàm `showScreen(activeScreenId)` dùng danh sách này để ẩn tất cả màn hình khác và chỉ hiện màn hình cần thiết.

### Event `DOMContentLoaded`

```js
document.addEventListener("DOMContentLoaded", async () => {
```

Callback là `async` vì phải đợi `loadPagePartials()`.

Trong callback:

```js
await loadPagePartials();
```

Phải đợi partial load xong trước khi gọi các hàm như `setupAuthUI()`, `bindProfileControls()`, `bindEventControls()`, vì các element như `#auth-form`, `#profile-avatar-file`, `#event-photo-form` nằm trong partial.

Sau đó app gọi:

```js
Theme.init();
setupHomeUI();
mountLanguageSwitchers();
applyTranslations();
setupAuthUI();
setupGuideChat();
bindEventControls();
bindProfileControls();
```

Ý nghĩa:

- `Theme.init()` áp dụng theme đã lưu trong localStorage.
- `setupHomeUI()` bind menu và chuyển trang.
- `mountLanguageSwitchers()` chèn nút đổi ngôn ngữ.
- `applyTranslations()` dịch các text static.
- `setupAuthUI()` bind form auth.
- `setupGuideChat()` tạo chat guide.
- `bindEventControls()` bind form events.
- `bindProfileControls()` bind upload avatar.

### Nhánh `if (auth)`

```js
if (auth) {
    onAuthStateChanged(auth, async (user) => {
```

Chỉ nghe auth nếu Firebase khởi tạo thành công. Callback dùng `async` vì khi có user cần load dữ liệu Firestore.

Nếu có user:

```js
showScreen("home-screen");
await bootTourShell(user);
void checkAndPromptNickname();
await renderHomeDashboard();
await renderEventGallery();
```

Giải thích:

- `showScreen("home-screen")`: đưa user vào home.
- `await bootTourShell(user)`: phải đợi load progress xong trước khi render avatar, resume, progress.
- `void checkAndPromptNickname()`: hiện modal nickname nếu cần, nhưng không chặn render dashboard.
- `await renderHomeDashboard()`: render dashboard.
- `await renderEventGallery()`: render album sự kiện.

Nếu chưa có user:

```js
showScreen("auth-screen");
```

Nếu `auth` không tồn tại:

```js
showScreen("auth-screen");
bootTourShell();
void checkAndPromptNickname();
void renderHomeDashboard();
```

Đây là fallback local/offline. `bootTourShell()` không truyền user nên sẽ dùng `hydrateState()`.

### Hàm `loadPagePartials()`

```js
async function loadPagePartials() {
```

Hàm này cần `async` vì dùng `fetch()`.

```js
const root = document.getElementById("screen-root");
if (!root) return;
```

Nếu không có `#screen-root`, dừng sớm để tránh lỗi.

```js
const html = await Promise.all(
    PAGE_PARTIALS.map(async (partial) => {
        const response = await fetch(partial);
        ...
        return response.text();
    })
);
```

`Promise.all()` giúp fetch tất cả partial song song. Callback trong `map()` là `async` vì mỗi partial cần `await fetch(partial)` và `await response.text()`.

```js
if (!response.ok) {
    throw new Error(t("partial.error", { partial }));
}
```

Nếu file không load được, ném lỗi để khối `catch` ở `DOMContentLoaded` gọi `showPartialLoadError(error)`.

```js
root.innerHTML = html.join("\n");
```

Gộp tất cả HTML partial thành một chuỗi và chèn vào DOM.

### Hàm `showPartialLoadError(error)`

Hàm này render một màn hình lỗi đơn giản vào `#screen-root` khi không load được partial.

Nó dùng `t("partial.title")` và `t("partial.hint")` để nội dung lỗi vẫn đi qua hệ thống i18n.

### Hàm `bootTourShell(user = null)`

```js
async function bootTourShell(user = null) {
```

Hàm này `async` vì nếu có user thì phải `await hydrateProgressFromFirebase(user)`.

```js
if (user) {
    await hydrateProgressFromFirebase(user);
} else {
    hydrateState();
}
```

- Có user: load Firestore.
- Không có user: load localStorage.

Sau khi state đã sẵn sàng:

```js
renderAvatarOptions();
bindControls();
renderResumeButton();
preloadPanoramas();
```

- `renderAvatarOptions()` vẽ các avatar để chọn.
- `bindControls()` bind các nút tour.
- `renderResumeButton()` hiện/ẩn nút resume.
- `preloadPanoramas()` tải trước ảnh panorama.

### Hàm `setupHomeUI()`

Hàm này bind các tương tác UI ngoài tour.

Các biến DOM chính:

- `homeScreen`: màn home.
- `menuToggle`: nút mở menu mobile.
- `menuClose`: nút đóng menu mobile.
- `menuBackdrop`: lớp nền để click đóng menu.
- `mobileMenu`: menu mobile.

Hàm con `setHomeMenuOpen(isOpen)`:

- Toggle class `home-menu-open`.
- Set `aria-expanded`.
- Set `aria-hidden`.

Hàm con `closeProfileMenus()` đóng các profile menu đang mở.

Các selector quan trọng:

- `[data-start-tour]`: nút bắt đầu tour.
- `[data-open-page]`: nút mở các page như profile, events, library.
- `[data-back-home], #back-home`: nút quay về home.

Khi click `[data-start-tour]`, code gọi:

```js
showScreen("tour-app");
startTour();
```

`startTour()` nằm trong `js/features/tour.js`.

### Hàm `showScreen(activeScreenId)`

```js
function showScreen(activeScreenId) {
    APP_SCREENS.forEach((screenId) => {
        document.getElementById(screenId)?.classList.toggle("hidden", screenId !== activeScreenId);
    });
}
```

Hàm này đi qua toàn bộ `APP_SCREENS`. Màn nào không phải `activeScreenId` thì thêm class `hidden`, màn cần hiện thì bỏ `hidden`.

Toán tử `?.` giúp nếu element không tồn tại thì bỏ qua, không crash.

---

## 5. File `js/app/state.js`

`js/app/state.js` là nơi quản lý trạng thái chung của app.

### Import trong `js/app/state.js`

- `avatars` từ `data/avatars.js`.
- `route` từ `data/route.js`.
- `auth`, `db`, `doc`, `getDoc`, `serverTimestamp`, `setDoc` từ `js/firebase/index.js`.
- `t` từ `js/app/i18n.js`.
- `clamp` từ `js/ui/ui.js`.

### Hằng `STORAGE_KEYS`

```js
export const STORAGE_KEYS = {
    avatar: "vkuQuestAvatar",
    avatarImagePath: "vkuQuestAvatarImagePath",
    avatarImageUrl: "vkuQuestAvatarImageUrl",
    customName: "vkuQuestCustomName",
    currentStep: "vkuQuestCurrentStep",
    unlockedStep: "vkuQuestUnlockedStep"
};
```

`STORAGE_KEYS` gom các key dùng cho localStorage. Việc gom key vào một object giúp tránh viết sai string ở nhiều nơi.

Ý nghĩa từng key:

- `avatar`: id avatar đang chọn.
- `avatarImagePath`: path ảnh avatar trên Firebase Storage.
- `avatarImageUrl`: URL ảnh avatar để hiển thị.
- `customName`: nickname.
- `currentStep`: chặng đang xem.
- `unlockedStep`: chặng xa nhất đã mở khóa.

### Biến `avatarById`

```js
export const avatarById = new Map(avatars.map((avatar) => [avatar.id, avatar]));
```

`avatarById` giúp tìm avatar theo id nhanh hơn:

```js
avatarById.get("tan-sinh-vien")
```

Không cần dùng `avatars.find(...)` nhiều lần.

### Biến `routeIndexById`

```js
export const routeIndexById = new Map(route.map((scene, index) => [scene.id, index]));
```

`routeIndexById` giúp đổi từ `scene.id` sang index trong mảng `route`. Pannellum trả về `sceneId`, nên tour cần map id đó về số thứ tự.

### Object `state`

```js
export const state = {
    selectedAvatar: avatars[0],
    avatarImagePath: "",
    avatarImageUrl: "",
    customName: t("fallback.guest"),
    currentStep: 0,
    unlockedStep: 0,
    activeMapZone: "khu-v",
    hasRemoteProgress: false,
    progressLoaded: false
};
```

Ý nghĩa từng field:

- `selectedAvatar`: object avatar hiện tại.
- `avatarImagePath`: path ảnh avatar trong Storage.
- `avatarImageUrl`: URL ảnh avatar.
- `customName`: tên hiển thị.
- `currentStep`: index chặng hiện tại.
- `unlockedStep`: index chặng cao nhất đã mở.
- `activeMapZone`: zone map đang xem, ví dụ `"khu-v"` hoặc `"khu-k"`.
- `hasRemoteProgress`: user đã có document progress trên Firestore chưa.
- `progressLoaded`: đã load progress xong chưa.

### Hàm `hydrateState()`

`hydrateState()` load dữ liệu từ localStorage. Hàm này không cần `async` vì localStorage là đồng bộ.

Các dòng:

```js
const savedAvatar = localStorage.getItem(STORAGE_KEYS.avatar);
```

Lấy avatar đã lưu.

```js
const savedCurrent = Number(localStorage.getItem(STORAGE_KEYS.currentStep));
```

Chuyển current step từ string sang number.

```js
state.selectedAvatar = avatarById.get(savedAvatar) || avatars[0];
```

Nếu id avatar hợp lệ thì dùng avatar đó, nếu không thì fallback avatar đầu tiên.

```js
state.currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
```

Nếu số hợp lệ thì giới hạn trong khoảng route, nếu không thì về `0`.

```js
state.unlockedStep = Number.isFinite(savedUnlocked)
    ? clamp(savedUnlocked, state.currentStep, route.length - 1)
    : state.currentStep;
```

`unlockedStep` không được nhỏ hơn `currentStep`, vì nếu đang ở chặng 5 mà unlocked chỉ 3 thì dữ liệu mâu thuẫn.

### Hàm `hydrateProgressFromFirebase(user = auth?.currentUser)`

Hàm này `async` vì dùng `await getDoc(progressRef)`.

Luồng:

1. Nếu không có `user` hoặc `db`, gọi `hydrateState()` rồi return `false`.
2. Tạo reference:

```js
const progressRef = doc(db, "tourProgress", user.uid);
```

3. Đọc document:

```js
const snapshot = await getDoc(progressRef);
```

4. Nếu document không tồn tại:
   - gọi `resetStateToDefault()`
   - set `state.progressLoaded = true`
   - set `state.hasRemoteProgress = false`
   - return `false`
5. Nếu document tồn tại:
   - gọi `applyProgressData(snapshot.data())`
   - set `state.progressLoaded = true`
   - set `state.hasRemoteProgress = true`
   - return `true`
6. Nếu lỗi:
   - log lỗi
   - fallback về `hydrateState()`
   - return `false`

### Hàm `hasSavedProgress()`

Nếu có user và Firestore, hàm trả về `state.hasRemoteProgress`. Nếu không, hàm kiểm tra localStorage có `STORAGE_KEYS.avatar` không.

Hàm này dùng trong `renderResumeButton()`.

### Hàm `persistState()`

Ghi state hiện tại xuống localStorage. Không cần `async`.

### Hàm `saveProgressToFirebase()`

Hàm này `async` vì dùng `await setDoc(...)`.

Luồng:

1. Lấy `user = auth?.currentUser`.
2. Nếu không có user hoặc db, gọi `persistState()` rồi return `false`.
3. Tạo `progressRef`.
4. Tạo `payload`.
5. Nếu `!state.hasRemoteProgress`, thêm `createdAt`.
6. Ghi Firestore:

```js
await setDoc(progressRef, payload, { merge: true });
```

`merge: true` giúp cập nhật field mới mà không xóa field khác.

7. Nếu thành công, set `state.hasRemoteProgress = true`, return `true`.
8. Nếu lỗi, fallback localStorage và return `false`.

### Các setter

`setProfile(avatar, name)`:

- set `state.selectedAvatar`
- set `state.customName`

`setProfileAvatarImage(imageUrl, imagePath)`:

- set `state.avatarImageUrl`
- set `state.avatarImagePath`

`resetProgress()`:

- đưa `currentStep`, `unlockedStep` về `0`
- set `activeMapZone` theo route đầu
- gọi `saveProgressToFirebase()`

`setCurrentStep(index)`:

- set `state.currentStep = index`
- cập nhật `state.unlockedStep`
- cập nhật `state.activeMapZone`
- gọi `saveProgressToFirebase()`

`setActiveMapZone(zone)`:

- set `state.activeMapZone`
- gọi `saveProgressToFirebase()`

### Hàm riêng `resetStateToDefault()`

Đặt state về mặc định khi user chưa có document Firestore.

### Hàm riêng `applyProgressData(data)`

Chuẩn hóa dữ liệu Firestore trước khi đưa vào state:

- ép `currentStep`, `unlockedStep` sang number.
- dùng `clamp()`.
- kiểm tra avatar id.
- kiểm tra `avatarImagePath`, `avatarImageUrl`, `customName` có phải string không.
- fallback tên khách bằng `t("fallback.guest")`.

---

## 6. File `js/firebase/index.js`

`js/firebase/index.js` là module duy nhất khởi tạo Firebase.

### Các import Firebase SDK

File import trực tiếp từ CDN:

- Firebase Auth: `getAuth`, `onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`
- Firestore: `collection`, `doc`, `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `deleteDoc`, `query`, `where`, `serverTimestamp`
- Storage: `getStorage`, `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`
- Functions: `getFunctions`, `httpsCallable`
- App: `initializeApp`

### Object `firebaseConfig`

`firebaseConfig` chứa cấu hình project Firebase:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId`

`apiKey` phía client của Firebase không phải secret tuyệt đối, nhưng quyền đọc/ghi thật sự phải được bảo vệ bằng Firestore rules và Storage rules.

### Các biến `app`, `auth`, `db`, `storage`, `functions`

```js
let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;
```

Các biến được đặt mặc định `null` để nếu Firebase khởi tạo lỗi, các module khác vẫn import được và có thể kiểm tra `if (!auth)` hoặc `if (!db)`.

### Khối `try/catch`

```js
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, "asia-southeast1");
} catch (error) {
    console.error(...);
}
```

`functions` dùng region `"asia-southeast1"`, phải khớp với `setGlobalOptions({ region: "asia-southeast1" })` trong `functions/index.js`.

### Export

File export cả instance và helper SDK. Nhờ vậy các module khác chỉ cần import từ `../firebase/index.js`, không phải import Firebase CDN lặp lại.

---

## 7. File `js/app/i18n.js`

`js/app/i18n.js` quản lý ngôn ngữ và text hiển thị.

### Biến `LANGUAGE_KEY`

```js
const LANGUAGE_KEY = "vkuQuestLanguage";
```

Key localStorage lưu ngôn ngữ hiện tại.

### Biến `SUPPORTED_LANGUAGES`

```js
const SUPPORTED_LANGUAGES = ["vi", "en"];
```

Danh sách ngôn ngữ hợp lệ.

### Object `TEXT`

`TEXT` là dictionary lớn:

```js
const TEXT = {
    vi: { ... },
    en: { ... }
};
```

Mỗi key như `auth.loginTitle`, `toast.loginSuccess`, `home.heroTitle` có bản dịch tương ứng.

### Biến `STATIC_BINDINGS`

`STATIC_BINDINGS` mô tả selector nào trong DOM cần được dịch. Mỗi binding có thể chứa:

- `selector`
- `key`
- `attr`
- `html`
- `accentKey`

`applyTranslations()` dùng danh sách này để cập nhật text.

### Object `AVATAR_EN`

`AVATAR_EN` chứa bản dịch tiếng Anh cho avatar trong `data/avatars.js`.

### Object `ROUTE_EN`

`ROUTE_EN` chứa bản dịch tiếng Anh cho các scene trong `data/route.js`.

### Biến `COMPACT_ROUTE_FIELDS`

```js
const COMPACT_ROUTE_FIELDS = new Set(["body", "notes", "mission", "dialog"]);
```

Các field này sẽ dùng text compact từ `getCompactSceneText()` thay vì lấy full text trực tiếp.

### Hàm `getCurrentLanguage()`

Đọc localStorage bằng `LANGUAGE_KEY`. Nếu giá trị lưu không nằm trong `SUPPORTED_LANGUAGES`, fallback `"vi"`.

### Hàm `getCurrentLocale()`

Trả:

- `"en-US"` nếu language là `"en"`
- `"vi-VN"` nếu language là `"vi"`

Dùng cho `Intl.DateTimeFormat` và `toLocaleString`.

### Hàm `setLanguage(language)`

Luồng:

1. Kiểm tra language hợp lệ.
2. Lưu vào localStorage.
3. Gọi `applyTranslations()`.
4. Dispatch event:

```js
window.dispatchEvent(new CustomEvent("vku-language-change", { detail: { language: nextLanguage } }));
```

Các module như `tour.js`, `home.js`, `events.js`, `auth.js` nghe event này để render lại text động.

### Hàm `t(key, params = {})`

Lấy text theo key.

```js
const template = TEXT[language]?.[key] ?? TEXT.vi[key] ?? key;
```

Thứ tự fallback:

1. Text theo ngôn ngữ hiện tại.
2. Text tiếng Việt.
3. Chính key.

Sau đó replace placeholder:

```js
t("toast.nicknameSet", { name: "An" })
```

Nếu template có `{name}`, nó thay bằng `"An"`.

### Hàm `formatNumber(value)`

Format số theo locale hiện tại.

### Hàm `mountLanguageSwitchers()`

Chèn cụm nút VI/EN vào các container:

- `.home-nav-actions`
- `.profile-nav-actions`
- `.topbar-actions`
- `.auth-container`

Hàm tránh chèn trùng bằng cách kiểm tra:

```js
if (target.querySelector(".language-switcher")) return;
```

### Hàm `applyTranslations()`

Render lại text static theo `STATIC_BINDINGS`.

Các xử lý đặc biệt:

- `.home-hero h1`: dùng `innerHTML` để có `<span>` cho accent.
- `.live-pill`: giữ `<span></span>` trang trí.
- binding có `html`: dùng `translateIconHtml()` để giữ icon.
- binding có `attr`: set attribute như `placeholder`, `aria-label`.

Cuối hàm gọi:

- `syncMoodOptions()`
- `syncLanguageSwitchers()`

### Hàm `getSceneText(scene, field)`

Đây là hàm lấy text scene đúng ngôn ngữ.

Luồng:

1. Nếu không có `scene`, return `""`.
2. Nếu `field` nằm trong `COMPACT_ROUTE_FIELDS`, gọi `getCompactSceneText(scene, field, language)`.
3. Nếu language là `"vi"`, return `scene[field]`.
4. Nếu `field === "chapter"`, tạo text theo stage.
5. Nếu `field === "zoneName"`, map zone sang tên zone.
6. Ngược lại lấy `ROUTE_EN[scene.id]?.[field]`, fallback `scene[field]`.

### Hàm `getCompactSceneText(scene, field, language)`

Tạo nội dung ngắn cho `body`, `notes`, `mission`, `dialog`.

### Hàm `getAvatarText(avatar, field)`

Tương tự `getSceneText()`, nhưng dùng cho avatar.

### Hàm `getZoneName(zone)`

Đổi `"khu-v"` hoặc `"khu-k"` thành tên zone theo ngôn ngữ.

### Hàm `countLabel(count, unitKey)`

Trả chuỗi dạng số + đơn vị dịch.

### Các helper cuối file

- `syncLanguageSwitchers()`: cập nhật active state cho nút VI/EN.
- `syncMoodOptions()`: dịch option mood.
- `translateIconHtml(html, value)`: giữ icon trong button khi dịch.
- `getStageNumber(scene)`: lấy số stage từ `scene.chapter`.

---

## 8. File `data/avatars.js`

File này chỉ export dữ liệu:

```js
export const avatars = [...]
```

Mỗi avatar có:

- `id`: định danh duy nhất.
- `name`: tên mẫu.
- `role`: vai trò hiển thị.
- `icon`: class icon Phosphor.
- `color`: màu đại diện.
- `line`: câu thoại mô tả.

Các file dùng `avatars`:

- `js/app/state.js`
- `js/features/tour.js`
- `js/app/i18n.js`

Nếu thêm avatar mới, cần đảm bảo `id` không trùng.

---

## 9. File `data/route.js`

File này chứa dữ liệu tuyến tham quan.

### Object `PANORAMAS`

```js
export const PANORAMAS = {
    v_cong: "assets/panoramas/v_cong.webp",
    k_e: "assets/panoramas/k_e.webp",
    ...
};
```

`PANORAMAS` giúp route dùng tên ngắn thay vì lặp lại đường dẫn ảnh.

### Mảng `route`

```js
export const route = [
    { id: "v-cong-chinh", ... },
    ...
];
```

Mỗi scene có:

- `id`: id duy nhất, dùng cho Pannellum, Firestore, map.
- `zone`: `"khu-v"` hoặc `"khu-k"`.
- `zoneName`: tên zone mặc định.
- `title`: tên đầy đủ.
- `shortTitle`: tên ngắn.
- `chapter`: chặng.
- `reward`: phần thưởng hiển thị.
- `panorama`: ảnh panorama.
- `mapCoords`: tọa độ phần trăm trên map.
- `body`: mô tả.
- `notes`: ghi chú.
- `mission`: nhiệm vụ.
- `dialog`: câu thoại avatar.
- `easterEggs`: hotspot phụ, nếu có.

Các file phụ thuộc `route`:

- `js/features/tour.js`: tạo scene Pannellum, render story, route list.
- `js/features/map.js`: render dot trên map.
- `js/features/home.js`: render quest summary, library, leaderboard.
- `js/features/moments.js`: gắn moment với scene.
- `js/features/chat-guide.js`: gửi scene hiện tại cho AI.
- `js/app/state.js`: clamp step theo `route.length`.

---

## 10. File `js/ui/ui.js`

### Biến `toastTimer`

```js
let toastTimer;
```

Lưu id timeout hiện tại của toast. Khi show toast mới, code clear timeout cũ để toast mới không bị ẩn quá sớm.

### Hàm `showToast(message)`

Luồng:

1. Tìm `#toast`.
2. Nếu không có, `console.warn(message)` rồi return.
3. Gán `toast.textContent = message`.
4. Bỏ class `hidden`.
5. `window.clearTimeout(toastTimer)`.
6. Tạo timeout mới để sau 2600ms thêm lại class `hidden`.

### Hàm `clamp(value, min, max)`

```js
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
```

Giới hạn `value` trong khoảng `[min, max]`. Dùng nhiều trong `state.js`.

---

## 11. File `js/ui/ui-utils.js`

### Hàm `showSkeleton(containerId, count = 3)`

Tìm container theo id, sau đó render `count` skeleton card.

`Array(count).fill(0).map(...)` tạo danh sách HTML skeleton.

### Hàm `hideSkeleton(containerId, htmlContent)`

Thay skeleton bằng nội dung thật.

### Biến `style`

```js
const style = document.createElement('style');
```

File này tự chèn CSS skeleton vào `document.head`. Đây là side effect của module: chỉ cần import file là style được thêm.

---

## 12. File `js/features/auth.js`

File này xử lý đăng nhập, đăng ký, đăng xuất.

### Biến `isLoginMode`

```js
let isLoginMode = true;
```

Cho biết form đang ở chế độ login hay signup.

### Biến `languageListenerBound`

```js
let languageListenerBound = false;
```

Ngăn bind listener `vku-language-change` nhiều lần.

### Hàm `setupAuthUI()`

Lấy các element:

- `#auth-form`
- `#auth-toggle-link`
- `#auth-toggle-text`
- `#auth-title`
- `#auth-submit-btn`

Nếu thiếu element nào thì return, vì có thể partial chưa load.

Hàm gọi:

- `refreshAuthText()`
- `bindLanguageListener()`

Khi click `#auth-toggle-link`, code đảo `isLoginMode`, refresh text và setup lại UI.

### `form.onsubmit`

```js
form.onsubmit = async (event) => {
```

Callback là `async` vì dùng Firebase Auth:

- `signInWithEmailAndPassword(auth, email, password)`
- `createUserWithEmailAndPassword(auth, email, password)`

Luồng submit:

1. `event.preventDefault()`.
2. Lấy email/password.
3. Nếu không có `auth`, show toast `t("toast.firebaseMissing")`.
4. Disable submit button.
5. Nếu `isLoginMode` là `true`, gọi `await signInWithEmailAndPassword(...)`.
6. Nếu `isLoginMode` là `false`, gọi `await createUserWithEmailAndPassword(...)`.
7. Thành công thì show toast và reload.
8. Lỗi thì show message từ `getAuthErrorMessage(error)`.
9. `finally` mở lại button.

### Hàm `handleLogout()`

Hàm này `async` vì `signOut(auth)` trả Promise.

Nếu thành công:

- show toast `t("toast.logoutSuccess")`
- gọi `refreshAfterAuthChange()`

Nếu lỗi:

- show toast `t("toast.logoutError")`

### Hàm `refreshAfterAuthChange()`

```js
window.location.reload();
```

Reload để toàn bộ app load lại theo trạng thái auth mới.

### Hàm `getAuthErrorMessage(error)`

Map Firebase error code sang text i18n. Ví dụ:

- `"auth/email-already-in-use"` -> `t("auth.error.emailInUse")`
- `"auth/invalid-email"` -> `t("auth.error.invalidEmail")`
- `"auth/invalid-credential"` -> `t("auth.error.invalidCredential")`

### Hàm `refreshAuthText()`

Cập nhật title, submit button, toggle text theo `isLoginMode`.

### Hàm `bindLanguageListener()`

Chỉ bind một lần nhờ `languageListenerBound`. Khi đổi ngôn ngữ, form auth refresh lại text.

---

## 13. File `js/features/theme.js`

File này export default object `Theme`.

### Thuộc tính

- `STORAGE_KEY`: key localStorage.
- `DARK`: string `"dark"`.
- `LIGHT`: string `"light"`.

### Hàm `getCurrent()`

Đọc theme trong localStorage. Nếu không hợp lệ thì fallback `"dark"`.

### Hàm `set(theme)`

Kiểm tra theme hợp lệ. Nếu hợp lệ:

1. Lưu vào localStorage.
2. Gọi `apply(theme)`.
3. Gọi `updateToggleButtons(theme)`.
4. Dispatch event `themechange`.

### Hàm `apply(theme)`

Nếu theme là light, set:

```js
document.documentElement.setAttribute('data-theme', 'light');
```

Nếu dark, remove attribute.

### Hàm `toggle()`

Đảo theme hiện tại từ dark sang light hoặc ngược lại.

### Hàm `updateToggleButtons(currentTheme)`

Cập nhật tất cả `.theme-toggle-btn`:

- `data-target-theme`
- `aria-label`
- `title`
- icon class
- label text

### Hàm `init()`

Đọc theme hiện tại, apply vào document, bind click cho các nút theme và cập nhật trạng thái nút.

---

## 14. File `js/features/nickname.js`

File này bắt user đặt nickname nếu chưa có.

### Biến `NICKNAME_KEY`

```js
const NICKNAME_KEY = STORAGE_KEYS.customName;
```

Dùng lại key `customName` từ `state.js`.

### Biến `MODAL_ID`

```js
const MODAL_ID = "nickname-modal";
```

Id DOM của modal nickname.

### Hàm `checkAndPromptNickname()`

Hàm này trả về `Promise`.

Lý do: nếu user chưa có nickname, Promise chỉ resolve sau khi user nhập tên và bấm xác nhận.

Luồng:

1. Lấy fallback `t("fallback.guest")`.
2. Kiểm tra `state.customName`.
3. Nếu đã có tên thật, resolve ngay.
4. Kiểm tra localStorage bằng `NICKNAME_KEY`.
5. Nếu vẫn chưa có, gọi `showNicknameModal(resolve)`.

### Hàm `showNicknameModal(onConfirm)`

Nếu modal chưa tồn tại, gọi `createModalElement()` rồi append vào `document.body`.

Sau đó reset input, error, counter, button và hiện modal bằng class.

### Hàm `bindModalEvents(modal, onConfirm, cleanup)`

Biến quan trọng:

- `MAX = 24`
- `MIN = 2`

Hàm con `validate(val)` kiểm tra tên:

- không được rỗng
- tối thiểu 2 ký tự
- tối đa 24 ký tự
- không chỉ toàn khoảng trắng

Hàm con `onInput()` cập nhật counter, error, disabled button.

Hàm con `onSubmit()` là `async` vì gọi `await saveProgressToFirebase()`.

Luồng `onSubmit()`:

1. Validate tên.
2. Disable button.
3. Gọi `setProfile(state.selectedAvatar, val)`.
4. Gọi `await saveProgressToFirebase()`.
5. Lưu localStorage.
6. Show toast.
7. Gọi `hideModal(modal)`.
8. Resolve Promise bằng `onConfirm(val)`.

### Hàm `hideModal(modal)`

Ẩn modal bằng class và set `aria-hidden`.

### Hàm `createModalElement()`

Tạo toàn bộ HTML modal bằng JavaScript. Cuối hàm tạo các nút gợi ý nickname. Khi click gợi ý, code set input value và dispatch event `input` để validate lại.

---

## 15. File `js/features/tour.js`

Đây là file trung tâm của trải nghiệm 360 tour.

### Biến `viewer`

```js
let viewer;
```

Lưu instance Pannellum viewer.

### Biến `controlsBound`

```js
let controlsBound = false;
```

Ngăn bind event nhiều lần.

### Biến `idleTimer`, `isCinematic`, `isAudioPlaying`

- `idleTimer`: timeout để phát hiện user không thao tác.
- `isCinematic`: UI đang ở chế độ cinematic hay không.
- `isAudioPlaying`: audio nền đang phát hay không.

### Hàm `resetIdleTimer()`

Nếu đang cinematic, hàm hiện lại UI bằng cách remove class `ui-hidden`. Sau đó clear timeout cũ và set timeout mới 10 giây. Nếu user không thao tác trong 10 giây, app thêm class `ui-hidden` vào `.topbar`, `.quest-panel`, `.right-sidebar`.

### Event global

```js
['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
});
```

Mọi thao tác chính của user đều reset idle timer.

### `setInterval(...)`

Nếu `isCinematic` và có `viewer`, code tăng yaw liên tục để camera tự quay.

### `setMapNavigator((stepIndex) => loadStep(stepIndex))`

Đăng ký callback cho `map.js`. Nhờ vậy `map.js` có thể điều hướng step mà không import trực tiếp `tour.js`.

### `setMomentsChangeHandler(() => renderMap())`

Khi moments thay đổi, map render lại để cập nhật badge số bài.

### Hàm `renderAvatarOptions()`

Render danh sách avatar từ `avatars`.

Biến:

- `container`: `#avatar-options`.
- `nameInput`: `#custom-avatar-name`.
- `startBtn`: `#start-new-tour-btn`.
- `tempSelectedId`: id avatar đang chọn tạm thời.

Hàm con `checkReady()` enable nút start khi đã chọn avatar và nhập tên.

Mỗi `.avatar-card` có:

- event `mousemove` để tạo hiệu ứng 3D.
- event `mouseleave` để reset transform.
- event `click` để chọn avatar.

Khi click `startBtn`:

1. Lấy avatar bằng `avatarById.get(tempSelectedId)`.
2. Lấy tên từ input.
3. Gọi `setProfile(avatar, inputName)`.
4. Gọi `resetProgress()`.
5. Gọi `startTour()`.

### Hàm `renderResumeButton()`

Hiện hoặc ẩn `#resume-tour` dựa vào `hasSavedProgress()`.

### Hàm `bindControls()`

Bind các nút tour:

- `#resume-tour`
- `#change-avatar`
- `#restart-tour`
- `#toggle-audio`
- `#prev-step`
- `#next-step`
- `#tab-khu-v`
- `#tab-khu-k`
- `#tour-logout-btn`
- `#mobile-minimap-btn`
- `#close-minimap-btn`

Hàm cũng gọi:

- `bindMomentControls()`
- `bindSidebarControls()`

### Hàm `bindSidebarControls()`

Quản lý sidebar/page trong tour.

Biến:

- `app`: `#tour-app`.
- `questButton`: `#toggle-quest-sidebar`.
- `momentsButton`: `#toggle-moments-page`.
- `storyButton`: `#toggle-story-sidebar`.

Hàm con:

- `isMobileLayout()`: kiểm tra viewport mobile.
- `applyState()`: đồng bộ class active và ARIA.
- `toggleSidebar(className, storageKey)`: toggle sidebar và lưu localStorage.
- `closeTourPages()`: đóng route/moments/minimap.
- `openTourPage(className)`: mở một page và đóng page còn lại.

### Hàm `startTour()`

Ẩn `#avatar-screen`, hiện `#tour-app`.

Nếu chưa có `viewer`, gọi `initViewer()`.

Sau đó:

```js
loadStep(state.currentStep, { forceViewer: true });
```

### Hàm `showAvatarScreen()`

Ẩn tour, hiện avatar screen, gọi `renderResumeButton()`.

### Hàm `restartTour()`

Gọi `resetProgress()`, `loadStep(0, { forceViewer: true })`, sau đó show toast.

### Hàm `initViewer()`

Nếu `window.pannellum` không tồn tại, show toast và chỉ render UI fallback.

Nếu có Pannellum:

1. Tạo object `pannellumScenes`.
2. Lặp qua `route`.
3. Với mỗi scene, tạo cấu hình:
   - `title`
   - `type: "equirectangular"`
   - `panorama`
   - `autoLoad`
   - `hotSpots`
4. Gọi:

```js
viewer = window.pannellum.viewer("panorama", { ... });
```

Sau đó bind:

```js
viewer.on("scenechange", (sceneId) => { ... });
```

Khi scene thay đổi:

- lấy index bằng `routeIndexById.get(sceneId)`.
- nếu user nhảy quá xa, show toast locked và quay lại.
- nếu hợp lệ, gọi `setCurrentStep(nextIndex)` và `renderExperience()`.

### Hàm `createHotspots(index)`

Tạo hotspot cho scene:

- hotspot easter egg nếu `current.easterEggs` tồn tại.
- hotspot next nếu có scene sau.
- hotspot previous nếu có scene trước.

### Hàm `customHotspot(hotSpotDiv, label)`

Tạo DOM custom cho hotspot gồm icon và label.

### Hàm `toggleAudio()`

Lấy `#ambient-audio`. Nếu đang phát thì pause, nếu đang tắt thì play. `audio.play()` có `.catch(...)` vì browser có thể chặn autoplay.

### Hàm `goNext()`

Nếu đang ở chặng cuối thì gọi `showCongratsScreen()`, ngược lại gọi `loadStep(state.currentStep + 1)`.

### Hàm `showCongratsScreen()`

Hiện `#congrats-screen`, set tên avatar, bind nút review và restart. Dùng attribute `data-listener` để tránh bind lại nhiều lần.

### Hàm `loadStep(index, options = {})`

Đây là hàm đổi chặng quan trọng nhất.

Luồng:

1. Nếu `index` ngoài mảng route, return.
2. Nếu `index > state.unlockedStep + 1`, show toast locked và return.
3. Tính `isNewStep`.
4. Gọi `setCurrentStep(index)`.
5. Nếu là step mới và có `window.confetti`, bắn confetti.
6. Nếu có `viewer`, load scene tương ứng.
7. Gọi `renderExperience()`.

### Hàm `renderExperience()`

Render lại toàn bộ UI của tour:

- zone label.
- progress label.
- progress circle.
- profile.
- story.
- moments.
- route list.
- map.

Hàm này gọi `void renderMomentsForScene(scene)` vì moments là async, app không cần chặn toàn bộ render story/map trong lúc chờ Firestore.

### Hàm `renderProfile()`

Render avatar và thông tin user trong tour. Nếu `state.avatarImageUrl` có giá trị, dùng `<img>`. Nếu không, dùng icon từ `state.selectedAvatar.icon`.

### Hàm `renderStory(scene)`

Set text cho:

- `#scene-chapter`
- `#scene-reward`
- `#avatar-line`
- `#scene-title`
- `#scene-body`
- `#scene-mission`
- `#scene-notes`
- `#prev-step`
- `#next-step`

### Hàm `renderRouteList()`

Render danh sách route theo `state.activeMapZone`.

Biến:

- `isCurrent`: có phải step hiện tại không.
- `isVisited`: đã mở khóa chưa.
- `isLocked`: đang bị khóa không.
- `icon`: class icon tương ứng.
- `classes`: class CSS của button.

Click vào step không bị khóa sẽ gọi `loadStep(Number(button.dataset.step))`.

### Hàm `focusZone(zone)`

Gọi `setActiveMapZone(zone)`, sau đó render lại route list và map.

### Hàm `escapeAttribute(value = "")`

Escape text trước khi đưa vào HTML attribute.

### Hàm `preloadPanoramas()`

Tạo `new Image()` cho từng panorama để browser tải trước.

---

## 16. File `js/features/map.js`

File này render mini map.

### Biến `navigateToStep`

```js
let navigateToStep = () => {};
```

Mặc định là hàm rỗng. `tour.js` sẽ gọi `setMapNavigator()` để gán callback thật.

### Hàm `setMapNavigator(callback)`

Gán callback điều hướng step.

### Hàm `renderMap()`

Lấy:

- `currentScene`
- `mapZoneName`
- `unlockedInZone`
- `totalInZone`
- `mapTitle`
- `unlockLabel`
- `mapImageV`
- `mapImageK`
- `dots`

Nếu thiếu dữ liệu hoặc element, return.

Hàm cập nhật:

- title map.
- label số điểm đã mở.
- alt ảnh map.
- ẩn/hiện map khu V hoặc khu K.
- render `.map-dot`.

Mỗi dot có:

- `data-step`
- `style="left: ...; top: ..."`
- icon lock/pin/check.
- badge moment count từ `getMomentCountByScene(scene.id)`.

Click dot không khóa gọi:

```js
navigateToStep(Number(dot.dataset.step));
```

---

## 17. File `js/features/moments.js`

File này xử lý khoảnh khắc trong tour: tạo, sửa, xóa, upload ảnh, reaction.

### Biến `MAX_IMAGE_SIZE`

```js
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
```

Giới hạn ảnh 5MB.

### Biến `momentCountsByScene`

```js
const momentCountsByScene = new Map();
```

Cache số moment theo `sceneId`, dùng cho badge trên map.

### Biến `controlsBound`

Ngăn bind event nhiều lần.

### Biến `afterMomentsChange`

Callback chạy sau khi moments thay đổi. `tour.js` set callback này thành `renderMap()`.

### Hàm `setMomentsChangeHandler(callback)`

Cho module khác đăng ký callback.

### Hàm `bindMomentControls()`

Bind:

- `#open-moment-form`
- `#cancel-moment`
- `#moment-photo`
- `#moment-form`
- `#moments-list`

`#moments-list` dùng event delegation qua `handleMomentAction(event)`.

### Hàm `renderMomentsForScene(scene = route[state.currentStep])`

Hàm này `async` vì đọc Firestore.

Luồng:

1. Lấy `#moments-list` và `#moment-count-label`.
2. Nếu chưa đăng nhập hoặc không có db, hiện trạng thái locked.
3. Hiện loading.
4. Gọi `await fetchMomentsForScene(scene.id)`.
5. Gọi `await attachReactionSummaries(moments)`.
6. Cập nhật `momentCountsByScene`.
7. Nếu không có moment, hiện empty.
8. Nếu có, render bằng `renderMomentCard(moment)`.
9. Nếu lỗi, show error và toast.

### Hàm `getMomentCountByScene(sceneId)`

Trả số moment đã cache trong `momentCountsByScene`.

### Hàm `fetchMomentsForScene(sceneId)`

Hàm này lấy cả:

- public moments của mọi người.
- own moments của user, kể cả private.

Dùng hai query:

```js
where("visibility", "==", "public")
where("uid", "==", user.uid)
```

Dùng `Promise.allSettled()` để nếu một query lỗi, query còn lại vẫn có thể dùng.

Dùng `Map` tên `merged` để tránh duplicate khi bài của mình là public.

### Hàm `addSceneMoments(snapshot, sceneId, target)`

Duyệt snapshot, normalize moment và chỉ thêm moment có `moment.sceneId === sceneId`.

### Hàm `attachReactionSummaries(moments)`

Lấy reaction cho danh sách moments.

Firestore query `where("momentId", "in", idChunk)` giới hạn số id, nên code chia thành chunk 10.

Hàm tạo:

- `reactionCounts`
- `viewerReaction`

rồi gắn vào từng moment.

### Hàm `handleMomentSubmit(event)`

Hàm này `async` vì có thể upload Storage, ghi Firestore, tạo notification, render lại.

Luồng:

1. `event.preventDefault()`.
2. Check `auth`, `db`, `storage`.
3. Lấy `scene`.
4. Lấy `editId`, `oldImagePath`, `caption`, `mood`, `visibility`, `file`.
5. Nếu caption rỗng, show toast.
6. Nếu có file, validate bằng `validateImageFile(file)`.
7. Disable submit button.
8. Nếu `editId` có giá trị, gọi `updateMoment(...)`.
9. Nếu không, gọi `createMoment(...)`.
10. Tạo notification bằng `createNotification(...)`.
11. Reset form, đóng form.
12. Gọi `await renderMomentsForScene(scene)`.
13. `finally` mở lại button.

### Hàm `createMoment(scene, { caption, mood, visibility, file })`

Tạo document reference trước:

```js
const momentRef = doc(collection(db, "moments"));
```

Lý do: cần `momentRef.id` để tạo path upload ảnh.

Payload gồm:

- `uid`
- `authorName`
- `avatarId`
- `sceneId`
- `sceneTitle`
- `zone`
- `caption`
- `mood`
- `visibility`
- `imageUrl`
- `imagePath`
- `createdAt`
- `updatedAt`

Nếu có file, gọi `uploadMomentImage(...)`.

Cuối cùng:

```js
await setDoc(momentRef, payload);
```

### Hàm `updateMoment(momentId, { caption, mood, visibility, file, oldImagePath })`

Cập nhật caption/mood/visibility/updatedAt.

Nếu có file mới:

- upload ảnh mới.
- set `imageUrl`, `imagePath`.
- xóa ảnh cũ bằng `deleteMomentImage(oldImagePath)`.

### Hàm `handleMomentAction(event)`

Phân loại click:

- `[data-moment-react]` -> `reactToMoment(reactionButton)`
- `[data-moment-edit]` -> `openMomentForm(editButton.dataset.momentEdit)`
- `[data-moment-delete]` -> `deleteMoment(momentId, imagePath)`

### Hàm `reactToMoment(button)`

Hàm này `async` vì đọc/ghi/xóa Firestore.

Document reaction có id:

```js
`${momentId}_${user.uid}`
```

Nhờ vậy mỗi user chỉ có một reaction cho một moment.

Luồng:

1. Đọc reaction hiện có bằng `getDoc(reactionRef)`.
2. Nếu reaction cũ giống reaction mới, xóa document.
3. Nếu khác, `setDoc(reactionRef, ..., { merge: true })`.
4. Nếu reaction cho bài người khác và trước đó chưa reaction, tạo notification.
5. Render lại moments.

### Hàm `createNotification({ uid, type, title, body, momentId = "", sceneId = "" })`

Tạo document trong collection `notifications`.

Hàm dùng `try/catch` và chỉ `console.warn` nếu lỗi, vì notification không nên làm hỏng thao tác chính.

### Hàm `deleteMoment(momentId, imagePath)`

Confirm trước bằng `window.confirm(t("confirm.deleteMoment"))`.

Nếu confirm:

- xóa ảnh nếu có `imagePath`.
- xóa document trong `moments`.
- render lại moments.

### Hàm `uploadMomentImage(uid, momentId, file)`

Upload ảnh vào:

```js
moment-images/{uid}/{momentId}/{timestamp}-{safeName}
```

Sau đó lấy URL bằng `getDownloadURL(imageRef)`.

### Hàm `deleteMomentImage(imagePath)`

Xóa object trong Storage. Có `try/catch` để nếu xóa Storage lỗi thì không crash toàn app.

### Hàm `openMomentForm(momentId = "")`

Nếu không có `momentId`, mở form tạo mới.

Nếu có `momentId`, tìm card tương ứng và fill dữ liệu vào form để sửa.

### Hàm `closeMomentForm()`

Ẩn form, reset hidden fields và preview.

### Hàm `handlePhotoPreview(event)`

Tạo preview ảnh bằng `URL.createObjectURL(file)`.

### Hàm `validateImageFile(file)`

Check:

- `file.type.startsWith("image/")`
- `file.size <= MAX_IMAGE_SIZE`

### Hàm `renderMomentCard(moment)`

Render card moment. Nếu user hiện tại là owner, hiện nút edit/delete.

### Hàm `renderReactionButton(moment, reaction, label)`

Render nút reaction emoji, count và trạng thái active.

### Hàm `normalizeMoment(snapshot)`

Chuyển Firestore snapshot thành object:

```js
return {
    id: snapshot.id,
    ...snapshot.data()
};
```

### Hàm `getTime(value)` và `formatMomentDate(value)`

Hỗ trợ nhiều dạng thời gian:

- Firestore Timestamp có `toMillis()`
- Firestore Timestamp có `toDate()`
- string date

### Hàm `escapeHtml(value = "")` và `escapeAttribute(value = "")`

Escape dữ liệu user trước khi đưa vào HTML.

---

## 18. File `js/features/events.js`

File này xử lý album ảnh sự kiện campus.

### Biến `MAX_EVENT_IMAGE_SIZE`

Giới hạn ảnh sự kiện 5MB.

### Biến `controlsBound`

Ngăn bind form event nhiều lần.

### Listener `vku-language-change`

Khi đổi ngôn ngữ:

- gọi `syncEventFileName()`
- gọi `renderEventGallery()`

### Hàm `bindEventControls()`

Bind:

- `#event-photo-file` -> `handleEventPhotoPreview`
- `#event-photo-form` -> `handleEventPhotoSubmit`

### Hàm `renderEventGallery()`

Hàm `async` vì đọc Firestore.

Luồng:

1. Lấy `#event-photo-gallery`.
2. Nếu chưa đăng nhập hoặc không có db, render empty locked.
3. Hiện loading.
4. Gọi `await fetchEventPhotos()`.
5. Nếu không có ảnh, render empty.
6. Nếu có ảnh, render bằng `renderEventPhotoCard(photo)`.
7. Nếu lỗi, render error và show toast.

### Hàm `handleEventPhotoSubmit(event)`

Hàm `async` vì upload ảnh và ghi Firestore.

Luồng:

1. `event.preventDefault()`.
2. Check `auth`, `db`, `storage`.
3. Lấy `title`, `caption`, `file`.
4. Nếu thiếu field, show toast.
5. Validate ảnh bằng `validateEventImage(file)`.
6. Disable submit button bằng `setSubmitState(submitButton, true)`.
7. Gọi `await createEventPhoto({ title, caption, file })`.
8. Reset form, file name, preview.
9. Show toast.
10. Gọi `await renderEventGallery()`.
11. `finally` mở lại button.

### Hàm `createEventPhoto({ title, caption, file })`

Tạo doc ref:

```js
const photoRef = doc(collection(db, "campusEventPhotos"));
```

Upload ảnh bằng `uploadEventImage(user.uid, photoRef.id, file)`.

Ghi document gồm:

- `uid`
- `authorName`
- `title`
- `caption`
- `imageUrl`
- `imagePath`
- `createdAt`
- `updatedAt`

### Hàm `uploadEventImage(uid, photoId, file)`

Upload vào:

```js
campus-event-photos/{uid}/{photoId}/{timestamp}-{safeName}
```

### Hàm `fetchEventPhotos()`

Đọc toàn bộ collection `campusEventPhotos`, chuyển snapshot thành mảng, sort mới nhất trước.

### Các helper

- `handleEventPhotoPreview(event)`: preview ảnh.
- `syncEventFileName(file)`: hiện tên file.
- `resetEventPhotoPreview()`: ẩn preview.
- `validateEventImage(file)`: check image + 5MB.
- `setSubmitState(button, isSaving)`: đổi trạng thái nút.
- `renderEventPhotoCard(photo)`: render card ảnh.
- `renderEmptyState(icon, message, className = "")`: render empty/loading/error.
- `getTime(value)`, `formatEventDate(value)`: format thời gian.
- `escapeHtml(value = "")`, `escapeAttribute(value = "")`: escape text.

---

## 19. File `js/features/profile.js`

File này xử lý upload avatar profile.

### Biến `MAX_AVATAR_SIZE`

Giới hạn avatar 5MB.

### Biến `controlsBound`

Ngăn bind event nhiều lần.

### Hàm `bindProfileControls()`

Bind:

- `#upload-profile-avatar` click -> trigger `#profile-avatar-file`.
- `#profile-avatar-file` change -> `handleAvatarUpload`.
- `#profile-logout-btn` click -> `handleLogout`.

### Hàm `handleAvatarUpload(event)`

Hàm này `async` vì upload Storage, save Firestore, render dashboard.

Luồng:

1. Lấy file.
2. Nếu không có file, return.
3. Check `auth.currentUser` và `storage`.
4. Validate file bằng `validateAvatarFile(file)`.
5. Lưu `oldImagePath = state.avatarImagePath`.
6. Set loading bằng `setUploadState(button, status, true)`.
7. Gọi `uploadProfileAvatar(auth.currentUser.uid, file)`.
8. Gọi `setProfileAvatarImage(upload.imageUrl, upload.imagePath)`.
9. Gọi `await saveProgressToFirebase()`.
10. Nếu save thành công và có ảnh cũ, gọi `deletePreviousAvatar(oldImagePath, auth.currentUser.uid)`.
11. Gọi `await renderHomeDashboard()`.
12. Show toast.
13. `finally` reset input và loading.

### Hàm `uploadProfileAvatar(uid, file)`

Upload vào:

```js
profile-avatars/{uid}/{timestamp}-{safeName}
```

Sau đó lấy URL bằng `getDownloadURL(imageRef)`.

### Hàm `deletePreviousAvatar(imagePath, uid)`

Chỉ xóa nếu:

```js
imagePath.startsWith(`profile-avatars/${uid}/`)
```

Điều này tránh xóa nhầm file của user khác.

### Hàm `validateAvatarFile(file)`

Check image type và size.

### Hàm `setUploadState(button, status, isUploading)`

Cập nhật:

- `button.disabled`
- `button.innerHTML`
- `status.textContent`

---

## 20. File `js/features/home.js`

File này render dashboard.

### Biến `TOTAL_STEPS`

```js
const TOTAL_STEPS = route.length;
```

Tổng số chặng route.

### Biến `NOTIFICATION_TYPES`

Map type notification sang icon và title key:

- `moment_created`
- `moment_updated`
- `reaction_received`

### Listener `vku-language-change`

Khi đổi ngôn ngữ, gọi lại `renderHomeDashboard()`.

### Hàm `renderHomeDashboard()`

Hàm này `async`.

Đầu tiên gọi `renderQuestSummary()` vì hàm này chỉ dùng dữ liệu local.

Sau đó:

```js
await Promise.all([
    renderLeaderboard(),
    renderLibrary(),
    renderProfile(),
    renderAchievements(),
    renderNotifications()
]);
```

Các phần dashboard độc lập nên chạy song song.

### Hàm `renderQuestSummary()`

Render danh sách quest từ `route`. Mỗi card có trạng thái unlock dựa vào:

```js
const isUnlocked = index <= state.unlockedStep;
```

### Hàm `renderLeaderboard()`

Hiện loading, gọi `fetchLeaderboardData()`, rồi render bằng `renderLeaderboardRows()`.

Nếu lỗi, fallback về `currentUserRank()`.

### Hàm `renderLeaderboardRows(table, rows, note = "")`

Render bảng leaderboard.

### Hàm `fetchLeaderboardData()`

Hàm `async` vì gọi:

```js
const snapshot = await getDocs(collection(db, "tourProgress"));
```

Luồng:

1. Nếu chưa login/db, return local row.
2. Đọc collection `tourProgress`.
3. Normalize từng progress bằng `normalizeProgress(...)`.
4. Nếu current user chưa có trong rows, thêm local row.
5. Sort theo score và unlockedStep.
6. Tính rank user hiện tại.

### Hàm `renderLibrary()`

Render 3 card:

- số chặng đã mở.
- số moments của user.
- danh sách điểm đã mở khóa.

Hàm gọi `await fetchOwnMoments()` nên là async.

### Hàm `renderProfile()`

Hàm `async` vì cần lấy song song:

- `fetchOwnMoments()`
- `fetchNotifications()`
- `fetchReceivedReactionCount()`
- `fetchLeaderboardData()`

Sau đó tính:

- `completedQuests`
- `totalXp`
- `xpTarget`
- `xpCurrent`
- `xpPercent`
- `level`

Rồi cập nhật DOM profile.

### Hàm `renderNotifications()`

Lấy notifications, tính unread badge, build activity từ notifications + moments.

### Hàm `renderAchievements()`

Nếu chưa login/db, render message yêu cầu login.

Nếu có db:

1. Thử lấy achievements thật bằng `fetchUserAchievements()`.
2. Nếu có, render.
3. Nếu không có, generate achievements bằng `buildAchievementsFromFirebaseData(...)`.

### Hàm `fetchUserAchievements()`

Query collection `achievements` theo uid.

### Hàm `buildAchievementsFromFirebaseData({ moments, reactionCount, leaderboardData })`

Sinh achievement từ dữ liệu hiện có:

- `Quest Starter`
- `Campus Navigator`
- `VKU 360 Finisher`
- `Moment Keeper`
- `Campus Signal`
- `Top Explorer`

### Các helper còn lại

- `renderAchievementCard(achievement)`
- `renderAchievementEmpty(grid, message)`
- `normalizeAchievement(achievement)`
- `normalizeRarity(value = "rare")`
- `normalizeIcon(value = "")`
- `formatRarity(rarity)`
- `fetchNotifications()`
- `fetchReceivedReactionCount()`
- `renderActivityItem(activity, index = 0)`
- `buildProfileActivity(notifications, moments)`
- `fetchOwnMoments()`
- `currentUserRank()`
- `normalizeProgress(progress)`
- `firstFiniteNumber(...values)`
- `clampStep(value)`
- `getTime(value)`
- `formatDate(value)`
- `formatCompact(value)`
- `setText(id, value)`
- `renderAvatarMarkup()`
- `escapeHtml(value = "")`
- `escapeAttribute(value = "")`

---

## 21. File `js/features/chat-guide.js`

File này tạo widget chat AI.

### Biến `guideCallable`

Callable reference tới Cloud Function `chatGuide`.

### Biến `isMounted`

Ngăn mount widget chat nhiều lần.

### Biến `isSending`

Ngăn gửi nhiều message cùng lúc.

### Hàm `setupGuideChat()`

Nếu `isMounted` là true thì return.

Tạo callable:

```js
guideCallable = functions ? httpsCallable(functions, "chatGuide") : null;
```

Tạo `<aside class="guide-chat">`, gọi `renderGuideTemplate(root)`, append vào body, bind event, thêm welcome message.

### Hàm `renderGuideTemplate(root)`

Render HTML chat widget:

- toggle button.
- panel.
- header.
- messages list.
- form input.
- send button.

### Hàm `bindGuideEvents(root)`

Bind:

- click toggle.
- click close.
- submit form.

### Hàm `handleGuideSubmit(root, event)`

Hàm này `async` vì gọi Cloud Function.

Luồng:

1. `event.preventDefault()`.
2. Nếu `isSending`, return.
3. Lấy message.
4. Nếu message rỗng, return.
5. Add user message bằng `addGuideMessage(root, "user", message)`.
6. Clear input.
7. Nếu chưa login, show toast và add assistant message.
8. Nếu không có `guideCallable`, báo lỗi.
9. Set sending true.
10. Add skeleton message.
11. Gọi:

```js
const result = await guideCallable({
    message: ...,
    language: currentLang,
    currentScene: buildCurrentScenePayload(),
    progress: {
        currentStep: state.currentStep,
        unlockedStep: state.unlockedStep,
    },
});
```

12. Set text trả lời từ `result.data?.reply`.
13. Catch lỗi và show message lỗi.
14. Finally set sending false.

### Hàm `buildCurrentScenePayload()`

Lấy scene hiện tại từ `route[state.currentStep]`, rồi trả object đã rút gọn gồm:

- `id`
- `zone`
- `zoneName`
- `title`
- `shortTitle`
- `chapter`
- `body`
- `mission`
- `notes`

### Hàm `setGuideOpen(root, isOpen)`

Toggle class `is-open`, cập nhật ARIA và focus input khi mở.

### Hàm `addGuideMessage(root, role, text, isSkeleton = false)`

Tạo bubble chat. Nếu không skeleton, dùng `textContent` để tránh HTML injection.

### Hàm `setSending(root, sending)`

Set `isSending`, disable/enable input và button.

---

## 22. File `functions/index.js`

Đây là backend Cloud Functions.

### Import

```js
const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
```

File này dùng CommonJS `require`, không dùng ES Module như frontend.

### Biến `GEMINI_API_KEY`

```js
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
```

Khai báo secret Firebase. API key Gemini không nằm ở frontend.

### Biến `GEMINI_MODEL`

```js
const GEMINI_MODEL = "gemini-2.5-flash";
```

Tên model Gemini được gọi.

### Biến `MAX_CHAT_MESSAGE_LENGTH`

Giới hạn message user tối đa 1000 ký tự.

### `setGlobalOptions(...)`

```js
setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});
```

- `region`: region Cloud Function.
- `maxInstances`: giới hạn số instance để kiểm soát chi phí.

### Function `exports.chatGuide`

```js
exports.chatGuide = onCall(
  {
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 60,
  },
  async (request) => { ... }
);
```

Đây là callable function. Callback là `async` vì gọi Gemini API bằng `fetch`.

### Kiểm tra auth

```js
if (!request.auth) {
  throw new HttpsError("unauthenticated", ...);
}
```

Chỉ user đăng nhập mới được dùng guide.

### Sanitize input

```js
const message = String(request.data?.message || "").trim();
const currentScene = sanitizeScene(request.data?.currentScene);
const progress = sanitizeProgress(request.data?.progress);
```

Không tin dữ liệu từ frontend. Backend ép kiểu và sanitize trước.

### Validate message

Nếu message rỗng, throw `invalid-argument`.

Nếu message dài hơn `MAX_CHAT_MESSAGE_LENGTH`, throw `invalid-argument`.

### Gọi Gemini API

```js
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
  { ... }
);
```

Phải `await` vì đây là HTTP request.

Headers:

- `"x-goog-api-key": GEMINI_API_KEY.value()`
- `"Content-Type": "application/json"`

Body gồm:

- `systemInstruction`
- `contents`
- `generationConfig`

### Xử lý response lỗi

Nếu `!response.ok`, code đọc `errorText`, log bằng `logger.error(...)`, rồi throw `HttpsError("internal", ...)`.

### Xử lý response thành công

```js
const data = await response.json();
```

Phải `await` vì parse JSON từ response cũng là async.

Sau đó lấy text trong:

```js
data.candidates?.[0]?.content?.parts
```

và return:

```js
return { reply: reply || "Minh chua co cau tra loi phu hop." };
```

### Hàm `sanitizeScene(scene)`

Chỉ giữ field cần thiết của scene và cắt độ dài:

- `body` tối đa 700 ký tự.
- `mission` tối đa 300 ký tự.
- `notes` tối đa 4 item, mỗi item 220 ký tự.

### Hàm `sanitizeProgress(progress)`

Chỉ giữ:

- `currentStep`
- `unlockedStep`

Nếu không phải number hợp lệ, fallback `0`.

### Hàm `stringOrEmpty(value)`

Nếu `value` là string thì trả `value`, nếu không thì trả `""`.

---

## 23. File `skills/react-components/scripts/validate.js`

Đây là script phụ trong thư mục skill, không phải runtime chính của app.

### Import

- `swc` từ `@swc/core`.
- `fs` từ `node:fs`.
- `path` từ `node:path`.

### Biến `HEX_COLOR_REGEX`

```js
const HEX_COLOR_REGEX = /#[0-9A-Fa-f]{6}/;
```

Regex tìm màu hex 6 ký tự.

### Hàm `validateComponent(filePath)`

Hàm này `async` vì `swc.parse(...)` trả Promise.

Luồng:

1. Đọc file bằng `fs.readFileSync(filePath, 'utf-8')`.
2. Lấy `filename`.
3. Parse code:

```js
const ast = await swc.parse(code, { syntax: "typescript", tsx: true });
```

4. Tạo:
   - `hasInterface = false`
   - `tailwindIssues = []`
5. Duyệt AST bằng `walk(node)`.

### Hàm con `walk(node)`

Kiểm tra:

- Nếu node là `TsInterfaceDeclaration` và tên kết thúc bằng `Props`, set `hasInterface = true`.
- Nếu node là `JSXAttribute` tên `className` và value chứa hex color, thêm vào `tailwindIssues`.
- Sau đó duyệt tiếp các field con của node.

### Kết quả

Nếu có Props interface và không có hardcoded hex, script `process.exit(0)`.

Nếu không, script `process.exit(1)`.

---

## 24. Firestore và Storage liên quan đến JavaScript

Các collection JavaScript đang dùng:

- `tourProgress`: lưu tiến độ.
- `moments`: lưu khoảnh khắc.
- `momentReactions`: lưu reaction.
- `notifications`: lưu thông báo.
- `achievements`: lưu achievement.
- `campusEventPhotos`: lưu ảnh sự kiện.

Các path Storage đang dùng:

- `moment-images/{uid}/{momentId}/{fileName}`
- `profile-avatars/{uid}/{fileName}`
- `campus-event-photos/{uid}/{photoId}/{fileName}`

Frontend validate ảnh để UX tốt hơn, nhưng bảo mật thật sự nằm ở `firebase/storage.rules`.

---

## 25. Các điểm cần chú ý khi sửa code

1. Phải load partial bằng `loadPagePartials()` trước khi query DOM trong các page.
2. Các hàm bind như `bindControls()`, `bindMomentControls()`, `bindEventControls()`, `bindProfileControls()` đều dùng flag để tránh bind lặp.
3. Nên sửa state qua setter như `setCurrentStep()`, `setProfile()`, `setProfileAvatarImage()`, `setActiveMapZone()`, `resetProgress()`.
4. Dữ liệu user nhập như caption, title, authorName phải escape bằng `escapeHtml()` hoặc `escapeAttribute()`.
5. Mọi thao tác Firebase nên có `try/catch`.
6. Upload ảnh luôn cần check type và size ở frontend, đồng thời Storage rules cũng phải check lại.
7. `chat-guide.js` gửi English request nhưng `functions/index.js` hiện vẫn có system instruction yêu cầu tiếng Việt. Nếu cần hỗ trợ tiếng Anh tốt, nên sửa backend để đọc `request.data.language`.
8. `tour.js` đang add listener cho `#restart-tour` hai lần trong `bindControls()`. Nên xóa một dòng để tránh click chạy lặp.

---

## 26. Bảng tóm tắt toàn bộ file `.js`

| File | Vai trò | Dùng `async/await` vì |
| --- | --- | --- |
| `js/app/main.js` | Khởi động app, load partial, nghe auth | `fetch()`, Firestore progress, render dashboard/gallery |
| `js/app/state.js` | Quản lý state và sync Firestore/localStorage | `getDoc()`, `setDoc()` |
| `js/app/i18n.js` | Dịch giao diện, format locale | Không cần async |
| `js/firebase/index.js` | Khởi tạo Firebase SDK | Không cần async |
| `data/avatars.js` | Dữ liệu avatar | Không cần async |
| `data/route.js` | Dữ liệu route/panorama/map | Không cần async |
| `js/ui/ui.js` | Toast, `clamp()` | Không cần async |
| `js/ui/ui-utils.js` | Skeleton loading | Không cần async |
| `js/features/auth.js` | Login/signup/logout | Firebase Auth |
| `js/features/theme.js` | Theme dark/light | Không cần async |
| `js/features/nickname.js` | Modal nickname | `saveProgressToFirebase()` |
| `js/features/tour.js` | Tour 360, route, story, map | Chủ yếu sync, gọi async moments bằng `void` |
| `js/features/map.js` | Mini map | Không cần async |
| `js/features/moments.js` | CRUD moments, upload ảnh, reaction | Firestore/Storage |
| `js/features/events.js` | Album ảnh sự kiện | Firestore/Storage |
| `js/features/profile.js` | Upload avatar profile | Storage + save progress |
| `js/features/home.js` | Dashboard, leaderboard, library, profile | Nhiều query Firestore |
| `js/features/chat-guide.js` | Widget chat AI | Callable Cloud Function |
| `functions/index.js` | Cloud Function gọi Gemini | HTTP `fetch()` tới Gemini |
| `skills/react-components/scripts/validate.js` | Validate React component | `swc.parse()` trả Promise |

---

## 27. Cách trình bày nhanh khi bảo vệ project

Bạn có thể nói:

> Project dùng frontend static ES Module. `js/app/main.js` là entry point, nạp các HTML partial trong `pages/*.html`, sau đó bind UI và nghe Firebase Auth. State trung tâm nằm ở `js/app/state.js`, được đồng bộ lên Firestore nếu user đăng nhập và fallback localStorage nếu không có Firebase. Trải nghiệm tour 360 nằm ở `js/features/tour.js`, dùng dữ liệu từ `data/route.js` để tạo Pannellum scene, render story, route list, minimap và progress. Các khoảnh khắc trong tour nằm ở `js/features/moments.js`, dùng Firestore để lưu caption/reaction và Storage để upload ảnh. Chat AI không gọi Gemini trực tiếp ở frontend mà gọi Cloud Function `chatGuide` trong `functions/index.js`, function này dùng Firebase Secret `GEMINI_API_KEY` để bảo vệ API key.

