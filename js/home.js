import { route } from "../data/route.js";
import { auth, collection, db, getDocs, query, where } from "./firebase.js";
import { state } from "./state.js";
import { showSkeleton } from "./ui-utils.js";


const TOTAL_STEPS = route.length;
const NOTIFICATION_TYPES = {
    moment_created: { icon: "ph-note-pencil", title: "Bạn đã đăng khoảnh khắc" },
    moment_updated: { icon: "ph-pencil-simple", title: "Bạn đã chỉnh sửa bài viết" },
    reaction_received: { icon: "ph-heart", title: "Có cảm xúc mới" }
};

export async function renderHomeDashboard() {
    renderQuestSummary();
    await Promise.all([
        renderLeaderboard(),
        renderLibrary(),
        renderProfile(),
        renderNotifications()
    ]);
}

function renderQuestSummary() {
    const list = document.getElementById("home-quest-list");
    if (!list) return;

    if (!route || route.length === 0) {
        showSkeleton("home-quest-list", 4);
        return;
    }

    const visibleScenes = route.slice(0, 4);
    list.innerHTML = visibleScenes.map((scene, index) => {
        const isUnlocked = index <= state.unlockedStep;
        return `
            <article class="quest-stage-card ${isUnlocked ? "is-unlocked" : ""}">
                <span>${scene.chapter}</span>
                <h3>${escapeHtml(scene.shortTitle || scene.title)}</h3>
                <p>${escapeHtml(scene.mission || scene.body)}</p>
            </article>
        `;
    }).join("");
}

async function renderLeaderboard() {
    const table = document.getElementById("home-leaderboard-table");
    if (!table) return;

    showSkeleton("home-leaderboard-table", 1);

    table.innerHTML = `
        <div class="leaderboard-row head">
            <span>Rank</span>
            <span>Người chơi</span>
            <span>Tiến độ</span>
            <span>Điểm</span>
        </div>
        <div class="leaderboard-row loading-row">
            <span>...</span>
            <strong>Đang tải bảng xếp hạng</strong>
            <span></span>
            <span></span>
        </div>
    `;

    try {
        const { rows } = await fetchLeaderboardData();
        renderLeaderboardRows(table, rows.slice(0, 8));
    } catch (error) {
        console.warn("Leaderboard load error:", error);
        renderLeaderboardRows(table, [currentUserRank()], "Chỉ hiển thị tiến độ của bạn. Firestore rules hiện chưa cho đọc BXH toàn hệ thống.");
    }
}

function renderLeaderboardRows(table, rows, note = "") {
    const body = rows.map((row, index) => `
        <div class="leaderboard-row">
            <span>#${index + 1}</span>
            <strong>${escapeHtml(row.name)}</strong>
            <span>${row.unlockedStep + 1}/${TOTAL_STEPS} chặng</span>
            <span>${row.score.toLocaleString("vi-VN")}</span>
        </div>
    `).join("");

    table.innerHTML = `
        <div class="leaderboard-row head">
            <span>Rank</span>
            <span>Người chơi</span>
            <span>Tiến độ</span>
            <span>Điểm</span>
        </div>
        ${body}
        ${note ? `<div class="leaderboard-note">${escapeHtml(note)}</div>` : ""}
    `;
}

async function fetchLeaderboardData() {
    const localRow = currentUserRank();
    if (!auth?.currentUser || !db) {
        return { rows: [localRow], currentRank: 1, currentProgress: localRow };
    }

    const snapshot = await getDocs(collection(db, "tourProgress"));
    const rows = [];
    snapshot.forEach((item) => {
        const data = item.data();
        rows.push(normalizeProgress({ ...data, uid: data.uid || item.id }));
    });

    if (!rows.some((row) => row.uid === auth.currentUser.uid)) {
        rows.push(localRow);
    }

    rows.sort((a, b) => b.score - a.score || b.unlockedStep - a.unlockedStep);
    const currentIndex = rows.findIndex((row) => row.uid === auth.currentUser.uid);

    return {
        rows,
        currentRank: currentIndex >= 0 ? currentIndex + 1 : null,
        currentProgress: currentIndex >= 0 ? rows[currentIndex] : localRow
    };
}

async function renderLibrary() {
    const grid = document.getElementById("home-library-grid");
    if (!grid) return;

    showSkeleton("home-library-grid", 3);

    grid.innerHTML = `
        <article class="library-card">
            <i class="ph ph-spinner-gap"></i>
            <strong>Đang tải nhật ký</strong>
            <span>Đang đồng bộ tiến độ, ghi chú và khoảnh khắc của bạn.</span>
        </article>
    `;

    const unlockedScenes = route.slice(0, state.unlockedStep + 1);
    const ownMoments = await fetchOwnMoments();
    const currentScene = route[state.currentStep] || route[0];

    grid.innerHTML = `
        <article class="library-card">
            <i class="ph ph-book-open-text"></i>
            <strong>${unlockedScenes.length}/${TOTAL_STEPS} chặng đã mở</strong>
            <span>Gần nhất: ${escapeHtml(currentScene.title)}.</span>
        </article>
        <article class="library-card">
            <i class="ph ph-images"></i>
            <strong>${ownMoments.length} khoảnh khắc</strong>
            <span>${ownMoments.length ? escapeHtml(ownMoments[0].caption) : "Bạn chưa lưu khoảnh khắc nào trong hành trình."}</span>
        </article>
        <article class="library-card">
            <i class="ph ph-map-pin-line"></i>
            <strong>Mốc đã mở khóa</strong>
            <span>${escapeHtml(unlockedScenes.map((scene) => scene.shortTitle || scene.title).join(", "))}</span>
        </article>
    `;
}

async function renderProfile() {
    const avatar = document.getElementById("profile-home-avatar");
    const portrait = document.querySelector(".profile-portrait");
    const name = document.getElementById("profile-home-name");
    const email = document.getElementById("profile-home-email");
    const progress = document.getElementById("profile-home-progress");
    const moments = document.getElementById("profile-home-moments");
    const reactions = document.getElementById("profile-home-reactions");
    if (!avatar || !name || !email || !progress || !moments || !reactions) return;

    const [ownMoments, notifications, reactionCount, leaderboardData] = await Promise.all([
        fetchOwnMoments(),
        fetchNotifications(),
        fetchReceivedReactionCount(),
        fetchLeaderboardData()
    ]);
    const profile = leaderboardData.currentProgress || currentUserRank();
    const completedQuests = profile.unlockedStep + 1;
    const totalXp = profile.totalXp;
    const xpTarget = profile.xpTarget || TOTAL_STEPS * 100;
    const xpCurrent = Math.min(totalXp, xpTarget);
    const xpPercent = Math.round((xpCurrent / xpTarget) * 1000) / 10;
    const level = profile.level || Math.max(1, Math.floor(totalXp / 500) + 1);

    avatar.style.setProperty("--avatar-color", state.selectedAvatar.color);
    avatar.innerHTML = `<i class="ph ${state.selectedAvatar.icon || "ph-user-circle"}"></i>`;
    if (portrait) {
        portrait.style.setProperty("--avatar-color", state.selectedAvatar.color);
        portrait.innerHTML = `<i class="ph ${state.selectedAvatar.icon || "ph-user-circle"}"></i>`;
    }
    name.textContent = profile.name || state.customName || "Explorer";
    email.textContent = auth?.currentUser?.email || "Tài khoản cục bộ";
    progress.textContent = String(completedQuests);
    moments.textContent = String(ownMoments.length);
    reactions.textContent = String(reactionCount);

    setText("profile-level", String(level));
    setText("profile-xp-current", xpCurrent.toLocaleString("vi-VN"));
    setText("profile-xp-total", xpTarget.toLocaleString("vi-VN"));
    setText("profile-total-xp", formatCompact(totalXp));
    setText("profile-ranking", leaderboardData.currentRank ? `#${leaderboardData.currentRank}` : "--");
    document.getElementById("profile-xp-progress")?.style.setProperty("--profile-progress", `${xpPercent}%`);
}

async function renderNotifications() {
    const list = document.getElementById("notification-list");
    const badge = document.getElementById("notification-badge");
    const notifications = await fetchNotifications();
    const unread = notifications.filter((item) => !item.read).length;

    if (badge) {
        badge.textContent = String(unread);
        badge.classList.toggle("hidden", unread === 0);
    }

    if (!list) return;

    const ownMoments = await fetchOwnMoments();
    const activity = buildProfileActivity(notifications, ownMoments);

    if (!activity.length) {
        list.innerHTML = `
            <article class="profile-activity-item is-highlight">
                <span></span>
                <div>
                    <strong>Chưa có hoạt động</strong>
                    <time>Firebase</time>
                </div>
            </article>
        `;
        return;
    }

    list.innerHTML = activity.slice(0, 5).map(renderActivityItem).join("");
}

async function fetchNotifications() {
    if (!auth?.currentUser || !db) return [];

    try {
        const snapshot = await getDocs(query(
            collection(db, "notifications"),
            where("uid", "==", auth.currentUser.uid)
        ));
        const notifications = [];
        snapshot.forEach((item) => notifications.push({ id: item.id, ...item.data() }));
        return notifications.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    } catch (error) {
        console.warn("Notifications load error:", error);
        return [];
    }
}

async function fetchReceivedReactionCount() {
    if (!auth?.currentUser || !db) return 0;

    try {
        const snapshot = await getDocs(query(
            collection(db, "momentReactions"),
            where("ownerUid", "==", auth.currentUser.uid)
        ));
        return snapshot.size;
    } catch (error) {
        console.warn("Reaction count load error:", error);
        return 0;
    }
}

function renderActivityItem(activity, index = 0) {
    return `
        <article class="profile-activity-item ${index === 0 ? "is-highlight" : ""}">
            <span></span>
            <div>
                <strong>${escapeHtml(activity.title)}</strong>
                <time>${formatDate(activity.createdAt)}</time>
            </div>
        </article>
    `;
}

function buildProfileActivity(notifications, moments) {
    const notificationActivity = notifications.map((notification) => {
        const meta = NOTIFICATION_TYPES[notification.type] || { title: "Thông báo" };
        return {
            title: notification.title || meta.title,
            createdAt: notification.createdAt
        };
    });
    const momentActivity = moments.map((moment) => ({
        title: `Đăng khoảnh khắc: "${moment.caption || moment.sceneTitle || "VKU 360 Quest"}"`,
        createdAt: moment.createdAt || moment.updatedAt
    }));

    return [...notificationActivity, ...momentActivity]
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

async function fetchOwnMoments() {
    if (!auth?.currentUser || !db) return [];

    try {
        const snapshot = await getDocs(query(
            collection(db, "moments"),
            where("uid", "==", auth.currentUser.uid)
        ));
        const moments = [];
        snapshot.forEach((item) => moments.push({ id: item.id, ...item.data() }));
        return moments.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    } catch (error) {
        console.warn("Library moments load error:", error);
        return [];
    }
}

function currentUserRank() {
    return normalizeProgress({
        uid: auth?.currentUser?.uid || "local",
        customName: state.customName,
        unlockedStep: state.unlockedStep
    });
}

function normalizeProgress(progress) {
    const unlockedStep = clampStep(Number(progress.unlockedStep));
    const currentStep = clampStep(Number(progress.currentStep));
    const fallbackScore = (unlockedStep + 1) * 100 + Math.max(0, currentStep) * 10;
    const score = firstFiniteNumber(progress.score, progress.totalXp, progress.xp, fallbackScore);
    const totalXp = firstFiniteNumber(progress.totalXp, progress.xp, progress.score, score);
    return {
        uid: progress.uid || "",
        name: progress.customName || "Explorer",
        currentStep,
        unlockedStep,
        score,
        totalXp,
        level: firstFiniteNumber(progress.level, null),
        xpTarget: firstFiniteNumber(progress.xpTarget, progress.nextLevelXp, null)
    };
}

function firstFiniteNumber(...values) {
    for (const value of values) {
        if (value === null || value === undefined || value === "") continue;
        const number = Number(value);
        if (Number.isFinite(number)) return Math.max(0, number);
    }
    return 0;
}

function clampStep(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(TOTAL_STEPS - 1, value));
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatDate(value) {
    const time = getTime(value);
    if (!time) return "Vừa xong";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(time));
}

function formatCompact(value) {
    if (value >= 1000) {
        return `${Math.round(value / 100) / 10}k`;
    }
    return String(value);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
