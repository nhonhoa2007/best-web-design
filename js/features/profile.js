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
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("upload-profile-avatar")?.addEventListener("click", () => {
        document.getElementById("profile-avatar-file")?.click();
    });

    document.getElementById("profile-avatar-file")?.addEventListener("change", handleAvatarUpload);
    document.getElementById("profile-logout-btn")?.addEventListener("click", handleLogout);
}

async function handleAvatarUpload(event) {
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
