import { avatars } from "../../data/avatars.js";
import { route } from "../../data/route.js";
import { handleLogout } from "./auth.js";
import { getAvatarText, getCurrentLanguage, getSceneText, translate } from "../app/i18n.js";
import { renderMap, setMapNavigator } from "./map.js";
import { bindMomentControls, renderMomentsForScene, setMomentsChangeHandler } from "./moments.js";
import {
    avatarById,
    hasSavedProgress,
    resetProgress,
    routeIndexById,
    setActiveMapZone,
    setCurrentStep,
    setProfile,
    state
} from "../app/state.js";
import { showToast } from "../ui/ui.js";

let viewer;
let controlsBound = false;
const preloadedPanoramaSources = new Set();
const panoramaHeadHints = new Set();
const PANORAMA_WARM_CHUNK_BYTES = 768 * 1024;
const PANORAMA_LAZY_WINDOW = [1, -1, 2];
let panoramaLoadingTimer = null;
let lastGuideAnnouncementKey = "";
const AMBIENT_AUDIO_VOLUME = 0.34;
const AMBIENT_AUDIO_PREF_KEY = "vkuQuestAmbientAudioEnabled";

// Cinematic & Audio States
let idleTimer = null;
let isCinematic = false;
let isAudioPlaying = false;

function resetIdleTimer() {
    // Đặt lại bộ đếm thời gian chờ (idle timer)
    // Mục đích: Theo dõi hoạt động của người dùng để kích hoạt chế độ điện ảnh (cinematic) khi họ không tương tác.
    if (isCinematic) {
        isCinematic = false;
        document.querySelector(".topbar")?.classList.remove("ui-hidden");
        document.querySelector(".quest-panel")?.classList.remove("ui-hidden");
        document.querySelector(".right-sidebar")?.classList.remove("ui-hidden");
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        isCinematic = true;
        document.querySelector(".topbar")?.classList.add("ui-hidden");
        document.querySelector(".quest-panel")?.classList.add("ui-hidden");
        document.querySelector(".right-sidebar")?.classList.add("ui-hidden");
    }, 10000); // 10s idle
}

['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
});

setInterval(() => {
    if (isCinematic && viewer && typeof viewer.getYaw === 'function') {
        viewer.setYaw(viewer.getYaw() + 0.05);
    }
}, 30);

setMapNavigator((stepIndex) => loadStep(stepIndex));
setMomentsChangeHandler(() => renderMap());
window.addEventListener("vku-language-change", () => {
    if (!document.getElementById("avatar-screen")?.classList.contains("hidden")) {
        renderAvatarOptions();
        renderResumeButton();
    }

    if (!document.getElementById("tour-app")?.classList.contains("hidden")) {
        renderExperience();
    }
});

export function renderAvatarOptions() {
    // Hiển thị danh sách các nhân vật (avatar) để người dùng chọn
    // Mục đích: Render các thẻ nhân vật với hiệu ứng 3D, xử lý việc chọn nhân vật và nhập tên trước khi bắt đầu hành trình.
    const container = document.getElementById("avatar-options");
    const nameInput = document.getElementById("custom-avatar-name");
    const startBtn = document.getElementById("start-new-tour-btn");
    if (!container || !nameInput || !startBtn) return;

    container.innerHTML = avatars.map((avatar) => `
        <button class="avatar-card" type="button" data-avatar="${avatar.id}" style="--avatar-color: ${avatar.color}">
            <span class="avatar-face"><i class="ph ${avatar.icon}"></i></span>
            <span>
                <strong>${getAvatarText(avatar, "role")}</strong>
            </span>
            <span>${getAvatarText(avatar, "line")}</span>
        </button>
    `).join("");

    let tempSelectedId = null;

    const checkReady = () => {
        startBtn.disabled = !(tempSelectedId && nameInput.value.trim().length > 0);
    };

    nameInput.oninput = checkReady;

    container.querySelectorAll(".avatar-card").forEach((button) => {
        button.addEventListener("mousemove", (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            button.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
        });
        
        button.addEventListener("mouseleave", () => {
            if (!button.classList.contains("selected")) {
                button.style.transform = "";
            } else {
                button.style.transform = "translateY(-4px) scale(1.02)";
            }
        });

        button.addEventListener("click", () => {
            container.querySelectorAll(".avatar-card").forEach((card) => {
                card.classList.remove("selected");
                card.style.transform = "";
            });
            button.classList.add("selected");
            tempSelectedId = button.dataset.avatar;
            checkReady();
        });
    });

    startBtn.onclick = () => {
        const avatar = avatarById.get(tempSelectedId);
        const inputName = nameInput.value.trim();
        if (!avatar || !inputName) return;

        setProfile(avatar, inputName);
        resetProgress();
        startTour();
    };
}

export function renderResumeButton() {
    // Hiển thị hoặc ẩn nút 'Tiếp tục hành trình'
    // Mục đích: Kiểm tra xem người dùng có tiến trình cũ đã lưu hay không để cung cấp tùy chọn quay lại tour.
    const resumeButton = document.getElementById("resume-tour");
    if (!resumeButton) return;

    resumeButton.classList.toggle("hidden", !hasSavedProgress());
}

export function bindControls() {
    // Gắn các sự kiện điều khiển chính cho tour
    // Mục đích: Thiết lập lắng nghe cho các nút chuyển bước, đổi nhân vật, âm thanh, đăng xuất và các sự kiện từ chatbot guide.
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("resume-tour")?.addEventListener("click", startTour);
    document.getElementById("change-avatar")?.addEventListener("click", showAvatarScreen);
    document.getElementById("restart-tour")?.addEventListener("click", restartTour);
    document.getElementById("toggle-audio")?.addEventListener("click", toggleAudio);
    document.getElementById("prev-step")?.addEventListener("click", () => loadStep(state.currentStep - 1));
    document.getElementById("next-step")?.addEventListener("click", goNext);
    document.getElementById("tab-khu-v")?.addEventListener("click", () => focusZone("khu-v"));
    document.getElementById("tab-khu-k")?.addEventListener("click", () => focusZone("khu-k"));
    document.getElementById("tour-logout-btn")?.addEventListener("click", handleLogout);
    document.getElementById("toggle-minimap-page")?.addEventListener("click", openMinimapPage);
    window.addEventListener("vku-guide-open-map", openMinimapPage);
    window.addEventListener("vku-guide-open-route", openRoutePage);
    window.addEventListener("vku-guide-complete-step", goNext);
    bindMomentControls();
    bindSidebarControls();
    bindTourActionMenu();

    document.getElementById("close-minimap-btn")?.addEventListener("click", () => {
        closeMinimapPage();
    });
}

function bindTourActionMenu() {
    const actions = document.querySelector(".topbar-actions");
    const toggle = document.getElementById("tour-action-menu-toggle");
    const panel = document.getElementById("tour-action-menu-panel");
    if (!actions || !toggle) return;

    const setOpen = (isOpen) => {
        actions.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        panel?.setAttribute("aria-hidden", String(!isOpen));
    };

    panel?.setAttribute("aria-hidden", "true");

    toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(!actions.classList.contains("is-open"));
    });

    actions.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button || button === toggle) return;
        setOpen(false);
    });

    document.addEventListener("click", (event) => {
        if (!actions.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setOpen(false);
            toggle.focus();
        }
    });
}

function bindSidebarControls() {
    // Gắn sự kiện cho các thanh bên (sidebars) và trang tính năng
    // Mục đích: Điều khiển việc đóng/mở thanh nhiệm vụ, bản đồ, khoảnh khắc và cốt truyện, đồng thời lưu trạng thái vào localStorage.
    const app = document.getElementById("tour-app");
    const questButton = document.getElementById("toggle-quest-sidebar");
    const mapButton = document.getElementById("toggle-minimap-page");
    const momentsButton = document.getElementById("toggle-moments-page");
    const storyButton = document.getElementById("toggle-story-sidebar");
    if (!app) return;
    const isMobileLayout = () => window.matchMedia("(max-width: 880px)").matches;

    const applyState = () => {
        const routeOpen = app.classList.contains("show-route-page");
        const mapOpen = app.classList.contains("show-minimap-page") || app.classList.contains("show-mobile-map");
        const momentsOpen = app.classList.contains("show-moments-page");
        const storyHidden = app.classList.contains("story-panel-hidden");
        const storyCollapsed = app.classList.contains("story-sidebar-collapsed");

        questButton?.classList.toggle("is-active", routeOpen);
        mapButton?.classList.toggle("is-active", mapOpen);
        momentsButton?.classList.toggle("is-active", momentsOpen);
        storyButton?.classList.toggle("is-active", isMobileLayout() ? !storyHidden : !storyCollapsed);
        storyButton?.classList.toggle("is-collapsed", !isMobileLayout() && storyCollapsed);
        questButton?.setAttribute("aria-pressed", String(routeOpen));
        mapButton?.setAttribute("aria-pressed", String(mapOpen));
        momentsButton?.setAttribute("aria-pressed", String(momentsOpen));
        storyButton?.setAttribute("aria-pressed", String(isMobileLayout() ? !storyHidden : !storyCollapsed));
    };

    const toggleSidebar = (className, storageKey) => {
        app.classList.toggle(className);
        localStorage.setItem(storageKey, String(app.classList.contains(className)));
        applyState();
    };
    const closeTourPages = () => {
        app.classList.remove("show-route-page", "show-moments-page", "show-minimap-page", "show-mobile-map");
        applyState();
    };
    const openTourPage = (className) => {
        app.classList.remove("show-route-page", "show-moments-page", "show-minimap-page", "show-mobile-map");
        app.classList.add(className);
        applyState();

        if (className === "show-route-page") {
            window.requestAnimationFrame(scrollCurrentRouteIntoView);
        }
    };

    if (localStorage.getItem("vkuStorySidebarCollapsed") === "true") {
        app.classList.add("story-sidebar-collapsed");
    }

    questButton?.addEventListener("click", () => {
        if (app.classList.contains("show-route-page")) {
            closeTourPages();
            return;
        }

        openTourPage("show-route-page");
    });
    momentsButton?.addEventListener("click", () => {
        openTourPage("show-moments-page");
    });
    storyButton?.addEventListener("click", () => {
        if (isMobileLayout()) {
            app.classList.toggle("story-panel-hidden");
            app.classList.remove("show-route-page", "show-moments-page", "show-minimap-page", "show-mobile-map");
            applyState();
            return;
        }

        toggleSidebar("story-sidebar-collapsed", "vkuStorySidebarCollapsed");
    });
    document.getElementById("close-route-page-btn")?.addEventListener("click", closeTourPages);
    document.getElementById("close-moments-page-btn")?.addEventListener("click", closeTourPages);

    applyState();
}

function openMinimapPage() {
    // Mở trang bản đồ thu nhỏ (minimap)
    // Mục đích: Chuyển đổi giao diện sang chế độ xem bản đồ và đóng các trang tính năng khác.
    const app = document.getElementById("tour-app");
    if (!app) return;

    app.classList.add("show-minimap-page");
    app.classList.remove("show-route-page", "show-moments-page", "show-mobile-map");
    document.getElementById("toggle-quest-sidebar")?.classList.remove("is-active");
    document.getElementById("toggle-quest-sidebar")?.setAttribute("aria-pressed", "false");
    document.getElementById("toggle-moments-page")?.classList.remove("is-active");
    document.getElementById("toggle-moments-page")?.setAttribute("aria-pressed", "false");
    document.getElementById("toggle-minimap-page")?.classList.add("is-active");
    document.getElementById("toggle-minimap-page")?.setAttribute("aria-pressed", "true");
}

function closeMinimapPage() {
    // Đóng trang bản đồ thu nhỏ
    // Mục đích: Quay lại màn hình tour panorama chính.
    document.getElementById("tour-app")?.classList.remove("show-minimap-page", "show-mobile-map");
    document.getElementById("toggle-minimap-page")?.classList.remove("is-active");
    document.getElementById("toggle-minimap-page")?.setAttribute("aria-pressed", "false");
}

function openRoutePage() {
    // Mở trang danh sách lộ trình (nhiệm vụ)
    // Mục đích: Hiển thị các chặng đường, chặng hiện tại và tự động cuộn đến vị trí người dùng đang đứng.
    const app = document.getElementById("tour-app");
    if (!app) return;

    app.classList.add("show-route-page");
    app.classList.remove("show-minimap-page", "show-moments-page", "show-mobile-map");
    document.getElementById("toggle-quest-sidebar")?.classList.add("is-active");
    document.getElementById("toggle-quest-sidebar")?.setAttribute("aria-pressed", "true");
    document.getElementById("toggle-minimap-page")?.classList.remove("is-active");
    document.getElementById("toggle-minimap-page")?.setAttribute("aria-pressed", "false");
    document.getElementById("toggle-moments-page")?.classList.remove("is-active");
    document.getElementById("toggle-moments-page")?.setAttribute("aria-pressed", "false");
    window.requestAnimationFrame(scrollCurrentRouteIntoView);
}

export function startTour() {
    // Bắt đầu hành trình tour VR
    // Mục đích: Chuyển từ màn hình chờ sang ứng dụng tour, khởi tạo bộ xem panorama và tải chặng hiện tại.
    document.getElementById("avatar-screen")?.classList.add("hidden");
    const tourApp = document.getElementById("tour-app");
    tourApp?.classList.remove("hidden", "screen-leaving");
    tourApp?.classList.add("app-screen", "is-screen-active");

    preloadCurrentPanorama(state.currentStep);
    tryStartAmbientAudio();

    const hadViewer = Boolean(viewer);
    if (!viewer) {
        setPanoramaLoading(true);
        initViewer();
    }

    loadStep(state.currentStep, { forceViewer: hadViewer });
}

function showAvatarScreen() {
    // Hiển thị màn hình chọn nhân vật
    // Mục đích: Cho phép người dùng quay lại bước thiết lập ban đầu để đổi nhân vật hoặc tên.
    document.getElementById("tour-app")?.classList.add("hidden");
    document.getElementById("tour-app")?.classList.remove("is-screen-active", "screen-leaving", "screen-entering");
    const avatarScreen = document.getElementById("avatar-screen");
    avatarScreen?.classList.remove("hidden", "screen-leaving");
    avatarScreen?.classList.add("app-screen", "is-screen-active");
    renderResumeButton();
}

function restartTour() {
    // Bắt đầu lại hành trình từ đầu
    // Mục đích: Xóa tiến trình cũ, đưa người dùng về chặng 0 và làm mới các trạng thái liên quan.
    resetProgress();
    lastGuideAnnouncementKey = "";
    loadStep(0, { forceViewer: true });
    showToast(translate("toast.restart"));
}

function initViewer() {
    // Khởi tạo bộ xem panorama Pannellum
    // Mục đích: Cấu hình các cảnh (scenes), điểm nóng (hotspots) và thiết lập lắng nghe sự kiện chuyển cảnh.
    if (!window.pannellum) {
        setPanoramaLoading(false);
        showToast(translate("toast.viewerMissing"));
        renderExperience();
        return;
    }

    const pannellumScenes = {};
    route.forEach((scene, index) => {
        pannellumScenes[scene.id] = {
            title: getSceneText(scene, "title"),
            type: "equirectangular",
            panorama: scene.panorama,
            hotSpots: createHotspots(index)
        };
    });

    viewer = window.pannellum.viewer("panorama", {
        default: {
            firstScene: route[state.currentStep].id,
            author: "VKU",
            autoLoad: true,
            compass: true,
            sceneFadeDuration: 800
        },
        scenes: pannellumScenes
    });

    viewer.on("scenechange", (sceneId) => {
        const nextIndex = routeIndexById.get(sceneId);
        if (typeof nextIndex !== "number") return;

        if (nextIndex > state.unlockedStep + 1) {
            showToast(translate("toast.lockedRoute"));
            loadStep(state.currentStep, { forceViewer: true });
            return;
        }

        setCurrentStep(nextIndex);
        renderExperience();
        announceGuideStage(route[nextIndex]);
    });

    viewer.on("load", () => {
        setPanoramaLoading(false);
    });
}

function createHotspots(index) {
    // Tạo các điểm nóng (hotspots) cho một chặng
    // Mục đích: Tạo các nút chuyển tiếp 'Tới' và 'Lùi' giữa các địa điểm, cũng như các điểm thông tin ẩn (easter eggs).
    const hotSpots = [];
    const current = route[index];
    const next = route[index + 1];
    const previous = route[index - 1];

    if (current.easterEggs) {
        current.easterEggs.forEach(egg => {
            hotSpots.push({
                pitch: egg.pitch,
                yaw: egg.yaw,
                type: "info",
                text: egg.text,
                cssClass: "custom-tooltip"
            });
        });
    }

    if (next) {
        hotSpots.push({
            pitch: -4,
            yaw: 32,
            type: "scene",
            text: translate("hotspot.next", { title: getSceneText(next, "shortTitle") }),
            sceneId: next.id,
            cssClass: "quest-hotspot next",
            createTooltipFunc: customHotspot,
            createTooltipArgs: translate("hotspot.next", { title: getSceneText(next, "shortTitle") })
        });
    }

    if (previous) {
        hotSpots.push({
            pitch: -6,
            yaw: -34,
            type: "scene",
            text: translate("hotspot.previous", { title: getSceneText(previous, "shortTitle") }),
            sceneId: previous.id,
            cssClass: "quest-hotspot previous",
            createTooltipFunc: customHotspot,
            createTooltipArgs: translate("hotspot.previous", { title: getSceneText(previous, "shortTitle") })
        });
    }

    return hotSpots;
}

function customHotspot(hotSpotDiv, label) {
    // Tùy chỉnh giao diện điểm nóng
    // Mục đích: Tạo icon mũi tên động và nhãn văn bản cho các điểm di chuyển trong không gian 3D.
    hotSpotDiv.classList.add("custom-tooltip");
    
    hotSpotDiv.style.display = "flex";
    hotSpotDiv.style.flexDirection = "column";
    hotSpotDiv.style.alignItems = "center";
    hotSpotDiv.style.animation = "float 2s ease-in-out infinite";

    const icon = document.createElement("i");
    icon.className = "ph ph-arrow-circle-up";
    icon.style.fontSize = "32px";
    icon.style.color = "var(--gold)";
    icon.style.textShadow = "0 2px 10px rgba(0,0,0,0.5)";
    icon.style.marginBottom = "4px";

    const span = document.createElement("span");
    span.textContent = label;
    span.style.background = "rgba(0,0,0,0.7)";
    span.style.padding = "4px 8px";
    span.style.borderRadius = "4px";
    span.style.fontSize = "12px";

    hotSpotDiv.appendChild(icon);
    hotSpotDiv.appendChild(span);
}

function toggleAudio() {
    // Bật hoặc tắt nhạc nền ambient
    // Mục đích: Điều khiển việc phát âm thanh và cập nhật icon trạng thái loa trên giao diện.
    setAmbientAudioEnabled(!isAudioPlaying);
}

function tryStartAmbientAudio() {
    if (localStorage.getItem(AMBIENT_AUDIO_PREF_KEY) === "false") {
        updateAudioButton(false);
        return;
    }

    setAmbientAudioEnabled(true, { persist: false });
}

function setAmbientAudioEnabled(enabled, options = {}) {
    const audio = getAmbientAudio();
    if (!audio) return;

    if (!enabled) {
        audio.pause();
        isAudioPlaying = false;
        if (options.persist !== false) {
            localStorage.setItem(AMBIENT_AUDIO_PREF_KEY, "false");
        }
        updateAudioButton(false);
        return;
    }

    const playPromise = audio.play();
    if (options.persist !== false) {
        localStorage.setItem(AMBIENT_AUDIO_PREF_KEY, "true");
    }

    if (!playPromise?.then) {
        isAudioPlaying = true;
        updateAudioButton(true);
        return;
    }

    playPromise
        .then(() => {
            isAudioPlaying = true;
            updateAudioButton(true);
        })
        .catch((error) => {
            isAudioPlaying = false;
            updateAudioButton(false);
            console.debug("Ambient audio start skipped:", error);
        });
}

function getAmbientAudio() {
    const audio = document.getElementById("ambient-audio");
    if (!audio) return null;

    audio.loop = true;
    audio.volume = AMBIENT_AUDIO_VOLUME;
    return audio;
}

function updateAudioButton(isPlaying) {
    const icon = document.querySelector("#toggle-audio i");
    const button = document.getElementById("toggle-audio");

    if (icon) {
        icon.className = isPlaying ? "ph ph-speaker-high" : "ph ph-speaker-slash";
    }
    button?.classList.toggle("is-active", isPlaying);
    button?.setAttribute("aria-pressed", String(isPlaying));
}

function goNext() {
    // Di chuyển tới chặng tiếp theo
    // Mục đích: Tự động chuyển bước hoặc hiển thị màn hình chúc mừng nếu người dùng đã hoàn thành chặng cuối.
    if (state.currentStep >= route.length - 1) {
        showCongratsScreen();
        return;
    }

    loadStep(state.currentStep + 1);
}

function showCongratsScreen() {
    // Hiển thị màn hình hoàn thành hành trình
    // Mục đích: Chúc mừng người dùng và cung cấp các tùy chọn xem lại tour hoặc bắt đầu lại.
    document.getElementById("congrats-avatar-name").textContent = state.customName;
    const congratsScreen = document.getElementById("congrats-screen");
    if (!congratsScreen) return;

    congratsScreen.classList.remove("hidden");

    if (!congratsScreen.hasAttribute("data-listener")) {
        congratsScreen.setAttribute("data-listener", "true");

        document.getElementById("review-tour-btn")?.addEventListener("click", () => {
            congratsScreen.classList.add("hidden");
        });

        document.getElementById("restart-tour-btn-congrats")?.addEventListener("click", () => {
            congratsScreen.classList.add("hidden");
            restartTour();
        });
    }
}

function loadStep(index, options = {}) {
    // Tải một chặng cụ thể trong tour
    // Mục đích: Cập nhật trạng thái bước hiện tại, tải cảnh panorama tương ứng và kích hoạt hiệu ứng pháo hoa nếu là chặng mới.
    if (index < 0 || index >= route.length) return;

    if (index > state.unlockedStep + 1) {
        showToast(translate("toast.lockedStep"));
        return;
    }

    const isNewStep = index > state.unlockedStep;
    setCurrentStep(index);

    if (isNewStep && window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    if (viewer) {
        const sceneId = route[index].id;
        const currentScene = typeof viewer.getScene === "function" ? viewer.getScene() : null;
        if (options.forceViewer || currentScene !== sceneId) {
            preloadCurrentPanorama(index);
            setPanoramaLoading(true);
            viewer.loadScene(sceneId);
        }
    }

    renderExperience();
    announceGuideStage(route[index]);
    preloadNearbyPanoramas(index);
}

function renderExperience() {
    // Cập nhật toàn bộ giao diện trải nghiệm tour
    // Mục đích: Làm mới nhãn vùng, thanh tiến trình, thông tin hồ sơ, cốt truyện, khoảnh khắc và danh sách lộ trình.
    const scene = route[state.currentStep];
    const progressPercent = (state.unlockedStep + 1) / route.length;

    document.getElementById("current-zone-label").textContent = getSceneText(scene, "zoneName");
    const progressLabel = document.getElementById("progress-label");
    if (progressLabel) progressLabel.textContent = `${state.unlockedStep + 1}/${route.length} ${translate("unit.stage")}`;

    const progressCircle = document.getElementById("progress-circle");
    if (progressCircle) {
        const circumference = 213; // 2 * pi * 34
        const offset = circumference - (progressPercent * circumference);
        progressCircle.style.strokeDashoffset = offset;
    }

    renderProfile();
    renderStory(scene);
    void renderMomentsForScene(scene);
    renderRouteList();
    renderMap();
}

function renderProfile() {
    // Cập nhật thông tin nhân vật đang sử dụng
    // Mục đích: Hiển thị avatar, tên và vai trò của người dùng trên thanh trạng thái và hộp thoại.
    const avatarMarkup = state.avatarImageUrl
        ? `<img class="avatar-image" src="${escapeAttribute(state.avatarImageUrl)}" alt="">`
        : `<i class="ph ${state.selectedAvatar.icon}"></i>`;
    const colorStyle = state.selectedAvatar.color;
    const profileAvatar = document.getElementById("profile-avatar");
    const dialogAvatar = document.getElementById("dialog-avatar");

    profileAvatar.style.setProperty("--avatar-color", colorStyle);
    dialogAvatar.style.setProperty("--avatar-color", colorStyle);
    profileAvatar.innerHTML = avatarMarkup;
    dialogAvatar.innerHTML = avatarMarkup;
    document.getElementById("profile-name").textContent = state.customName;
    document.getElementById("profile-role").textContent = getAvatarText(state.selectedAvatar, "role");
}

function renderStory(scene) {
    // Hiển thị nội dung cốt truyện và nhiệm vụ của chặng
    // Mục đích: Cập nhật văn bản hội thoại, mô tả địa danh, phần thưởng và danh sách các lưu ý cần thực hiện.
    const storyPanel = document.querySelector(".story-panel");
    storyPanel?.classList.remove("story-panel-refreshed");
    void storyPanel?.offsetWidth;

    document.getElementById("scene-chapter").textContent = getSceneText(scene, "chapter");
    document.getElementById("scene-reward").textContent = getSceneText(scene, "reward");
    document.getElementById("avatar-line").textContent = `${state.customName}: ${getSceneText(scene, "dialog")}`;
    document.getElementById("scene-title").textContent = getSceneText(scene, "title");
    document.getElementById("scene-body").textContent = getSceneText(scene, "body");
    const mission = document.getElementById("scene-mission");
    if (mission) {
        mission.textContent = getSceneText(scene, "mission");
    }

    const notes = document.getElementById("scene-notes");
    notes.innerHTML = getSceneText(scene, "notes").map((note) => `
        <li><i class="ph ph-sparkle"></i><span>${note}</span></li>
    `).join("");

    const prevButton = document.getElementById("prev-step");
    const nextButton = document.getElementById("next-step");
    if (prevButton) {
        prevButton.disabled = state.currentStep === 0;
    }
    if (nextButton) {
        nextButton.innerHTML = state.currentStep === route.length - 1
            ? `${translate("action.finish")} <i class="ph ph-flag-checkered"></i>`
            : `${translate("action.next")} <i class="ph ph-arrow-right"></i>`;
    }

    storyPanel?.classList.add("story-panel-refreshed");
}

function announceGuideStage(scene) {
    // Phát thông báo chặng hiện tại tới hệ thống Guide
    // Mục đích: Gửi sự kiện để chatbot Guide biết người dùng đang ở đâu và có thể đưa ra gợi ý tương ứng.
    if (!scene) return;

    const announcementKey = `${state.currentStep}:${getCurrentLanguage()}`;
    if (announcementKey === lastGuideAnnouncementKey) return;
    lastGuideAnnouncementKey = announcementKey;

    window.dispatchEvent(new CustomEvent("vku-guide-stage", {
        detail: {
            step: state.currentStep,
            total: route.length,
            chapter: getSceneText(scene, "chapter"),
            title: getSceneText(scene, "shortTitle") || getSceneText(scene, "title"),
            mission: getSceneText(scene, "mission"),
            dialog: getSceneText(scene, "dialog"),
            zoneName: getSceneText(scene, "zoneName"),
            isFinal: state.currentStep === route.length - 1,
        },
    }));
}

function renderRouteList() {
    // Hiển thị danh sách các chặng trong lộ trình
    // Mục đích: Liệt kê các địa điểm theo khu vực, đánh dấu trạng thái (đã đi, hiện tại, đang khóa) và cho phép di chuyển nhanh.
    const list = document.getElementById("route-list");
    const activeZoneScenes = route
        .map((scene, index) => ({ scene, index }))
        .filter(({ scene }) => scene.zone === state.activeMapZone);

    list.innerHTML = activeZoneScenes.map(({ scene, index }) => {
        const isCurrent = index === state.currentStep;
        const isVisited = index <= state.unlockedStep;
        const isLocked = index > state.unlockedStep;
        const icon = isLocked ? "ph-lock" : isCurrent ? "ph-map-pin" : "ph-check";
        const classes = [
            "route-step",
            isCurrent ? "current" : "",
            isVisited ? "visited" : "",
            isLocked ? "locked" : ""
        ].filter(Boolean).join(" ");

        return `
            <button class="${classes}" type="button" data-step="${index}" ${isLocked ? "disabled" : ""}>
                <span class="route-icon"><i class="ph ${icon}"></i></span>
                <span class="route-copy">
                    <strong>${getSceneText(scene, "shortTitle")}</strong>
                    <span>${getSceneText(scene, "chapter")}</span>
                </span>
                <span class="route-zone">${getSceneText(scene, "zoneName")}</span>
            </button>
        `;
    }).join("");

    list.querySelectorAll(".route-step:not(.locked)").forEach((button) => {
        button.addEventListener("click", () => {
            loadStep(Number(button.dataset.step));
            document.getElementById("tour-app")?.classList.remove("show-route-page");
            document.getElementById("toggle-quest-sidebar")?.classList.remove("is-active");
            document.getElementById("toggle-quest-sidebar")?.setAttribute("aria-pressed", "false");
        });
    });

    document.getElementById("tab-khu-v").classList.toggle("active", state.activeMapZone === "khu-v");
    document.getElementById("tab-khu-k").classList.toggle("active", state.activeMapZone === "khu-k");
    document.getElementById("tab-khu-v").textContent = translate("route.zoneV");
    document.getElementById("tab-khu-k").textContent = translate("route.zoneK");

    if (document.getElementById("tour-app")?.classList.contains("show-route-page")) {
        window.requestAnimationFrame(scrollCurrentRouteIntoView);
    }
}

function scrollCurrentRouteIntoView() {
    // Cuộn danh sách lộ trình tới chặng hiện tại
    // Mục đích: Đảm bảo chặng mà người dùng đang đứng luôn hiển thị ở giữa vùng nhìn thấy của danh sách.
    const list = document.getElementById("route-list");
    const current = list?.querySelector(".route-step.current");
    current?.scrollIntoView({ block: "center", inline: "nearest" });
}

function focusZone(zone) {
    // Tập trung vào một khu vực cụ thể (V hoặc K)
    // Mục đích: Thay đổi vùng bản đồ đang xem và cập nhật lại danh sách lộ trình tương ứng với khu vực đó.
    setActiveMapZone(zone);
    renderRouteList();
    renderMap();
}

function escapeAttribute(value = "") {
    // Làm sạch văn bản dùng trong thuộc tính HTML
    // Mục đích: Ngăn chặn lỗi cấu trúc thẻ khi chèn các chuỗi văn bản không an toàn vào attribute.
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("`", "&#096;");
}

function preloadNearbyPanoramas(index) {
    // Tải trước một phần các panorama lân cận trong lúc trình duyệt rảnh.
    PANORAMA_LAZY_WINDOW.forEach((offset) => {
        const sceneIndex = index + offset;
        const src = route[sceneIndex]?.panorama;
        if (!src || preloadedPanoramaSources.has(src)) return;

        preloadedPanoramaSources.add(src);
        scheduleIdleWork(() => {
            void warmPanoramaChunk(src);
        });
    });
}

function preloadCurrentPanorama(index) {
    const src = route[index]?.panorama;
    if (!src) return;

    addPanoramaHeadHint(src, "preload", "high");
}

function addPanoramaHeadHint(src, rel, priority = "low") {
    const key = `${rel}:${src}`;
    if (panoramaHeadHints.has(key)) return;

    const link = document.createElement("link");
    link.rel = rel;
    link.as = "image";
    link.href = src;
    link.fetchPriority = priority;
    link.setAttribute("fetchpriority", priority);
    document.head.appendChild(link);
    panoramaHeadHints.add(key);
}

function scheduleIdleWork(callback) {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 1800 });
        return;
    }

    window.setTimeout(callback, 120);
}

async function warmPanoramaChunk(src) {
    if (typeof fetch !== "function") return;

    try {
        const response = await fetch(src, {
            cache: "force-cache",
            credentials: "same-origin",
            headers: {
                Range: `bytes=0-${PANORAMA_WARM_CHUNK_BYTES - 1}`
            }
        });

        if (response.status === 206) {
            await response.arrayBuffer();
            return;
        }

        const reader = response.body?.getReader?.();
        if (!reader) return;

        let received = 0;
        while (received < PANORAMA_WARM_CHUNK_BYTES) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            received += value.byteLength;
        }

        await reader.cancel();
    } catch (error) {
        console.debug("Panorama lazy warm skipped:", src, error);
    }
}

function setPanoramaLoading(isLoading) {
    // Cập nhật trạng thái đang tải của ảnh 360
    // Mục đích: Hiển thị vòng xoay loading trên màn hình để người dùng biết hệ thống đang xử lý ảnh dung lượng lớn.
    const panorama = document.getElementById("panorama");
    if (!panorama) return;

    window.clearTimeout(panoramaLoadingTimer);
    panorama.classList.toggle("is-loading", isLoading);
    panorama.setAttribute("aria-busy", String(isLoading));

    if (isLoading) {
        panoramaLoadingTimer = window.setTimeout(() => {
            panorama.classList.remove("is-loading");
            panorama.setAttribute("aria-busy", "false");
        }, 8000);
    }
}
