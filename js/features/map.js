import { route } from "../../data/route.js";
import { getSceneText, getZoneName, t } from "../app/i18n.js";
import { getMomentCountByScene } from "./moments.js";
import { state } from "../app/state.js";

let navigateToStep = () => {};

export function setMapNavigator(callback) {
    navigateToStep = callback;
}

export function renderMap() {
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

    mapTitle.textContent = t("map.title", { zone: mapZoneName });
    unlockLabel.textContent = `${unlockedInZone}/${totalInZone} ${t("unit.pointUnlocked")}`;
    mapImageV.alt = t("map.alt", { zone: getZoneName("khu-v") });
    mapImageK.alt = t("map.alt", { zone: getZoneName("khu-k") });
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
