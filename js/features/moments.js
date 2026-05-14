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
import { getCurrentLocale, getSceneText, translate } from "../app/i18n.js";
import { state } from "../app/state.js";
import { showToast } from "../ui/ui.js";
import { DEFAULT_MAX_SOURCE_SIZE, LONG_CACHE_CONTROL, optimizeImageForUpload } from "../utils/image-optimizer.js";

const MAX_IMAGE_SIZE = DEFAULT_MAX_SOURCE_SIZE;
const momentCountsByScene = new Map();

let controlsBound = false;
let afterMomentsChange = () => {};

export function setMomentsChangeHandler(callback) {
    // Thiết lập hàm xử lý khi khoảnh khắc thay đổi
    // Mục đích: Đăng ký một hành động sẽ thực hiện sau khi danh sách khoảnh khắc được cập nhật (ví dụ: làm mới UI khác).
    afterMomentsChange = typeof callback === "function" ? callback : () => {};
}

export function bindMomentControls() {
    // Gắn sự kiện cho các điều khiển khoảnh khắc
    // Mục đích: Lắng nghe các thao tác mở form, hủy, xem trước ảnh, gửi form và các hành động trên thẻ khoảnh khắc (sửa/xóa).
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("open-moment-form")?.addEventListener("click", () => {
        if (!auth?.currentUser) {
            showToast(translate("toast.needLoginMomentPost"));
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
    // Hiển thị danh sách khoảnh khắc của một địa điểm cụ thể
    // Mục đích: Tải dữ liệu từ Firebase, đếm số bài đăng, lấy phản ứng (reaction) và render vào danh sách hiển thị.
    // Ghi chú Async: Phải đợi (await) hai bước quan trọng: lấy danh sách bài đăng và lấy tóm tắt cảm xúc (tim, like) của từng bài từ server trước khi hiển thị.
    const list = document.getElementById("moments-list");
    const countLabel = document.getElementById("moment-count-label");
    if (!list || !countLabel || !scene) return;

    if (!auth?.currentUser || !db) {
        momentCountsByScene.set(scene.id, 0);
        countLabel.textContent = `0 ${translate("unit.post")}`;
        list.innerHTML = `
            <div class="moments-empty">
                <i class="ph ph-lock-key"></i>
                <p>${translate("moments.emptyLogin")}</p>
            </div>
        `;
        afterMomentsChange();
        return;
    }

    list.innerHTML = `
            <div class="moments-loading">
                <i class="ph ph-spinner-gap"></i>
                <span>${translate("moments.loading")}</span>
            </div>
    `;

    try {
        const moments = await fetchMomentsForScene(scene.id);
        await attachReactionSummaries(moments);
        momentCountsByScene.set(scene.id, moments.length);
        countLabel.textContent = `${moments.length} ${translate("unit.post")}`;

        if (!moments.length) {
            list.innerHTML = `
                <div class="moments-empty">
                    <i class="ph ph-camera"></i>
                    <p>${translate("moments.empty")}</p>
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
        countLabel.textContent = `0 ${translate("unit.post")}`;
        list.innerHTML = `
            <div class="moments-empty error">
                <i class="ph ph-warning"></i>
                <p>${translate("moments.error")}</p>
            </div>
        `;
        showToast(translate("toast.momentLoadError"));
        afterMomentsChange();
    }
}

export function getMomentCountByScene(sceneId) {
    // Lấy số lượng khoảnh khắc của một địa điểm
    // Mục đích: Trả về con số đã được lưu trong bộ nhớ đệm Map để hiển thị nhanh trên bản đồ hoặc danh sách.
    return momentCountsByScene.get(sceneId) || 0;
}

async function fetchMomentsForScene(sceneId) {
    // Truy xuất khoảnh khắc từ Firebase Firestore
    // Mục đích: Lấy cả khoảnh khắc công khai và khoảnh khắc riêng tư của chính người dùng tại địa điểm này.
    // Ghi chú Async: Sử dụng 'await Promise.allSettled' để thực hiện đồng thời hai truy vấn (bài đăng công khai và bài đăng của cá nhân). Việc này giúp giảm độ trễ khi lấy dữ liệu từ database.
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
    // Lọc và thêm khoảnh khắc vào danh sách kết quả
    // Mục đích: Duyệt qua snapshot từ Firestore và chỉ lấy những khoảnh khắc thuộc về địa điểm đang xem.
    snapshot.forEach((item) => {
        const moment = normalizeMoment(item);
        if (moment.sceneId === sceneId) {
            target.set(item.id, moment);
        }
    });
}

async function attachReactionSummaries(moments) {
    // Đính kèm tóm tắt cảm xúc vào danh sách khoảnh khắc
    // Mục đích: Thống kê số lượng từng loại cảm xúc (thích, tim, tiệc) và kiểm tra người xem đã thả cảm xúc chưa.
    // Ghi chú Async: Vì Firestore giới hạn số lượng ID trong một truy vấn, hàm này phải chia nhỏ danh sách (chunk) và 'await' từng đợt lấy dữ liệu cảm xúc tương ứng.
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
    // Xử lý gửi form đăng hoặc cập nhật khoảnh khắc
    // Mục đích: Kiểm tra dữ liệu, upload ảnh mới nếu có, lưu vào Firestore và tạo thông báo hoạt động.
    // Ghi chú Async: Quy trình này bao gồm nhiều bước chờ đợi: tải ảnh (nếu có), lưu bài đăng, và tạo thông báo. 'await' đảm bảo các bước này thực hiện đúng thứ tự và form chỉ reset sau khi tất cả đã xong.
    event.preventDefault();

    if (!auth?.currentUser || !db || !storage) {
        showToast(translate("toast.needLoginMomentSave"));
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
        showToast(translate("toast.needCaption"));
        return;
    }

    if (file && !validateImageFile(file)) return;

    submitButton.disabled = true;
    submitButton.innerHTML = `<i class="ph ph-spinner-gap"></i> ${translate("moments.saveLoading")}`;

    try {
        if (editId) {
            await updateMoment(editId, { caption, mood, visibility, file, oldImagePath });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_updated",
                title: translate("notification.momentUpdated"),
                body: translate("moments.notificationUpdated", { sceneTitle: getSceneText(scene, "title") }),
                momentId: editId,
                sceneId: scene.id
            });
            showToast(translate("toast.momentUpdated"));
        } else {
            const momentId = await createMoment(scene, { caption, mood, visibility, file });
            await createNotification({
                uid: auth.currentUser.uid,
                type: "moment_created",
                title: translate("notification.momentCreated"),
                body: translate("moments.notificationCreated", { sceneTitle: getSceneText(scene, "title") }),
                momentId,
                sceneId: scene.id
            });
            showToast(translate("toast.momentSaved"));
        }

        form.reset();
        closeMomentForm();
        await renderMomentsForScene(scene);
    } catch (error) {
        console.error("Moment save error:", error);
        showToast(translate("toast.momentSaveError"));
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="ph ph-floppy-disk"></i> ${translate("tour.saveMoment")}`;
    }
}

async function createMoment(scene, { caption, mood, visibility, file }) {
    // Tạo một khoảnh khắc mới trên Firebase
    // Mục đích: Lưu nội dung văn bản, cảm xúc và ảnh (nếu có) vào bộ sưu tập 'moments' trong Firestore.
    // Ghi chú Async: Đợi (await) quá trình upload ảnh lên Storage lấy URL, sau đó tiếp tục đợi ghi toàn bộ dữ liệu vào Firestore.
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
    // Cập nhật thông tin một khoảnh khắc đã có
    // Mục đích: Thay đổi nội dung, trạng thái hiển thị và thay thế ảnh cũ bằng ảnh mới nếu người dùng tải lên lại.
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
    // Điều phối các hành động trên thẻ khoảnh khắc
    // Mục đích: Xác định người dùng nhấn vào nút thả cảm xúc, sửa hay xóa để gọi hàm xử lý tương ứng.
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
    // Xử lý việc thả hoặc gỡ cảm xúc
    // Mục đích: Lưu cảm xúc vào Firestore, cập nhật thông báo cho chủ sở hữu bài viết và làm mới danh sách hiển thị.
    // Ghi chú Async: Cần đợi (await) Firestore kiểm tra xem người dùng đã thả cảm xúc trước đó chưa, sau đó mới quyết định thêm mới hoặc xóa bản ghi cảm xúc.
    if (!auth?.currentUser || !db) {
        showToast(translate("toast.needLoginReaction"));
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
            showToast(translate("toast.reactionRemoved"));
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
                title: translate("moments.reactionTitle", { name: state.customName, reaction }),
                body: translate("moments.reactionBody", { caption: moment.caption || button.dataset.caption || translate("moments.yourMoment") }),
                momentId,
                sceneId: moment.sceneId || button.dataset.sceneId || ""
            });
        }

        showToast(translate("toast.reactionSaved"));
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Reaction save error:", error);
        showToast(translate("toast.reactionError"));
    } finally {
        button.disabled = false;
    }
}

async function createNotification({ uid, type, title, body, momentId = "", sceneId = "" }) {
    // Tạo thông báo mới cho người dùng
    // Mục đích: Ghi một bản ghi thông báo vào Firestore để người dùng nhận được tin nhắn về hoạt động mới (cảm xúc, cập nhật).
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
    // Xóa một khoảnh khắc
    // Mục đích: Xóa dữ liệu trong Firestore và xóa file ảnh tương ứng trong Storage để giải phóng dung lượng.
    if (!momentId || !auth?.currentUser || !db) return;

    const confirmed = window.confirm(translate("confirm.deleteMoment"));
    if (!confirmed) return;

    try {
        if (imagePath) {
            await deleteMomentImage(imagePath);
        }

        await deleteDoc(doc(db, "moments", momentId));
        showToast(translate("toast.momentDeleted"));
        await renderMomentsForScene(route[state.currentStep]);
    } catch (error) {
        console.error("Moment delete error:", error);
        showToast(translate("toast.momentDeleteError"));
    }
}

async function uploadMomentImage(uid, momentId, file) {
    // Tải ảnh khoảnh khắc lên Firebase Storage
    // Mục đích: Lưu trữ file ảnh và trả về URL để ứng dụng có thể hiển thị ảnh đó sau này.
    const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82
    });
    const safeName = optimizedFile.name.replace(/[^\w.-]/g, "_");
    const imagePath = `moment-images/${uid}/${momentId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, optimizedFile, {
        contentType: optimizedFile.type,
        cacheControl: LONG_CACHE_CONTROL
    });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function deleteMomentImage(imagePath) {
    // Xóa ảnh khỏi Firebase Storage
    // Mục đích: Loại bỏ file vật lý trên server khi khoảnh khắc bị xóa hoặc ảnh được thay thế.
    if (!imagePath || !storage) return;

    try {
        await deleteObject(ref(storage, imagePath));
    } catch (error) {
        console.warn("Moment image delete skipped:", error);
    }
}

function openMomentForm(momentId = "") {
    // Mở form đăng khoảnh khắc
    // Mục đích: Hiển thị giao diện nhập liệu, nếu có momentId thì sẽ điền sẵn dữ liệu cũ để thực hiện việc chỉnh sửa.
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
    // Đóng form đăng khoảnh khắc
    // Mục đích: Ẩn giao diện form và xóa sạch các dữ liệu đang nhập dở để chuẩn bị cho lần sau.
    const form = document.getElementById("moment-form");
    if (!form) return;

    form.classList.add("hidden");
    form.reset();
    document.getElementById("moment-edit-id").value = "";
    document.getElementById("moment-edit-image-path").value = "";
    resetMomentPreview();
}

function handlePhotoPreview(event) {
    // Xử lý xem trước ảnh khoảnh khắc
    // Mục đích: Hiển thị hình ảnh ngay khi người dùng chọn file từ máy tính để họ kiểm tra trước khi lưu.
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
    preview.innerHTML = `<img src="${imageUrl}" alt="${translate("moments.previewAlt")}" decoding="async">`;
}

function resetMomentPreview() {
    // Đặt lại vùng xem trước ảnh
    // Mục đích: Xóa ảnh xem trước và ẩn vùng hiển thị khi form được reset hoặc hủy.
    const preview = document.getElementById("moment-preview");
    if (!preview) return;

    preview.classList.add("hidden");
    preview.innerHTML = "";
}

function validateImageFile(file) {
    // Kiểm tra tính hợp lệ của file ảnh khoảnh khắc
    // Mục đích: Đảm bảo người dùng chọn đúng định dạng ảnh và file không quá nặng (tránh lỗi upload).
    if (!file.type.startsWith("image/")) {
        showToast(translate("toast.imageOnly"));
        return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        showToast(translate("toast.photoMax"));
        return false;
    }

    return true;
}

function renderMomentCard(moment) {
    // Tạo HTML cho thẻ khoảnh khắc
    // Mục đích: Hiển thị nội dung, ảnh, thông tin tác giả, cảm xúc và các nút chức năng (nếu là chủ sở hữu).
    const isOwner = auth?.currentUser?.uid === moment.uid;
    const visibilityText = moment.visibility === "public" ? translate("moments.publicLabel") : translate("moments.privateLabel");
    const image = moment.imageUrl
        ? `<img class="moment-image img-loading-skeleton" src="${escapeAttribute(moment.imageUrl)}" alt="${escapeAttribute(translate("moments.imageAlt", { sceneTitle: moment.sceneTitle }))}" loading="lazy" decoding="async" onload="this.classList.remove('img-loading-skeleton')">`
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
                    <span>${escapeHtml(moment.authorName || translate("fallback.explorer"))}</span>
                    <span>${formatMomentDate(moment.createdAt)}</span>
                </div>
                <div class="moment-reactions" aria-label="${translate("moments.reactLabel")}">
                    ${renderReactionButton(moment, "👍", translate("moments.like"))}
                    ${renderReactionButton(moment, "💛", translate("moments.love"))}
                    ${renderReactionButton(moment, "🎉", translate("moments.celebrate"))}
                </div>
                ${isOwner ? `
                    <div class="moment-card-actions">
                        <button class="secondary-button compact-button" type="button" data-moment-edit="${moment.id}">
                            <i class="ph ph-pencil-simple"></i> ${translate("moments.edit")}
                        </button>
                        <button class="secondary-button compact-button danger-button" type="button" data-moment-delete="${moment.id}" data-image-path="${escapeAttribute(moment.imagePath)}">
                            <i class="ph ph-trash"></i> ${translate("moments.delete")}
                        </button>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

function renderReactionButton(moment, reaction, label) {
    // Tạo HTML cho nút thả cảm xúc
    // Mục đích: Hiển thị icon cảm xúc kèm theo số lượng người đã thả và trạng thái (đã nhấn hay chưa).
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
    // Chuẩn hóa dữ liệu khoảnh khắc
    // Mục đích: Hợp nhất ID tài liệu và dữ liệu bên trong thành một đối tượng JavaScript duy nhất.
    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

function getTime(value) {
    // Lấy thời gian dạng miliseconds
    // Mục đích: Chuyển đổi linh hoạt các định dạng thời gian từ Firebase sang số nguyên để sắp xếp bài đăng.
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatMomentDate(value) {
    // Định dạng ngày tháng cho khoảnh khắc
    // Mục đích: Hiển thị thời gian đăng bài dưới dạng DD/MM/YYYY HH:MM dễ đọc.
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
    // Làm sạch chuỗi văn bản an toàn
    // Mục đích: Ngăn chặn các mã độc HTML từ phía người dùng nhập vào.
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
    // Làm sạch văn bản dùng trong thuộc tính thẻ HTML
    // Mục đích: Đảm bảo dữ liệu không phá hỏng các attribute như 'src' hay 'alt'.
    return escapeHtml(value).replaceAll("`", "&#096;");
}
