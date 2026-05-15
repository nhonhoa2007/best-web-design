import { route } from "../../data/route.js";
import { auth, collection, db, getDocs, query, where } from "../firebase/index.js";
import { formatNumber, getCurrentLocale, getSceneText, translate } from "../app/i18n.js";
import { avatarById, state } from "../app/state.js";
import { showSkeleton } from "../ui/ui-utils.js";


const TOTAL_STEPS = route.length;
const NOTIFICATION_TYPES = {
    moment_created: { icon: "ph-note-pencil", titleKey: "notification.momentCreated" },
    moment_updated: { icon: "ph-pencil-simple", titleKey: "notification.momentUpdated" },
    reaction_received: { icon: "ph-heart", titleKey: "notification.reactionReceived" },
    forum_reply_received: { icon: "ph-chat-circle-text", titleKey: "notification.forumReply" }
};
const DASHBOARD_CACHE_TTL = 45_000;
const LEADERBOARD_PAGE_LIMIT = 4;
const LEADERBOARD_HOME_LIMIT = 8;
const LEADERBOARD_MORE_STEP = 4;
let dashboardCacheContext = "";
let dashboardCache = new Map();

window.addEventListener("vku-language-change", () => {
    void renderHomeDashboard();
});
export async function renderHomeDashboard() {
    // Render toàn bộ bảng điều khiển trang chủ
    // Mục đích: Gọi đồng thời các hàm render thành phần như tóm tắt nhiệm vụ, bảng xếp hạng, thư viện, hồ sơ và thông báo.
    // Ghi chú Async: Sử dụng 'await Promise.all' để đợi tất cả các thành phần giao diện tải dữ liệu xong. Việc này giúp các phần của dashboard hiện ra đồng bộ và giảm thời gian chờ đợi nhờ việc tải song song.
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
    // Hiển thị tóm tắt các chặng nhiệm vụ
    // Mục đích: Duyệt qua danh sách các địa điểm trong route và hiển thị trạng thái đã mở khóa hay chưa.
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
                <span>${getSceneText(scene, "chapter")}</span>
                <h3>${escapeHtml(getSceneText(scene, "shortTitle") || getSceneText(scene, "title"))}</h3>
                <p>${escapeHtml(getSceneText(scene, "mission") || getSceneText(scene, "body"))}</p>
            </article>
        `;
    }).join("");
}

async function renderLeaderboard() {
    // Hiển thị bảng xếp hạng người chơi
    // Mục đích: Tải dữ liệu từ Firebase, xử lý hiệu ứng loading và hiển thị danh sách người chơi dẫn đầu.
    // Ghi chú Async: Hàm này 'await' fetchLeaderboardData() để lấy danh sách từ database trước khi tiến hành vẽ các hàng dữ liệu lên bảng.
    const table = document.getElementById("leaderboard-table") || document.getElementById("home-leaderboard-table");
    if (!table) return;

    showSkeleton(table.id, 1);

    table.innerHTML = `
        <div class="leaderboard-row head">
            <span>${translate("leaderboard.rank")}</span>
            <span>${translate("leaderboard.player")}</span>
            <span>${translate("leaderboard.progress")}</span>
            <span>${translate("leaderboard.score")}</span>
        </div>
        <div class="leaderboard-row loading-row">
            <span>...</span>
            <strong>${translate("leaderboard.loading")}</strong>
            <span></span>
            <span></span>
        </div>
    `;

    try {
        const { rows } = await fetchLeaderboardData();
        const isStandaloneLeaderboard = table.id === "leaderboard-table";
        renderLeaderboardRows(table, rows, {
            visibleCount: isStandaloneLeaderboard ? LEADERBOARD_PAGE_LIMIT : LEADERBOARD_HOME_LIMIT
        });
    } catch (error) {
        console.warn("Leaderboard load error:", error);
        renderLeaderboardRows(table, [currentUserRank()], {
            note: translate("leaderboard.localOnly")
        });
    }
}

function renderLeaderboardRows(table, rows, options = {}) {
    // Tạo mã HTML cho các hàng trong bảng xếp hạng
    // Mục đích: Chuyển đổi mảng dữ liệu người chơi thành cấu trúc hàng cột để chèn vào DOM.
    const note = options.note || "";
    const visibleCount = Math.min(options.visibleCount || rows.length, rows.length);
    const visibleRows = rows.slice(0, visibleCount);
    const hasMore = visibleCount < rows.length;
    updateLeaderboardTopAvatar(rows[0]);

    const body = visibleRows.map((row, index) => `
        <div class="leaderboard-row">
            <span class="leaderboard-rank-badge ${index < 3 ? `rank-${index + 1}` : ""}">#${index + 1}</span>
            <span class="leaderboard-player-cell">
                ${renderLeaderboardAvatar(row)}
                <strong>${escapeHtml(row.name)}</strong>
            </span>
            <span class="leaderboard-progress-cell">
                <strong>${row.unlockedStep + 1}/${TOTAL_STEPS} ${translate("unit.stage")}</strong>
                <span class="leaderboard-progress-track">
                    <span style="width: ${getProgressPercent(row)}%"></span>
                </span>
            </span>
            <span class="leaderboard-score">${formatNumber(row.score)}</span>
        </div>
    `).join("");

    table.innerHTML = `
        <div class="leaderboard-row head">
            <span>${translate("leaderboard.rank")}</span>
            <span>${translate("leaderboard.player")}</span>
            <span>${translate("leaderboard.progress")}</span>
            <span>${translate("leaderboard.score")}</span>
        </div>
        ${body}
        ${hasMore ? `<button class="leaderboard-more" type="button" data-leaderboard-more>${translate("leaderboard.more")}</button>` : ""}
        ${note ? `<div class="leaderboard-note">${escapeHtml(note)}</div>` : ""}
    `;

    table.querySelector("[data-leaderboard-more]")?.addEventListener("click", () => {
        renderLeaderboardRows(table, rows, {
            note,
            visibleCount: Math.min(rows.length, visibleCount + LEADERBOARD_MORE_STEP)
        });
    });
}

function updateLeaderboardTopAvatar(row) {
    const container = document.getElementById("leaderboard-top-avatar");
    if (!container) return;

    if (!row) {
        container.innerHTML = `<i class="ph ph-user-circle"></i>`;
        container.style.removeProperty("--leader-avatar-color");
        return;
    }

    container.style.setProperty("--leader-avatar-color", getAvatarColor(row));
    container.innerHTML = renderLeaderboardAvatar(row, "leaderboard-top-avatar-face");
}

function renderLeaderboardAvatar(row, className = "leaderboard-avatar") {
    const imageUrl = row.avatarImageUrl || "";
    const avatar = avatarById.get(row.avatarId) || state.selectedAvatar;
    const color = row.avatarColor || avatar?.color || "#ffd21f";
    const icon = avatar?.icon || "ph-user-circle";

    if (imageUrl) {
        return `<span class="${className}" style="--leader-avatar-color: ${escapeAttribute(color)}"><img src="${escapeAttribute(imageUrl)}" alt=""></span>`;
    }

    return `<span class="${className}" style="--leader-avatar-color: ${escapeAttribute(color)}"><i class="ph ${escapeAttribute(icon)}"></i></span>`;
}

function getAvatarColor(row) {
    const avatar = avatarById.get(row.avatarId) || state.selectedAvatar;
    return row.avatarColor || avatar?.color || "#ffd21f";
}

function getProgressPercent(row) {
    return Math.max(0, Math.min(100, Math.round(((row.unlockedStep + 1) / TOTAL_STEPS) * 100)));
}

async function fetchLeaderboardData() {
    // Lấy dữ liệu bảng xếp hạng từ Firebase
    // Mục đích: Truy xuất tiến trình của tất cả người dùng, chuẩn hóa dữ liệu và tính toán thứ hạng của người dùng hiện tại.
    // Ghi chú Async: 'await' quá trình lấy dữ liệu từ cache hoặc trực tiếp từ Firestore. Tác vụ này tốn thời gian vì phải xử lý lượng lớn bản ghi tiến trình của nhiều người dùng.
    const localRow = currentUserRank();
    if (!auth?.currentUser || !db) {
        return { rows: [localRow], currentRank: 1, currentProgress: localRow };
    }

    const cachedRows = await getCachedDashboardValue("leaderboard", async () => {
        const snapshot = await getDocs(collection(db, "tourProgress"));
        const progressRows = [];
        snapshot.forEach((item) => {
            const data = item.data();
            progressRows.push(normalizeProgress({ ...data, uid: data.uid || item.id }));
        });
        return progressRows;
    });
    const rows = [...cachedRows];

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
    // Hiển thị thư viện hành trình của người dùng
    // Mục đích: Tổng hợp số chặng đã qua, số khoảnh khắc đã lưu và hiển thị chúng dưới dạng các thẻ thông tin.
    // Ghi chú Async: Cần đợi (await) fetchOwnMoments() để đếm chính xác số lượng khoảnh khắc người dùng đã đăng trước khi render.
    const grid = document.getElementById("library-grid") || document.getElementById("home-library-grid");
    if (!grid) return;

    showSkeleton(grid.id, 3);

    grid.innerHTML = `
        <article class="library-card">
            <i class="ph ph-spinner-gap"></i>
            <strong>${translate("library.loadingTitle")}</strong>
            <span>${translate("library.loadingBody")}</span>
        </article>
    `;

    const unlockedScenes = route.slice(0, state.unlockedStep + 1);
    const ownMoments = await fetchOwnMoments();
    const currentScene = route[state.currentStep] || route[0];

    grid.innerHTML = `
        <article class="library-card">
            <i class="ph ph-book-open-text"></i>
            <strong>${unlockedScenes.length}/${TOTAL_STEPS} ${translate("library.unlockedStages")}</strong>
            <span>${translate("library.latest")}: ${escapeHtml(getSceneText(currentScene, "title"))}.</span>
        </article>
        <article class="library-card">
            <i class="ph ph-images"></i>
            <strong>${ownMoments.length} ${translate("tour.moments").toLowerCase()}</strong>
            <span>${ownMoments.length ? escapeHtml(ownMoments[0].caption) : translate("library.noMoments")}</span>
        </article>
        <article class="library-card">
            <i class="ph ph-map-pin-line"></i>
            <strong>${translate("library.unlockedTitle")}</strong>
            <span>${escapeHtml(unlockedScenes.map((scene) => getSceneText(scene, "shortTitle") || getSceneText(scene, "title")).join(", "))}</span>
        </article>
    `;
}

async function renderProfile() {
    // Hiển thị thông tin hồ sơ chi tiết của người dùng
    // Mục đích: Cập nhật avatar, tên, cấp độ, XP và các số liệu thống kê cá nhân lên giao diện.
    // Ghi chú Async: Sử dụng 'await Promise.all' để thu thập cùng lúc 4 loại dữ liệu (khoảnh khắc, thông báo, cảm xúc, xếp hạng). Điều này tối ưu hiệu suất vì ứng dụng không phải đợi từng cái một theo thứ tự.
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
    name.textContent = profile.name || state.customName || translate("fallback.explorer");
    email.textContent = auth?.currentUser?.email || translate("profile.localAccount");
    progress.textContent = String(completedQuests);
    moments.textContent = String(ownMoments.length);
    reactions.textContent = String(reactionCount);

    setText("profile-level", String(level));
    setText("profile-xp-current", formatNumber(xpCurrent));
    setText("profile-xp-total", formatNumber(xpTarget));
    setText("profile-total-xp", formatCompact(totalXp));
    setText("profile-ranking", leaderboardData.currentRank ? `#${leaderboardData.currentRank}` : "--");
    document.getElementById("profile-xp-progress")?.style.setProperty("--profile-progress", `${xpPercent}%`);
}

async function renderNotifications() {
    // Hiển thị danh sách thông báo và hoạt động
    // Mục đích: Lấy các thông báo từ Firebase, cập nhật số lượng thông báo chưa đọc và render danh sách hoạt động gần đây.
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
                    <strong>${translate("profile.noActivity")}</strong>
                    <time>${translate("profile.firebase")}</time>
                </div>
            </article>
        `;
        return;
    }

    list.innerHTML = activity.slice(0, 5).map(renderActivityItem).join("");
}

async function renderAchievements() {
    // Hiển thị danh sách thành tựu (huy hiệu)
    // Mục đích: Tải các thành tựu đã đạt được từ Firebase hoặc tự động tính toán dựa trên tiến trình hiện tại.
    const grid = document.getElementById("profile-achievement-grid");
    if (!grid) return;

    if (!auth?.currentUser || !db) {
        renderAchievementEmpty(grid, translate("achievement.loginSync"));
        return;
    }

    grid.innerHTML = `
        <article class="profile-achievement-card rare">
            <i class="ph ph-spinner-gap"></i>
            <strong>${translate("profile.loadingAchievements")}</strong>
            <span>${translate("profile.firebase")}</span>
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
            renderAchievementEmpty(grid, translate("achievement.empty"));
            return;
        }

        grid.innerHTML = generatedAchievements.slice(0, 6).map(renderAchievementCard).join("");
    } catch (error) {
        console.warn("Achievements load error:", error);
        renderAchievementEmpty(grid, translate("achievement.loadError"));
    }
}

async function fetchUserAchievements() {
    // Truy xuất danh sách thành tựu từ Firestore
    // Mục đích: Lấy các huy hiệu mà người dùng đã mở khóa chính thức và được lưu trên server.
    return getCachedDashboardValue("achievements", async () => {
        const snapshot = await getDocs(query(
            collection(db, "achievements"),
            where("uid", "==", auth.currentUser.uid)
        ));
        const achievements = [];
        snapshot.forEach((item) => achievements.push(normalizeAchievement({ id: item.id, ...item.data() })));
        return achievements
            .filter((achievement) => achievement.title)
            .sort((a, b) => getTime(b.unlockedAt) - getTime(a.unlockedAt));
    });
}

function buildAchievementsFromFirebaseData({ moments, reactionCount, leaderboardData }) {
    // Tự động tính toán các thành tựu dựa trên dữ liệu người dùng
    // Mục đích: Kiểm tra các điều kiện (số chặng, số khoảnh khắc, hạng) để đề xuất các huy hiệu tương ứng.
    const progress = leaderboardData.currentProgress || currentUserRank();
    const completedQuests = progress.unlockedStep + 1;
    const achievements = [];

    if (completedQuests > 0) {
        achievements.push(normalizeAchievement({
            title: "Quest Starter",
            rarity: "rare",
            icon: "ph-rocket-launch",
            description: `${completedQuests}/${TOTAL_STEPS} ${translate("library.unlockedStages")}`,
            unlockedAt: progress.updatedAt
        }));
    }

    if (completedQuests >= Math.ceil(TOTAL_STEPS / 2)) {
        achievements.push(normalizeAchievement({
            title: "Campus Navigator",
            rarity: "epic",
            icon: "ph-map-trifold",
            description: translate("achievement.navigator"),
            unlockedAt: progress.updatedAt
        }));
    }

    if (completedQuests >= TOTAL_STEPS) {
        achievements.push(normalizeAchievement({
            title: "VKU 360 Finisher",
            rarity: "legendary",
            icon: "ph-trophy",
            description: translate("achievement.finisher"),
            unlockedAt: progress.updatedAt
        }));
    }

    if (moments.length > 0) {
        achievements.push(normalizeAchievement({
            title: "Moment Keeper",
            rarity: "rare",
            icon: "ph-images",
            description: translate("achievement.momentKeeper", { count: moments.length }),
            unlockedAt: moments[0].createdAt || moments[0].updatedAt
        }));
    }

    if (reactionCount > 0) {
        achievements.push(normalizeAchievement({
            title: "Campus Signal",
            rarity: "epic",
            icon: "ph-heart",
            description: translate("achievement.campusSignal", { count: reactionCount }),
            unlockedAt: null
        }));
    }

    if (leaderboardData.currentRank && leaderboardData.currentRank <= 3) {
        achievements.push(normalizeAchievement({
            title: "Top Explorer",
            rarity: "legendary",
            icon: "ph-medal",
            description: translate("achievement.topExplorer", { rank: leaderboardData.currentRank }),
            unlockedAt: null
        }));
    }

    return achievements;
}

function renderAchievementCard(achievement) {
    // Tạo HTML cho thẻ thành tựu
    // Mục đích: Hiển thị icon, tiêu đề và độ hiếm của huy hiệu (Rare, Epic, Legendary).
    return `
        <article class="profile-achievement-card ${escapeAttribute(achievement.rarity)}">
            <i class="ph ${escapeAttribute(achievement.icon)}"></i>
            <strong>${escapeHtml(achievement.title)}</strong>
            <span>${escapeHtml(achievement.description || formatRarity(achievement.rarity))}</span>
        </article>
    `;
}

function renderAchievementEmpty(grid, message) {
    // Hiển thị trạng thái trống cho phần thành tựu
    // Mục đích: Thông báo khi người dùng chưa đăng nhập hoặc chưa đạt được thành tựu nào.
    grid.innerHTML = `
        <article class="profile-achievement-card profile-achievement-empty">
            <i class="ph ph-medal"></i>
            <strong>${escapeHtml(message)}</strong>
            <span>${translate("profile.firebase")}</span>
        </article>
    `;
}

function normalizeAchievement(achievement) {
    // Chuẩn hóa dữ liệu thành tựu
    // Mục đích: Đảm bảo các trường dữ liệu như icon, tiêu đề, độ hiếm luôn có giá trị hợp lệ trước khi hiển thị.
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
    // Chuẩn hóa độ hiếm của thành tựu
    // Mục đích: Phân loại thành tựu vào 4 nhóm: common, rare, epic, legendary.
    const rarity = String(value).toLowerCase();
    return ["common", "rare", "epic", "legendary"].includes(rarity) ? rarity : "rare";
}

function normalizeIcon(value = "") {
    // Chuẩn hóa tên icon Phosphor
    // Mục đích: Đảm bảo tên class icon luôn bắt đầu bằng 'ph-' để hiển thị đúng.
    const icon = String(value).trim();
    if (!icon) return "ph-medal";
    return icon.startsWith("ph-") ? icon : `ph-${icon}`;
}

function formatRarity(rarity) {
    // Chuyển đổi tên độ hiếm sang văn bản hiển thị
    // Mục đích: Trả về chuỗi văn bản tương ứng với mã độ hiếm (ví dụ: 'legendary' -> 'Legendary').
    const labels = {
        common: "Common",
        rare: "Rare",
        epic: "Epic",
        legendary: "Legendary"
    };
    return labels[rarity] || labels.rare;
}

async function fetchNotifications() {
    // Lấy thông báo từ Firebase
    // Mục đích: Truy xuất các thông báo riêng tư của người dùng hiện tại và sắp xếp theo thời gian.
    // Ghi chú Async: Thực hiện truy vấn bất đồng bộ tới Firestore để lấy danh sách thông báo theo UID người dùng.
    if (!auth?.currentUser || !db) return [];

    return getCachedDashboardValue("notifications", async () => {
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
    });
}

async function fetchReceivedReactionCount() {
    // Đếm tổng số cảm xúc người dùng đã nhận được
    // Mục đích: Thống kê mức độ tương tác của cộng đồng với các khoảnh khắc mà người dùng đã đăng.
    if (!auth?.currentUser || !db) return 0;

    return getCachedDashboardValue("reaction-count", async () => {
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
    });
}

function renderActivityItem(activity, index = 0) {
    // Tạo HTML cho một mục hoạt động gần đây
    // Mục đích: Hiển thị tiêu đề hoạt động và thời gian diễn ra trong danh sách thông báo.
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
    // Tổng hợp các hoạt động từ thông báo và khoảnh khắc
    // Mục đích: Tạo ra một dòng thời gian duy nhất chứa tất cả các sự kiện liên quan đến người dùng.
    const notificationActivity = notifications.map((notification) => {
        const meta = NOTIFICATION_TYPES[notification.type] || { titleKey: "notification.default" };
        return {
            title: notification.title || translate(meta.titleKey),
            createdAt: notification.createdAt
        };
    });
    const momentActivity = moments.map((moment) => ({
        title: translate("notification.momentActivity", { caption: moment.caption || moment.sceneTitle || "VKU 360 Quest" }),
        createdAt: moment.createdAt || moment.updatedAt
    }));

    return [...notificationActivity, ...momentActivity]
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

async function fetchOwnMoments() {
    // Lấy các khoảnh khắc do chính người dùng đăng
    // Mục đích: Truy xuất dữ liệu từ Firestore để hiển thị trong thư viện cá nhân và trang hồ sơ.
    if (!auth?.currentUser || !db) return [];

    return getCachedDashboardValue("own-moments", async () => {
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
    });
}

function getCachedDashboardValue(key, loader) {
    // Lấy giá trị từ bộ nhớ đệm (cache) cho dashboard
    // Mục đích: Giảm số lượng request tới Firebase bằng cách lưu tạm dữ liệu trong một khoảng thời gian (TTL).
    refreshDashboardCacheContext();

    const cached = dashboardCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.promise;
    }

    const promise = Promise.resolve()
        .then(loader)
        .catch((error) => {
            dashboardCache.delete(key);
            throw error;
        });

    dashboardCache.set(key, {
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL,
        promise
    });

    return promise;
}

function refreshDashboardCacheContext() {
    // Làm mới ngữ cảnh bộ nhớ đệm
    // Mục đích: Xóa cache nếu người dùng thay đổi, hoặc các thông số state quan trọng bị thay đổi.
    const nextContext = [
        auth?.currentUser?.uid || "local",
        Boolean(db),
        state.currentStep,
        state.unlockedStep,
        state.customName
    ].join("|");

    if (nextContext === dashboardCacheContext) return;

    dashboardCacheContext = nextContext;
    dashboardCache = new Map();
}

function currentUserRank() {
    // Lấy thông tin xếp hạng tạm thời của người dùng hiện tại
    // Mục đích: Cung cấp dữ liệu để hiển thị ngay lập tức khi chưa tải xong BXH toàn hệ thống.
    return normalizeProgress({
        uid: auth?.currentUser?.uid || "local",
        customName: state.customName,
        avatarId: state.selectedAvatar.id,
        avatarImageUrl: state.avatarImageUrl,
        avatarColor: state.selectedAvatar.color,
        unlockedStep: state.unlockedStep
    });
}

function normalizeProgress(progress) {
    // Chuẩn hóa dữ liệu tiến trình
    // Mục đích: Tính toán điểm số (score), XP và cấp độ từ các trường dữ liệu thô của Firebase.
    const unlockedStep = clampStep(Number(progress.unlockedStep));
    const currentStep = clampStep(Number(progress.currentStep));
    const fallbackScore = (unlockedStep + 1) * 100 + Math.max(0, currentStep) * 10;
    const score = firstFiniteNumber(progress.score, progress.totalXp, progress.xp, fallbackScore);
    const totalXp = firstFiniteNumber(progress.totalXp, progress.xp, progress.score, score);
    return {
        uid: progress.uid || "",
        name: progress.customName || translate("fallback.explorer"),
        avatarId: progress.avatarId || "",
        avatarImageUrl: typeof progress.avatarImageUrl === "string" ? progress.avatarImageUrl : "",
        avatarColor: typeof progress.avatarColor === "string" ? progress.avatarColor : "",
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
    // Lấy số hợp lệ đầu tiên trong danh sách
    // Mục đích: Xử lý fallback cho các trường dữ liệu có thể bị null hoặc không xác định.
    for (const value of values) {
        if (value === null || value === undefined || value === "") continue;
        const number = Number(value);
        if (Number.isFinite(number)) return Math.max(0, number);
    }
    return 0;
}

function clampStep(value) {
    // Giới hạn giá trị bước trong phạm vi hợp lệ
    // Mục đích: Đảm bảo chỉ số chặng luôn nằm trong khoảng từ 0 đến tổng số chặng của tour.
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(TOTAL_STEPS - 1, value));
}

function getTime(value) {
    // Lấy thời gian dạng miliseconds
    // Mục đích: Chuyển đổi đa dạng các kiểu dữ liệu thời gian sang số nguyên để so sánh.
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}

function formatDate(value) {
    // Định dạng ngày tháng hiển thị
    // Mục đích: Trả về chuỗi ngày giờ rút gọn phù hợp với ngôn ngữ hiện tại của người dùng.
    const time = getTime(value);
    if (!time) return translate("status.justNow");

    return new Intl.DateTimeFormat(getCurrentLocale(), {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(time));
}

function formatCompact(value) {
    // Định dạng số rút gọn (ví dụ: 1500 -> 1.5k)
    // Mục đích: Giúp giao diện gọn gàng hơn khi hiển thị các con số lớn (XP, Điểm).
    if (value >= 1000) {
        return `${Math.round(value / 100) / 10}k`;
    }
    return String(value);
}

function setText(id, value) {
    // Cập nhật nội dung văn bản cho một phần tử HTML
    // Mục đích: Hàm tiện ích giúp gán giá trị nhanh cho các element theo ID.
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function renderAvatarMarkup() {
    // Tạo mã HTML cho avatar người dùng
    // Mục đích: Hiển thị ảnh upload nếu có, nếu không thì hiển thị icon nhân vật đã chọn.
    if (state.avatarImageUrl) {
        return `<img class="avatar-image" src="${escapeAttribute(state.avatarImageUrl)}" alt="">`;
    }

    return `<i class="ph ${state.selectedAvatar.icon || "ph-user-circle"}"></i>`;
}

function escapeHtml(value = "") {
    // Làm sạch chuỗi HTML
    // Mục đích: Ngăn chặn tấn công XSS bằng cách mã hóa các ký tự đặc biệt.
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
    // Làm sạch chuỗi dùng trong thuộc tính HTML
    // Mục đích: Đảm bảo dữ liệu không phá hỏng cấu trúc các attribute của thẻ HTML.
    return escapeHtml(value).replaceAll("`", "&#096;");
}
