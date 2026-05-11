import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "../firebase/index.js";
import { translate } from "../app/i18n.js";
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
            showToast(translate("toast.firebaseMissing"));
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? translate("auth.loggingIn") : translate("auth.signingUp");

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                showToast(translate("toast.loginSuccess"));
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                showToast(translate("toast.signupSuccess"));
            }
            refreshAfterAuthChange();
        } catch (error) {
            showToast(getAuthErrorMessage(error));
            console.error("Auth Error:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? translate("auth.loginAction") : translate("auth.signupAction");
        }
    };
}

export async function handleLogout() {
    if (!auth) return;

    try {
        await signOut(auth);
        showToast(translate("toast.logoutSuccess"));
        refreshAfterAuthChange();
    } catch (error) {
        showToast(translate("toast.logoutError"));
        console.error("Logout Error:", error);
    }
}

function refreshAfterAuthChange() {
    window.location.reload();
}

function getAuthErrorMessage(error) {
    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": translate("auth.error.emailInUse"),
        "auth/invalid-email": translate("auth.error.invalidEmail"),
        "auth/invalid-credential": translate("auth.error.invalidCredential"),
        "auth/network-request-failed": translate("auth.error.network"),
        "auth/operation-not-allowed": translate("auth.error.operation"),
        "auth/too-many-requests": translate("auth.error.tooMany"),
        "auth/missing-password": translate("auth.error.missingPassword"),
        "auth/weak-password": translate("auth.error.weakPassword"),
        "auth/user-not-found": translate("auth.error.userNotFound"),
        "auth/wrong-password": translate("auth.error.wrongPassword")
    };

    return messages[code] || error?.message || translate("auth.error.default");
}

function refreshAuthText() {
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const toggleText = document.getElementById("auth-toggle-text");

    if (title) title.textContent = isLoginMode ? translate("auth.loginTitle") : translate("auth.signupTitle");
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.textContent = isLoginMode ? translate("auth.loginAction") : translate("auth.signupAction");
    }
    if (toggleText) {
        toggleText.innerHTML = isLoginMode
            ? `${translate("auth.needAccount")} <a href="#" id="auth-toggle-link">${translate("auth.signupNow")}</a>`
            : `${translate("auth.hasAccount")} <a href="#" id="auth-toggle-link">${translate("auth.loginNow")}</a>`;
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
