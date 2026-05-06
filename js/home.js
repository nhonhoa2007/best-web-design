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
        renderAchievements(),
        renderNotifications()
    ]);
}

function renderQuestSummary() {
    const list = document.getElementById("quest-list") || document.getElementById("home-quest-list");
    if (!list) return;

    if (!route || route.length === 0) {
        showSkeleton(list.id, 4);
        return;
    }

    list.innerHTML = route.map((scene, index) => {
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
    const table = document.getElementById("leaderboard-table") || document.getElementById("home-leaderboard-table");
    if (!table) return;

    showSkeleton(table.id, 1);

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
    const grid = document.getElementById("library-grid") || document.getElementById("home-library-grid");
    if (!grid) return;

    showSkeleton(grid.id, 3);

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
    const avatarMarkup = renderAvatarMarkup();

    avatar.style.setProperty("--avatar-color", state.selectedAvatar.color);
    avatar.innerHTML = avatarMarkup;
    if (portrait) {
        portrait.style.setProperty("--avatar-color", state.selectedAvatar.color);
        portrait.innerHTML = avatarMarkup;
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

async function renderAchievements() {
    const grid = document.getElementById("profile-achievement-grid");
    if (!grid) return;

    if (!auth?.currentUser || !db) {
        renderAchievementEmpty(grid, "Đăng nhập để đồng bộ achievements từ Firebase.");
        return;
    }

    grid.innerHTML = `
        <article class="profile-achievement-card rare">
            <i class="ph ph-spinner-gap"></i>
            <strong>Đang tải achievements</strong>
            <span>Firebase</span>
        </article>
    `;

    let storedAchievements = [];
    try {
        storedAchievements = await fetchUserAchievements();
    } catch (error) {
        console.warn("Stored achievements load error:", error);
    }

    if (storedAchievements.length) {
        grid.innerHTML = storedAchievements.slice(0, 6).map(renderAchievementCard).join("");
        return;
    }

    try {
        const [ownMoments, reactionCount, leaderboardData] = await Promise.all([
            fetchOwnMoments(),
            fetchReceivedReactionCount(),
            fetchLeaderboardData()
        ]);
        const generatedAchievements = buildAchievementsFromFirebaseData({
            moments: ownMoments,
            reactionCount,
            leaderboardData
        });

        if (!generatedAchievements.length) {
            renderAchievementEmpty(grid, "Chưa có achievement nào được mở khóa.");
            return;
        }

        grid.innerHTML = generatedAchievements.slice(0, 6).map(renderAchievementCard).join("");
    } catch (error) {
        console.warn("Achievements load error:", error);
        renderAchievementEmpty(grid, "Không tải được achievements từ Firebase.");
    }
}

async function fetchUserAchievements() {
    const snapshot = await getDocs(query(
        collection(db, "achievements"),
        where("uid", "==", auth.currentUser.uid)
    ));
    const achievements = [];
    snapshot.forEach((item) => achievements.push(normalizeAchievement({ id: item.id, ...item.data() })));
    return achievements
        .filter((achievement) => achievement.title)
        .sort((a, b) => getTime(b.unlockedAt) - getTime(a.unlockedAt));
}

function buildAchievementsFromFirebaseData({ moments, reactionCount, leaderboardData }) {
    const progress = leaderboardData.currentProgress || currentUserRank();
    const completedQuests = progress.unlockedStep + 1;
    const achievements = [];

    if (completedQuests > 0) {
        achievements.push(normalizeAchievement({
            title: "Quest Starter",
            rarity: "rare",
            icon: "ph-rocket-launch",
            description: `${completedQuests}/${TOTAL_STEPS} chặng đã mở`,
            unlockedAt: progress.updatedAt
        }));
    }

    if (completedQuests >= Math.ceil(TOTAL_STEPS / 2)) {
        achievements.push(normalizeAchievement({
            title: "Campus Navigator",
            rarity: "epic",
            icon: "ph-map-trifold",
            description: "Đã đi qua hơn nửa lộ trình",
            unlockedAt: progress.updatedAt
        }));
    }

    if (completedQuests >= TOTAL_STEPS) {
        achievements.push(normalizeAchievement({
            title: "VKU 360 Finisher",
            rarity: "legendary",
            icon: "ph-trophy",
            description: "Hoàn thành toàn bộ quest route",
            unlockedAt: progress.updatedAt
        }));
    }

    if (moments.length > 0) {
        achievements.push(normalizeAchievement({
            title: "Moment Keeper",
            rarity: "rare",
            icon: "ph-images",
            description: `${moments.length} khoảnh khắc đã lưu`,
            unlockedAt: moments[0].createdAt || moments[0].updatedAt
        }));
    }

    if (reactionCount > 0) {
        achievements.push(normalizeAchievement({
            title: "Campus Signal",
            rarity: "epic",
            icon: "ph-heart",
            description: `${reactionCount} cảm xúc đã nhận`,
            unlockedAt: null
        }));
    }

    if (leaderboardData.currentRank && leaderboardData.currentRank <= 3) {
        achievements.push(normalizeAchievement({
            title: "Top Explorer",
            rarity: "legendary",
            icon: "ph-medal",
            description: `Hạng #${leaderboardData.currentRank} trên bảng xếp hạng`,
            unlockedAt: null
        }));
    }

    return achievements;
}

function renderAchievementCard(achievement) {
    return `
        <article class="profile-achievement-card ${escapeAttribute(achievement.rarity)}">
            <i class="ph ${escapeAttribute(achievement.icon)}"></i>
            <strong>${escapeHtml(achievement.title)}</strong>
            <span>${escapeHtml(achievement.description || formatRarity(achievement.rarity))}</span>
        </article>
    `;
}

function renderAchievementEmpty(grid, message) {
    grid.innerHTML = `
        <article class="profile-achievement-card profile-achievement-empty">
            <i class="ph ph-medal"></i>
            <strong>${escapeHtml(message)}</strong>
            <span>Firebase</span>
        </article>
    `;
}

function normalizeAchievement(achievement) {
    const rarity = normalizeRarity(achievement.rarity || achievement.tier || achievement.level);
    return {
        id: achievement.id || "",
        title: achievement.title || achievement.name || "",
        rarity,
        icon: normalizeIcon(achievement.icon),
        description: achievement.description || achievement.body || achievement.subtitle || formatRarity(rarity),
        unlockedAt: achievement.unlockedAt || achievement.createdAt || achievement.updatedAt || null
    };
}

function normalizeRarity(value = "rare") {
    const rarity = String(value).toLowerCase();
    return ["common", "rare", "epic", "legendary"].includes(rarity) ? rarity : "rare";
}

function normalizeIcon(value = "") {
    const icon = String(value).trim();
    if (!icon) return "ph-medal";
    return icon.startsWith("ph-") ? icon : `ph-${icon}`;
}

function formatRarity(rarity) {
    const labels = {
        common: "Common",
        rare: "Rare",
        epic: "Epic",
        legendary: "Legendary"
    };
    return labels[rarity] || labels.rare;
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
        xpTarget: firstFiniteNumber(progress.xpTarget, progress.nextLevelXp, null),
        updatedAt: progress.updatedAt || progress.createdAt || null
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

function renderAvatarMarkup() {
    if (state.avatarImageUrl) {
        return `<img class="avatar-image" src="${escapeAttribute(state.avatarImageUrl)}" alt="">`;
    }

    return `<i class="ph ${state.selectedAvatar.icon || "ph-user-circle"}"></i>`;
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
