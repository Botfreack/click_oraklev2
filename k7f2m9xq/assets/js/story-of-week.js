// story-of-week.js — оповідання тижня з переходом на сторінку
(() => {
    "use strict";

    let weekStory = null;

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function parseStory(text) {
        const lines = text.split("\n");
        const metadata = {};
        let contentStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === "---") {
                contentStart = i + 1;
                break;
            }

            if (line.includes(":")) {
                const [key, ...valueParts] = line.split(":");
                metadata[key.trim().toLowerCase()] = valueParts.join(":").trim();
            }
        }

        const content = lines.slice(contentStart).join("\n").trim();

        return {
            title: metadata.title || "Без назви",
            author: metadata.author || "Невідомий автор",
            date: metadata.date || "2026-01-01",
            text: content,
        };
    }

    async function loadStoriesOnce() {
        if (window.STORIES) return;

        const STORY_FILES = ["story-001.txt", "story-002.txt"];
        window.STORIES = {};

        for (const file of STORY_FILES) {
            try {
                const response = await fetch(`./stories/data/${file}`);
                if (!response.ok) continue;

                const text = await response.text();
                const story = parseStory(text);
                window.STORIES[story.date] = story;
            } catch (err) {
                console.error(`Помилка завантаження ${file}:`, err);
            }
        }
    }

    // 🔥 ОНОВЛЕНА ФУНКЦІЯ БЕЗ ПОВТОРІВ
    async function getWeekStory() {
        const today = new Date();
        const weekNumber = getWeekNumber(today);
        const year = today.getFullYear();
        const weekKey = `${year}-W${weekNumber}`;

        const savedWeek = localStorage.getItem("storyOfWeekKey");
        const savedStory = localStorage.getItem("storyOfWeekData");
        const lastStoryId = localStorage.getItem("lastWeekStoryId");

        // Якщо той самий тиждень — повертаємо збережене
        if (savedWeek === weekKey && savedStory) {
            try {
                return JSON.parse(savedStory);
            } catch (_) {}
        }

        await loadStoriesOnce();

        const dates = Object.keys(window.STORIES || {});
        if (dates.length === 0) return null;

        let availableDates = [...dates];

        // Якщо більше 1 історії — прибираємо минулу
        if (availableDates.length > 1 && lastStoryId) {
            availableDates = availableDates.filter(date => date !== lastStoryId);
        }

        const randomDate =
            availableDates[Math.floor(Math.random() * availableDates.length)];

        const story = window.STORIES[randomDate];

        const storyData = {
            date: randomDate,
            ...story,
        };

        // Зберігаємо нові значення
        localStorage.setItem("storyOfWeekKey", weekKey);
        localStorage.setItem("storyOfWeekData", JSON.stringify(storyData));
        localStorage.setItem("lastWeekStoryId", randomDate);

        return storyData;
    }

    function getPreview(text, chars = 300) {
        const cleaned = (text || "").trim();
        return cleaned.length > chars ? cleaned.slice(0, chars) + "..." : cleaned;
    }

    async function displayWeekStory() {
        weekStory = await getWeekStory();

        const bodyEl = document.getElementById("storyBody");
        const authorEl = document.getElementById("storyAuthor");

        if (!bodyEl) return;

        if (!weekStory) {
            bodyEl.textContent = "Оповідань поки немає...";
            if (authorEl) authorEl.textContent = "";
            return;
        }

        const preview = getPreview(weekStory.text);

        if (authorEl) authorEl.textContent = weekStory.author || "";
        bodyEl.textContent = preview;
    }

    function setupEventListeners() {
        const readBtn = document.getElementById("readFullStory");
        if (!readBtn) return;

        readBtn.addEventListener("click", () => {
            if (!weekStory) return;

            localStorage.setItem("openStoryOnLoad", weekStory.date);
            window.location.href = "/stories/";
        });
    }

    async function init() {
        await displayWeekStory();
        setupEventListeners();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
