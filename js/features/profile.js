import {
    auth,
    deleteObject,
    getDownloadURL,
    ref,
    storage,
    uploadBytes
} from "../firebase/index.js";
import { handleLogout } from "./auth.js";
import { translate } from "../app/i18n.js";
import { renderHomeDashboard } from "./home.js";
import { saveProgressToFirebase, setProfileAvatarImage, state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

let controlsBound = false;

export function bindProfileControls() {
    // Gắn sự kiện cho các điều khiển trang hồ sơ
    // Mục đích: Thiết lập lắng nghe cho nút tải lên avatar và nút đăng xuất trên trang cá nhân.
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("upload-profile-avatar")?.addEventListener("click", () => {
        document.getElementById("profile-avatar-file")?.click();
    });

    document.getElementById("profile-avatar-file")?.addEventListener("change", handleAvatarUpload);
    document.getElementById("profile-logout-btn")?.addEventListener("click", handleLogout);
}

async function handleAvatarUpload(event) {
    // Xử lý sự kiện tải lên ảnh đại diện (avatar)
    // Mục đích: Kiểm tra file, thực hiện tải lên Storage, cập nhật Firestore và xóa ảnh cũ để tiết kiệm dung lượng.
    // Ghi chú Async: Quá trình này cần 'await' nhiều công đoạn: tải ảnh mới lên Storage, lưu thông tin URL vào Firestore và xóa ảnh cũ. Sử dụng async/await giúp mã nguồn dễ đọc hơn thay vì dùng các callback lồng nhau.
    const input = event.currentTarget;
    const file = input.files?.[0] || null;
    if (!file) return;

    if (!auth?.currentUser || !storage) {
        showToast(translate("toast.needLoginAvatar"));
        input.value = "";
        return;
    }

    if (!validateAvatarFile(file)) {
        input.value = "";
        return;
    }

    const button = document.getElementById("upload-profile-avatar");
    const status = document.getElementById("profile-avatar-status");
    const oldImagePath = state.avatarImagePath;

    setUploadState(button, status, true);

    try {
        const upload = await uploadProfileAvatar(auth.currentUser.uid, file);
        setProfileAvatarImage(upload.imageUrl, upload.imagePath);
        const saved = await saveProgressToFirebase();

        if (saved && oldImagePath && oldImagePath !== upload.imagePath) {
            await deletePreviousAvatar(oldImagePath, auth.currentUser.uid);
        }

        await renderHomeDashboard();
        showToast(saved ? translate("toast.avatarUpdated") : translate("toast.avatarUploadedUnsynced"));
    } catch (error) {
        console.error("Profile avatar upload error:", error);
        showToast(translate("toast.avatarUploadError"));
    } finally {
        input.value = "";
        setUploadState(button, status, false);
    }
}

async function uploadProfileAvatar(uid, file) {
    // Tải ảnh đại diện lên Firebase Storage
    // Mục đích: Lưu file ảnh vào thư mục riêng của người dùng và lấy URL công khai để hiển thị.
    // Ghi chú Async: Đợi (await) quá trình tải lên (uploadBytes) kết thúc, sau đó đợi lấy URL download để trả về cho luồng xử lý chính.
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const imagePath = `profile-avatars/${uid}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function deletePreviousAvatar(imagePath, uid) {
    // Xóa ảnh đại diện cũ khỏi server
    // Mục đích: Dọn dẹp các file ảnh không còn sử dụng trong Storage sau khi người dùng đổi avatar mới.
    if (!imagePath.startsWith(`profile-avatars/${uid}/`)) return;

    try {
        await deleteObject(ref(storage, imagePath));
    } catch (error) {
        console.warn("Previous profile avatar delete skipped:", error);
    }
}

function validateAvatarFile(file) {
    // Kiểm tra tính hợp lệ của file ảnh đại diện
    // Mục đích: Đảm bảo file đúng định dạng hình ảnh và không vượt quá dung lượng cho phép (5MB).
    if (!file.type.startsWith("image/")) {
        showToast(translate("toast.imageOnly"));
        return false;
    }

    if (file.size > MAX_AVATAR_SIZE) {
        showToast(translate("toast.avatarMax"));
        return false;
    }

    return true;
}

function setUploadState(button, status, isUploading) {
    // Cập nhật trạng thái hiển thị khi đang tải ảnh
    // Mục đích: Vô hiệu hóa nút bấm và hiển thị hiệu ứng xoay loading để thông báo cho người dùng biết hệ thống đang xử lý.
    if (button) {
        button.disabled = isUploading;
        button.innerHTML = isUploading
            ? `<i class="ph ph-spinner-gap"></i> ${translate("action.uploading")}`
            : `<i class="ph ph-camera"></i> ${translate("action.uploadAvatar")}`;
    }

    if (status) {
        status.textContent = isUploading ? translate("profile.avatarSyncing") : "";
    }
}
