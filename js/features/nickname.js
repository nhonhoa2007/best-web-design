import { translate } from "../app/i18n.js";
import { STORAGE_KEYS, saveProgressToFirebase, setProfile, state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

const NICKNAME_KEY = STORAGE_KEYS.customName;
const MODAL_ID = "nickname-modal";

/**
 * Shows the nickname modal if user hasn't set a name yet.
 * Resolves when the user successfully sets a name, or immediately if already set.
 */
export function checkAndPromptNickname() {
    // Kiểm tra và yêu cầu người dùng đặt bí danh
    // Mục đích: Nếu người dùng chưa có tên (hoặc là khách), hiển thị hộp thoại yêu cầu đặt tên để định danh trong tour.
    return new Promise((resolve) => {
        const fallback = translate("fallback.guest");
        const currentName = state.customName?.trim();

        // Already has a real, non-default name → skip
        if (currentName && currentName !== fallback) {
            resolve(state.customName);
            return;
        }

        // Also check localStorage directly (guest / offline flow)
        const saved = localStorage.getItem(NICKNAME_KEY)?.trim();
        if (saved && saved !== fallback && saved !== "Khách" && saved !== "Guest") {
            state.customName = saved;
            resolve(saved);
            return;
        }

        showNicknameModal(resolve);
    });
}

function showNicknameModal(onConfirm) {
    // Hiển thị hộp thoại (modal) đặt bí danh
    // Mục đích: Khởi tạo modal nếu chưa có, reset các trạng thái nhập liệu và hiển thị lên màn hình.
    let modal = document.getElementById(MODAL_ID);
    if (!modal) {
        modal = createModalElement();
        document.body.appendChild(modal);
    }

    // Reset state
    const input = modal.querySelector("#nickname-input");
    const btn = modal.querySelector("#nickname-confirm-btn");
    const charCount = modal.querySelector("#nickname-char-count");
    const errorEl = modal.querySelector("#nickname-error");

    if (input) {
        input.value = "";
        input.focus();
    }
    if (errorEl) errorEl.textContent = "";
    if (charCount) charCount.textContent = "0/24";
    if (btn) btn.disabled = true;

    // Show modal
    modal.classList.remove("nickname-modal--hidden");
    modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => modal.classList.add("nickname-modal--visible"));

    // Bind events
    const cleanup = bindModalEvents(modal, onConfirm, () => cleanup());

    // Prevent closing by clicking backdrop (forced)
    modal.querySelector(".nickname-modal__backdrop")?.addEventListener("click", (e) => {
        // shake the card to indicate it's required
        modal.querySelector(".nickname-modal__card")?.classList.add("nickname-modal--shake");
        setTimeout(() => {
            modal.querySelector(".nickname-modal__card")?.classList.remove("nickname-modal--shake");
        }, 500);
    });
}

function bindModalEvents(modal, onConfirm, cleanup) {
    // Gắn sự kiện cho hộp thoại bí danh
    // Mục đích: Xử lý kiểm tra tính hợp lệ của tên (độ dài, khoảng trắng), gợi ý tên và gửi dữ liệu lên server.
    const input = modal.querySelector("#nickname-input");
    const btn = modal.querySelector("#nickname-confirm-btn");
    const charCount = modal.querySelector("#nickname-char-count");
    const errorEl = modal.querySelector("#nickname-error");
    const MAX = 24;
    const MIN = 2;

    const validate = (val) => {
        if (!val || val.length < MIN) return translate("nickname.errorMin") || `Tên cần ít nhất ${MIN} ký tự`;
        if (val.length > MAX) return translate("nickname.errorMax") || `Tên không được quá ${MAX} ký tự`;
        if (/^\s+$/.test(val)) return translate("nickname.errorBlank") || "Tên không được chỉ có khoảng trắng";
        return null;
    };

    const onInput = () => {
        const val = input.value.trim();
        const raw = input.value;
        const count = raw.length;
        if (charCount) {
            charCount.textContent = `${count}/${MAX}`;
            charCount.classList.toggle("nickname-char-count--warn", count >= MAX - 4);
        }
        const err = validate(val);
        if (errorEl) errorEl.textContent = err || "";
        if (btn) btn.disabled = !!err;
    };

    const onSubmit = async () => {
        // Xử lý khi người dùng nhấn nút xác nhận đặt bí danh
        // Ghi chú Async: Cần đợi (await) hàm saveProgressToFirebase() hoàn tất việc đồng bộ tên mới lên server trước khi đóng hộp thoại và thông báo thành công.
        const val = input.value.trim();
        const err = validate(val);
        if (err) {
            if (errorEl) errorEl.textContent = err;
            input.focus();
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="ph ph-spinner-gap nickname-spin"></i> Đang lưu...`;

        try {
            setProfile(state.selectedAvatar, val);
            await saveProgressToFirebase();
            localStorage.setItem(NICKNAME_KEY, val);
            showToast(translate("toast.nicknameSet", { name: val }));
            hideModal(modal);
            onConfirm(val);
        } catch (err) {
            console.error("Nickname save error:", err);
            btn.disabled = false;
            btn.innerHTML = `${translate("nickname.confirm") || "Xác nhận"} <i class="ph ph-arrow-right"></i>`;
        }
    };

    input?.addEventListener("input", onInput);
    input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") onSubmit();
    });
    btn?.addEventListener("click", onSubmit);

    return () => {
        input?.removeEventListener("input", onInput);
    };
}

function hideModal(modal) {
    // Ẩn hộp thoại bí danh
    // Mục đích: Sử dụng hiệu ứng mờ dần để đóng hộp thoại sau khi người dùng đã đặt tên thành công.
    modal.classList.remove("nickname-modal--visible");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(() => {
        modal.classList.add("nickname-modal--hidden");
    }, 400);
}

function createModalElement() {
    // Tạo cấu trúc HTML cho hộp thoại bí danh
    // Mục đích: Xây dựng giao diện modal bao gồm ô nhập liệu, thông báo lỗi và danh sách các bí danh gợi ý nhanh.
    const el = document.createElement("div");
    el.id = MODAL_ID;
    el.className = "nickname-modal nickname-modal--hidden";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "nickname-modal-title");
    el.setAttribute("aria-hidden", "true");

    el.innerHTML = `
        <div class="nickname-modal__backdrop"></div>
        <div class="nickname-modal__card glass-panel">
            <div class="nickname-modal__glow" aria-hidden="true"></div>

            <div class="nickname-modal__header">
                <div class="nickname-modal__icon">
                    <i class="ph ph-user-circle-plus"></i>
                </div>
                <h2 id="nickname-modal-title" class="nickname-modal__title">
                    Đặt bí danh của bạn
                </h2>
                <p class="nickname-modal__subtitle">
                    Bí danh sẽ hiển thị trong suốt hành trình khám phá VKU. Bạn có thể thay đổi sau trong hồ sơ.
                </p>
            </div>

            <div class="nickname-modal__body">
                <div class="nickname-input-group">
                    <div class="nickname-input-wrapper">
                        <i class="ph ph-at nickname-input-icon"></i>
                        <input
                            type="text"
                            id="nickname-input"
                            class="nickname-input"
                            placeholder="Ví dụ: Sói Bắc Cực, Explorer_VKU..."
                            maxlength="24"
                            autocomplete="off"
                            autocorrect="off"
                            spellcheck="false"
                        >
                        <span id="nickname-char-count" class="nickname-char-count">0/24</span>
                    </div>
                    <p id="nickname-error" class="nickname-error" aria-live="polite"></p>
                </div>

                <div class="nickname-suggestions">
                    <span class="nickname-suggestions__label">Gợi ý nhanh:</span>
                    <div class="nickname-suggestions__pills" id="nickname-pills"></div>
                </div>
            </div>

            <div class="nickname-modal__footer">
                <button id="nickname-confirm-btn" class="nickname-confirm-btn primary-button" type="button" disabled>
                    Bắt đầu hành trình <i class="ph ph-arrow-right"></i>
                </button>
                <p class="nickname-modal__required-note">
                    <i class="ph ph-info"></i> Bắt buộc để tiếp tục
                </p>
            </div>
        </div>
    `;

    // Populate suggestion pills
    const pills = el.querySelector("#nickname-pills");
    const suggestions = [
        "Khám Phá Viên", "Nhà Thám Hiểm", "VKU Pioneer",
        "Sói Cô Độc", "Thám Tử VKU", "Star Seeker"
    ];
    suggestions.forEach((name) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nickname-pill";
        btn.textContent = name;
        btn.addEventListener("click", () => {
            const input = el.querySelector("#nickname-input");
            if (input) {
                input.value = name;
                input.dispatchEvent(new Event("input"));
                input.focus();
            }
        });
        pills?.appendChild(btn);
    });

    return el;
}
