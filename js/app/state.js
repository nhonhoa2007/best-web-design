import { avatars } from "../../data/avatars.js";
import { route } from "../../data/route.js";
import { auth, db, doc, getDoc, serverTimestamp, setDoc } from "../firebase/index.js";
import { t } from "./i18n.js";
import { clamp } from "../ui/ui.js";

export const STORAGE_KEYS = {
    avatar: "vkuQuestAvatar",
    avatarImagePath: "vkuQuestAvatarImagePath",
    avatarImageUrl: "vkuQuestAvatarImageUrl",
    customName: "vkuQuestCustomName",
    currentStep: "vkuQuestCurrentStep",
    unlockedStep: "vkuQuestUnlockedStep"
};

export const avatarById = new Map(avatars.map((avatar) => [avatar.id, avatar]));
export const routeIndexById = new Map(route.map((scene, index) => [scene.id, index]));

export const state = {
    selectedAvatar: avatars[0],
    avatarImagePath: "",
    avatarImageUrl: "",
    customName: t("fallback.guest"),
    currentStep: 0,
    unlockedStep: 0,
    activeMapZone: "khu-v",
    hasRemoteProgress: false,
    progressLoaded: false
};

export function hydrateState() {
    const savedAvatar = localStorage.getItem(STORAGE_KEYS.avatar);
    const savedAvatarImagePath = localStorage.getItem(STORAGE_KEYS.avatarImagePath);
    const savedAvatarImageUrl = localStorage.getItem(STORAGE_KEYS.avatarImageUrl);
    const savedName = localStorage.getItem(STORAGE_KEYS.customName);
    const savedCurrent = Number(localStorage.getItem(STORAGE_KEYS.currentStep));
    const savedUnlocked = Number(localStorage.getItem(STORAGE_KEYS.unlockedStep));

    state.selectedAvatar = avatarById.get(savedAvatar) || avatars[0];
    state.avatarImagePath = savedAvatarImagePath || "";
    state.avatarImageUrl = savedAvatarImageUrl || "";
    state.customName = savedName || t("fallback.guest");
    state.currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
    state.unlockedStep = Number.isFinite(savedUnlocked)
        ? clamp(savedUnlocked, state.currentStep, route.length - 1)
        : state.currentStep;
    state.activeMapZone = route[state.currentStep]?.zone || "khu-v";
    state.progressLoaded = true;
}

export async function hydrateProgressFromFirebase(user = auth?.currentUser) {
    if (!user || !db) {
        hydrateState();
        return false;
    }

    try {
        const progressRef = doc(db, "tourProgress", user.uid);
        const snapshot = await getDoc(progressRef);

        if (!snapshot.exists()) {
            resetStateToDefault();
            state.progressLoaded = true;
            state.hasRemoteProgress = false;
            return false;
        }

        applyProgressData(snapshot.data());
        state.progressLoaded = true;
        state.hasRemoteProgress = true;
        return true;
    } catch (error) {
        console.error("Progress hydrate error:", error);
        hydrateState();
        return false;
    }
}

export function hasSavedProgress() {
    if (auth?.currentUser && db) {
        return state.hasRemoteProgress;
    }

    return Boolean(localStorage.getItem(STORAGE_KEYS.avatar));
}

export function persistState() {
    localStorage.setItem(STORAGE_KEYS.avatar, state.selectedAvatar.id);
    localStorage.setItem(STORAGE_KEYS.avatarImagePath, state.avatarImagePath);
    localStorage.setItem(STORAGE_KEYS.avatarImageUrl, state.avatarImageUrl);
    localStorage.setItem(STORAGE_KEYS.customName, state.customName);
    localStorage.setItem(STORAGE_KEYS.currentStep, String(state.currentStep));
    localStorage.setItem(STORAGE_KEYS.unlockedStep, String(state.unlockedStep));
}

export async function saveProgressToFirebase() {
    const user = auth?.currentUser;
    if (!user || !db) {
        persistState();
        return false;
    }

    const progressRef = doc(db, "tourProgress", user.uid);
    const payload = {
        uid: user.uid,
        avatarId: state.selectedAvatar.id,
        avatarImagePath: state.avatarImagePath,
        avatarImageUrl: state.avatarImageUrl,
        customName: state.customName,
        currentStep: state.currentStep,
        unlockedStep: state.unlockedStep,
        activeMapZone: state.activeMapZone,
        updatedAt: serverTimestamp()
    };

    if (!state.hasRemoteProgress) {
        payload.createdAt = serverTimestamp();
    }

    try {
        await setDoc(progressRef, payload, { merge: true });
        state.hasRemoteProgress = true;
        return true;
    } catch (error) {
        console.error("Progress save error:", error);
        persistState();
        return false;
    }
}

export function setProfile(avatar, name) {
    state.selectedAvatar = avatar;
    state.customName = name;
}

export function setProfileAvatarImage(imageUrl, imagePath) {
    state.avatarImageUrl = imageUrl || "";
    state.avatarImagePath = imagePath || "";
}

export function resetProgress() {
    state.currentStep = 0;
    state.unlockedStep = 0;
    state.activeMapZone = route[0].zone;
    void saveProgressToFirebase();
}

export function setCurrentStep(index) {
    state.currentStep = index;
    state.unlockedStep = Math.max(state.unlockedStep, index);
    state.activeMapZone = route[index].zone;
    void saveProgressToFirebase();
}

export function setActiveMapZone(zone) {
    state.activeMapZone = zone;
    void saveProgressToFirebase();
}

function resetStateToDefault() {
    state.selectedAvatar = avatars[0];
    state.avatarImagePath = "";
    state.avatarImageUrl = "";
    state.customName = t("fallback.guest");
    state.currentStep = 0;
    state.unlockedStep = 0;
    state.activeMapZone = route[0].zone;
}

function applyProgressData(data) {
    const savedCurrent = Number(data.currentStep);
    const savedUnlocked = Number(data.unlockedStep);
    const currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
    const unlockedStep = Number.isFinite(savedUnlocked) ? clamp(savedUnlocked, currentStep, route.length - 1) : currentStep;

    state.selectedAvatar = avatarById.get(data.avatarId) || avatars[0];
    state.avatarImagePath = typeof data.avatarImagePath === "string" ? data.avatarImagePath : "";
    state.avatarImageUrl = typeof data.avatarImageUrl === "string" ? data.avatarImageUrl : "";
    state.customName = typeof data.customName === "string" && data.customName.trim()
        ? data.customName.trim()
        : t("fallback.guest");
    state.currentStep = currentStep;
    state.unlockedStep = unlockedStep;
    state.activeMapZone = data.activeMapZone || route[currentStep]?.zone || "khu-v";
}
