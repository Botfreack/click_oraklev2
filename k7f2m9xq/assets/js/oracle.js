// oracle.js — передбачення + модалка + анімація рядків
(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    function pickOracleLines(){
        const arr = window.ORACLES;
        if (!Array.isArray(arr) || !arr.length) return ["Сьогодні буде гарний день ✨"];

        const choice = arr[Math.floor(Math.random() * arr.length)];
        if (!Array.isArray(choice)) return ["Сьогодні буде гарний день ✨"];

        return choice
            .filter(t => typeof t === "string")
            .map(t => t.trim())
            .filter(Boolean);
    }

    function renderOracleText(lines){
        const el = $("oracleText");
        if (!el) return;

        el.innerHTML = "";
        lines.forEach((text, i) => {
            const span = document.createElement("span");
            span.className = "line";
            span.textContent = text;
            span.style.setProperty("--d", `${i * 140}ms`);
            el.appendChild(span);
        });
    }

    function openOracle(){
        const modal = $("oracleModal");
        const btn = $("oracleBtn");
        if (!modal) return;

        // вимикаємо pulse після першого кліку (якщо ти його додаси у CSS)
        btn?.classList.add("used");

        renderOracleText(pickOracleLines());
        void $("oracleText")?.offsetWidth; // перезапуск анімації

        modal.classList.add("isOpen");
        modal.setAttribute("aria-hidden", "false");

        window.track?.("oracle_open", { page: location.pathname });
    }

    function closeOracle(){
        const modal = $("oracleModal");
        if (!modal) return;

        modal.classList.remove("isOpen");
        modal.setAttribute("aria-hidden", "true");

        window.track?.("oracle_close", { page: location.pathname });
    }

    document.addEventListener("DOMContentLoaded", () => {
        $("oracleBtn")?.addEventListener("click", openOracle);
        $("oracleClose")?.addEventListener("click", closeOracle);

        $("oracleModal")?.addEventListener("click", (e) => {
            if (e.target === $("oracleModal")) closeOracle();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeOracle();
        });

        // меню теж може викликати передбачення
        document.addEventListener("oracle:open", openOracle);
    });
})();
