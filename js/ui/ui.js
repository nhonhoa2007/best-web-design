let toastTimer;

export function showToast(message) {
    // Hiển thị thông báo nhanh (toast notification)
    // Mục đích: Hiện một dòng chữ thông báo ngắn gọn ở dưới màn hình và tự động ẩn sau 2.6 giây.
    const toast = document.getElementById("toast");
    if (!toast) {
        console.warn(message);
        return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 2600);
}

export function clamp(value, min, max) {
    // Ràng buộc giá trị số trong một khoảng
    // Mục đích: Giữ cho một con số không vượt quá giới hạn nhỏ nhất (min) và lớn nhất (max).
    return Math.min(Math.max(value, min), max);
}
