// analytics.js — безпечний трекер для Plausible
(() => {
    "use strict";

    window.track = function track(eventName, props = null) {
        if (typeof window.plausible !== "function") return;
        try {
            window.plausible(eventName, props ? { props } : undefined);
        } catch (_) {}
    };
})();
