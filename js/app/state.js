import { avatars } from "../../data/avatars.js";
import { route } from "../../data/route.js";
import { auth, db, doc, getDoc, getDownloadURL, ref, serverTimestamp, setDoc, storage } from "../firebase/index.js";
import { translate } from "./i18n.js";
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
    customName: translate("fallback.guest"),
    currentStep: 0,
    unlockedStep: 0,
    activeMapZone: "khu-v",
    hasRemoteProgress: false,
    progressLoaded: false
};

export function hydrateState() {
    // Khôi phục trạng thái từ localStorage
    // Mục đích: Tải các thông tin về avatar, tên người dùng và tiến trình đã lưu cục bộ trên trình duyệt.
    const savedAvatar = localStorage.getItem(STORAGE_KEYS.avatar);
    const savedAvatarImagePath = localStorage.getItem(STORAGE_KEYS.avatarImagePath);
    const savedAvatarImageUrl = localStorage.getItem(STORAGE_KEYS.avatarImageUrl);
    const savedName = localStorage.getItem(STORAGE_KEYS.customName);
    const savedCurrent = Number(localStorage.getItem(STORAGE_KEYS.currentStep));
    const savedUnlocked = Number(localStorage.getItem(STORAGE_KEYS.unlockedStep));

    state.selectedAvatar = avatarById.get(savedAvatar) || avatars[0];
    state.avatarImagePath = savedAvatarImagePath || "";
    state.avatarImageUrl = savedAvatarImageUrl || "";
    state.customName = savedName || translate("fallback.guest");
    state.currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
    state.unlockedStep = Number.isFinite(savedUnlocked)
        ? clamp(savedUnlocked, state.currentStep, route.length - 1)
        : state.currentStep;
    state.activeMapZone = route[state.currentStep]?.zone || "khu-v";
    state.progressLoaded = true;
}

export async function hydrateProgressFromFirebase(user = auth?.currentUser) {
    // Khôi phục tiến trình từ Firebase Firestore
    // Mục đích: Nếu người dùng đã đăng nhập, tải dữ liệu tiến trình từ server; nếu không, sẽ quay lại sử dụng local storage.
    // Ghi chú Async: Cần đợi (await) kết quả trả về từ hàm getDoc() của Firebase. Đây là một tác vụ bất đồng bộ vì dữ liệu cần thời gian để tải về từ server qua internet.
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
        await refreshAvatarDownloadUrl();
        persistState();
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
    // Kiểm tra xem có tiến trình nào đã lưu hay chưa
    // Mục đích: Xác định xem có dữ liệu trên Firebase (nếu đã đăng nhập) hoặc trong localStorage hay không.
    if (auth?.currentUser && db) {
        return state.hasRemoteProgress;
    }

    return Boolean(localStorage.getItem(STORAGE_KEYS.avatar));
}

function persistState() {
    // Lưu trạng thái hiện tại vào localStorage
    // Mục đích: Ghi đè dữ liệu tiến trình cục bộ để duy trì trạng thái khi người dùng làm mới trang.
    localStorage.setItem(STORAGE_KEYS.avatar, state.selectedAvatar.id);
    localStorage.setItem(STORAGE_KEYS.avatarImagePath, state.avatarImagePath);
    localStorage.setItem(STORAGE_KEYS.avatarImageUrl, state.avatarImageUrl);
    localStorage.setItem(STORAGE_KEYS.customName, state.customName);
    localStorage.setItem(STORAGE_KEYS.currentStep, String(state.currentStep));
    localStorage.setItem(STORAGE_KEYS.unlockedStep, String(state.unlockedStep));
}

export async function saveProgressToFirebase() {
    // Lưu tiến trình hiện tại lên Firebase Firestore
    // Mục đích: Đồng bộ hóa dữ liệu người dùng với server. Nếu không có kết nối hoặc chưa đăng nhập, sẽ lưu vào local.
    // Ghi chú Async: Sử dụng 'async' để 'await' hàm setDoc(). Việc này đảm bảo ứng dụng không bị treo khi đang gửi dữ liệu lên server, và chỉ tiếp tục sau khi server xác nhận lưu thành công (hoặc lỗi).
    const user = auth?.currentUser;
    if (!user || !db) {
        persistState();
        return false;
    }

    const progressRef = doc(db, "tourProgress", user.uid);
    const payload = {
        uid: user.uid,
        avatarId: state.selectedAvatar.id,
        customName: state.customName,
        currentStep: state.currentStep,
        unlockedStep: state.unlockedStep,
        activeMapZone: state.activeMapZone,
        updatedAt: serverTimestamp()
    };

    if (state.avatarImagePath || state.avatarImageUrl) {
        payload.avatarImagePath = state.avatarImagePath;
        payload.avatarImageUrl = state.avatarImageUrl;
    }

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
    // Cập nhật thông tin hồ sơ người dùng
    // Mục đích: Thay đổi avatar và tên hiển thị trong state của ứng dụng.
    state.selectedAvatar = avatar;
    state.customName = name;
}

export function setProfileAvatarImage(imageUrl, imagePath) {
    // Thiết lập hình ảnh đại diện tùy chỉnh
    // Mục đích: Cập nhật URL và đường dẫn ảnh đại diện mà người dùng đã tải lên.
    state.avatarImageUrl = imageUrl || "";
    state.avatarImagePath = imagePath || "";
}

async function refreshAvatarDownloadUrl() {
    if (!state.avatarImagePath || !storage) return;

    try {
        state.avatarImageUrl = await getDownloadURL(ref(storage, state.avatarImagePath));
    } catch (error) {
        console.warn("Avatar download URL refresh skipped:", error);
    }
}

export function resetProgress() {
    // Đặt lại tiến trình về ban đầu
    // Mục đích: Đưa người dùng về bước 0, mở khóa lại từ đầu và cập nhật lên Firebase.
    state.currentStep = 0;
    state.unlockedStep = 0;
    state.activeMapZone = route[0].zone;
    void saveProgressToFirebase();
}

export function setCurrentStep(index) {
    // Thiết lập bước hiện tại trong hành trình
    // Mục đích: Cập nhật vị trí hiện tại của người dùng, mở khóa các bước tiếp theo và lưu tiến trình.
    state.currentStep = index;
    state.unlockedStep = Math.max(state.unlockedStep, index);
    state.activeMapZone = route[index].zone;
    void saveProgressToFirebase();
}

export function setActiveMapZone(zone) {
    // Cập nhật khu vực bản đồ đang hoạt động
    // Mục đích: Thay đổi vùng (zone) mà người dùng đang đứng trên bản đồ và lưu lại.
    state.activeMapZone = zone;
    void saveProgressToFirebase();
}

function resetStateToDefault() {
    // Đặt lại toàn bộ state về giá trị mặc định
    // Mục đích: Xóa bỏ các tùy chỉnh và tiến trình, đưa ứng dụng về trạng thái nguyên bản.
    state.selectedAvatar = avatars[0];
    state.avatarImagePath = "";
    state.avatarImageUrl = "";
    state.customName = translate("fallback.guest");
    state.currentStep = 0;
    state.unlockedStep = 0;
    state.activeMapZone = route[0].zone;
}

function applyProgressData(data) {
    // Áp dụng dữ liệu tiến trình vào state
    // Mục đích: Chuyển đổi dữ liệu thô từ Firebase thành cấu trúc state mà ứng dụng có thể sử dụng.
    const savedCurrent = Number(data.currentStep);
    const savedUnlocked = Number(data.unlockedStep);
    const currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
    const unlockedStep = Number.isFinite(savedUnlocked) ? clamp(savedUnlocked, currentStep, route.length - 1) : currentStep;

    state.selectedAvatar = avatarById.get(data.avatarId) || avatars[0];
    state.avatarImagePath = typeof data.avatarImagePath === "string" ? data.avatarImagePath : "";
    state.avatarImageUrl = typeof data.avatarImageUrl === "string" ? data.avatarImageUrl : "";
    state.customName = typeof data.customName === "string" && data.customName.trim()
        ? data.customName.trim()
        : translate("fallback.guest");
    state.currentStep = currentStep;
    state.unlockedStep = unlockedStep;
    state.activeMapZone = data.activeMapZone || route[currentStep]?.zone || "khu-v";
}
