import { auth, functions, httpsCallable } from "../firebase/index.js";
import { route } from "../../data/route.js";
import { getSceneText, t, getCurrentLanguage } from "../app/i18n.js";
import { state } from "../app/state.js";
import { showToast } from "../ui/ui.js";

let guideCallable = null;
let isMounted = false;
let isSending = false;

export function setupGuideChat() {
    if (isMounted) return;
    isMounted = true;
    guideCallable = functions ? httpsCallable(functions, "chatGuide") : null;

    const root = document.createElement("aside");
    root.className = "guide-chat";
    root.setAttribute("aria-label", "VKU guide chat");
    renderGuideTemplate(root);

    document.body.appendChild(root);

    bindGuideEvents(root);
    addGuideMessage(root, "assistant", t("guide.welcome"));

    window.addEventListener("vku-language-change", () => {
        const isOpen = root.classList.contains("is-open");
        renderGuideTemplate(root);
        bindGuideEvents(root);
        setGuideOpen(root, isOpen);
        addGuideMessage(root, "assistant", t("guide.welcome"));
    });
}

function renderGuideTemplate(root) {
    root.innerHTML = `
        <button class="guide-chat-toggle" type="button" aria-expanded="false" aria-controls="guide-chat-panel">
            <i class="ph ph-chats-circle"></i>
        </button>
        <section class="guide-chat-panel" id="guide-chat-panel" aria-hidden="true">
            <header class="guide-chat-header">
                <div>
                    <span>${t("guide.title")}</span>
                    <strong>${t("guide.subtitle")}</strong>
                </div>
                <button class="guide-chat-close" type="button" aria-label="Close guide">
                    <i class="ph ph-x"></i>
                </button>
            </header>
            <div class="guide-chat-messages" role="log" aria-live="polite"></div>
            <form class="guide-chat-form">
                <input
                    class="guide-chat-input"
                    type="text"
                    maxlength="1000"
                    autocomplete="off"
                    placeholder="${t("guide.placeholder")}"
                    aria-label="Message"
                >
                <button class="guide-chat-send" type="submit" aria-label="Send">
                    <i class="ph ph-paper-plane-tilt"></i>
                </button>
            </form>
        </section>
    `;
}

function bindGuideEvents(root) {
    root.querySelector(".guide-chat-toggle")?.addEventListener("click", () => {
        setGuideOpen(root, !root.classList.contains("is-open"));
    });
    root.querySelector(".guide-chat-close")?.addEventListener("click", () => {
        setGuideOpen(root, false);
    });
    root.querySelector(".guide-chat-form")?.addEventListener("submit", (event) => {
        void handleGuideSubmit(root, event);
    });
}

async function handleGuideSubmit(root, event) {
    event.preventDefault();
    if (isSending) return;

    const input = root.querySelector(".guide-chat-input");
    const message = input?.value.trim();
    if (!message) return;

    addGuideMessage(root, "user", message);
    input.value = "";

    if (!auth?.currentUser) {
        showToast(t("guide.needLogin"));
        addGuideMessage(root, "assistant", t("guide.needLoginLong"));
        return;
    }

    if (!guideCallable) {
        addGuideMessage(root, "assistant", t("guide.noFunctions"));
        return;
    }

    setSending(root, true);
    const thinking = addGuideMessage(root, "assistant", "", true);

    try {
        const currentLang = getCurrentLanguage();
        const result = await guideCallable({
            message: currentLang === "en" ? `${message} (Please reply in English)` : message,
            language: currentLang,
            currentScene: buildCurrentScenePayload(),
            progress: {
                currentStep: state.currentStep,
                unlockedStep: state.unlockedStep,
            },
        });
        thinking.textContent = result.data?.reply || t("guide.noReply");
    } catch (error) {
        console.error("Guide chat error:", error);
        thinking.textContent = t("guide.error");
    } finally {
        setSending(root, false);
    }
}

function buildCurrentScenePayload() {
    const scene = route[state.currentStep] || route[0];
    if (!scene) return null;

    return {
        id: scene.id,
        zone: scene.zone,
        zoneName: getSceneText(scene, "zoneName"),
        title: getSceneText(scene, "title"),
        shortTitle: getSceneText(scene, "shortTitle"),
        chapter: getSceneText(scene, "chapter"),
        body: getSceneText(scene, "body"),
        mission: getSceneText(scene, "mission"),
        notes: getSceneText(scene, "notes"),
    };
}

function setGuideOpen(root, isOpen) {
    root.classList.toggle("is-open", isOpen);
    root.querySelector(".guide-chat-toggle")?.setAttribute("aria-expanded", String(isOpen));
    root.querySelector(".guide-chat-panel")?.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
        root.querySelector(".guide-chat-input")?.focus();
    }
}

function addGuideMessage(root, role, text, isSkeleton = false) {
    const list = root.querySelector(".guide-chat-messages");
    const bubble = document.createElement("div");
    bubble.className = `guide-chat-message ${role}`;
    
    if (isSkeleton) {
        bubble.innerHTML = `
            <div class="guide-chat-skeleton">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
    } else {
        bubble.textContent = text;
    }

    list?.appendChild(bubble);
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    return bubble;
}

function setSending(root, sending) {
    isSending = sending;
    const input = root.querySelector(".guide-chat-input");
    const button = root.querySelector(".guide-chat-send");
    if (input) input.disabled = sending;
    if (button) button.disabled = sending;
}
