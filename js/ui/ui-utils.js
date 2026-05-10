export function showSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletons = Array(count).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
    `).join("");

    container.innerHTML = skeletons;
}

const style = document.createElement("style");
style.textContent = `
    .skeleton-card {
        background: rgba(30, 41, 59, 0.4);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow: hidden;
        position: relative;
    }

    .skeleton-card::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        animation: shimmer 1.5s infinite;
    }

    .skeleton-image {
        height: 120px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }

    .skeleton-text {
        height: 14px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        width: 100%;
    }

    .skeleton-text.short {
        width: 60%;
    }
`;
document.head.appendChild(style);
