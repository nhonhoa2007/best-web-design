import {
    auth,
    authReady,
    createUserWithEmailAndPassword,
    getRedirectResult,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "../firebase/index.js";
import { translate } from "../app/i18n.js";
import { showToast } from "../ui/ui.js";

let isLoginMode = true;
let languageListenerBound = false;
const POST_LOGIN_SCREEN_KEY = "vkuQuestPostLoginScreen";
const GOOGLE_REDIRECT_PENDING_KEY = "vkuQuestGoogleRedirectPending";
const GOOGLE_REDIRECT_STARTED_AT_KEY = "vkuQuestGoogleRedirectStartedAt";
const DEFAULT_POST_LOGIN_SCREEN = "home-screen";
const REDIRECT_SETTLE_TIMEOUT_MS = 10000;
const REDIRECT_PENDING_MAX_AGE_MS = 2 * 60 * 1000;
const POST_LOGIN_SCREENS = new Set([
    "home-screen",
    "quest-screen",
    "leaderboard-screen",
    "library-screen",
    "events-screen",
    "profile-screen",
    "avatar-screen",
    "tour-app"
]);

export function setupAuthUI() {
    // Thiết lập giao diện xác thực (Đăng nhập/Đăng ký)
    // Mục đích: Khởi tạo các phần tử form, gắn sự kiện submit và logic chuyển đổi giữa chế độ đăng nhập và đăng ký.
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-link");
    const toggleText = document.getElementById("auth-toggle-text");
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const googleBtn = document.getElementById("google-auth-btn");
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");

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

    if (googleBtn) {
        googleBtn.onclick = handleGoogleLogin;
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.onclick = handlePasswordReset;
    }

    form.onsubmit = async (event) => {
        // Xử lý khi người dùng nhấn nút gửi form đăng nhập/đăng ký
        // Ghi chú Async: Hàm xử lý sự kiện này là 'async' để có thể 'await' các phản hồi từ hệ thống xác thực Firebase.
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!auth) {
            showToast(translate("toast.firebaseMissing"));
            return;
        }

        submitBtn.disabled = true;
        if (googleBtn) googleBtn.disabled = true;
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
            if (googleBtn) googleBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? translate("auth.loginAction") : translate("auth.signupAction");
        }
    };
}

async function handlePasswordReset() {
    const emailInput = document.getElementById("email");
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");
    const email = emailInput?.value.trim() || "";

    if (!auth) {
        showToast(translate("toast.firebaseMissing"));
        return;
    }

    if (!email) {
        showToast(translate("auth.error.resetEmailRequired"));
        emailInput?.focus();
        return;
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.disabled = true;
        forgotPasswordBtn.textContent = translate("auth.resetSending");
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showToast(translate("toast.passwordResetSent"));
    } catch (error) {
        showToast(getAuthErrorMessage(error));
        console.error("Password Reset Error:", error);
    } finally {
        if (forgotPasswordBtn) {
            forgotPasswordBtn.disabled = false;
            forgotPasswordBtn.textContent = translate("auth.forgotPassword");
        }
    }
}

async function handleGoogleLogin() {
    const submitBtn = document.getElementById("auth-submit-btn");
    const googleBtn = document.getElementById("google-auth-btn");

    if (!auth) {
        showToast(translate("toast.firebaseMissing"));
        return;
    }
    await authReady;

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    rememberPostLoginScreen();

    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<i class="ph ph-spinner-gap"></i> ${translate("auth.googleLoggingIn")}`;
    }
    if (submitBtn) submitBtn.disabled = true;

    try {
        await signInWithPopup(auth, provider);
        showToast(translate("toast.loginSuccess"));
        refreshAfterAuthChange();
    } catch (error) {
        if (shouldFallBackToRedirect(error)) {
            try {
                await startGoogleRedirectLogin(provider);
                return;
            } catch (redirectError) {
                clearPendingGoogleRedirect();
                showToast(getAuthErrorMessage(redirectError));
                console.error("Google Redirect Auth Error:", redirectError);
            }
        } else {
            showToast(getAuthErrorMessage(error));
            console.error("Google Auth Error:", error);
        }
    } finally {
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<i class="ph ph-google-logo"></i> ${translate("auth.googleAction")}`;
        }
        if (submitBtn) submitBtn.disabled = false;
    }
}

export async function handlePendingGoogleRedirect() {
    if (!auth) return false;
    await authReady;

    try {
        const hadPendingRedirect = isGoogleRedirectPending();
        const result = await getRedirectResult(auth);
        if (result?.user) {
            clearPendingGoogleRedirect();
            showToast(translate("toast.loginSuccess"));
            return true;
        }

        const redirectedUser = auth.currentUser || (hadPendingRedirect ? await waitForCurrentUser() : null);
        if (redirectedUser) {
            clearPendingGoogleRedirect();
            return true;
        }

        if (hadPendingRedirect) {
            clearPendingGoogleRedirect();
        }
        return false;
    } catch (error) {
        clearPendingGoogleRedirect();
        showToast(getAuthErrorMessage(error));
        console.error("Google Redirect Result Error:", error);
        return false;
    }
}

export function consumePostLoginScreen() {
    const screenId = readSessionValue(POST_LOGIN_SCREEN_KEY);
    sessionStorageRemove(POST_LOGIN_SCREEN_KEY);
    return POST_LOGIN_SCREENS.has(screenId) ? screenId : DEFAULT_POST_LOGIN_SCREEN;
}

export async function handleLogout() {
    // Xử lý đăng xuất người dùng
    // Mục đích: Gọi API Firebase để đăng xuất, hiển thị thông báo thành công và tải lại trang để xóa trạng thái người dùng.
    // Ghi chú Async: Phải dùng 'await' cho signOut() vì đây là một yêu cầu gửi đến server Firebase, cần thời gian phản hồi trước khi chúng ta thực hiện làm mới trang.
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
    // Notify the app shell; main.js handles screen changes through onAuthStateChanged.
    window.dispatchEvent(new CustomEvent("vku-auth-change"));
}

async function startGoogleRedirectLogin(provider) {
    markGoogleRedirectPending();
    await signInWithRedirect(auth, provider);
}

function rememberPostLoginScreen() {
    const activeScreen = document.querySelector(".app-screen.is-screen-active")?.id;
    const screenId = POST_LOGIN_SCREENS.has(activeScreen) && activeScreen !== "auth-screen"
        ? activeScreen
        : DEFAULT_POST_LOGIN_SCREEN;
    writeSessionValue(POST_LOGIN_SCREEN_KEY, screenId);
}

function markGoogleRedirectPending() {
    writeSessionValue(GOOGLE_REDIRECT_PENDING_KEY, "1");
    writeSessionValue(GOOGLE_REDIRECT_STARTED_AT_KEY, String(Date.now()));
}

function isGoogleRedirectPending() {
    if (readSessionValue(GOOGLE_REDIRECT_PENDING_KEY) !== "1") {
        return false;
    }

    const startedAt = Number(readSessionValue(GOOGLE_REDIRECT_STARTED_AT_KEY));
    if (Number.isFinite(startedAt) && Date.now() - startedAt > REDIRECT_PENDING_MAX_AGE_MS) {
        clearPendingGoogleRedirect();
        return false;
    }

    return true;
}

function clearPendingGoogleRedirect() {
    sessionStorageRemove(GOOGLE_REDIRECT_PENDING_KEY);
    sessionStorageRemove(GOOGLE_REDIRECT_STARTED_AT_KEY);
}

function shouldFallBackToRedirect(error) {
    return [
        "auth/popup-blocked",
        "auth/operation-not-supported-in-this-environment",
        "auth/cancelled-popup-request"
    ].includes(error?.code);
}

function readSessionValue(key) {
    try {
        return window.sessionStorage?.getItem(key) || window.localStorage?.getItem(key) || "";
    } catch (error) {
        return "";
    }
}

function writeSessionValue(key, value) {
    try {
        window.sessionStorage?.setItem(key, value);
        window.localStorage?.setItem(key, value);
    } catch (error) {
        // Auth still works without browser storage; the app will fall back to the home screen.
    }
}

function sessionStorageRemove(key) {
    try {
        window.sessionStorage?.removeItem(key);
        window.localStorage?.removeItem(key);
    } catch (error) {
        // Ignore storage access errors from strict browser privacy modes.
    }
}

function waitForCurrentUser(timeoutMs = REDIRECT_SETTLE_TIMEOUT_MS) {
    return new Promise((resolve) => {
        let settled = false;
        let timer = 0;
        let unsubscribe = () => {};
        const finish = (user) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            unsubscribe();
            resolve(user || null);
        };
        unsubscribe = auth.onAuthStateChanged(finish, () => finish(null));
        timer = window.setTimeout(() => finish(auth.currentUser), timeoutMs);
    });
}

function getAuthErrorMessage(error) {
    // Chuyển đổi mã lỗi Firebase thành thông báo tiếng Việt dễ hiểu
    // Mục đích: Cung cấp phản hồi thân thiện cho người dùng khi xảy ra lỗi trong quá trình đăng nhập hoặc đăng ký.
    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": translate("auth.error.emailInUse"),
        "auth/invalid-email": translate("auth.error.invalidEmail"),
        "auth/invalid-credential": translate("auth.error.invalidCredential"),
        "auth/network-request-failed": translate("auth.error.network"),
        "auth/operation-not-allowed": translate("auth.error.operation"),
        "auth/popup-blocked": translate("auth.error.popupBlocked"),
        "auth/popup-closed-by-user": translate("auth.error.popupClosed"),
        "auth/too-many-requests": translate("auth.error.tooMany"),
        "auth/unauthorized-domain": translate("auth.error.unauthorizedDomain"),
        "auth/missing-password": translate("auth.error.missingPassword"),
        "auth/weak-password": translate("auth.error.weakPassword"),
        "auth/user-not-found": translate("auth.error.userNotFound"),
        "auth/wrong-password": translate("auth.error.wrongPassword")
    };

    return messages[code] || error?.message || translate("auth.error.default");
}

function refreshAuthText() {
    // Cập nhật văn bản hiển thị trong form xác thực
    // Mục đích: Thay đổi tiêu đề, nhãn nút và nội dung liên kết dựa trên chế độ hiện tại (Đăng nhập hoặc Đăng ký).
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const toggleText = document.getElementById("auth-toggle-text");
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");

    if (title) title.textContent = isLoginMode ? translate("auth.loginTitle") : translate("auth.signupTitle");
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.textContent = isLoginMode ? translate("auth.loginAction") : translate("auth.signupAction");
    }
    const googleBtn = document.getElementById("google-auth-btn");
    if (googleBtn && !googleBtn.disabled) {
        googleBtn.innerHTML = `<i class="ph ph-google-logo"></i> ${translate("auth.googleAction")}`;
    }
    if (forgotPasswordBtn) {
        forgotPasswordBtn.hidden = !isLoginMode;
        if (!forgotPasswordBtn.disabled) {
            forgotPasswordBtn.textContent = translate("auth.forgotPassword");
        }
    }
    if (toggleText) {
        toggleText.innerHTML = isLoginMode
            ? `${translate("auth.needAccount")} <a href="#" id="auth-toggle-link">${translate("auth.signupNow")}</a>`
            : `${translate("auth.hasAccount")} <a href="#" id="auth-toggle-link">${translate("auth.loginNow")}</a>`;
    }
}

function bindLanguageListener() {
    // Lắng nghe sự kiện thay đổi ngôn ngữ
    // Mục đích: Đảm bảo giao diện đăng nhập được cập nhật ngay lập tức khi người dùng chuyển đổi ngôn ngữ ứng dụng.
    if (languageListenerBound) return;
    languageListenerBound = true;
    window.addEventListener("vku-language-change", () => {
        refreshAuthText();
        setupAuthUI();
    });
}
