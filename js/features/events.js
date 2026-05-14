import { auth, db, storage } from "../firebase/index.js";
import { translate } from "../app/i18n.js";
import { showToast } from "../ui/ui.js";
import { renderEmptyState, renderEventPhotoCard } from "../ui/event-gallery.js";
import { createEventPhoto, fetchEventPhotos } from "../services/event-photos-service.js";
import { DEFAULT_MAX_SOURCE_SIZE } from "../utils/image-optimizer.js";

const MAX_EVENT_IMAGE_SIZE = DEFAULT_MAX_SOURCE_SIZE;

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
        const photos = await fetchEventPhotos(db);

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
        await createEventPhoto({ db, storage, user: auth.currentUser, title, caption, file });
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
    preview.innerHTML = `<img src="${imageUrl}" alt="${translate("events.previewAlt")}" decoding="async">`;
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
