import {
    auth,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "../firebase/index.js";
import { translate } from "../app/i18n.js";
import { showToast } from "../ui/ui.js";

let isLoginMode = true;
let languageListenerBound = false;

export function setupAuthUI() {
    // Thiết lập giao diện xác thực (Đăng nhập/Đăng ký)
    // Mục đích: Khởi tạo các phần tử form, gắn sự kiện submit và logic chuyển đổi giữa chế độ đăng nhập và đăng ký.
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-link");
    const toggleText = document.getElementById("auth-toggle-text");
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const googleBtn = document.getElementById("google-auth-btn");

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

async function handleGoogleLogin() {
    const submitBtn = document.getElementById("auth-submit-btn");
    const googleBtn = document.getElementById("google-auth-btn");

    if (!auth) {
        showToast(translate("toast.firebaseMissing"));
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

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
        if (error?.code === "auth/popup-blocked") {
            try {
                await signInWithRedirect(auth, provider);
                return;
            } catch (redirectError) {
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
    // Làm mới trang sau khi thay đổi trạng thái xác thực
    // Mục đích: Đảm bảo toàn bộ ứng dụng được cập nhật trạng thái mới nhất từ Firebase.
    window.location.reload();
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

    if (title) title.textContent = isLoginMode ? translate("auth.loginTitle") : translate("auth.signupTitle");
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.textContent = isLoginMode ? translate("auth.loginAction") : translate("auth.signupAction");
    }
    const googleBtn = document.getElementById("google-auth-btn");
    if (googleBtn && !googleBtn.disabled) {
        googleBtn.innerHTML = `<i class="ph ph-google-logo"></i> ${translate("auth.googleAction")}`;
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
