# Giải thích cấu trúc code project

## Tổng quan

Project là web tour 360 "VKU 360 Quest". Người dùng đăng nhập bằng Firebase Auth, chọn avatar, đi qua các chặng trong Khu V/Khu K, xem panorama bằng Pannellum, theo dõi tiến độ, xem lộ trình và bản đồ nhỏ.

Sau khi tách file, `index.html` chỉ giữ HTML giao diện và gọi entry chính:

```html
<script type="module" src="js/main.js"></script>
```

`script.js` hiện chỉ còn là wrapper tương thích:

```js
import "./js/main.js";
```

## Cấu trúc thư mục

```txt
best-web-design/
|- index.html
|- style.css
|- script.js
|- improve.md
|- explain.md
|- image_web/
|  |- fullmap_khuV.jpg
|  `- fullmap_khuK.jpg
|- data/
|  |- avatars.js
|  `- route.js
|- js/
|  |- main.js
|  |- firebase.js
|  |- auth.js
|  |- state.js
|  |- tour.js
|  |- map.js
|  |- moments.js
|  `- ui.js
`- firebase/
   |- firestore.rules
   `- storage.rules
```

## Vai trò từng file

### `index.html`

Chứa khung giao diện chính:

- `#auth-screen`: màn hình đăng nhập/đăng ký.
- `#avatar-screen`: màn hình chọn avatar và tên nhân vật.
- `#tour-app`: màn hình tour chính.
- `.quest-panel`: hồ sơ người dùng và danh sách chặng.
- `.story-panel`: nội dung địa điểm hiện tại.
- `.minimap-panel`: bản đồ khu vực và các điểm trên bản đồ.
- `#congrats-screen`: màn hình chúc mừng khi hoàn thành tour.
- `#toast`: vùng hiển thị thông báo nhanh.

### `style.css`

Chứa toàn bộ style hiện tại:

- Biến màu, font, nền panorama.
- Layout desktop 3 cột cho tour.
- Giao diện auth, avatar cards, route list, story panel, minimap.
- Responsive cho tablet/mobile.
- Style màn hình chúc mừng và toast.

### `data/avatars.js`

Export danh sách avatar:

```js
export const avatars = [...]
```

Mỗi avatar có:

- `id`: mã avatar.
- `name`: tên mặc định.
- `role`: vai trò.
- `icon`: icon Phosphor.
- `color`: màu đại diện.
- `line`: câu thoại/giới thiệu.

### `data/route.js`

Export dữ liệu panorama và danh sách chặng:

```js
export const PANORAMAS = {...}
export const route = [...]
```

Mỗi chặng có:

- `id`: mã địa điểm.
- `zone`: khu, ví dụ `khu-v`, `khu-k`.
- `zoneName`: tên khu hiển thị.
- `title`, `shortTitle`: tên đầy đủ và tên ngắn.
- `chapter`: số chặng.
- `reward`: điểm thưởng.
- `panorama`: ảnh 360.
- `mapCoords`: tọa độ dot trên bản đồ.
- `body`: mô tả địa điểm.
- `notes`: ghi chú khám phá.
- `mission`: nhiệm vụ nhỏ.
- `dialog`: lời thoại của avatar.

### `js/firebase.js`

Khởi tạo Firebase và export các service:

- `auth`: Firebase Authentication.
- `db`: Cloud Firestore.
- `storage`: Firebase Storage.
- `onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`.

File này là nơi duy nhất chứa `firebaseConfig`.

### `js/auth.js`

Xử lý đăng nhập/đăng ký/đăng xuất:

- `setupAuthUI()`: gắn sự kiện cho form auth và chuyển giữa đăng nhập/đăng ký.
- `handleLogout()`: đăng xuất tài khoản.
- Dịch một số lỗi Firebase phổ biến sang tiếng Việt.
- Có loading state cho nút submit để tránh bấm lặp.

### `js/state.js`

Quản lý trạng thái dùng chung:

- `state.selectedAvatar`
- `state.customName`
- `state.currentStep`
- `state.unlockedStep`
- `state.activeMapZone`
- `state.hasRemoteProgress`
- `state.progressLoaded`

Các hàm chính:

- `hydrateProgressFromFirebase()`: đọc tiến độ từ Firestore theo `tourProgress/{uid}`.
- `hydrateState()`: fallback đọc tiến độ từ `localStorage` khi Firebase không hoạt động.
- `saveProgressToFirebase()`: lưu tiến độ hiện tại lên Firestore; fallback local nếu không có Firebase.
- `setProfile()`: cập nhật avatar và tên.
- `resetProgress()`: đưa tour về chặng đầu.
- `setCurrentStep()`: cập nhật chặng hiện tại và mở khóa.
- `setActiveMapZone()`: đổi khu đang xem trên bản đồ.

Firestore là nguồn dữ liệu chính cho tiến độ. `localStorage` chỉ còn là fallback khi Firebase không khả dụng.

### `js/tour.js`

Là module điều phối trải nghiệm tour:

- Render danh sách avatar.
- Bắt đầu tour.
- Đổi avatar.
- Restart tour.
- Khởi tạo Pannellum viewer.
- Tạo hotspot trong panorama.
- Chuyển chặng trước/sau.
- Render nội dung địa điểm.
- Render hồ sơ người dùng.
- Render route list.
- Điều phối render minimap.
- Gọi render khoảnh khắc mỗi khi đổi địa điểm.

Các hàm export chính:

- `renderAvatarOptions()`
- `renderResumeButton()`
- `bindControls()`
- `startTour()`
- `showAvatarScreen()`
- `restartTour()`
- `loadStep()`
- `preloadPanoramas()`

### `js/map.js`

Render bản đồ nhỏ:

- Hiển thị đúng ảnh bản đồ Khu V hoặc Khu K.
- Tính số điểm đã mở trong khu.
- Render dot theo `mapCoords`.
- Dot khóa không cho click.
- Dot đã mở cho phép chuyển đến chặng tương ứng.
- Dot có badge nếu cache hiện tại biết địa điểm đó có khoảnh khắc.

`setMapNavigator()` nhận callback từ `tour.js` để tránh phụ thuộc vòng tròn giữa `map.js` và `tour.js`.

### `js/ui.js`

Chứa helper UI dùng chung:

- `showToast(message)`: hiển thị thông báo nhanh.
- `clamp(value, min, max)`: giới hạn giá trị số.

### `js/moments.js`

Xử lý tính năng "Đăng khoảnh khắc tại địa điểm".

Module này xử lý:

- Form đăng/sửa khoảnh khắc.
- Validate caption bắt buộc, ảnh tối đa 5MB và phải là `image/*`.
- Upload ảnh lên Firebase Storage tại `moment-images/{uid}/{momentId}/{fileName}`.
- Lưu metadata bài đăng lên Firestore collection `moments`.
- Render danh sách khoảnh khắc theo `sceneId`.
- Query bài `public` và bài của chính user, lọc theo `sceneId` rồi merge chống trùng.
- Sửa/xóa bài đăng của chính người dùng; nếu bài có ảnh thì xóa cả file Storage.
- Cập nhật cache số khoảnh khắc để minimap có badge.

Không nên lưu ảnh hoặc dữ liệu bài đăng dài hạn trong `localStorage`.

### `firebase/firestore.rules`

Rule mẫu cho Firestore:

- `tourProgress/{uid}`: chỉ chủ tài khoản được đọc/ghi tiến độ của mình.
- `moments/{momentId}`: bài public được đọc công khai, bài riêng tư chỉ chủ bài đọc; chỉ chủ bài được sửa/xóa.

### `firebase/storage.rules`

Rule mẫu cho ảnh khoảnh khắc:

- Ảnh nằm trong `moment-images/{uid}/{momentId}/{fileName}`.
- Chỉ chủ `uid` được upload.
- User đã đăng nhập được đọc ảnh; quyền riêng tư bài đăng do Firestore kiểm soát qua việc có trả `imageUrl` hay không.
- Giới hạn file nhỏ hơn 5MB.
- Chỉ nhận file có `contentType` là ảnh.

## Luồng chạy chính

1. Trình duyệt tải `index.html`.
2. `index.html` tải Pannellum, Phosphor Icons và `js/main.js`.
3. `js/main.js` gọi `setupAuthUI()`.
4. Nếu Firebase Auth hoạt động, app đợi `onAuthStateChanged`.
5. Khi người dùng đăng nhập:
   - Ẩn auth screen.
   - Hiện avatar screen nếu chưa vào tour.
   - Gọi `bootTourShell()`.
6. `bootTourShell()`:
   - Nếu có user, đọc tiến độ bằng `hydrateProgressFromFirebase()`.
   - Nếu không có Firebase, fallback bằng `hydrateState()`.
   - Render avatar bằng `renderAvatarOptions()`.
   - Gắn event bằng `bindControls()`.
   - Hiện/ẩn nút tiếp tục bằng `renderResumeButton()`.
   - Preload ảnh panorama.
7. Khi bắt đầu tour, `startTour()` khởi tạo Pannellum và gọi `loadStep()`.
8. `loadStep()` cập nhật state, lưu tiến độ lên Firestore, đổi scene 360 và render lại UI.
9. `renderExperience()` cập nhật profile, nội dung chặng, route list, minimap và khoảnh khắc của địa điểm.

## Dữ liệu Firebase

Tiến độ tour:

- Path: `tourProgress/{uid}`.
- Fields: `uid`, `avatarId`, `customName`, `currentStep`, `unlockedStep`, `activeMapZone`, `createdAt`, `updatedAt`.

Khoảnh khắc:

- Firestore path: `moments/{momentId}`.
- Storage path: `moment-images/{uid}/{momentId}/{fileName}`.
- Fields: `uid`, `authorName`, `avatarId`, `sceneId`, `sceneTitle`, `zone`, `caption`, `mood`, `visibility`, `imageUrl`, `imagePath`, `createdAt`, `updatedAt`.
- `visibility` v1 chỉ có `private` và `public`.
