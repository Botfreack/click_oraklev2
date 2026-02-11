// app.js — точка зборки (поки пустий, але залишаємо під майбутнє)
(() => {
    "use strict";
    // Тут потім легко додати “все загальне”
})();
// ===============================
// Player: зсув контенту під плеєр
// ===============================
(function () {
    const root = document.documentElement;
    const playerWrap = document.getElementById("playerWrap");
    const main = document.querySelector("main.content");

    if (!playerWrap || !main) return;

    let rafId = 0;
    let lastPush = -1;

    function measureAndApply() {
        rafId = 0;

        const isOpen = !playerWrap.hasAttribute("hidden");
        if (!isOpen) {
            if (lastPush !== 0) {
                root.style.setProperty("--player-push", "0px");
                lastPush = 0;
            }
            return;
        }

        const playerRect = playerWrap.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();

        // мінімальний потрібний зсув + 12px “повітря”
        const need = Math.max(0, Math.round((playerRect.bottom + 0) - mainRect.top));

        // анти-дрижання: не оновлюємо, якщо зміна менше 2px
        if (Math.abs(need - lastPush) < 2) return;

        root.style.setProperty("--player-push", need + "px");
        lastPush = need;
    }

    function scheduleMeasure() {
        if (rafId) return;
        rafId = requestAnimationFrame(measureAndApply);
    }

    // стабілізація після відкриття: кілька кадрів, і все
    function stabilizeAfterOpen() {
        let frames = 0;
        function tick() {
            scheduleMeasure();
            frames += 1;
            if (frames < 6) requestAnimationFrame(tick); // ~6 кадрів
        }
        requestAnimationFrame(tick);
    }

    // стартові події
    window.addEventListener("DOMContentLoaded", scheduleMeasure);
    window.addEventListener("load", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure);

    // коли відкрили/закрили плеєр (hidden)
    const mo = new MutationObserver(() => {
        scheduleMeasure();
        if (!playerWrap.hasAttribute("hidden")) stabilizeAfterOpen();
    });
    mo.observe(playerWrap, { attributes: true, attributeFilter: ["hidden"] });
})();
