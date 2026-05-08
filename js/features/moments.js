import { route } from "../../data/route.js";
import {
    auth,
    collection,
    db,
    deleteDoc,
    deleteObject,
    doc,
    getDoc,
    getDocs,
    getDownloadURL,
    query,
    ref,
    serverTimestamp,
    setDoc,
    storage,
    updateDoc,
    uploadBytes,
    where
} from "../firebase/index.js";
import { getCurrentLocale, getSceneText, t } from "../app/i18n.js";
import { state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const momentCountsByScene = new Map();

let controlsBound = false;
let afterMomentsChange = () => {};

export function setMomentsChangeHandler(callback) {
    afterMomentsChange = typeof callback === "function" ? callback : () => {};
}

export function bindMomentControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("open-moment-form")?.addEventListener("click", () => {
        if (!auth?.currentUser) {
            showToast(t("toast.needLoginMomentPost"));
            return;
        }

        openMomentForm();
    });

    document.getElementById("cancel-moment")?.addEventListener("click", () => closeMomentForm());
    document.getElementById("moment-photo")?.addEventListener("change", handlePhotoPreview);
    document.getElementById("moment-form")?.addEventListener("submit", handleMomentSubmit);
    document.getElementById("moments-list")?.addEventListener("click", handleMomentAction);
}

export async function renderMomentsForScene(scene = route[state.currentStep]) {
    const list = document.getElementById("moments-list");
    const countLabel = document.getElementById("moment-count-label");
    if (!list || !countLabel || !scene) return;

    if (!auth?.currentUser || !db) {
        momentCountsByScene.set(scene.id, 0);
        countLabel.textContent = `0 ${t("unit.post")}`;
        list.innerHTML = `
            <div class="moments-empty">
                <i class="ph ph-lock-key"></i>
                <p>${t("moments.emptyLogin")}</p>
            </div>
        `;
        afterMomentsChange();
        return;
    }

    list.innerHTML = `
            <div class="moments-loading">
                <i class="ph ph-spinner-gap"></i>
                <span>${t("moments.loading")}</span>
            </div>
    `;

    try {
        const moments = await fetchMomentsForScene(scene.id);
        await attachReactionSummaries(moments);
        momentCountsByScene.set(scene.id, moments.length);
        countLabel.textContent = `${moments.length} ${t("unit.post")}`;

        if (!moments.length) {
            list.innerHTML = `
                <div class="moments-empty">
                    <i class="ph ph-camera"></i>
                    <p>${t("moments.empty")}</p>
                </div>
            `;
            afterMomentsChange();
            return;
        }

        list.innerHTML = moments.map(renderMomentCard).join("");
        afterMomentsChange();
    } catch (error) {
        console.error("Moment fetch error:", error);
        momentCountsByScene.set(scene.id, 0);
        countLabel.textContent = `0 ${t("unit.post")}`;
        list.innerHTML = `
            <div class="moments-empty error">
                <i class="ph ph-warning"></i>
                <p>${t("moments.error")}</p>
            </div>
        `;
        showToast(t("toast.momentLoadError"));
        afterMomentsChange();
    }
}

export function getMomentCountByScene(sceneId) {
    return momentCountsByScene.get(sceneId) || 0;
}

async function fetchMomentsForScene(sceneId) {
    const user = auth.currentUser;
    if (!user || !db) return [];

    const momentsRef = collection(db, "moments");
    const publicQuery = query(
        momentsRef,
        where("visibility", "==", "public")
    );
    const ownQuery = query(
        momentsRef,
        where("uid", "==", user.uid)
    );

    const [publicResult, ownResult] = await Promise.allSettled([
        getDocs(publicQuery),
        getDocs(ownQuery)
    ]);
    const merged = new Map();

    if (publicResult.status === "fulfilled") {
        addSceneMoments(publicResult.value, sceneId, merged);
    } else {
        console.warn("Public moments load skipped:", publicResult.reason);
    }

    if (ownResult.status === "fulfilled") {
        addSceneMoments(ownResult.value, sceneId, merged);
    } else {
        console.warn("Own moments load skipped:", ownResult.reason);
    }

    if (publicResult.status === "rejected" && ownResult.status === "rejected") {
        throw ownResult.reason || publicResult.reason;
    }

    return Array.from(merged.values()).sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

function addSceneMoments(snapshot, sceneId, target) {
    snapshot.forEach((item) => {
        const moment = normalizeMoment(item);
        if (moment.sceneId === sceneId) {
            target.set(item.id, moment);
        }
    });
}

async function attachReactionSummaries(moments) {
    if (!moments.length || !auth?.currentUser || !db) return;

    const reactionsByMoment = new Map();
    const ids = moments.map((moment) => moment.id);
    const chunkSize = 10;

    for (let index = 0; index < ids.length; index += chunkSize) {
        const idChunk = ids.slice(index, index + chunkSize);
        let snapshot;

        try {
            snapshot = await getDocs(query(
                collection(db, "momentReactions"),
                where("momentId", "in", idChunk)
            ));
        } catch (error) {
            console.warn("Reaction summaries load skipped:", error);
            continue;
        }

        snapshot.forEach((item) => {
            const reaction = item.data();
            const summary = reactionsByMoment.get(reaction.momentId) || {
                counts: {},
                viewerReaction: ""
            };

            summary.counts[reaction.reaction] = (summary.counts[reaction.reaction] || 0) + 1;
            if (reaction.actorUid === auth.currentUser.uid) {
                summary.viewerReaction = reaction.reaction;
            }
            reactionsByMoment.set(reaction.momentId, summary);
        });
    }

    moments.forEach((moment) => {
        const summary = reactionsByMoment.get(moment.id) || { counts: {}, viewerReaction: "" };
        moment.reactionCounts = summary.counts;
        moment.viewerReaction = summary.viewerReaction;
    });
}

async function handleMomentSubmit(event) {
    event.preventDefault();

    if (!auth?.currentUser || !db || !storage) {
        showToast(t("toast.needLoginMomentSave"));
        return;
    }

    const scene = route[state.currentStep];
    const form = event.currentTarget;
    const submitButton = document.getElementById("save-moment");
    const editId = document.getElementById("moment-edit-id").value;
    const oldImagePath = document.getElementById("moment-edit-image-path").value;
    const caption = document.getElementById("moment-caption").value.trim();
    const mood = document.getElementById("moment-mood").value;
    const visibility = document.getElementById("moment-visibility").value;
    const file = document.getElementById("moment-photo").files[0] || null;

    if (!caption) {
        showToast(t("toast.needCaption"));
        return;
    }

    if (file && !validateImageFile(file)) return;

    submitButton.disabled = true;
    submitButton.innerHTML = `<i class="ph ph-spinner-gap"></i> ${t("moments.saveLoading")}`;

    try {
        if (editId) {
            await updateMoment(editId, { caption, mood, visibility, file, oldImagePath });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_updated",
                title: t("notification.momentUpdated"),
                body: t("moments.notificationUpdated", { sceneTitle: getSceneText(scene, "title") }),
                momentId: editId,
                sceneId: scene.id
            });
            showToast(t("toast.momentUpdated"));
        } else {
            const momentId = await createMoment(scene, { caption, mood, visibility, file });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_created",
                title: t("notification.momentCreated"),
                body: t("moments.notificationCreated", { sceneTitle: getSceneText(scene, "title") }),
                momentId,
                sceneId: scene.id
            });
            showToast(t("toast.momentSaved"));
        }

        form.reset();
        closeMomentForm();
        await renderMomentsForScene(scene);
    } catch (error) {
        console.error("Moment save error:", error);
        showToast(t("toast.momentSaveError"));
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="ph ph-floppy-disk"></i> ${t("tour.saveMoment")}`;
    }
}

async function createMoment(scene, { caption, mood, visibility, file }) {
    const user = auth.currentUser;
    const momentRef = doc(collection(db, "moments"));
    const payload = {
        uid: user.uid,
        authorName: state.customName,
        avatarId: state.selectedAvatar.id,
        sceneId: scene.id,
        sceneTitle: getSceneText(scene, "title"),
        zone: scene.zone,
        caption,
        mood,
        visibility,
        imageUrl: "",
        imagePath: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (file) {
        const upload = await uploadMomentImage(user.uid, momentRef.id, file);
        payload.imageUrl = upload.imageUrl;
        payload.imagePath = upload.imagePath;
    }

    await setDoc(momentRef, payload);
    return momentRef.id;
}

async function updateMoment(momentId, { caption, mood, visibility, file, oldImagePath }) {
    const user = auth.currentUser;
    const momentRef = doc(db, "moments", momentId);
    const payload = {
        caption,
        mood,
        visibility,
        updatedAt: serverTimestamp()
    };

    if (file) {
        const upload = await uploadMomentImage(user.uid, momentId, file);
        payload.imageUrl = upload.imageUrl;
        payload.imagePath = upload.imagePath;
    }

    await updateDoc(momentRef, payload);

    if (file && oldImagePath && oldImagePath !== payload.imagePath) {
        await deleteMomentImage(oldImagePath);
    }
}

async function handleMomentAction(event) {
    const reactionButton = event.target.closest("[data-moment-react]");
    const editButton = event.target.closest("[data-moment-edit]");
    const deleteButton = event.target.closest("[data-moment-delete]");

    if (reactionButton) {
        await reactToMoment(reactionButton);
        return;
    }

    if (editButton) {
        openMomentForm(editButton.dataset.momentEdit);
        return;
    }

    if (deleteButton) {
        const momentId = deleteButton.dataset.momentDelete;
        const imagePath = deleteButton.dataset.imagePath || "";
        await deleteMoment(momentId, imagePath);
    }
}

async function reactToMoment(button) {
    if (!auth?.currentUser || !db) {
        showToast(t("toast.needLoginReaction"));
        return;
    }

    const momentId = button.dataset.momentId;
    const reaction = button.dataset.momentReact;
    const ownerUid = button.dataset.ownerUid;
    if (!momentId || !reaction || !ownerUid) return;

    const user = auth.currentUser;
    const reactionRef = doc(db, "momentReactions", `${momentId}_${user.uid}`);

    try {
        button.disabled = true;
        const existingSnapshot = await getDoc(reactionRef);
        const previousReaction = existingSnapshot.exists() ? existingSnapshot.data().reaction : "";

        if (previousReaction === reaction) {
            await deleteDoc(reactionRef);
            await renderMomentsForScene(route[state.currentStep]);
            showToast(t("toast.reactionRemoved"));
            return;
        }

        await setDoc(reactionRef, {
            momentId,
            ownerUid,
            actorUid: user.uid,
            actorName: state.customName,
            reaction,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        if (ownerUid !== user.uid && !previousReaction) {
            const momentSnapshot = await getDoc(doc(db, "moments", momentId));
            const moment = momentSnapshot.exists() ? momentSnapshot.data() : {};
            await createNotification({
                uid: ownerUid,
                type: "reaction_received",
                title: t("moments.reactionTitle", { name: state.customName, reaction }),
                body: t("moments.reactionBody", { caption: moment.caption || button.dataset.caption || t("moments.yourMoment") }),
                momentId,
                sceneId: moment.sceneId || button.dataset.sceneId || ""
            });
        }

        showToast(t("toast.reactionSaved"));
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Reaction save error:", error);
        showToast(t("toast.reactionError"));
    } finally {
        button.disabled = false;
    }
}

async function createNotification({ uid, type, title, body, momentId = "", sceneId = "" }) {
    if (!uid || !auth?.currentUser || !db) return;

    try {
        const notificationRef = doc(collection(db, "notifications"));
        await setDoc(notificationRef, {
            uid,
            type,
            title,
            body,
            momentId,
            sceneId,
            actorUid: auth.currentUser.uid,
            actorName: state.customName,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.warn("Notification create skipped:", error);
    }
}

async function deleteMoment(momentId, imagePath) {
    if (!momentId || !auth?.currentUser || !db) return;

    const confirmed = window.confirm(t("confirm.deleteMoment"));
    if (!confirmed) return;

    try {
        if (imagePath) {
            await deleteMomentImage(imagePath);
        }

        await deleteDoc(doc(db, "moments", momentId));
        showToast(t("toast.momentDeleted"));
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Moment delete error:", error);
        showToast(t("toast.momentDeleteError"));
    }
}

async function uploadMomentImage(uid, momentId, file) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const imagePath = `moment-images/${uid}/${momentId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function deleteMomentImage(imagePath) {
    if (!imagePath || !storage) return;

    try {
        await deleteObject(ref(storage, imagePath));
    } catch (error) {
        console.warn("Moment image delete skipped:", error);
    }
}

function openMomentForm(momentId = "") {
    const form = document.getElementById("moment-form");
    if (!form) return;

    form.classList.remove("hidden");
    form.reset();
    resetMomentPreview();

    if (!momentId) {
        document.getElementById("moment-edit-id").value = "";
        document.getElementById("moment-edit-image-path").value = "";
        document.getElementById("moment-caption").focus();
        return;
    }

    const card = document.querySelector(`[data-moment-id="${momentId}"]`);
    document.getElementById("moment-edit-id").value = momentId;
    document.getElementById("moment-edit-image-path").value = card?.dataset.imagePath || "";
    document.getElementById("moment-caption").value = card?.dataset.caption || "";
    document.getElementById("moment-mood").value = card?.dataset.mood || "Háo hức";
    document.getElementById("moment-visibility").value = card?.dataset.visibility || "private";
    document.getElementById("moment-caption").focus();
}

function closeMomentForm() {
    const form = document.getElementById("moment-form");
    if (!form) return;

    form.classList.add("hidden");
    form.reset();
    document.getElementById("moment-edit-id").value = "";
    document.getElementById("moment-edit-image-path").value = "";
    resetMomentPreview();
}

function handlePhotoPreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("moment-preview");
    if (!preview) return;

    if (!file) {
        resetMomentPreview();
        return;
    }

    if (!validateImageFile(file)) {
        event.target.value = "";
        resetMomentPreview();
        return;
    }

    const imageUrl = URL.createObjectURL(file);
    preview.classList.remove("hidden");
    preview.innerHTML = `<img src="${imageUrl}" alt="${t("moments.previewAlt")}">`;
}

function resetMomentPreview() {
    const preview = document.getElementById("moment-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateImageFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast(t("toast.imageOnly"));
        return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        showToast(t("toast.photoMax"));
        return false;
    }

    return true;
}

function renderMomentCard(moment) {
    const isOwner = auth?.currentUser?.uid === moment.uid;
    const visibilityText = moment.visibility === "public" ? t("moments.publicLabel") : t("moments.privateLabel");
    const image = moment.imageUrl
        ? `<img class="moment-image" src="${escapeAttribute(moment.imageUrl)}" alt="${escapeAttribute(t("moments.imageAlt", { sceneTitle: moment.sceneTitle }))}">`
        : "";

    return `
        <article class="moment-card" data-moment-id="${moment.id}" data-caption="${escapeAttribute(moment.caption)}" data-mood="${escapeAttribute(moment.mood)}" data-visibility="${escapeAttribute(moment.visibility)}" data-image-path="${escapeAttribute(moment.imagePath)}" data-owner-uid="${escapeAttribute(moment.uid)}">
            ${image}
            <div class="moment-card-body">
                <div class="moment-card-meta">
                    <span><i class="ph ph-smiley"></i> ${escapeHtml(moment.mood)}</span>
                    <span><i class="ph ph-shield-check"></i> ${visibilityText}</span>
                </div>
                <p>${escapeHtml(moment.caption)}</p>
                <div class="moment-card-foot">
                    <span>${escapeHtml(moment.authorName || t("fallback.explorer"))}</span>
                    <span>${formatMomentDate(moment.createdAt)}</span>
                </div>
                <div class="moment-reactions" aria-label="${t("moments.reactLabel")}">
                    ${renderReactionButton(moment, "👍", t("moments.like"))}
                    ${renderReactionButton(moment, "💛", t("moments.love"))}
                    ${renderReactionButton(moment, "🎉", t("moments.celebrate"))}
                </div>
                ${isOwner ? `
                    <div class="moment-card-actions">
                        <button class="secondary-button compact-button" type="button" data-moment-edit="${moment.id}">
                            <i class="ph ph-pencil-simple"></i> ${t("moments.edit")}
                        </button>
                        <button class="secondary-button compact-button danger-button" type="button" data-moment-delete="${moment.id}" data-image-path="${escapeAttribute(moment.imagePath)}">
                            <i class="ph ph-trash"></i> ${t("moments.delete")}
                        </button>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

function renderReactionButton(moment, reaction, label) {
    const count = moment.reactionCounts?.[reaction] || 0;
    const isActive = moment.viewerReaction === reaction;
    const countText = count ? `<strong>${count}</strong>` : "";

    return `
        <button class="reaction-button${isActive ? " active" : ""}" type="button" aria-pressed="${isActive ? "true" : "false"}" data-moment-react="${escapeAttribute(reaction)}" data-moment-id="${escapeAttribute(moment.id)}" data-owner-uid="${escapeAttribute(moment.uid)}" data-scene-id="${escapeAttribute(moment.sceneId)}" data-caption="${escapeAttribute(moment.caption)}">
            <span>${reaction}</span>
            ${escapeHtml(label)}
            ${countText}
        </button>
    `;
}

function normalizeMoment(snapshot) {
    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatMomentDate(value) {
    const time = getTime(value);
    if (!time) return t("status.justNow");

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
