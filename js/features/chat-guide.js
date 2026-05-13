import { auth, db, doc, functions, getDoc, httpsCallable, serverTimestamp, setDoc } from "../firebase/index.js";
import { route } from "../../data/route.js";
import { getSceneText, translate, getCurrentLanguage } from "../app/i18n.js";
import { state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

let guideCallable = null;
let isMounted = false;
let isSending = false;

const GUIDE_POSITION_KEY = "vku-guide-chat-position";
const GUIDE_HISTORY_KEY = "vku-guide-chat-history";
const GUIDE_HISTORY_COLLECTION = "guideChatHistories";
const GUIDE_EDGE_PADDING = 14;
const GUIDE_DRAG_THRESHOLD = 6;
const GUIDE_MAX_HISTORY_MESSAGES = 80;
const GUIDE_CONTEXT_HISTORY_MESSAGES = 12;
const GUIDE_PET_SPRITESHEET_SRC = new URL("../../assets/images/pets/gugugaga-vku/spritesheet.webp", import.meta.url).href;
const GUIDE_STAGE_ALERT_DURATION = 9000;
const GUIDE_PET_TEMP_CLASSES = [
    "is-pet-failed",
    "is-pet-jumping",
    "is-pet-reviewing",
    "is-pet-waiting",
    "is-pet-waving",
];

let guidePetTimer = null;
let guideAmbientTimer = null;
let guideStageTimer = null;
let latestStagePayload = null;
let latestStageMessageKey = "";
let guideHistoryCache = [];

export function setupGuideChat() {
    // Khởi tạo hệ thống chatbot Guide (linh vật hỗ trợ)
    // Mục đích: Thiết lập giao diện chatbot, xử lý kéo thả, khôi phục lịch sử tin nhắn và lắng nghe các sự kiện thay đổi ngôn ngữ/chặng đường.
    if (isMounted) return;
    isMounted = true;
    guideCallable = functions ? httpsCallable(functions, "chatGuide") : null;
    preloadGuidePetSpritesheet();

    const root = document.createElement("aside");
    root.className = "guide-chat";
    root.setAttribute("aria-label", "VKU guide chat");
    renderGuideTemplate(root);

    document.body.appendChild(root);
    applySavedGuidePosition(root);

    bindGuideEvents(root);
    restoreGuideMessages(root);
    startGuidePetMood(root);
    window.addEventListener("resize", () => clampGuidePosition(root, true));
    window.addEventListener("vku-guide-stage", (event) => {
        showGuideStageAlert(root, event.detail);
    });

    window.addEventListener("vku-language-change", () => {
        const isOpen = root.classList.contains("is-open");
        renderGuideTemplate(root);
        bindGuideEvents(root);
        setGuideOpen(root, isOpen);
        restoreGuideMessages(root);
        if (latestStagePayload) {
            renderGuideStageCard(root, latestStagePayload);
        }
    });
}

function renderGuideTemplate(root) {
    // Tạo cấu trúc HTML cho chatbot Guide
    // Mục đích: Render nút kích hoạt (linh vật), bảng điều khiển chat, các nút hành động nhanh và form nhập tin nhắn.
    root.innerHTML = `
        <button class="guide-chat-toggle" type="button" aria-expanded="false" aria-controls="guide-chat-panel">
            <span class="guide-chat-pet" aria-hidden="true"></span>
            <span class="sr-only">${translate("guide.title")}</span>
        </button>
        <section class="guide-stage-card" aria-live="polite" aria-hidden="true"></section>
        <section class="guide-chat-panel" id="guide-chat-panel" aria-hidden="true">
            <button class="guide-chat-close" type="button" aria-label="${getCurrentLanguage() === "en" ? "Close" : "Đóng"}">
                <i class="ph ph-x"></i>
            </button>
            <div class="guide-chat-status">
                <span></span>
                <p>${buildGuideContextLabel()}</p>
            </div>
            <div class="guide-chat-messages" role="log" aria-live="polite"></div>
            <div class="guide-quick-actions" aria-label="Guide quick actions">
                <button type="button" data-guide-quick-action="map">
                    <i class="ph ph-map-trifold"></i>
                    ${getCurrentLanguage() === "en" ? "Map" : "Bản đồ"}
                </button>
                <button type="button" data-guide-quick-action="route">
                    <i class="ph ph-list-checks"></i>
                    ${getCurrentLanguage() === "en" ? "Route" : "Lộ trình"}
                </button>
                <button type="button" data-guide-quick-action="mission">
                    <i class="ph ph-flag"></i>
                    ${getCurrentLanguage() === "en" ? "Mission" : "Nhiệm vụ"}
                </button>
            </div>
            <form class="guide-chat-form">
                <div class="guide-chat-composer">
                    <input
                        class="guide-chat-input"
                        type="text"
                        maxlength="1000"
                        autocomplete="off"
                        placeholder="${translate("guide.placeholder")}"
                        aria-label="Message"
                    >
                    <button class="guide-chat-send" type="submit" aria-label="Send">
                        <i class="ph ph-paper-plane-tilt"></i>
                    </button>
                </div>
            </form>
        </section>
    `;
}

function bindGuideEvents(root) {
    // Gắn sự kiện cho chatbot Guide
    // Mục đích: Xử lý nhấn nút đóng/mở, kéo thả linh vật, các nút hành động nhanh (Bản đồ, Nhiệm vụ) và gửi tin nhắn chat.
    const toggle = root.querySelector(".guide-chat-toggle");

    toggle?.addEventListener("click", (event) => {
        if (root.dataset.dragSuppressClick === "true") {
            event.preventDefault();
            root.dataset.dragSuppressClick = "false";
            return;
        }

        setGuideOpen(root, !root.classList.contains("is-open"));
    });
    bindGuideDrag(root, toggle);
    root.querySelector(".guide-chat-close")?.addEventListener("click", () => {
        setGuideOpen(root, false);
    });
    root.querySelector(".guide-quick-actions")?.addEventListener("click", (event) => {
        const action = event.target.closest("[data-guide-quick-action]")?.dataset.guideQuickAction;
        if (!action) return;
        handleGuideQuickAction(root, action);
    });
    root.querySelector(".guide-stage-card")?.addEventListener("click", (event) => {
        const action = event.target.closest("[data-guide-stage-action]")?.dataset.guideStageAction;
        if (!action) return;

        if (action === "dismiss") {
            hideGuideStageAlert(root);
            return;
        }

        if (action === "map") {
            window.dispatchEvent(new CustomEvent("vku-guide-open-map"));
            hideGuideStageAlert(root);
            return;
        }

        if (action === "complete") {
            window.dispatchEvent(new CustomEvent("vku-guide-complete-step"));
            hideGuideStageAlert(root);
        }
    });
    root.querySelector(".guide-chat-form")?.addEventListener("submit", (event) => {
        void handleGuideSubmit(root, event);
    });
}

function handleGuideQuickAction(root, action) {
    // Xử lý các lệnh hành động nhanh từ chatbot
    // Mục đích: Mở bản đồ, lộ trình, di chuyển chặng hoặc yêu cầu Guide giải thích nhiệm vụ hiện tại.
    if (action === "map") {
        window.dispatchEvent(new CustomEvent("vku-guide-open-map"));
        return;
    }

    if (action === "route") {
        window.dispatchEvent(new CustomEvent("vku-guide-open-route"));
        return;
    }

    if (action === "mission") {
        const { title, mission } = getCurrentGuideSceneDetails();
        const text = getCurrentLanguage() === "en"
            ? `Mission at ${title}: ${mission || "Look around this stop and continue when you're ready."}`
            : `Nhiệm vụ ở ${title} nè: ${mission || "Bạn nhìn quanh chặng này rồi bấm đi tiếp khi sẵn sàng nha."}`;
        addGuideMessage(root, "assistant", text);
        playGuidePetAnimation(root, "jumping", 900);
        return;
    }
}

function getCurrentGuideSceneDetails() {
    // Lấy thông tin chặng hiện tại cho Guide
    // Mục đích: Truy xuất tiêu đề và nhiệm vụ của địa điểm người dùng đang đứng để Guide có thể trả lời chính xác.
    const scene = route[state.currentStep] || route[0];
    if (!scene) {
        return {
            title: getCurrentLanguage() === "en" ? "this stop" : "chặng này",
            mission: "",
        };
    }

    return {
        title: getSceneText(scene, "shortTitle") || getSceneText(scene, "title") || (getCurrentLanguage() === "en" ? "this stop" : "chặng này"),
        mission: String(getSceneText(scene, "mission") || "").trim(),
    };
}

function bindGuideDrag(root, toggle) {
    // Xử lý việc kéo thả linh vật Guide trên màn hình
    // Mục đích: Cho phép người dùng di chuyển chatbot đến vị trí thuận tiện và tránh che mất các nội dung quan trọng khác.
    if (!toggle) return;

    let drag = null;

    toggle.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;

        const rect = root.getBoundingClientRect();
        drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: rect.left,
            top: rect.top,
            moved: false,
        };

        toggle.setPointerCapture?.(event.pointerId);
        clearTemporaryPetAnimation(root);
        root.classList.add("is-dragging");
    });

    toggle.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;

        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        if (Math.hypot(deltaX, deltaY) >= GUIDE_DRAG_THRESHOLD) {
            drag.moved = true;
            root.dataset.dragSuppressClick = "true";
        }

        if (!drag.moved) return;

        event.preventDefault();
        root.classList.toggle("is-moving-left", deltaX < 0);
        root.classList.toggle("is-moving-right", deltaX >= 0);
        placeGuideChat(root, drag.left + deltaX, drag.top + deltaY);
    });

    const endDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;

        toggle.releasePointerCapture?.(event.pointerId);
        root.classList.remove("is-dragging", "is-moving-left", "is-moving-right");

        if (drag.moved) {
            saveGuidePosition(root);
            window.setTimeout(() => {
                root.dataset.dragSuppressClick = "false";
            }, 250);
        }

        drag = null;
    };

    toggle.addEventListener("pointerup", endDrag);
    toggle.addEventListener("pointercancel", endDrag);
}

function applySavedGuidePosition(root) {
    // Khôi phục vị trí chatbot đã lưu
    // Mục đích: Lấy tọa độ từ localStorage để đặt chatbot vào đúng vị trí người dùng đã để ở phiên làm việc trước.
    try {
        const saved = JSON.parse(localStorage.getItem(GUIDE_POSITION_KEY) || "null");
        if (!saved || !Number.isFinite(saved.left) || !Number.isFinite(saved.top)) {
            updateGuidePanelDocking(root);
            return;
        }

        placeGuideChat(root, saved.left, saved.top);
    } catch {
        updateGuidePanelDocking(root);
    }
}

function placeGuideChat(root, left, top) {
    // Đặt chatbot vào một vị trí cụ thể
    // Mục đích: Cập nhật CSS left/top và xác định phía neo (docking) để bảng chat mở ra không bị tràn khỏi màn hình.
    const { left: safeLeft, top: safeTop } = getClampedGuidePosition(root, left, top);

    root.style.left = `${safeLeft}px`;
    root.style.top = `${safeTop}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
    updateGuidePanelDocking(root, safeLeft, safeTop);
}

function clampGuidePosition(root, shouldSave = false) {
    // Ràng buộc vị trí chatbot trong vùng nhìn thấy
    // Mục đích: Đảm bảo chatbot không bị kéo ra ngoài rìa màn hình và lưu lại vị trí hợp lệ.
    const rect = root.getBoundingClientRect();
    placeGuideChat(root, rect.left, rect.top);
    if (shouldSave) {
        saveGuidePosition(root);
    }
}

function getClampedGuidePosition(root, left, top) {
    // Tính toán tọa độ hợp lệ (không vượt quá biên)
    // Mục đích: Đảm bảo khoảng cách an toàn (padding) giữa chatbot và các cạnh của trình duyệt.
    const rect = root.getBoundingClientRect();
    const width = rect.width || 132;
    const height = rect.height || 143;

    return {
        left: clamp(left, GUIDE_EDGE_PADDING, window.innerWidth - width - GUIDE_EDGE_PADDING),
        top: clamp(top, GUIDE_EDGE_PADDING, window.innerHeight - height - GUIDE_EDGE_PADDING),
    };
}

function updateGuidePanelDocking(root, left = root.getBoundingClientRect().left, top = root.getBoundingClientRect().top) {
    // Cập nhật hướng mở của bảng chat
    // Mục đích: Tự động điều chỉnh bảng chat mở sang trái/phải hoặc lên/xuống dựa trên vị trí hiện tại của linh vật.
    root.classList.toggle("is-docked-left", left < 360);
    root.classList.toggle("is-docked-top", top < 340);
}

function saveGuidePosition(root) {
    // Lưu vị trí chatbot vào bộ nhớ đệm
    // Mục đích: Ghi nhớ tọa độ X, Y hiện tại vào localStorage.
    const rect = root.getBoundingClientRect();
    localStorage.setItem(GUIDE_POSITION_KEY, JSON.stringify({
        left: Math.round(rect.left),
        top: Math.round(rect.top),
    }));
}

function clamp(value, min, max) {
    // Hàm tiện ích giới hạn giá trị số
    // Mục đích: Giữ một con số nằm trong khoảng [min, max].
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
}

function preloadGuidePetSpritesheet() {
    // Tải trước hình ảnh hoạt ảnh của linh vật
    // Mục đích: Tránh tình trạng linh vật bị biến mất hoặc nhấp nháy khi thực hiện các hoạt động (nhảy, vẫy tay).
    const image = new Image();
    image.decoding = "async";
    image.src = GUIDE_PET_SPRITESHEET_SRC;
}

async function handleGuideSubmit(root, event) {
    // Xử lý khi người dùng gửi tin nhắn cho chatbot
    // Mục đích: Gửi nội dung tới Firebase Cloud Functions để xử lý bằng AI (Gemini) và hiển thị câu trả lời.
    // Ghi chú Async: Hàm này 'await' phản hồi từ AI (guideCallable). Quá trình suy luận của AI tốn vài giây, 'await' giúp mã lệnh dừng lại đúng lúc để nhận câu trả lời trước khi hiển thị lên màn hình.
    event.preventDefault();
    if (isSending) return;

    const input = root.querySelector(".guide-chat-input");
    const message = input?.value.trim();
    if (!message) return;

    addGuideMessage(root, "user", message);
    input.value = "";

    if (!auth?.currentUser) {
        showToast(translate("guide.needLogin"));
        addGuideMessage(root, "assistant", translate("guide.needLoginLong"));
        playGuidePetAnimation(root, "failed", 1400);
        return;
    }

    if (!guideCallable) {
        addGuideMessage(root, "assistant", translate("guide.noFunctions"));
        playGuidePetAnimation(root, "failed", 1400);
        return;
    }

    setSending(root, true);
    const thinking = addGuideMessage(root, "assistant", "", true);

    try {
        const currentLang = getCurrentLanguage();
        const result = await guideCallable({
            message: currentLang === "en" ? `${message} (Please reply in English)` : message,
            language: currentLang,
            history: buildGuideHistoryPayload(message),
            currentScene: buildCurrentScenePayload(),
            progress: {
                currentStep: state.currentStep,
                unlockedStep: state.unlockedStep,
            },
        });
        thinking.textContent = normalizeGuideText(result.data?.reply || translate("guide.noReply"));
        persistGuideMessage("assistant", thinking.textContent);
        scrollGuideMessages(root);
        playGuidePetAnimation(root, "reviewing", 1200);
    } catch (error) {
        console.error("Guide chat error:", error);
        thinking.textContent = translate("guide.error");
        persistGuideMessage("assistant", thinking.textContent);
        scrollGuideMessages(root);
        playGuidePetAnimation(root, "failed", 1500);
    } finally {
        setSending(root, false);
    }
}

function buildCurrentScenePayload() {
    // Tạo dữ liệu ngữ cảnh về chặng hiện tại cho AI
    // Mục đích: Cung cấp thông tin địa danh, nhiệm vụ để AI có thể trả lời các câu hỏi liên quan đến vị trí người dùng.
    const scene = route[state.currentStep] || route[0];
    if (!scene) return null;

    return {
        id: scene.id,
        zone: scene.zone,
        zoneName: getSceneText(scene, "zoneName"),
        title: getSceneText(scene, "title"),
        shortTitle: getSceneText(scene, "shortTitle"),
        chapter: getSceneText(scene, "chapter"),
        body: getSceneText(scene, "body"),
        mission: getSceneText(scene, "mission"),
        notes: getSceneText(scene, "notes"),
    };
}

function buildGuideContextLabel() {
    // Tạo nhãn hiển thị ngữ cảnh chặng hiện tại
    // Mục đích: Hiển thị tên chặng đang đứng ngay trên đầu bảng chat để người dùng dễ theo dõi.
    const scene = route[state.currentStep] || route[0];
    const sceneName = scene ? getSceneText(scene, "shortTitle") || getSceneText(scene, "title") : "";
    const prefix = getCurrentLanguage() === "en" ? "Current stop" : "Chặng hiện tại";
    return sceneName ? `${prefix}: ${sceneName}` : prefix;
}

function setGuideOpen(root, isOpen) {
    // Điều khiển việc đóng/mở giao diện chat
    // Mục đích: Chuyển đổi trạng thái hiển thị của bảng chat và kích hoạt hoạt ảnh vẫy tay của linh vật khi mở.
    root.classList.toggle("is-open", isOpen);
    root.querySelector(".guide-chat-toggle")?.setAttribute("aria-expanded", String(isOpen));
    root.querySelector(".guide-chat-panel")?.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
        hideGuideStageAlert(root);
        playGuidePetAnimation(root, "waving", 900);
        root.querySelector(".guide-chat-input")?.focus();
    }
}

function restoreGuideMessages(root) {
    // Khôi phục các tin nhắn cũ
    // Mục đích: Tải lại lịch sử chat từ localStorage và đồng bộ thêm từ Firebase (nếu đã đăng nhập).
    const history = loadGuideHistory();
    renderGuideMessages(root, history);
    void syncGuideHistoryFromFirebase(root);
}

function addGuideMessage(root, role, text, isSkeleton = false, shouldPersist = true) {
    // Thêm một tin nhắn mới vào giao diện chat
    // Mục đích: Tạo bong bóng chat cho người dùng hoặc Guide, hỗ trợ hiệu ứng skeleton khi đang 'suy nghĩ'.
    const list = root.querySelector(".guide-chat-messages");
    const bubble = document.createElement("div");
    bubble.className = `guide-chat-message ${role}${isSkeleton ? " is-typing" : ""}`;
    
    if (isSkeleton) {
        bubble.innerHTML = `
            <div class="guide-typing-indicator" role="status" aria-live="polite">
                <span class="guide-typing-dots" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                </span>
                <span>${getCurrentLanguage() === "en" ? "VKU Guide is typing..." : "VKU Guide đang soạn..."}</span>
            </div>
        `;
    } else {
        bubble.textContent = normalizeGuideText(text);
        if (shouldPersist) {
            persistGuideMessage(role, bubble.textContent);
        }
    }

    list?.appendChild(bubble);
    scrollGuideMessages(root);
    return bubble;
}

function scrollGuideMessages(root, behavior = "smooth") {
    // Cuộn danh sách tin nhắn xuống cuối
    // Mục đích: Luôn hiển thị các tin nhắn mới nhất vừa được thêm vào.
    const list = root.querySelector(".guide-chat-messages");
    if (!list) return;

    requestAnimationFrame(() => {
        list.scrollTo({ top: list.scrollHeight, behavior });
    });
}

function buildGuideHistoryPayload(currentMessage = "") {
    // Chuẩn bị dữ liệu lịch sử gửi cho AI
    // Mục đích: Lấy ra N tin nhắn gần nhất để AI hiểu được mạch hội thoại (context).
    const currentText = normalizeGuideText(currentMessage);
    const history = guideHistoryCache.length ? guideHistoryCache : loadGuideHistory();
    const context = history.slice();
    const latest = context.at(-1);

    if (latest?.role === "user" && latest.text === currentText) {
        context.pop();
    }

    return context.slice(-GUIDE_CONTEXT_HISTORY_MESSAGES);
}

function persistGuideMessage(role, text) {
    // Lưu trữ tin nhắn vào bộ nhớ đệm lịch sử
    // Mục đích: Ghi lại tin nhắn mới kèm theo mốc thời gian và ngôn ngữ vào mảng cache.
    const normalizedText = normalizeGuideText(text);
    if (!normalizedText || !["assistant", "user"].includes(role)) return;

    const history = guideHistoryCache.length ? guideHistoryCache.slice() : loadGuideHistory();
    history.push({
        role,
        text: normalizedText,
        language: getCurrentLanguage(),
        createdAt: Date.now(),
    });
    saveGuideHistory(history.slice(-GUIDE_MAX_HISTORY_MESSAGES));
}

function loadGuideHistory() {
    // Tải lịch sử chat từ localStorage
    // Mục đích: Truy xuất dữ liệu JSON đã lưu và chuẩn hóa chúng thành danh sách đối tượng tin nhắn hợp lệ.
    try {
        const parsed = JSON.parse(localStorage.getItem(getGuideHistoryStorageKey()) || "[]");
        if (!Array.isArray(parsed)) return [];
        guideHistoryCache = normalizeGuideHistory(parsed);
        return guideHistoryCache;
    } catch {
        guideHistoryCache = [];
        return [];
    }
}

function normalizeGuideHistory(messages) {
    // Làm sạch và chuẩn hóa dữ liệu lịch sử chat
    // Mục đích: Đảm bảo các tin nhắn luôn có đầy đủ vai trò, nội dung văn bản và định dạng thời gian.
    if (!Array.isArray(messages)) return [];

    return messages
            .map((item) => ({
                role: item?.role === "user" ? "user" : item?.role === "assistant" ? "assistant" : "",
                text: normalizeGuideText(item?.text || "").slice(0, 1200),
                language: typeof item?.language === "string" ? item.language : "",
                createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : 0,
            }))
            .filter((item) => item.role && item.text);
}

function saveGuideHistory(history) {
    // Lưu vĩnh viễn lịch sử chat
    // Mục đích: Lưu vào localStorage và đồng bộ lên Firebase Cloud Firestore (nếu có tài khoản).
    guideHistoryCache = normalizeGuideHistory(history).slice(-GUIDE_MAX_HISTORY_MESSAGES);
    localStorage.setItem(getGuideHistoryStorageKey(), JSON.stringify(guideHistoryCache));
    void saveGuideHistoryToFirebase(guideHistoryCache);
}

function renderGuideMessages(root, history) {
    // Vẽ lại toàn bộ danh sách tin nhắn chat
    // Mục đích: Hiển thị lại hội thoại khi người dùng chuyển trang hoặc làm mới ứng dụng.
    const list = root.querySelector(".guide-chat-messages");
    if (list) list.innerHTML = "";

    if (!history.length) {
        addGuideMessage(root, "assistant", translate("guide.welcome"), false, false);
        return;
    }

    history.forEach((message) => {
        addGuideMessage(root, message.role, message.text, false, false);
    });
}

async function syncGuideHistoryFromFirebase(root) {
    // Đồng bộ lịch sử chat từ Firebase server
    // Mục đích: Giúp người dùng có thể xem lại lịch sử chat của mình trên nhiều thiết bị khác nhau.
    // Ghi chú Async: Đợi (await) quá trình tải dữ liệu từ Firestore. Việc này diễn ra ngầm khi mở ứng dụng để đảm bảo lịch sử chat luôn đầy đủ.
    if (!auth?.currentUser || !db) return;

    try {
        const snapshot = await getDoc(doc(db, GUIDE_HISTORY_COLLECTION, auth.currentUser.uid));
        const remoteHistory = normalizeGuideHistory(snapshot.data()?.messages || []);
        if (!remoteHistory.length) {
            await saveGuideHistoryToFirebase(guideHistoryCache);
            return;
        }

        const remoteKey = JSON.stringify(remoteHistory);
        const localKey = JSON.stringify(guideHistoryCache);
        if (remoteKey === localKey) return;

        guideHistoryCache = remoteHistory.slice(-GUIDE_MAX_HISTORY_MESSAGES);
        localStorage.setItem(getGuideHistoryStorageKey(), JSON.stringify(guideHistoryCache));
        renderGuideMessages(root, guideHistoryCache);
    } catch (error) {
        console.warn("Guide history sync failed:", error);
    }
}

async function saveGuideHistoryToFirebase(history) {
    // Lưu lịch sử chat lên Firebase server
    // Mục đích: Sao lưu dữ liệu hội thoại lên đám mây gắn liền với tài khoản UID người dùng.
    // Ghi chú Async: 'await' lệnh setDoc() để đảm bảo tin nhắn được ghi nhận thành công trên server trước khi kết thúc tác vụ lưu trữ.
    if (!auth?.currentUser || !db) return;

    try {
        await setDoc(doc(db, GUIDE_HISTORY_COLLECTION, auth.currentUser.uid), {
            uid: auth.currentUser.uid,
            messages: normalizeGuideHistory(history).slice(-GUIDE_MAX_HISTORY_MESSAGES),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn("Guide history save failed:", error);
    }
}

function getGuideHistoryStorageKey() {
    // Lấy khóa lưu trữ lịch sử tương ứng với người dùng
    // Mục đích: Phân biệt lịch sử chat của khách (local) và người dùng đã đăng nhập (UID).
    return auth?.currentUser ? `${GUIDE_HISTORY_KEY}:${auth.currentUser.uid}` : GUIDE_HISTORY_KEY;
}

function showGuideStageAlert(root, payload) {
    // Hiển thị thông báo chặng mới từ Guide
    // Mục đích: Khi người dùng chuyển địa điểm, linh vật Guide sẽ hiện ra thông báo nhiệm vụ và gợi ý đi tiếp.
    const tourApp = document.getElementById("tour-app");
    if (!payload || !tourApp || tourApp.classList.contains("hidden")) {
        return;
    }

    latestStagePayload = payload;
    announceGuideStageInChat(root, payload);
    const status = root.querySelector(".guide-chat-status p");
    if (status) status.textContent = buildGuideContextLabel();
    renderGuideStageCard(root, payload);
    setGuideOpen(root, false);
    root.classList.add("is-stage-alert");
    playGuidePetAnimation(root, "waving", 1100);

    if (guideStageTimer) {
        window.clearTimeout(guideStageTimer);
    }

    guideStageTimer = window.setTimeout(() => {
        hideGuideStageAlert(root);
    }, GUIDE_STAGE_ALERT_DURATION);
}

function renderGuideStageCard(root, payload) {
    // Vẽ thẻ thông tin chặng nhiệm vụ
    // Mục đích: Hiển thị tiêu đề chặng, nội dung nhiệm vụ và các nút tương tác nhanh (Mở bản đồ, Hoàn thành).
    const card = root.querySelector(".guide-stage-card");
    if (!card) return;

    const language = getCurrentLanguage();
    const actionLabel = payload.isFinal
        ? (language === "en" ? "Finish" : "Hoàn thành")
        : (language === "en" ? "Continue" : "Đi tiếp");
    const mapLabel = language === "en" ? "Open map" : "Mở bản đồ";
    const dismissLabel = language === "en" ? "Close" : "Đóng";
    const title = payload.title || payload.chapter || translate("guide.title");
    const mission = payload.mission || payload.dialog || "";
    const progressText = payload.total ? `${Number(payload.step) + 1}/${payload.total}` : "";

    card.innerHTML = `
        <button class="guide-stage-close" type="button" data-guide-stage-action="dismiss" aria-label="${dismissLabel}">
            <i class="ph ph-x"></i>
        </button>
        <div class="guide-stage-meta">
            <span>${escapeHtml(payload.chapter || translate("guide.title"))}</span>
            ${progressText ? `<span>${escapeHtml(progressText)}</span>` : ""}
        </div>
        <strong>${escapeHtml(title)}</strong>
        ${mission ? `<p>${escapeHtml(mission)}</p>` : ""}
        <div class="guide-stage-actions">
            <button type="button" class="guide-stage-map" data-guide-stage-action="map">
                <i class="ph ph-map-trifold"></i>
                ${escapeHtml(mapLabel)}
            </button>
            <button type="button" class="guide-stage-complete" data-guide-stage-action="complete">
                ${escapeHtml(actionLabel)}
                <i class="ph ${payload.isFinal ? "ph-flag-checkered" : "ph-arrow-right"}"></i>
            </button>
        </div>
    `;
    card.setAttribute("aria-hidden", "false");
}

function announceGuideStageInChat(root, payload) {
    // Tự động thêm tin nhắn thông báo vào cửa sổ chat
    // Mục đích: Ghi lại dấu mốc chặng đường ngay trong lịch sử hội thoại để người dùng có thể xem lại sau.
    const language = getCurrentLanguage();
    const stepNumber = Number(payload.step) + 1;
    const messageKey = `${payload.step}:${language}`;
    if (messageKey === latestStageMessageKey) return;

    latestStageMessageKey = messageKey;
    addGuideMessage(root, "assistant", buildGuideStageMessage(payload, stepNumber, language));
}

function buildGuideStageMessage(payload, stepNumber, language) {
    // Soạn nội dung tin nhắn thông báo chặng
    // Mục đích: Tạo ra câu nói tự nhiên của Guide (tiếng Việt/Anh) dựa trên số thứ tự chặng và nhiệm vụ tương ứng.
    const progressText = payload.total ? `${stepNumber}/${payload.total}` : String(stepNumber);
    const title = payload.title || payload.chapter || translate("guide.title");
    const mission = payload.mission || payload.dialog || "";

    if (language === "en") {
        return mission
            ? `New stop ${progressText}: ${title}. Tiny mission for you: ${mission}`
            : `New stop ${progressText}: ${title}. Take a look around and ask me for the mission when you're ready.`;
    }

    return mission
        ? `Tới chặng ${progressText}: ${title} rồi nè. Nhiệm vụ nhỏ của bạn là: ${mission}`
        : `Tới chặng ${progressText}: ${title} rồi nè. Bạn nhìn quanh một vòng, cần gợi ý thì gọi mình nha.`;
}

function hideGuideStageAlert(root) {
    // Ẩn thông báo chặng nhiệm vụ
    // Mục đích: Gỡ bỏ thẻ thông báo khỏi màn hình sau một khoảng thời gian chờ hoặc khi người dùng nhấn đóng.
    root.classList.remove("is-stage-alert");
    root.querySelector(".guide-stage-card")?.setAttribute("aria-hidden", "true");

    if (guideStageTimer) {
        window.clearTimeout(guideStageTimer);
        guideStageTimer = null;
    }
}

function setSending(root, sending) {
    // Cập nhật trạng thái đang gửi tin nhắn
    // Mục đích: Vô hiệu hóa ô nhập và hiển thị hiệu ứng 'thinking' của linh vật khi đang chờ AI phản hồi.
    isSending = sending;
    root.classList.toggle("is-thinking", sending);
    const input = root.querySelector(".guide-chat-input");
    const button = root.querySelector(".guide-chat-send");
    if (input) input.disabled = sending;
    if (button) button.disabled = sending;
}

function startGuidePetMood(root) {
    // Kích hoạt các hoạt ảnh ngẫu nhiên cho linh vật
    // Mục đích: Làm cho linh vật Guide trông sống động hơn bằng cách thỉnh thoảng nhảy hoặc chờ đợi khi người dùng rảnh tay.
    if (guideAmbientTimer) return;

    const schedule = () => {
        guideAmbientTimer = window.setTimeout(() => {
            if (!root.isConnected) {
                guideAmbientTimer = null;
                return;
            }

            if (
                !root.classList.contains("is-open")
                && !root.classList.contains("is-dragging")
                && !root.classList.contains("is-thinking")
            ) {
                const shouldJump = Math.random() > 0.45;
                playGuidePetAnimation(root, shouldJump ? "jumping" : "waiting", shouldJump ? 900 : 1300);
            }

            schedule();
        }, 3800 + Math.random() * 3200);
    };

    schedule();
}

function playGuidePetAnimation(root, state, duration = 1000) {
    // Thực hiện một hoạt ảnh cụ thể cho linh vật
    // Mục đích: Thay đổi class CSS của linh vật trong một khoảng thời gian nhất định để thể hiện các cảm xúc (vui, buồn, suy nghĩ).
    clearTemporaryPetAnimation(root);
    root.classList.add(`is-pet-${state}`);

    guidePetTimer = window.setTimeout(() => {
        clearTemporaryPetAnimation(root);
    }, duration);
}

function clearTemporaryPetAnimation(root) {
    // Xóa bỏ các hoạt ảnh tạm thời
    // Mục đích: Đưa linh vật về trạng thái đứng yên ban đầu.
    if (guidePetTimer) {
        window.clearTimeout(guidePetTimer);
        guidePetTimer = null;
    }

    root.classList.remove(...GUIDE_PET_TEMP_CLASSES);
}

function escapeHtml(value = "") {
    // Làm sạch chuỗi văn bản an toàn cho HTML
    // Mục đích: Ngăn chặn XSS bằng cách mã hóa các ký tự đặc biệt như <, >, &.
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeGuideText(value = "") {
    // Chuẩn hóa văn bản từ AI
    // Mục đích: Loại bỏ các ký tự định dạng markdown (như **, *, __) để hiển thị văn bản thuần túy trong bong bóng chat.
    return String(value)
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .trim();
}
