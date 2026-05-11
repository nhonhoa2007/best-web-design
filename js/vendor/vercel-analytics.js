const SCRIPT_ID = "vercel-analytics-script";

function ensureQueue() {
    window.va = window.va || function (...args) {
        window.vaq = window.vaq || [];
        window.vaq.push(args);
    };
}

export function inject() {
    ensureQueue();

    if (document.getElementById(SCRIPT_ID)) {
        return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.id = SCRIPT_ID;
    script.src = "/_vercel/insights/script.js";
    document.head.append(script);
}

export function track(name, properties) {
    ensureQueue();
    window.va("event", { name, data: properties });
}

export default {
    inject,
    track
};
