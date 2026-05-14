import { getCurrentLocale, translate } from "../app/i18n.js";
import { escapeAttribute, escapeHtml } from "./html.js";

export function renderEventPhotoCard(photo) {
    return `
        <article class="event-photo-card">
            <img class="img-loading-skeleton" src="${escapeAttribute(photo.imageUrl)}" alt="${escapeAttribute(translate("events.imageAlt", { title: photo.title || translate("events.fallbackTitle") }))}" loading="lazy" decoding="async" onload="this.classList.remove('img-loading-skeleton')">
            <div class="event-photo-body">
                <div>
                    <span>${formatEventDate(photo.createdAt)}</span>
                    <strong>${escapeHtml(photo.title || translate("events.fallbackTitle"))}</strong>
                </div>
                <p>${escapeHtml(photo.caption || "")}</p>
                <small>${escapeHtml(photo.authorName || translate("fallback.explorer"))}</small>
            </div>
        </article>
    `;
}

export function renderEmptyState(icon, message, className = "") {
    return `
        <div class="events-empty ${className}">
            <i class="ph ${icon}"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function formatEventDate(value) {
    const time = getTime(value);
    if (!time) return translate("status.justNow");

    return new Intl.DateTimeFormat(getCurrentLocale(), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(time));
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}
