import {
    auth,
    deleteObject,
    getDownloadURL,
    ref,
    storage,
    uploadBytes
} from "./firebase.js";
import { renderHomeDashboard } from "./home.js";
import { saveProgressToFirebase, setProfileAvatarImage, state } from "./state.js";
import { showToast } from "./ui.js";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

let controlsBound = false;

export function bindProfileControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("upload-profile-avatar")?.addEventListener("click", () => {
        document.getElementById("profile-avatar-file")?.click();
    });

    document.getElementById("profile-avatar-file")?.addEventListener("change", handleAvatarUpload);
}

async function handleAvatarUpload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0] || null;
    if (!file) return;

    if (!auth?.currentUser || !storage) {
        showToast("Bạn cần đăng nhập để upload avatar.");
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
        showToast(saved ? "Đã cập nhật avatar." : "Đã upload ảnh, nhưng chưa đồng bộ được profile.");
    } catch (error) {
        console.error("Profile avatar upload error:", error);
        showToast("Không upload được avatar. Vui lòng thử lại.");
    } finally {
        input.value = "";
        setUploadState(button, status, false);
    }
}

async function uploadProfileAvatar(uid, file) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const imagePath = `profile-avatars/${uid}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function deletePreviousAvatar(imagePath, uid) {
    if (!imagePath.startsWith(`profile-avatars/${uid}/`)) return;

    try {
        await deleteObject(ref(storage, imagePath));
    } catch (error) {
        console.warn("Previous profile avatar delete skipped:", error);
    }
}

function validateAvatarFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast("Chỉ hỗ trợ file ảnh.");
        return false;
    }

    if (file.size > MAX_AVATAR_SIZE) {
        showToast("Avatar tối đa 5MB.");
        return false;
    }

    return true;
}

function setUploadState(button, status, isUploading) {
    if (button) {
        button.disabled = isUploading;
        button.innerHTML = isUploading
            ? '<i class="ph ph-spinner-gap"></i> Đang upload...'
            : '<i class="ph ph-camera"></i> Upload avatar';
    }

    if (status) {
        status.textContent = isUploading ? "Đang đồng bộ ảnh" : "";
    }
}
