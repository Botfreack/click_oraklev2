// stories-loader.js — з пагінацією та закладками
(() => {
    "use strict";

    const STORY_FILES = [
        'story-001.txt',
        'story-002.txt',
        'story-003.txt',
    ];

    const CHARS_PER_PAGE = 1500;

    window.STORIES = {};
    let currentPage = 0;
    let totalPages = 0;
    let currentPages = [];
    let currentStoryId = null;

    // Закладки в localStorage
    function saveBookmark(storyId, page) {
        localStorage.setItem(`bookmark_${storyId}`, page);
    }

    function getBookmark(storyId) {
        const saved = localStorage.getItem(`bookmark_${storyId}`);
        return saved ? parseInt(saved) : null;
    }

    function removeBookmark(storyId) {
        localStorage.removeItem(`bookmark_${storyId}`);
    }

    function parseStory(text) {
        const lines = text.split('\n');
        const metadata = {};
        let contentStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '---') {
                contentStart = i + 1;
                break;
            }

            if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                metadata[key.trim().toLowerCase()] = valueParts.join(':').trim();
            }
        }

        const content = lines.slice(contentStart).join('\n').trim();

        return {
            title: metadata.title || 'Без назви',
            author: metadata.author || 'Невідомий автор',
            date: metadata.date || '2026-01-01',
            text: content
        };
    }

    async function loadStory(filename) {
        try {
            const response = await fetch(`./data/${filename}`);
            if (!response.ok) throw new Error(`Не вдалося завантажити ${filename}`);

            const text = await response.text();
            const story = parseStory(text);

            window.STORIES[story.date] = story;
        } catch (error) {
            console.error(`Помилка завантаження ${filename}:`, error);
        }
    }

    async function loadAllStories() {
        await Promise.all(STORY_FILES.map(file => loadStory(file)));
        displayStories();
    }

    function getPreview(text, chars = 200) {
        const cleaned = text.trim();
        return cleaned.length > chars ? cleaned.substring(0, chars) + '...' : cleaned;
    }

    function paginateText(text) {
        const pages = [];
        const paragraphs = text.split('\n\n');
        let currentPageText = '';

        for (const paragraph of paragraphs) {
            if ((currentPageText + paragraph).length > CHARS_PER_PAGE && currentPageText.length > 0) {
                pages.push(currentPageText.trim());
                currentPageText = paragraph + '\n\n';
            } else {
                currentPageText += paragraph + '\n\n';
            }
        }

        if (currentPageText.trim()) {
            pages.push(currentPageText.trim());
        }

        return pages.length > 0 ? pages : [text];
    }

    function createStoryCard(date, story) {
        const preview = getPreview(story.text);

        const [year, month, day] = date.split('-');
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'storyCard';
        card.innerHTML = `
            <div class="storyCard__date">${formattedDate}</div>
            <h3 class="storyCard__title">${story.title}</h3>
            <p class="storyCard__author">${story.author}</p>
            <div class="storyCard__preview">${preview}</div>
            <button class="storyCard__readMore" data-story-id="${date}" data-full-text="${encodeURIComponent(story.text)}" data-title="${story.title}" data-author="${story.author}">
                Читати повністю
            </button>
        `;

        return card;
    }

    function displayStories() {
        const grid = document.querySelector('.storiesGrid');
        if (!grid) return;

        grid.innerHTML = '';
        const dates = Object.keys(window.STORIES || {}).sort().reverse();

        if (dates.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: rgba(255,246,234,.7);">Оповідань поки немає...</p>';
            return;
        }

        dates.forEach(date => {
            const story = window.STORIES[date];
            const card = createStoryCard(date, story);
            grid.appendChild(card);
        });

        setupReadMoreButtons();

        // ✅ АВТОВІДКРИТТЯ з головної сторінки
        const openStoryId = localStorage.getItem('openStoryOnLoad');

        if (openStoryId && window.STORIES[openStoryId]) {
            localStorage.removeItem('openStoryOnLoad');

            const story = window.STORIES[openStoryId];

            openStoryModal(
                openStoryId,
                story.text,
                story.title,
                story.author
            );
        }
    }


    function setupReadMoreButtons() {
        const buttons = document.querySelectorAll('.storyCard__readMore');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyId = e.target.dataset.storyId;
                const fullText = decodeURIComponent(e.target.dataset.fullText);
                const title = e.target.dataset.title;
                const author = e.target.dataset.author;
                openStoryModal(storyId, fullText, title, author);
            });
        });
    }

    function openStoryModal(storyId, text, title, author) {
        currentStoryId = storyId;
        let modal = document.getElementById('storyModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'storyModal';
            modal.className = 'storyModal';
            modal.innerHTML = `
                <div class="storyModalCard">
                    <div class="storyModalHeader">
                        <h2 class="storyModalTitle"></h2>
                        <p class="storyModalAuthor"></p>
                    </div>
                    <div class="storyModalContent" id="storyModalContent"></div>
                    <div class="storyModalFooter">
                        <button class="storyBookmark" id="bookmarkBtn" title="Зберегти закладку">
                            🔖 Закладка
                        </button>
                        <div class="storyPagination">
                            <button class="storyPageBtn" id="prevPage" aria-label="Попередня сторінка">‹</button>
                            <span class="storyPageInfo" id="pageInfo"></span>
                            <button class="storyPageBtn" id="nextPage" aria-label="Наступна сторінка">›</button>
                        </div>
                        <button class="storyModalClose" id="closeStory">Закрити</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('closeStory').addEventListener('click', () => {
                modal.classList.remove('isOpen');
            });

            document.getElementById('bookmarkBtn').addEventListener('click', () => {
                saveBookmark(currentStoryId, currentPage);
                showBookmarkNotification();
            });

            document.getElementById('prevPage').addEventListener('click', () => {
                if (currentPage > 0) {
                    currentPage--;
                    updatePage();
                }
            });

            document.getElementById('nextPage').addEventListener('click', () => {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    updatePage();
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('isOpen');
            });

            document.addEventListener('keydown', (e) => {
                if (!modal.classList.contains('isOpen')) return;

                if (e.key === 'Escape') {
                    modal.classList.remove('isOpen');
                } else if (e.key === 'ArrowLeft' && currentPage > 0) {
                    currentPage--;
                    updatePage();
                } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
                    currentPage++;
                    updatePage();
                } else if (e.key === 'b' || e.key === 'B') {
                    // Швидка клавіша B для закладки
                    saveBookmark(currentStoryId, currentPage);
                    showBookmarkNotification();
                }
            });
        }

        modal.querySelector('.storyModalTitle').textContent = title;
        modal.querySelector('.storyModalAuthor').textContent = author;

        currentPages = paginateText(text);
        totalPages = currentPages.length;

        // Перевіряємо чи є закладка
        const savedPage = getBookmark(storyId);
        if (savedPage !== null && savedPage > 0) {
            showBookmarkPrompt(savedPage);
        } else {
            currentPage = 0;
        }

        const content = document.getElementById('storyModalContent');
        content.innerHTML = currentPages.map((pageText, index) => `
            <div class="storyModalPage ${index === currentPage ? 'active' : ''}" data-page="${index}">
                <div class="storyModalText">${pageText}</div>
            </div>
        `).join('');

        updatePage();
        modal.classList.add('isOpen');
    }

    function showBookmarkPrompt(savedPage) {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'bookmarkPrompt';
        promptDiv.innerHTML = `
            <div class="bookmarkPromptCard">
                <p>Ви зупинились на сторінці ${savedPage + 1}</p>
                <div class="bookmarkPromptActions">
                    <button class="bookmarkPromptBtn" id="continueReading">Продовжити</button>
                    <button class="bookmarkPromptBtn bookmarkPromptBtn--secondary" id="startOver">Почати спочатку</button>
                </div>
            </div>
        `;
        document.body.appendChild(promptDiv);

        setTimeout(() => promptDiv.classList.add('show'), 10);

        document.getElementById('continueReading').addEventListener('click', () => {
            currentPage = savedPage;
            promptDiv.remove();
        });

        document.getElementById('startOver').addEventListener('click', () => {
            currentPage = 0;
            removeBookmark(currentStoryId);
            promptDiv.remove();
        });
    }

    function showBookmarkNotification() {
        const notification = document.createElement('div');
        notification.className = 'bookmarkNotification';
        notification.textContent = `🔖 Закладка збережена (сторінка ${currentPage + 1})`;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    function updatePage() {
        document.querySelectorAll('.storyModalPage').forEach((page, index) => {
            page.classList.toggle('active', index === currentPage);
        });

        document.getElementById('pageInfo').textContent = `${currentPage + 1} / ${totalPages}`;

        document.getElementById('prevPage').disabled = currentPage === 0;
        document.getElementById('nextPage').disabled = currentPage === totalPages - 1;

        document.getElementById('storyModalContent').scrollTop = 0;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllStories);
    } else {
        loadAllStories();
    }
})();
