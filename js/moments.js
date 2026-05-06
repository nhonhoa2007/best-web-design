import { route } from "../data/route.js";
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
} from "./firebase.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

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
            showToast("Bạn cần đăng nhập để đăng khoảnh khắc.");
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
        countLabel.textContent = "0 bài đăng";
        list.innerHTML = `
            <div class="moments-empty">
                <i class="ph ph-lock-key"></i>
                <p>Đăng nhập để lưu và xem khoảnh khắc tại địa điểm này.</p>
            </div>
        `;
        afterMomentsChange();
        return;
    }

    list.innerHTML = `
        <div class="moments-loading">
            <i class="ph ph-spinner-gap"></i>
            <span>Đang tải khoảnh khắc...</span>
        </div>
    `;

    try {
        const moments = await fetchMomentsForScene(scene.id);
        await attachReactionSummaries(moments);
        momentCountsByScene.set(scene.id, moments.length);
        countLabel.textContent = `${moments.length} bài đăng`;

        if (!moments.length) {
            list.innerHTML = `
                <div class="moments-empty">
                    <i class="ph ph-camera"></i>
                    <p>Chưa có khoảnh khắc nào ở địa điểm này.</p>
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
        countLabel.textContent = "0 bài đăng";
        list.innerHTML = `
            <div class="moments-empty error">
                <i class="ph ph-warning"></i>
                <p>Không tải được khoảnh khắc. Vui lòng thử lại sau.</p>
            </div>
        `;
        showToast("Không tải được khoảnh khắc.");
        afterMomentsChange();
    }
}

export function getMomentCountByScene(sceneId) {
    return momentCountsByScene.get(sceneId) || 0;
}

async function fetchMomentsForScene(sceneId) {
    const user = auth.currentUser;
    const momentsRef = collection(db, "moments");
    const publicQuery = query(
        momentsRef,
        where("visibility", "==", "public")
    );
    const ownQuery = query(
        momentsRef,
        where("uid", "==", user.uid)
    );

    const [publicSnapshot, ownSnapshot] = await Promise.all([
        getDocs(publicQuery),
        getDocs(ownQuery)
    ]);
    const merged = new Map();

    publicSnapshot.forEach((snapshot) => {
        const moment = normalizeMoment(snapshot);
        if (moment.sceneId === sceneId) {
            merged.set(snapshot.id, moment);
        }
    });
    ownSnapshot.forEach((snapshot) => {
        const moment = normalizeMoment(snapshot);
        if (moment.sceneId === sceneId) {
            merged.set(snapshot.id, moment);
        }
    });

    return Array.from(merged.values()).sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

async function attachReactionSummaries(moments) {
    if (!moments.length || !auth?.currentUser || !db) return;

    const reactionsByMoment = new Map();
    const ids = moments.map((moment) => moment.id);
    const chunkSize = 10;

    for (let index = 0; index < ids.length; index += chunkSize) {
        const idChunk = ids.slice(index, index + chunkSize);
        const snapshot = await getDocs(query(
            collection(db, "momentReactions"),
            where("momentId", "in", idChunk)
        ));

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
        showToast("Bạn cần đăng nhập để lưu khoảnh khắc.");
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
        showToast("Vui lòng nhập caption cho khoảnh khắc.");
        return;
    }

    if (file && !validateImageFile(file)) return;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="ph ph-spinner-gap"></i> Đang lưu...';

    try {
        if (editId) {
            await updateMoment(editId, { caption, mood, visibility, file, oldImagePath });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_updated",
                title: "Bạn đã chỉnh sửa bài viết",
                body: `Khoảnh khắc tại ${scene.title} đã được cập nhật.`,
                momentId: editId,
                sceneId: scene.id
            });
            showToast("Đã cập nhật khoảnh khắc.");
        } else {
            const momentId = await createMoment(scene, { caption, mood, visibility, file });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_created",
                title: "Bạn đã đăng khoảnh khắc",
                body: `Bài viết mới tại ${scene.title} đã được lưu vào nhật ký.`,
                momentId,
                sceneId: scene.id
            });
            showToast("Đã lưu khoảnh khắc.");
        }

        form.reset();
        closeMomentForm();
        await renderMomentsForScene(scene);
    } catch (error) {
        console.error("Moment save error:", error);
        showToast("Không lưu được khoảnh khắc.");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="ph ph-floppy-disk"></i> Lưu khoảnh khắc';
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
        sceneTitle: scene.title,
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
        showToast("Bạn cần đăng nhập để thả cảm xúc.");
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
            showToast("Đã gỡ cảm xúc khỏi khoảnh khắc.");
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
                title: `${state.customName} đã thả cảm xúc ${reaction}`,
                body: `Khoảnh khắc "${moment.caption || button.dataset.caption || "của bạn"}" vừa nhận tương tác mới.`,
                momentId,
                sceneId: moment.sceneId || button.dataset.sceneId || ""
            });
        }

        showToast("Đã thả cảm xúc cho khoảnh khắc.");
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Reaction save error:", error);
        showToast("Không thả được cảm xúc. Vui lòng thử lại.");
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

    const confirmed = window.confirm("Xóa khoảnh khắc này?");
    if (!confirmed) return;

    try {
        if (imagePath) {
            await deleteMomentImage(imagePath);
        }

        await deleteDoc(doc(db, "moments", momentId));
        showToast("Đã xóa khoảnh khắc.");
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Moment delete error:", error);
        showToast("Không xóa được khoảnh khắc.");
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
    preview.innerHTML = `<img src="${imageUrl}" alt="Ảnh xem trước khoảnh khắc">`;
}

function resetMomentPreview() {
    const preview = document.getElementById("moment-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateImageFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast("Chỉ hỗ trợ file ảnh.");
        return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        showToast("Ảnh tối đa 5MB.");
        return false;
    }

    return true;
}

function renderMomentCard(moment) {
    const isOwner = auth?.currentUser?.uid === moment.uid;
    const visibilityText = moment.visibility === "public" ? "Công khai" : "Chỉ mình tôi";
    const image = moment.imageUrl
        ? `<img class="moment-image" src="${escapeAttribute(moment.imageUrl)}" alt="Ảnh khoảnh khắc tại ${escapeAttribute(moment.sceneTitle)}">`
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
                    <span>${escapeHtml(moment.authorName || "Explorer")}</span>
                    <span>${formatMomentDate(moment.createdAt)}</span>
                </div>
                <div class="moment-reactions" aria-label="Thả cảm xúc cho khoảnh khắc">
                    ${renderReactionButton(moment, "👍", "Thích")}
                    ${renderReactionButton(moment, "💛", "Yêu thích")}
                    ${renderReactionButton(moment, "🎉", "Chúc mừng")}
                </div>
                ${isOwner ? `
                    <div class="moment-card-actions">
                        <button class="secondary-button compact-button" type="button" data-moment-edit="${moment.id}">
                            <i class="ph ph-pencil-simple"></i> Sửa
                        </button>
                        <button class="secondary-button compact-button danger-button" type="button" data-moment-delete="${moment.id}" data-image-path="${escapeAttribute(moment.imagePath)}">
                            <i class="ph ph-trash"></i> Xóa
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
    if (!time) return "Vừa xong";

    return new Intl.DateTimeFormat("vi-VN", {
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
