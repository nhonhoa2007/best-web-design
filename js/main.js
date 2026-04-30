import { auth, onAuthStateChanged } from "./firebase.js";
import { setupAuthUI } from "./auth.js";
import { hydrateProgressFromFirebase, hydrateState } from "./state.js";
import { bindControls, preloadPanoramas, renderAvatarOptions, renderResumeButton } from "./tour.js";

document.addEventListener("DOMContentLoaded", () => {
    setupAuthUI();

    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                document.getElementById("auth-screen")?.classList.add("hidden");

                if (document.getElementById("tour-app")?.classList.contains("hidden")) {
                    document.getElementById("avatar-screen")?.classList.remove("hidden");
                }

                await bootTourShell(user);
            } else {
                document.getElementById("auth-screen")?.classList.remove("hidden");
                document.getElementById("avatar-screen")?.classList.add("hidden");
                document.getElementById("tour-app")?.classList.add("hidden");
            }
        });
    } else {
        bootTourShell();
    }
});

async function bootTourShell(user = null) {
    if (user) {
        await hydrateProgressFromFirebase(user);
    } else {
        hydrateState();
    }

    renderAvatarOptions();
    bindControls();
    renderResumeButton();
    preloadPanoramas();
}
