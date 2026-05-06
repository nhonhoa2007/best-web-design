import { auth, onAuthStateChanged } from "./firebase.js";
import { setupAuthUI } from "./auth.js";
import { renderHomeDashboard } from "./home.js";
import { bindProfileControls } from "./profile.js";
import { hydrateProgressFromFirebase, hydrateState } from "./state.js";
import { bindControls, preloadPanoramas, renderAvatarOptions, renderResumeButton, startTour } from "./tour.js";


const PAGE_PARTIALS = [
    "pages/homepage.html",
    "pages/quest.html",
    "pages/leaderboard.html",
    "pages/library.html",
    "pages/profile.html",
    "pages/login.html",
    "pages/avatar.html",
    "pages/tour.html",
    "pages/congrats.html"
];

const APP_SCREENS = [
    "home-screen",
    "quest-screen",
    "leaderboard-screen",
    "library-screen",
    "profile-screen",
    "auth-screen",
    "avatar-screen",
    "tour-app"
];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadPagePartials();
    } catch (error) {
        console.error("Page partial load error:", error);
        showPartialLoadError(error);
        return;
    }

    setupHomeUI();
    setupAuthUI();
    bindProfileControls();

    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                showScreen("home-screen");

                await bootTourShell(user);
                await renderHomeDashboard();
            } else {
                showScreen("auth-screen");
            }
        });
    } else {
        showScreen("auth-screen");
        bootTourShell();
        void renderHomeDashboard();
    }
});

async function loadPagePartials() {
    const root = document.getElementById("screen-root");
    if (!root) return;

    const html = await Promise.all(
        PAGE_PARTIALS.map(async (partial) => {
            const response = await fetch(partial);
            if (!response.ok) {
                throw new Error(`Không tải được ${partial}`);
            }
            return response.text();
        })
    );

    root.innerHTML = html.join("\n");
}

function showPartialLoadError(error) {
    const root = document.getElementById("screen-root");
    if (!root) return;

    root.innerHTML = `
        <section class="auth-screen">
            <div class="auth-container glass-panel">
                <div class="auth-header">
                    <h2>Không tải được giao diện</h2>
                    <p>${error.message}. Hãy chạy trang qua local server thay vì mở trực tiếp file HTML.</p>
                </div>
            </div>
        </section>
    `;
}

async function bootTourShell(user = null) {
    if (user) {
        await hydrateProgressFromFirebase(user);
    } else {
        hydrateState();
    }

    renderAvatarOptions();
    bindControls();
    renderResumeButton();
    preloadPanoramas();
}

function setupHomeUI() {
    document.querySelectorAll("[data-start-tour]").forEach((button) => {
        button.addEventListener("click", () => {
            showScreen("tour-app");
            startTour();
        });
    });

    document.querySelectorAll("[data-open-page]").forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            if (!auth?.currentUser) return;

            const page = event.currentTarget.dataset.openPage;
            const screenId = `${page}-screen`;
            if (!APP_SCREENS.includes(screenId)) return;

            showScreen(screenId);
            await renderHomeDashboard();
        });
    });

    document.querySelectorAll("[data-back-home], #back-home").forEach((button) => {
        button.addEventListener("click", () => {
            if (auth?.currentUser) {
                showScreen("home-screen");
            }
        });
    });
}

function showScreen(activeScreenId) {
    APP_SCREENS.forEach((screenId) => {
        document.getElementById(screenId)?.classList.toggle("hidden", screenId !== activeScreenId);
    });
}
