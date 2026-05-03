import { auth, onAuthStateChanged } from "./firebase.js";
import { setupAuthUI } from "./auth.js";
import { renderHomeDashboard } from "./home.js";
import { hydrateProgressFromFirebase, hydrateState } from "./state.js";
import { bindControls, preloadPanoramas, renderAvatarOptions, renderResumeButton, startTour } from "./tour.js";

const PAGE_PARTIALS = [
    "pages/homepage.html",
    "pages/login.html",
    "pages/avatar.html",
    "pages/tour.html",
    "pages/congrats.html"
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

    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                document.getElementById("home-screen")?.classList.remove("hidden");
                document.getElementById("auth-screen")?.classList.add("hidden");
                document.getElementById("avatar-screen")?.classList.add("hidden");
                document.getElementById("tour-app")?.classList.add("hidden");

                await bootTourShell(user);
                await renderHomeDashboard();
            } else {
                document.getElementById("home-screen")?.classList.add("hidden");
                document.getElementById("auth-screen")?.classList.remove("hidden");
                document.getElementById("avatar-screen")?.classList.add("hidden");
                document.getElementById("tour-app")?.classList.add("hidden");
            }
        });
    } else {
        document.getElementById("home-screen")?.classList.add("hidden");
        document.getElementById("auth-screen")?.classList.remove("hidden");
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
    const homeScreen = document.getElementById("home-screen");
    const authScreen = document.getElementById("auth-screen");

    document.querySelectorAll("[data-start-tour]").forEach((button) => {
        button.addEventListener("click", () => {
            homeScreen?.classList.add("hidden");
            authScreen?.classList.add("hidden");
            startTour();
        });
    });

    document.getElementById("back-home")?.addEventListener("click", () => {
        if (auth?.currentUser) {
            authScreen?.classList.add("hidden");
            homeScreen?.classList.remove("hidden");
        }
    });
}
