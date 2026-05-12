import { route } from "../../data/route.js";
import { getSceneText, getZoneName, translate } from "../app/i18n.js";
import { getMomentCountByScene } from "./moments.js";
import { state } from "../app/state.js";

let navigateToStep = () => {};

export function setMapNavigator(callback) {
    // Thiết lập bộ điều hướng bản đồ
    // Mục đích: Đăng ký một hàm callback để thực hiện chuyển bước (step) khi người dùng nhấp vào một điểm trên bản đồ.
    navigateToStep = callback;
}

export function renderMap() {
    // Hiển thị bản đồ khu vực tương ứng
    // Mục đích: Cập nhật hình ảnh bản đồ (Khu V/K), hiển thị các điểm dừng (dots) và trạng thái mở khóa của chúng.
    const currentScene = route[state.currentStep];
    const mapZoneName = getZoneName(state.activeMapZone);
    const unlockedInZone = route.filter((scene, index) => {
        return scene.zone === state.activeMapZone && index <= state.unlockedStep;
    }).length;
    const totalInZone = route.filter((scene) => scene.zone === state.activeMapZone).length;
    const mapTitle = document.getElementById("map-title");
    const unlockLabel = document.getElementById("unlock-label");
    const mapImageV = document.getElementById("map-image-v");
    const mapImageK = document.getElementById("map-image-k");
    const dots = document.getElementById("map-dots");

    if (!currentScene || !mapTitle || !unlockLabel || !mapImageV || !mapImageK || !dots) return;

    mapTitle.textContent = translate("map.title", { zone: mapZoneName });
    unlockLabel.textContent = `${unlockedInZone}/${totalInZone} ${translate("unit.pointUnlocked")}`;
    mapImageV.alt = translate("map.alt", { zone: getZoneName("khu-v") });
    mapImageK.alt = translate("map.alt", { zone: getZoneName("khu-k") });
    mapImageV.hidden = state.activeMapZone !== "khu-v";
    mapImageK.hidden = state.activeMapZone !== "khu-k";

    dots.innerHTML = route.map((scene, index) => {
        if (scene.zone !== state.activeMapZone) return "";

        const isCurrent = currentScene.id === scene.id;
        const isLocked = index > state.unlockedStep;
        const icon = isLocked ? "ph-lock" : isCurrent ? "ph-map-pin" : "ph-check";
        const momentCount = getMomentCountByScene(scene.id);
        const classes = ["map-dot", isCurrent ? "current" : "", isLocked ? "locked" : ""]
            .filter(Boolean)
            .join(" ");

        return `
            <button class="${classes}" type="button" data-step="${index}" style="left: ${scene.mapCoords.x}%; top: ${scene.mapCoords.y}%;" ${isLocked ? "disabled" : ""}>
                <i class="ph ${icon}"></i>
                ${momentCount ? `<span class="map-dot-badge">${momentCount}</span>` : ""}
                <span class="map-dot-label">${getSceneText(scene, "title")}</span>
            </button>
        `;
    }).join("");

    dots.querySelectorAll(".map-dot:not(.locked)").forEach((dot) => {
        dot.addEventListener("click", () => {
            navigateToStep(Number(dot.dataset.step));
            document.getElementById("tour-app")?.classList.remove("show-minimap-page", "show-mobile-map");
            document.getElementById("toggle-minimap-page")?.classList.remove("is-active");
            document.getElementById("toggle-minimap-page")?.setAttribute("aria-pressed", "false");
        });
    });
}
