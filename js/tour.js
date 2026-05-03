import { avatars } from "../data/avatars.js";
import { route } from "../data/route.js";
import { handleLogout } from "./auth.js";
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
} from "./state.js";
import { showToast } from "./ui.js";

let viewer;
let controlsBound = false;

// Cinematic & Audio States
let idleTimer = null;
let isCinematic = false;
let isAudioPlaying = false;

function resetIdleTimer() {
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

export function renderAvatarOptions() {
    const container = document.getElementById("avatar-options");
    const nameInput = document.getElementById("custom-avatar-name");
    const startBtn = document.getElementById("start-new-tour-btn");
    if (!container || !nameInput || !startBtn) return;

    container.innerHTML = avatars.map((avatar) => `
        <button class="avatar-card" type="button" data-avatar="${avatar.id}" style="--avatar-color: ${avatar.color}">
            <span class="avatar-face"><i class="ph ${avatar.icon}"></i></span>
            <span>
                <strong>${avatar.role}</strong>
            </span>
            <span>${avatar.line}</span>
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
    const resumeButton = document.getElementById("resume-tour");
    if (!resumeButton) return;

    resumeButton.classList.toggle("hidden", !hasSavedProgress());
}

export function bindControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.getElementById("resume-tour")?.addEventListener("click", startTour);
    document.getElementById("change-avatar")?.addEventListener("click", showAvatarScreen);
    document.getElementById("restart-tour")?.addEventListener("click", restartTour);
    document.getElementById("toggle-audio")?.addEventListener("click", toggleAudio);
    document.getElementById("restart-tour")?.addEventListener("click", restartTour);
    document.getElementById("prev-step")?.addEventListener("click", () => loadStep(state.currentStep - 1));
    document.getElementById("next-step")?.addEventListener("click", goNext);
    document.getElementById("tab-khu-v")?.addEventListener("click", () => focusZone("khu-v"));
    document.getElementById("tab-khu-k")?.addEventListener("click", () => focusZone("khu-k"));
    document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
    bindMomentControls();
    bindSidebarControls();

    document.getElementById("mobile-minimap-btn")?.addEventListener("click", () => {
        document.getElementById("tour-app")?.classList.add("show-mobile-map");
    });

    document.getElementById("close-minimap-btn")?.addEventListener("click", () => {
        document.getElementById("tour-app")?.classList.remove("show-mobile-map");
    });
}

function bindSidebarControls() {
    const app = document.getElementById("tour-app");
    const questButton = document.getElementById("toggle-quest-sidebar");
    const storyButton = document.getElementById("toggle-story-sidebar");
    if (!app) return;

    const applyState = () => {
        const questCollapsed = app.classList.contains("quest-sidebar-collapsed");
        const storyCollapsed = app.classList.contains("story-sidebar-collapsed");

        questButton?.classList.toggle("is-collapsed", questCollapsed);
        storyButton?.classList.toggle("is-collapsed", storyCollapsed);
        questButton?.setAttribute("aria-pressed", String(questCollapsed));
        storyButton?.setAttribute("aria-pressed", String(storyCollapsed));
    };

    const toggleSidebar = (className, storageKey) => {
        app.classList.toggle(className);
        localStorage.setItem(storageKey, String(app.classList.contains(className)));
        applyState();
    };

    if (localStorage.getItem("vkuQuestSidebarCollapsed") === "true") {
        app.classList.add("quest-sidebar-collapsed");
    }
    if (localStorage.getItem("vkuStorySidebarCollapsed") === "true") {
        app.classList.add("story-sidebar-collapsed");
    }

    questButton?.addEventListener("click", () => {
        toggleSidebar("quest-sidebar-collapsed", "vkuQuestSidebarCollapsed");
    });
    storyButton?.addEventListener("click", () => {
        toggleSidebar("story-sidebar-collapsed", "vkuStorySidebarCollapsed");
    });

    applyState();
}

export function startTour() {
    document.getElementById("avatar-screen")?.classList.add("hidden");
    document.getElementById("tour-app")?.classList.remove("hidden");

    if (!viewer) {
        initViewer();
    }

    loadStep(state.currentStep, { forceViewer: true });
}

export function showAvatarScreen() {
    document.getElementById("tour-app")?.classList.add("hidden");
    document.getElementById("avatar-screen")?.classList.remove("hidden");
    renderResumeButton();
}

export function restartTour() {
    resetProgress();
    loadStep(0, { forceViewer: true });
    showToast("Hành trình đã bắt đầu lại từ cổng chính Khu V.");
}

function initViewer() {
    if (!window.pannellum) {
        showToast("Không tải được trình xem 360. Nội dung tour vẫn dùng được.");
        renderExperience();
        return;
    }

    const pannellumScenes = {};
    route.forEach((scene, index) => {
        pannellumScenes[scene.id] = {
            title: scene.title,
            type: "equirectangular",
            panorama: scene.panorama,
            autoLoad: true,
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
            showToast("Điểm này chưa mở khóa. Hãy đi theo tuyến nhiệm vụ.");
            loadStep(state.currentStep, { forceViewer: true });
            return;
        }

        setCurrentStep(nextIndex);
        renderExperience();
    });
}

function createHotspots(index) {
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
            text: `Đi tiếp: ${next.shortTitle}`,
            sceneId: next.id,
            cssClass: "quest-hotspot next",
            createTooltipFunc: customHotspot,
            createTooltipArgs: `Đi tiếp: ${next.shortTitle}`
        });
    }

    if (previous) {
        hotSpots.push({
            pitch: -6,
            yaw: -34,
            type: "scene",
            text: `Quay lại: ${previous.shortTitle}`,
            sceneId: previous.id,
            cssClass: "quest-hotspot previous",
            createTooltipFunc: customHotspot,
            createTooltipArgs: `Quay lại: ${previous.shortTitle}`
        });
    }

    return hotSpots;
}

function customHotspot(hotSpotDiv, label) {
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
    const audio = document.getElementById("ambient-audio");
    if (!audio) return;
    
    const icon = document.querySelector("#toggle-audio i");
    if (isAudioPlaying) {
        audio.pause();
        isAudioPlaying = false;
        if (icon) icon.className = "ph ph-speaker-slash";
    } else {
        audio.play().catch(e => console.log("Audio play blocked", e));
        isAudioPlaying = true;
        if (icon) icon.className = "ph ph-speaker-high";
    }
}

function goNext() {
    if (state.currentStep >= route.length - 1) {
        showCongratsScreen();
        return;
    }

    loadStep(state.currentStep + 1);
}

function showCongratsScreen() {
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

export function loadStep(index, options = {}) {
    if (index < 0 || index >= route.length) return;

    if (index > state.unlockedStep + 1) {
        showToast("Điểm này chưa mở khóa. Hãy hoàn thành các chặng trước.");
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
            viewer.loadScene(sceneId);
        }
    }

    renderExperience();
}

function renderExperience() {
    const scene = route[state.currentStep];
    const progressPercent = (state.unlockedStep + 1) / route.length;

    document.getElementById("current-zone-label").textContent = scene.zoneName;
    const progressLabel = document.getElementById("progress-label");
    if (progressLabel) progressLabel.textContent = `${state.unlockedStep + 1}/${route.length} Chặng`;

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
    const avatarMarkup = `<i class="ph ${state.selectedAvatar.icon}"></i>`;
    const colorStyle = state.selectedAvatar.color;
    const profileAvatar = document.getElementById("profile-avatar");
    const dialogAvatar = document.getElementById("dialog-avatar");

    profileAvatar.style.setProperty("--avatar-color", colorStyle);
    dialogAvatar.style.setProperty("--avatar-color", colorStyle);
    profileAvatar.innerHTML = avatarMarkup;
    dialogAvatar.innerHTML = avatarMarkup;
    document.getElementById("profile-name").textContent = state.customName;
    document.getElementById("profile-role").textContent = state.selectedAvatar.role;
}

function renderStory(scene) {
    document.getElementById("scene-chapter").textContent = scene.chapter;
    document.getElementById("scene-reward").textContent = scene.reward;
    document.getElementById("avatar-line").textContent = `${state.customName}: ${scene.dialog}`;
    document.getElementById("scene-title").textContent = scene.title;
    document.getElementById("scene-body").textContent = scene.body;
    document.getElementById("scene-mission").textContent = scene.mission;

    const notes = document.getElementById("scene-notes");
    notes.innerHTML = scene.notes.map((note) => `
        <li><i class="ph ph-sparkle"></i><span>${note}</span></li>
    `).join("");

    const prevButton = document.getElementById("prev-step");
    const nextButton = document.getElementById("next-step");
    prevButton.disabled = state.currentStep === 0;
    nextButton.innerHTML = state.currentStep === route.length - 1
        ? 'Hoàn thành <i class="ph ph-flag-checkered"></i>'
        : 'Đi tiếp <i class="ph ph-arrow-right"></i>';
}

function renderRouteList() {
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
                    <strong>${scene.shortTitle}</strong>
                    <span>${scene.chapter}</span>
                </span>
                <span class="route-zone">${scene.zoneName}</span>
            </button>
        `;
    }).join("");

    list.querySelectorAll(".route-step:not(.locked)").forEach((button) => {
        button.addEventListener("click", () => loadStep(Number(button.dataset.step)));
    });

    document.getElementById("tab-khu-v").classList.toggle("active", state.activeMapZone === "khu-v");
    document.getElementById("tab-khu-k").classList.toggle("active", state.activeMapZone === "khu-k");
}

function focusZone(zone) {
    setActiveMapZone(zone);
    renderRouteList();
    renderMap();
}

export function preloadPanoramas() {
    new Set(route.map((scene) => scene.panorama)).forEach((src) => {
        const image = new Image();
        image.src = src;
    });
}
