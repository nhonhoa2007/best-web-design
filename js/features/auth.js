import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "../firebase/index.js";
import { t } from "../app/i18n.js";
import { showToast } from "../ui/ui.js";

let isLoginMode = true;
let languageListenerBound = false;

export function setupAuthUI() {
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-link");
    const toggleText = document.getElementById("auth-toggle-text");
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");

    if (!form || !toggleLink || !toggleText || !title || !submitBtn) return;

    refreshAuthText();
    bindLanguageListener();

    const currentToggleLink = document.getElementById("auth-toggle-link");
    if (!currentToggleLink) return;

    currentToggleLink.onclick = (event) => {
        event.preventDefault();
        isLoginMode = !isLoginMode;
        refreshAuthText();
        setupAuthUI();
    };

    form.onsubmit = async (event) => {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!auth) {
            showToast(t("toast.firebaseMissing"));
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? t("auth.loggingIn") : t("auth.signingUp");

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                showToast(t("toast.loginSuccess"));
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                showToast(t("toast.signupSuccess"));
            }
            refreshAfterAuthChange();
        } catch (error) {
            showToast(getAuthErrorMessage(error));
            console.error("Auth Error:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? t("auth.loginAction") : t("auth.signupAction");
        }
    };
}

export async function handleLogout() {
    if (!auth) return;

    try {
        await signOut(auth);
        showToast(t("toast.logoutSuccess"));
        refreshAfterAuthChange();
    } catch (error) {
        showToast(t("toast.logoutError"));
        console.error("Logout Error:", error);
    }
}

function refreshAfterAuthChange() {
    window.location.reload();
}

function getAuthErrorMessage(error) {
    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": t("auth.error.emailInUse"),
        "auth/invalid-email": t("auth.error.invalidEmail"),
        "auth/invalid-credential": t("auth.error.invalidCredential"),
        "auth/network-request-failed": t("auth.error.network"),
        "auth/operation-not-allowed": t("auth.error.operation"),
        "auth/too-many-requests": t("auth.error.tooMany"),
        "auth/missing-password": t("auth.error.missingPassword"),
        "auth/weak-password": t("auth.error.weakPassword"),
        "auth/user-not-found": t("auth.error.userNotFound"),
        "auth/wrong-password": t("auth.error.wrongPassword")
    };

    return messages[code] || error?.message || t("auth.error.default");
}

function refreshAuthText() {
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const toggleText = document.getElementById("auth-toggle-text");

    if (title) title.textContent = isLoginMode ? t("auth.loginTitle") : t("auth.signupTitle");
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.textContent = isLoginMode ? t("auth.loginAction") : t("auth.signupAction");
    }
    if (toggleText) {
        toggleText.innerHTML = isLoginMode
            ? `${t("auth.needAccount")} <a href="#" id="auth-toggle-link">${t("auth.signupNow")}</a>`
            : `${t("auth.hasAccount")} <a href="#" id="auth-toggle-link">${t("auth.loginNow")}</a>`;
    }
}

function bindLanguageListener() {
    if (languageListenerBound) return;
    languageListenerBound = true;
    window.addEventListener("vku-language-change", () => {
        refreshAuthText();
        setupAuthUI();
    });
}
