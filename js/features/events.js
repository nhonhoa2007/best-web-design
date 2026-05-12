import {
    auth,
    collection,
    db,
    doc,
    getDocs,
    getDownloadURL,
    ref,
    serverTimestamp,
    setDoc,
    storage,
    uploadBytes
} from "../firebase/index.js";
import { getCurrentLocale, translate } from "../app/i18n.js";
import { state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024;

let controlsBound = false;

window.addEventListener("vku-language-change", () => {
    syncEventFileName();
    void renderEventGallery();
});

export function bindEventControls() {
    // Gắn sự kiện cho các điều khiển trong phần Sự kiện
    // Mục đích: Thiết lập lắng nghe sự kiện thay đổi file ảnh và gửi form đăng ảnh sự kiện.
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("event-photo-file")?.addEventListener("change", handleEventPhotoPreview);
    document.getElementById("event-photo-form")?.addEventListener("submit", handleEventPhotoSubmit);
}

export async function renderEventGallery() {
    // Hiển thị danh sách ảnh sự kiện
    // Mục đích: Kiểm tra đăng nhập, tải dữ liệu từ Firebase và render danh sách ảnh vào giao diện gallery.
    // Ghi chú Async: Hàm này 'await' quá trình lấy dữ liệu từ Firestore (fetchEventPhotos). Việc này đảm bảo gallery chỉ được vẽ sau khi đã nhận đủ dữ liệu ảnh từ server.
    const gallery = document.getElementById("event-photo-gallery");
    if (!gallery) return;

    if (!auth?.currentUser || !db) {
        gallery.innerHTML = renderEmptyState("ph-lock-key", translate("events.emptyLogin"));
        return;
    }

    gallery.innerHTML = renderEmptyState("ph-spinner-gap", translate("events.loadingGallery"), "is-loading");

    try {
        const photos = await fetchEventPhotos();

        if (!photos.length) {
            gallery.innerHTML = renderEmptyState("ph-images", translate("events.empty"));
            return;
        }

        gallery.innerHTML = photos.map(renderEventPhotoCard).join("");
    } catch (error) {
        console.warn("Event gallery load error:", error);
        gallery.innerHTML = renderEmptyState("ph-warning", translate("events.loadError"), "error");
        showToast(translate("toast.eventLoadError"));
    }
}

async function handleEventPhotoSubmit(event) {
    // Xử lý khi người dùng gửi form đăng ảnh
    // Mục đích: Kiểm tra dữ liệu đầu vào, thực hiện upload ảnh và lưu thông tin vào Firestore, sau đó cập nhật lại gallery.
    // Ghi chú Async: Cần đợi (await) toàn bộ quy trình tải ảnh và lưu database (createEventPhoto) hoàn tất trước khi reset form và làm mới danh sách hiển thị.
    event.preventDefault();

    if (!auth?.currentUser || !db || !storage) {
        showToast(translate("toast.needLoginEventPhoto"));
        return;
    }

    const form = event.currentTarget;
    const titleInput = document.getElementById("event-photo-title");
    const captionInput = document.getElementById("event-photo-caption");
    const fileInput = document.getElementById("event-photo-file");
    const submitButton = document.getElementById("event-photo-submit");
    const title = titleInput?.value.trim() || "";
    const caption = captionInput?.value.trim() || "";
    const file = fileInput?.files?.[0] || null;

    if (!title || !caption || !file) {
        showToast(translate("toast.eventMissingFields"));
        return;
    }

    if (!validateEventImage(file)) return;

    setSubmitState(submitButton, true);

    try {
        await createEventPhoto({ title, caption, file });
        form.reset();
        syncEventFileName();
        resetEventPhotoPreview();
        showToast(translate("toast.eventPhotoSaved"));
        await renderEventGallery();
    } catch (error) {
        console.error("Event photo save error:", error);
        showToast(translate("toast.eventPhotoSaveError"));
    } finally {
        setSubmitState(submitButton, false);
    }
}

async function createEventPhoto({ title, caption, file }) {
    // Tạo bản ghi ảnh sự kiện mới trên Firebase
    // Mục đích: Upload file ảnh lên Storage và lưu metadata (tiêu đề, tác giả, đường dẫn ảnh) vào Firestore.
    // Ghi chú Async: Sử dụng 'await' hai lần: một lần cho việc tải ảnh lên Storage và một lần để ghi dữ liệu vào Firestore. Cả hai tác vụ này đều tốn thời gian vì phải giao tiếp với server.
    const user = auth.currentUser;
    const photoRef = doc(collection(db, "campusEventPhotos"));
    const upload = await uploadEventImage(user.uid, photoRef.id, file);

    await setDoc(photoRef, {
        uid: user.uid,
        authorName: state.customName || translate("fallback.explorer"),
        title,
        caption,
        imageUrl: upload.imageUrl,
        imagePath: upload.imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

async function uploadEventImage(uid, photoId, file) {
    // Tải ảnh lên Firebase Storage
    // Mục đích: Lưu file vào đúng đường dẫn theo UID người dùng và trả về URL để truy cập ảnh.
    // Ghi chú Async: Đợi (await) uploadBytes() để file được tải lên hoàn toàn, sau đó lại đợi getDownloadURL() để lấy link ảnh công khai từ server.
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const imagePath = `campus-event-photos/${uid}/${photoId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function fetchEventPhotos() {
    // Lấy toàn bộ ảnh sự kiện từ Firestore
    // Mục đích: Truy xuất danh sách ảnh và sắp xếp chúng theo thời gian mới nhất lên đầu.
    // Ghi chú Async: 'await' hàm getDocs() để truy vấn toàn bộ bản ghi trong collection 'campusEventPhotos' từ database đám mây.
    const snapshot = await getDocs(collection(db, "campusEventPhotos"));
    const photos = [];
    snapshot.forEach((item) => photos.push({ id: item.id, ...item.data() }));
    return photos.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

function handleEventPhotoPreview(event) {
    // Hiển thị ảnh xem trước khi chọn file
    // Mục đích: Tạo URL tạm thời để hiển thị ảnh ngay lập tức cho người dùng kiểm tra trước khi bấm đăng.
    const file = event.target.files?.[0] || null;
    const preview = document.getElementById("event-photo-preview");
    syncEventFileName(file);
    if (!preview) return;

    if (!file) {
        resetEventPhotoPreview();
        return;
    }

    if (!validateEventImage(file)) {
        event.target.value = "";
        syncEventFileName();
        resetEventPhotoPreview();
        return;
    }

    const imageUrl = URL.createObjectURL(file);
    preview.classList.remove("hidden");
    preview.innerHTML = `<img src="${imageUrl}" alt="${translate("events.previewAlt")}" decoding="async">`;
}

function syncEventFileName(file = document.getElementById("event-photo-file")?.files?.[0] || null) {
    // Đồng bộ tên file hiển thị trên giao diện
    // Mục đích: Cập nhật văn bản hiển thị tên file đã chọn hoặc thông báo 'Chưa chọn file'.
    const fileName = document.getElementById("event-photo-file-name");
    if (!fileName) return;

    fileName.textContent = file ? file.name : translate("events.noFileSelected");
}

function resetEventPhotoPreview() {
    // Đặt lại phần xem trước ảnh
    // Mục đích: Ẩn vùng xem trước và xóa dữ liệu ảnh cũ khi form được reset hoặc file bị xóa.
    const preview = document.getElementById("event-photo-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateEventImage(file) {
    // Kiểm tra tính hợp lệ của file ảnh
    // Mục đích: Đảm bảo file chọn là định dạng ảnh và có dung lượng không vượt quá giới hạn (5MB).
    if (!file.type.startsWith("image/")) {
        showToast(translate("toast.imageOnly"));
        return false;
    }

    if (file.size > MAX_EVENT_IMAGE_SIZE) {
        showToast(translate("toast.eventPhotoMax"));
        return false;
    }

    return true;
}

function setSubmitState(button, isSaving) {
    // Cập nhật trạng thái nút gửi form
    // Mục đích: Vô hiệu hóa nút và hiển thị hiệu ứng loading khi đang trong quá trình tải ảnh lên server.
    if (!button) return;

    button.disabled = isSaving;
    button.innerHTML = isSaving
        ? `<i class="ph ph-spinner-gap"></i> ${translate("events.saving")}`
        : `<i class="ph ph-cloud-arrow-up"></i> ${translate("events.postPhoto")}`;
}

function renderEventPhotoCard(photo) {
    // Tạo cấu trúc HTML cho một thẻ ảnh sự kiện
    // Mục đích: Chuyển đổi dữ liệu ảnh thành mã HTML để hiển thị trong gallery với hiệu ứng skeleton khi đang tải.
    return `
        <article class="event-photo-card">
            <img class="img-loading-skeleton" src="${escapeAttribute(photo.imageUrl)}" alt="${escapeAttribute(translate("events.imageAlt", { title: photo.title || translate("events.fallbackTitle") }))}" loading="lazy" decoding="async" onload="this.classList.remove('img-loading-skeleton')">
            <div class="event-photo-body">
                <div>
                    <span>${formatEventDate(photo.createdAt)}</span>
                    <strong>${escapeHtml(photo.title || translate("events.fallbackTitle"))}</strong>
                </div>
                <p>${escapeHtml(photo.caption || "")}</p>
                <small>${escapeHtml(photo.authorName || translate("fallback.explorer"))}</small>
            </div>
        </article>
    `;
}

function renderEmptyState(icon, message, className = "") {
    // Tạo giao diện trạng thái trống hoặc đang tải
    // Mục đích: Hiển thị thông báo trực quan khi không có ảnh, đang tải dữ liệu hoặc gặp lỗi.
    return `
        <div class="events-empty ${className}">
            <i class="ph ${icon}"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function getTime(value) {
    // Lấy giá trị thời gian dạng miliseconds
    // Mục đích: Chuyển đổi linh hoạt các định dạng thời gian từ Firebase hoặc Date object sang số để tính toán/sắp xếp.
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatEventDate(value) {
    // Định dạng ngày tháng cho ảnh sự kiện
    // Mục đích: Hiển thị thời gian đăng ảnh theo định dạng DD/MM/YYYY HH:MM phù hợp với ngôn ngữ người dùng.
    const time = getTime(value);
    if (!time) return translate("status.justNow");

    return new Intl.DateTimeFormat(getCurrentLocale(), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(time));
}

function escapeHtml(value = "") {
    // Làm sạch chuỗi văn bản để tránh lỗi XSS
    // Mục đích: Thay thế các ký tự đặc biệt trong HTML để hiển thị văn bản người dùng nhập một cách an toàn.
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
    // Làm sạch chuỗi văn bản dùng trong thuộc tính HTML
    // Mục đích: Đảm bảo các giá trị dùng trong thuộc tính (như 'src' hoặc 'alt') không phá vỡ cấu trúc thẻ HTML.
    return escapeHtml(value).replaceAll("`", "&#096;");
}
