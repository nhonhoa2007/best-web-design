import { auth, db, storage } from "../firebase/index.js";
import { translate } from "../app/i18n.js";
import { showToast } from "../ui/ui.js";
import { renderEmptyState, renderForumThreadCard, renderForumThreadDetail } from "../ui/forum.js";
import {
    createForumReply,
    createForumThread,
    deleteForumThread,
    fetchForumReplies,
    fetchForumThreads,
    getForumThread
} from "../services/forum-service.js";
import { DEFAULT_MAX_SOURCE_SIZE } from "../utils/image-optimizer.js";

const MAX_FORUM_IMAGE_SIZE = DEFAULT_MAX_SOURCE_SIZE;

let controlsBound = false;
let activeCategory = "all";
let activeThreadId = "";

window.addEventListener("vku-language-change", () => {
    syncEventFileName();
    syncCategoryFilters();
    void renderEventGallery();
    if (activeThreadId) {
        void renderForumDetail(activeThreadId);
    }
});

export function bindEventControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("event-photo-file")?.addEventListener("change", handleForumImagePreview);
    document.getElementById("event-photo-form")?.addEventListener("submit", handleForumThreadSubmit);
    document.getElementById("event-photo-gallery")?.addEventListener("click", handleForumThreadAction);
    document.getElementById("event-forum-filters")?.addEventListener("click", handleForumFilterClick);
    document.getElementById("event-forum-detail")?.addEventListener("submit", handleForumReplySubmit);
}

export async function renderEventGallery() {
    const list = document.getElementById("event-photo-gallery");
    if (!list) return;

    if (!auth?.currentUser || !db) {
        list.innerHTML = renderEmptyState("ph-lock-key", translate("events.emptyLogin"));
        updateThreadCount(0);
        renderForumPlaceholder();
        return;
    }

    list.innerHTML = renderEmptyState("ph-spinner-gap", translate("events.loadingGallery"), "is-loading");

    try {
        const threads = await fetchForumThreads(db, activeCategory);
        updateThreadCount(threads.length);

        if (!threads.length) {
            list.innerHTML = renderEmptyState("ph-chats-circle", translate("events.empty"));
            renderForumPlaceholder();
            return;
        }

        list.innerHTML = threads.map((thread) => renderForumThreadCard(thread, auth.currentUser.uid)).join("");

        if (!activeThreadId || !threads.some((thread) => thread.id === activeThreadId)) {
            activeThreadId = threads[0].id;
        }
        await renderForumDetail(activeThreadId);
    } catch (error) {
        console.warn("Forum thread load error:", error);
        list.innerHTML = renderEmptyState("ph-warning", translate("events.loadError"), "error");
        updateThreadCount(0);
        showToast(translate("toast.eventLoadError"));
    }
}

async function handleForumThreadSubmit(event) {
    event.preventDefault();

    if (!auth?.currentUser || !db || !storage) {
        showToast(translate("toast.needLoginEventPhoto"));
        return;
    }

    const form = event.currentTarget;
    const titleInput = document.getElementById("event-photo-title");
    const bodyInput = document.getElementById("event-photo-caption");
    const categoryInput = document.getElementById("event-forum-category");
    const fileInput = document.getElementById("event-photo-file");
    const submitButton = document.getElementById("event-photo-submit");
    const title = titleInput?.value.trim() || "";
    const body = bodyInput?.value.trim() || "";
    const category = categoryInput?.value || "event";
    const file = fileInput?.files?.[0] || null;

    if (!title || !body) {
        showToast(translate("toast.eventMissingFields"));
        return;
    }

    if (file && !validateForumImage(file)) return;

    setSubmitState(submitButton, true);

    try {
        activeThreadId = await createForumThread({ db, storage, user: auth.currentUser, title, body, category, file });
        form.reset();
        syncEventFileName();
        resetForumImagePreview();
        showToast(translate("toast.eventPhotoSaved"));
        await renderEventGallery();
    } catch (error) {
        console.error("Forum thread save error:", error);
        showToast(translate("toast.eventPhotoSaveError"));
    } finally {
        setSubmitState(submitButton, false);
    }
}

async function handleForumThreadAction(event) {
    const openButton = event.target.closest("[data-forum-open]");
    const deleteButton = event.target.closest("[data-forum-delete]");

    if (deleteButton) {
        await handleForumThreadDelete(deleteButton);
        return;
    }

    if (openButton) {
        activeThreadId = openButton.dataset.forumOpen;
        await renderForumDetail(activeThreadId);
    }
}

async function handleForumThreadDelete(button) {
    if (!auth?.currentUser || !db) return;

    const threadId = button.dataset.forumDelete;
    const imagePath = button.dataset.imagePath || "";
    if (!threadId || !window.confirm(translate("confirm.deleteForumThread"))) return;

    try {
        button.disabled = true;
        await deleteForumThread({ db, storage, threadId, imagePath });
        if (activeThreadId === threadId) activeThreadId = "";
        showToast(translate("toast.eventThreadDeleted"));
        await renderEventGallery();
    } catch (error) {
        console.error("Forum thread delete error:", error);
        showToast(translate("toast.eventThreadDeleteError"));
    } finally {
        button.disabled = false;
    }
}

function handleForumFilterClick(event) {
    const button = event.target.closest("[data-forum-category]");
    if (!button) return;

    activeCategory = button.dataset.forumCategory || "all";
    activeThreadId = "";
    syncCategoryFilters();
    void renderEventGallery();
}

async function handleForumReplySubmit(event) {
    const form = event.target.closest("#event-forum-reply-form");
    if (!form) return;

    event.preventDefault();

    if (!auth?.currentUser || !db) {
        showToast(translate("toast.needLoginEventPhoto"));
        return;
    }

    const threadId = form.dataset.threadId;
    const bodyInput = document.getElementById("event-forum-reply");
    const submitButton = document.getElementById("event-forum-reply-submit");
    const body = bodyInput?.value.trim() || "";

    if (!threadId || !body) {
        showToast(translate("toast.eventReplyMissing"));
        return;
    }

    setReplyState(submitButton, true);

    try {
        await createForumReply({ db, user: auth.currentUser, threadId, body });
        form.reset();
        showToast(translate("toast.eventReplySaved"));
        await renderForumDetail(threadId);
        await renderEventGallery();
    } catch (error) {
        console.error("Forum reply save error:", error);
        showToast(translate("toast.eventReplySaveError"));
    } finally {
        setReplyState(submitButton, false);
    }
}

async function renderForumDetail(threadId) {
    const detail = document.getElementById("event-forum-detail");
    if (!detail || !threadId || !auth?.currentUser || !db) return;

    detail.innerHTML = renderEmptyState("ph-spinner-gap", translate("events.loadingThread"), "is-loading");

    try {
        const [thread, replies] = await Promise.all([
            getForumThread(db, threadId),
            fetchForumReplies(db, threadId)
        ]);
        detail.innerHTML = renderForumThreadDetail(thread, replies, auth.currentUser.uid);
        markActiveThread(threadId);
    } catch (error) {
        console.warn("Forum detail load error:", error);
        detail.innerHTML = renderEmptyState("ph-warning", translate("events.threadLoadError"), "error");
    }
}

function handleForumImagePreview(event) {
    const file = event.target.files?.[0] || null;
    const preview = document.getElementById("event-photo-preview");
    syncEventFileName(file);
    if (!preview) return;

    if (!file) {
        resetForumImagePreview();
        return;
    }

    if (!validateForumImage(file)) {
        event.target.value = "";
        syncEventFileName();
        resetForumImagePreview();
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

function syncCategoryFilters() {
    document.querySelectorAll("[data-forum-category]").forEach((button) => {
        button.classList.toggle("active", button.dataset.forumCategory === activeCategory);
    });
}

function resetForumImagePreview() {
    const preview = document.getElementById("event-photo-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateForumImage(file) {
    if (!file.type.startsWith("image/")) {
        showToast(translate("toast.imageOnly"));
        return false;
    }

    if (file.size > MAX_FORUM_IMAGE_SIZE) {
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
        : `<i class="ph ph-paper-plane-tilt"></i> ${translate("events.postPhoto")}`;
}

function setReplyState(button, isSaving) {
    if (!button) return;

    button.disabled = isSaving;
    button.innerHTML = isSaving
        ? `<i class="ph ph-spinner-gap"></i> ${translate("events.replySaving")}`
        : `<i class="ph ph-paper-plane-tilt"></i> ${translate("events.replySubmit")}`;
}

function updateThreadCount(count) {
    const label = document.getElementById("event-forum-count");
    if (!label) return;

    label.textContent = translate("events.threadCount", { count });
}

function renderForumPlaceholder() {
    const detail = document.getElementById("event-forum-detail");
    if (!detail) return;

    detail.innerHTML = renderForumThreadDetail(null);
}

function markActiveThread(threadId) {
    document.querySelectorAll("[data-forum-thread-id]").forEach((card) => {
        card.classList.toggle("active", card.dataset.forumThreadId === threadId);
    });
}
