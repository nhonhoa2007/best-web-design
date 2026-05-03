import { route } from "../data/route.js";
import { auth, collection, db, getDocs, query, where } from "./firebase.js";
import { state } from "./state.js";

const TOTAL_STEPS = route.length;

export async function renderHomeDashboard() {
    renderQuestSummary();
    await Promise.all([
        renderLeaderboard(),
        renderLibrary()
    ]);
}

function renderQuestSummary() {
    const list = document.getElementById("home-quest-list");
    if (!list) return;

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

    if (!auth?.currentUser || !db) {
        renderLeaderboardRows(table, [currentUserRank()]);
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "tourProgress"));
        const rows = [];
        snapshot.forEach((item) => rows.push(normalizeProgress(item.data())));

        if (!rows.some((row) => row.uid === auth.currentUser.uid)) {
            rows.push(currentUserRank());
        }

        rows.sort((a, b) => b.score - a.score || b.unlockedStep - a.unlockedStep);
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

async function renderLibrary() {
    const grid = document.getElementById("home-library-grid");
    if (!grid) return;

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
    return {
        uid: progress.uid || "",
        name: progress.customName || "Explorer",
        unlockedStep,
        score: (unlockedStep + 1) * 100 + Math.max(0, Number(progress.currentStep) || 0) * 10
    };
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

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
