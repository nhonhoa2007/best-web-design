import { getCurrentLocale, translate } from "../app/i18n.js";
import { escapeAttribute, escapeHtml } from "./html.js";

const CATEGORY_ICONS = {
    event: "ph-calendar-star",
    question: "ph-question",
    club: "ph-users-three",
    notice: "ph-megaphone"
};

export function renderForumThreadCard(thread, viewerUid = "") {
    const isOwner = viewerUid && viewerUid === thread.uid;
    const image = thread.imageUrl
        ? `<img class="forum-thread-thumb img-loading-skeleton" src="${escapeAttribute(thread.imageUrl)}" alt="${escapeAttribute(translate("events.imageAlt", { title: thread.title || translate("events.fallbackTitle") }))}" loading="lazy" decoding="async" onload="this.classList.remove('img-loading-skeleton')">`
        : "";

    return `
        <article class="forum-thread-card${thread.imageUrl ? " has-image" : ""}" data-forum-thread-id="${escapeAttribute(thread.id)}" data-image-path="${escapeAttribute(thread.imagePath || "")}">
            ${image}
            <button class="forum-thread-main" type="button" data-forum-open="${escapeAttribute(thread.id)}">
                <span class="forum-category-pill">
                    <i class="ph ${escapeAttribute(CATEGORY_ICONS[thread.category] || CATEGORY_ICONS.event)}"></i>
                    ${escapeHtml(translate(`events.category.${thread.category || "event"}`))}
                </span>
                <strong>${escapeHtml(thread.title || translate("events.fallbackTitle"))}</strong>
                <p>${escapeHtml(thread.body || "")}</p>
                <span class="forum-thread-meta">
                    ${escapeHtml(thread.authorName || translate("fallback.explorer"))} · ${formatForumDate(thread.lastActivityAt || thread.createdAt)}
                </span>
            </button>
            <div class="forum-thread-stats">
                <span><i class="ph ph-chat-circle"></i> ${Number(thread.replyCount) || 0}</span>
                ${isOwner ? `
                    <button class="forum-icon-action danger-button" type="button" data-forum-delete="${escapeAttribute(thread.id)}" data-image-path="${escapeAttribute(thread.imagePath || "")}" aria-label="${escapeAttribute(translate("events.deleteThread"))}">
                        <i class="ph ph-trash"></i>
                    </button>
                ` : ""}
            </div>
        </article>
    `;
}

export function renderForumThreadDetail(thread, replies = [], viewerUid = "") {
    if (!thread) {
        return `
            <div class="forum-detail-empty">
                <i class="ph ph-chats-circle"></i>
                <p>${escapeHtml(translate("events.selectThread"))}</p>
            </div>
        `;
    }

    const image = thread.imageUrl
        ? `<img class="forum-detail-image img-loading-skeleton" src="${escapeAttribute(thread.imageUrl)}" alt="${escapeAttribute(translate("events.imageAlt", { title: thread.title || translate("events.fallbackTitle") }))}" loading="lazy" decoding="async" onload="this.classList.remove('img-loading-skeleton')">`
        : "";
    const replyList = replies.length
        ? replies.map((reply) => renderForumReply(reply, viewerUid)).join("")
        : `<div class="forum-reply-empty"><i class="ph ph-chat-centered-text"></i><p>${escapeHtml(translate("events.noReplies"))}</p></div>`;

    return `
        <div class="forum-detail-head">
            <span class="forum-category-pill">
                <i class="ph ${escapeAttribute(CATEGORY_ICONS[thread.category] || CATEGORY_ICONS.event)}"></i>
                ${escapeHtml(translate(`events.category.${thread.category || "event"}`))}
            </span>
            <h3>${escapeHtml(thread.title || translate("events.fallbackTitle"))}</h3>
            <div class="forum-thread-meta">
                ${escapeHtml(thread.authorName || translate("fallback.explorer"))} · ${formatForumDate(thread.createdAt)}
            </div>
        </div>
        ${image}
        <p class="forum-detail-body">${escapeHtml(thread.body || "")}</p>
        <div class="forum-replies">
            <div class="forum-replies-head">
                <strong>${escapeHtml(translate("events.replies"))}</strong>
                <span>${replies.length}</span>
            </div>
            ${replyList}
        </div>
        <form id="event-forum-reply-form" class="forum-reply-form" data-thread-id="${escapeAttribute(thread.id)}">
            <label for="event-forum-reply">${escapeHtml(translate("events.replyLabel"))}</label>
            <textarea id="event-forum-reply" maxlength="800" rows="3" placeholder="${escapeAttribute(translate("events.replyPlaceholder"))}" required></textarea>
            <button id="event-forum-reply-submit" class="home-primary" type="submit">
                <i class="ph ph-paper-plane-tilt"></i>
                ${escapeHtml(translate("events.replySubmit"))}
            </button>
        </form>
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

function renderForumReply(reply) {
    return `
        <article class="forum-reply">
            <div>
                <strong>${escapeHtml(reply.authorName || translate("fallback.explorer"))}</strong>
                <span>${formatForumDate(reply.createdAt)}</span>
            </div>
            <p>${escapeHtml(reply.body || "")}</p>
        </article>
    `;
}

function formatForumDate(value) {
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
