// poems.js — показує “вірш цього дня” по даті
(() => {
    "use strict";

    const poemBody = document.getElementById("poemBody");
    const poemDate = document.getElementById("poemDate");

    function toKey(d){
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,"0");
        const day = String(d.getDate()).padStart(2,"0");
        return `${y}-${m}-${day}`;
    }

    function render(){
        const key = toKey(new Date());
        const poems = window.POEMS || {};
        const item = poems[key] || window.POEM_FALLBACK;

        if (poemDate) poemDate.textContent = key;
        if (poemBody) poemBody.textContent = item?.text || "";
    }

    document.addEventListener("DOMContentLoaded", render);
})();
