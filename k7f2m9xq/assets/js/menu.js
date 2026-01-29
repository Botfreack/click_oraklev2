// menu.js — меню “Щось глибше” + музика + запуск плейлистів + overlay blur
(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    // ✅ ЗАМІНИ тут ID плейлистів на свої
    const PLAYLISTS = {
        morning: {
            title: "Ранковий вайб",
            src: "https://www.youtube.com/embed/videoseries?list=PLxxxxxxxxxxxxxxxxxxxx"
        },
        day: {
            title: "Вайб на день",
            src: "https://www.youtube.com/embed/videoseries?list=PLyyyyyyyyyyyyyyyyyyyy"
        },
        night: {
            title: "Нічний вайб",
            src: "https://www.youtube.com/embed/videoseries?list=PLzzzzzzzzzzzzzzzzzzzz"
        }
    };

    // =========================
    // Стан / елементи
    // =========================
    function getEls() {
        return {
            menuBtn: $("menuBtn"),
            menu: $("menu"),
            overlay: $("menuOverlay"),
            menuOracle: $("menuOracle"),
            menuMusic: $("menuMusic"),
            submenu: $("submenuMusic"),
            playerWrap: $("playerWrap"),
            playerIframe: $("playerIframe"),
            playerTitle: $("playerTitle"),
            playerClose: $("playerClose"),
        };
    }

    // =========================
    // Відкриття / закриття меню + overlay
    // =========================
    function openMenu() {
        const { menuBtn, menu, overlay } = getEls();
        if (!menuBtn || !menu) return;

        document.body.classList.add("menuOpen");

        menu.classList.add("isOpen");
        menu.setAttribute("aria-hidden", "false");
        menuBtn.setAttribute("aria-expanded", "true");

        if (overlay) {
            overlay.classList.add("isOpen");
            overlay.setAttribute("aria-hidden", "false");
        }

        window.track?.("menu_open", { page: location.pathname });
    }

    function closeMenu({ focusBtn = true } = {}) {
        const { menuBtn, menu, overlay } = getEls();
        if (!menuBtn || !menu) return;

        // ⚠️ ВАЖЛИВО: перед aria-hidden ховаємо фокус з меню, щоб не було warning про focus + aria-hidden
        if (focusBtn) menuBtn.focus();

        document.body.classList.remove("menuOpen");

        menu.classList.remove("isOpen");
        menu.setAttribute("aria-hidden", "true");
        menuBtn.setAttribute("aria-expanded", "false");

        if (overlay) {
            overlay.classList.remove("isOpen");
            overlay.setAttribute("aria-hidden", "true");
        }

        closeSubmenu();
        window.track?.("menu_close", { page: location.pathname });
    }

    function toggleMenu() {
        const { menu } = getEls();
        if (!menu) return;
        menu.classList.contains("isOpen") ? closeMenu() : openMenu();
    }

    // =========================
    // Підменю музики
    // =========================
    function openSubmenu() {
        const { submenu, menuMusic } = getEls();
        if (!submenu || !menuMusic) return;

        submenu.classList.add("isOpen");
        submenu.setAttribute("aria-hidden", "false");
        menuMusic.setAttribute("aria-expanded", "true");
    }

    function closeSubmenu() {
        const { submenu, menuMusic } = getEls();
        if (!submenu || !menuMusic) return;

        submenu.classList.remove("isOpen");
        submenu.setAttribute("aria-hidden", "true");
        menuMusic.setAttribute("aria-expanded", "false");
    }

    function toggleSubmenu() {
        const { submenu } = getEls();
        if (!submenu) return;
        submenu.classList.contains("isOpen") ? closeSubmenu() : openSubmenu();
    }

    // =========================
    // Плеєр
    // =========================
    function showPlayer(kind) {
        const info = PLAYLISTS[kind];
        const { playerWrap, playerIframe, playerTitle } = getEls();
        if (!info || !playerWrap || !playerIframe || !playerTitle) return;

        playerTitle.textContent = info.title;
        playerIframe.src = info.src;

        playerWrap.hidden = false;
        window.track?.("music_open", { page: location.pathname, playlist: kind });
    }

    function hidePlayer() {
        const { playerWrap, playerIframe } = getEls();
        if (!playerWrap || !playerIframe) return;

        playerWrap.hidden = true;
        playerIframe.src = ""; // зупиняємо відтворення
        window.track?.("music_close", { page: location.pathname });
    }

    // =========================
    // INIT
    // =========================
    document.addEventListener("DOMContentLoaded", () => {
        const { menuBtn, menu, overlay, menuOracle, menuMusic, submenu, playerClose } = getEls();

        menuBtn?.addEventListener("click", (e) => {
            e.stopPropagation(); // щоб document click не закрив одразу
            toggleMenu();
        });

        // ✅ Оверлей: клік закриває меню (це той шматок, що ти питав “куди додати”)
        overlay?.addEventListener("click", () => closeMenu());

        // Пункт: передбачення
        menuOracle?.addEventListener("click", () => {
            closeMenu();
            document.dispatchEvent(new Event("oracle:open"));
            window.track?.("menu_oracle_click", { page: location.pathname });
        });

        // Пункт: музика (відкриває підменю)
        menuMusic?.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSubmenu();
            window.track?.("menu_music_toggle", { page: location.pathname });
        });

        // Плейлисти
        submenu?.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-playlist]");
            if (!btn) return;

            const kind = btn.getAttribute("data-playlist");
            closeMenu();
            showPlayer(kind);

            window.track?.("menu_playlist_click", { page: location.pathname, playlist: kind });
        });

        playerClose?.addEventListener("click", hidePlayer);

        // Клік поза меню — закриває
        document.addEventListener("click", (e) => {
            if (!menu || !menuBtn) return;

            const clickedInside = menu.contains(e.target) || menuBtn.contains(e.target);
            if (!clickedInside && menu.classList.contains("isOpen")) closeMenu({ focusBtn: false });
        });

        // ESC — закрити меню
        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            if (menu?.classList.contains("isOpen")) closeMenu();
        });
    });
})();
