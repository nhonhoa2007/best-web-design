let toastTimer;

export function showToast(message) {
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
    return Math.min(Math.max(value, min), max);
}
