import { auth, onAuthStateChanged } from "../firebase/index.js";
import { setupAuthUI } from "../features/auth.js";
import { setupGuideChat } from "../features/chat-guide.js";
import { bindEventControls, renderEventGallery } from "../features/events.js";
import { renderHomeDashboard } from "../features/home.js";
import { applyTranslations, mountLanguageSwitchers, translate } from "./i18n.js";
import { checkAndPromptNickname } from "../features/nickname.js";
import { bindProfileControls } from "../features/profile.js";
import { hydrateProgressFromFirebase, hydrateState } from "./state.js";
import { bindControls, renderAvatarOptions, renderResumeButton, startTour } from "../features/tour.js";
import Theme from "../features/theme.js";


const PAGE_PARTIALS = [
    "pages/homepage.html",
    "pages/quest.html",
    "pages/leaderboard.html",
    "pages/library.html",
    "pages/events.html",
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
    "events-screen",
    "profile-screen",
    "auth-screen",
    "avatar-screen",
    "tour-app"
];

const SCREEN_TRANSITION_MS = 260;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadPagePartials();
    } catch (error) {
        console.error("Page partial load error:", error);
        showPartialLoadError(error);
        return;
    }

    Theme.init();
    initializeScreenMotion();
    setupHomeUI();
    mountLanguageSwitchers();
    applyTranslations();
    setupAuthUI();
    setupGuideChat();
    bindEventControls();
    bindProfileControls();

    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                showScreen("home-screen");

                await bootTourShell(user);
                // Prompt for nickname if user hasn't set one yet
                void checkAndPromptNickname();
                await renderHomeDashboard();
                await renderEventGallery();
            } else {
                showScreen("auth-screen");
            }
        });
    } else {
        showScreen("auth-screen");
        bootTourShell();
        void checkAndPromptNickname();
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
                throw new Error(translate("partial.error", { partial }));
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
                    <h2>${translate("partial.title")}</h2>
                    <p>${error.message}. ${translate("partial.hint")}</p>
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
}

function setupHomeUI() {
    const homeScreen = document.getElementById("home-screen");
    const menuToggle = document.getElementById("home-menu-toggle");
    const menuClose = document.getElementById("home-menu-close");
    const menuBackdrop = document.getElementById("home-menu-backdrop");
    const mobileMenu = document.getElementById("home-mobile-menu");

    const setHomeMenuOpen = (isOpen) => {
        homeScreen?.classList.toggle("home-menu-open", isOpen);
        menuToggle?.setAttribute("aria-expanded", String(isOpen));
        mobileMenu?.setAttribute("aria-hidden", String(!isOpen));
    };

    menuToggle?.addEventListener("click", () => {
        setHomeMenuOpen(!homeScreen?.classList.contains("home-menu-open"));
    });
    menuClose?.addEventListener("click", () => setHomeMenuOpen(false));
    menuBackdrop?.addEventListener("click", () => setHomeMenuOpen(false));
    document.querySelectorAll("[data-home-menu-link]").forEach((link) => {
        link.addEventListener("click", () => setHomeMenuOpen(false));
    });
    const closeProfileMenus = () => {
        document.querySelectorAll(".profile-screen.profile-menu-open").forEach((screen) => {
            screen.classList.remove("profile-menu-open");
            screen.querySelector("[data-profile-menu-toggle]")?.setAttribute("aria-expanded", "false");
        });
    };

    document.querySelectorAll("[data-profile-menu-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const screen = button.closest(".profile-screen");
            const isOpen = !screen?.classList.contains("profile-menu-open");
            closeProfileMenus();
            screen?.classList.toggle("profile-menu-open", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });
    });

    document.querySelectorAll(".profile-nav-links button").forEach((button) => {
        button.addEventListener("click", closeProfileMenus);
    });

    document.querySelectorAll("[data-start-tour]").forEach((button) => {
        button.addEventListener("click", () => {
            setHomeMenuOpen(false);
            closeProfileMenus();
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

            setHomeMenuOpen(false);
            closeProfileMenus();
            showScreen(screenId);
            await renderHomeDashboard();
            if (screenId === "events-screen") {
                await renderEventGallery();
            }
        });
    });

    document.querySelectorAll("[data-back-home], #back-home").forEach((button) => {
        button.addEventListener("click", () => {
            if (auth?.currentUser) {
                setHomeMenuOpen(false);
                closeProfileMenus();
                showScreen("home-screen");
            }
        });
    });
}

function showScreen(nextScreenId) {
    const nextScreen = document.getElementById(nextScreenId);
    if (!nextScreen || nextScreen.classList.contains("is-screen-active")) return;

    APP_SCREENS.forEach((screenId) => {
        const screen = document.getElementById(screenId);
        if (!screen) return;

        if (screenId === nextScreenId) {
            window.clearTimeout(Number(screen.dataset.hideTimer || 0));
            screen.classList.remove("hidden", "screen-leaving");
            screen.classList.add("screen-entering");

            requestAnimationFrame(() => {
                screen.classList.add("is-screen-active");
                screen.classList.remove("screen-entering");
            });
            return;
        }

        if (screen.classList.contains("hidden")) {
            screen.classList.remove("is-screen-active", "screen-entering", "screen-leaving");
            return;
        }

        screen.classList.remove("is-screen-active", "screen-entering");
        screen.classList.add("screen-leaving");
        const timer = window.setTimeout(() => {
            screen.classList.add("hidden");
            screen.classList.remove("screen-leaving");
        }, SCREEN_TRANSITION_MS);
        screen.dataset.hideTimer = String(timer);
    });
}

function initializeScreenMotion() {
    APP_SCREENS.forEach((screenId) => {
        document.getElementById(screenId)?.classList.add("app-screen");
    });
}
