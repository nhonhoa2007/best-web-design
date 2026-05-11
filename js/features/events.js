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
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("event-photo-file")?.addEventListener("change", handleEventPhotoPreview);
    document.getElementById("event-photo-form")?.addEventListener("submit", handleEventPhotoSubmit);
}

export async function renderEventGallery() {
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
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const imagePath = `campus-event-photos/${uid}/${photoId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function fetchEventPhotos() {
    const snapshot = await getDocs(collection(db, "campusEventPhotos"));
    const photos = [];
    snapshot.forEach((item) => photos.push({ id: item.id, ...item.data() }));
    return photos.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

function handleEventPhotoPreview(event) {
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
    preview.innerHTML = `<img src="${imageUrl}" alt="${translate("events.previewAlt")}">`;
}

function syncEventFileName(file = document.getElementById("event-photo-file")?.files?.[0] || null) {
    const fileName = document.getElementById("event-photo-file-name");
    if (!fileName) return;

    fileName.textContent = file ? file.name : translate("events.noFileSelected");
}

function resetEventPhotoPreview() {
    const preview = document.getElementById("event-photo-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateEventImage(file) {
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
    if (!button) return;

    button.disabled = isSaving;
    button.innerHTML = isSaving
        ? `<i class="ph ph-spinner-gap"></i> ${translate("events.saving")}`
        : `<i class="ph ph-cloud-arrow-up"></i> ${translate("events.postPhoto")}`;
}

function renderEventPhotoCard(photo) {
    return `
        <article class="event-photo-card">
            <img class="img-loading-skeleton" src="${escapeAttribute(photo.imageUrl)}" alt="${escapeAttribute(translate("events.imageAlt", { title: photo.title || translate("events.fallbackTitle") }))}" onload="this.classList.remove('img-loading-skeleton')">
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
    return `
        <div class="events-empty ${className}">
            <i class="ph ${icon}"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatEventDate(value) {
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
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
    return escapeHtml(value).replaceAll("`", "&#096;");
}
