// poetry-display.js — відображення віршів у блоках
(() => {
    "use strict";

    // Функція для отримання автора з тексту вірша
    function extractAuthor(text) {
        const match = text.match(/\(([^)]+)\)$/);
        return match ? match[1].trim() : "Невідомий автор";
    }

    // Функція для отримання перших 4-6 рядків
    function getPreview(text, lines = 6) {
        const cleaned = text.replace(/\([^)]+\)$/, '').trim();
        const allLines = cleaned.split('\n').filter(line => line.trim());
        const preview = allLines.slice(0, lines).join('\n');
        return preview;
    }

    // Функція для створення картки вірша
    function createPoemCard(date, poem) {
        const author = extractAuthor(poem.text);
        const preview = getPreview(poem.text);
        const fullText = poem.text.replace(/\([^)]+\)$/, '').trim();

        const [year, month, day] = date.split('-');
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'poetryCard';
        card.innerHTML = `
            <div class="poetryCard__date">${formattedDate}</div>
            <h3 class="poetryCard__title">${author}</h3>
            <div class="poetryCard__preview" style="font-family: 'Marck Script', 'Bad Script', cursive; font-size: 18px; letter-spacing: 0.03em;">${preview}</div>
            <button class="poetryCard__readMore" data-full-text="${encodeURIComponent(fullText)}" data-author="${author}">
                Читати повністю
            </button>
        `;

        return card;
    }

    // Функція для відображення всіх віршів
    function displayPoems() {
        const grid = document.querySelector('.poetryGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const dates = Object.keys(window.POEMS || {}).sort().reverse();

        dates.forEach(date => {
            const poem = window.POEMS[date];
            const card = createPoemCard(date, poem);
            grid.appendChild(card);
        });

        setupReadMoreButtons();
    }

    // Функція для налаштування кнопок
    function setupReadMoreButtons() {
        const buttons = document.querySelectorAll('.poetryCard__readMore');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fullText = decodeURIComponent(e.target.dataset.fullText);
                const author = e.target.dataset.author;
                openPoemModal(fullText, author);
            });
        });
    }

    // Функція для відкриття модального вікна
    function openPoemModal(text, author) {
        let modal = document.getElementById('poemModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'poemModal';
            modal.className = 'poemModal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="poemModalCard" role="dialog" aria-modal="true">
                    <div class="poemModalHeader">
                        <h2 class="poemModalAuthor">${author}</h2>
                        <button class="poemModalClose" type="button">✕</button>
                    </div>
                    <div class="poemModalText" style="font-family: 'Marck Script', 'Bad Script', cursive; font-size: 20px; letter-spacing: 0.03em;">${text}</div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('.poemModalClose');
            closeBtn.addEventListener('click', closePoemModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closePoemModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
                    closePoemModal();
                }
            });
        } else {
            // Оновлюємо контент
            modal.querySelector('.poemModalAuthor').textContent = author;
            const textDiv = modal.querySelector('.poemModalText');
            textDiv.textContent = text;
            textDiv.style.fontFamily = "'Marck Script', 'Bad Script', cursive";
            textDiv.style.fontSize = "20px";
            textDiv.style.letterSpacing = "0.03em";
        }

        modal.classList.add('isOpen');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    // Функція для закриття модального вікна
    function closePoemModal() {
        const modal = document.getElementById('poemModal');
        if (modal) {
            modal.classList.remove('isOpen');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    // Ініціалізація
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayPoems);
    } else {
        displayPoems();
    }
})();