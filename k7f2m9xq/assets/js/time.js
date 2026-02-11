// time.js — дата/час
(() => {
    "use strict";

    const dateEl = document.getElementById("metaDate");
    const timeEl = document.getElementById("metaTime");

    function formatDateUA(d){
        const months = [
            "січня","лютого","березня","квітня","травня","червня",
            "липня","серпня","вересня","жовтня","листопада","грудня"
        ];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} р.`;
    }

    function formatTime(d){
        return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    }

    function tick(){
        const now = new Date();
        if (dateEl) dateEl.textContent = formatDateUA(now);
        if (timeEl) timeEl.textContent = formatTime(now);
    }

    tick();
    setInterval(tick, 1000);
})();
