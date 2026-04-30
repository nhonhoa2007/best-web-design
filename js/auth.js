import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "./firebase.js";
import { showToast } from "./ui.js";

let isLoginMode = true;

export function setupAuthUI() {
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-link");
    const toggleText = document.getElementById("auth-toggle-text");
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");

    if (!form || !toggleLink || !toggleText || !title || !submitBtn) return;

    toggleLink.onclick = (event) => {
        event.preventDefault();
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            title.textContent = "Đăng nhập";
            submitBtn.textContent = "Đăng nhập";
            toggleText.innerHTML = 'Chưa có tài khoản? <a href="#" id="auth-toggle-link">Đăng ký ngay</a>';
        } else {
            title.textContent = "Đăng ký";
            submitBtn.textContent = "Đăng ký";
            toggleText.innerHTML = 'Đã có tài khoản? <a href="#" id="auth-toggle-link">Đăng nhập</a>';
        }

        setupAuthUI();
    };

    form.onsubmit = async (event) => {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!auth) {
            showToast("Cấu hình Firebase chưa được thiết lập.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? "Đang đăng nhập..." : "Đang đăng ký...";

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                showToast("Đăng nhập thành công!");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                showToast("Đăng ký thành công!");
            }
        } catch (error) {
            showToast(getAuthErrorMessage(error));
            console.error("Auth Error:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? "Đăng nhập" : "Đăng ký";
        }
    };
}

export async function handleLogout() {
    if (!auth) return;

    try {
        await signOut(auth);
        showToast("Đã đăng xuất.");
    } catch (error) {
        showToast("Lỗi đăng xuất.");
        console.error("Logout Error:", error);
    }
}

function getAuthErrorMessage(error) {
    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": "Email này đã được đăng ký.",
        "auth/invalid-email": "Email không hợp lệ.",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
        "auth/network-request-failed": "Không kết nối được Firebase. Kiểm tra mạng hoặc cấu hình project.",
        "auth/operation-not-allowed": "Bạn chưa bật phương thức đăng nhập Email/Password trong Firebase Authentication.",
        "auth/too-many-requests": "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.",
        "auth/missing-password": "Vui lòng nhập mật khẩu.",
        "auth/weak-password": "Mật khẩu cần tối thiểu 6 ký tự.",
        "auth/user-not-found": "Không tìm thấy tài khoản.",
        "auth/wrong-password": "Mật khẩu không đúng."
    };

    return messages[code] || error?.message || "Đã xảy ra lỗi.";
}
