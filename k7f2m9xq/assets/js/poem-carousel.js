// poem-carousel.js — карусель віршів
(() => {
    "use strict";

    let currentSlide = 0;
    let autoplayInterval = null;
    let poems = [];

    // Функція для отримання автора
    function extractAuthor(text) {
        const match = text.match(/\(([^)]+)\)$/);
        return match ? match[1].trim() : "Невідомий автор";
    }

    // Функція для отримання перших 4-5 рядків
    function getPreview(text, lines = 5) {
        const cleaned = text.replace(/\([^)]+\)$/, '').trim();
        const allLines = cleaned.split('\n').filter(line => line.trim());
        const preview = allLines.slice(0, lines).join('\n');
        return preview + (allLines.length > lines ? '...' : '');
    }

    // Ініціалізація каруселі
    function initCarousel() {
        if (!window.POEMS) return;

        // Отримуємо останні 5 віршів
        const dates = Object.keys(window.POEMS).sort().reverse().slice(0, 5);
        poems = dates.map(date => ({
            date,
            ...window.POEMS[date]
        }));

        renderSlides();
        renderDots();
        setupNavigation();
        startAutoplay();
    }

    // Рендер слайдів
    function renderSlides() {
        const track = document.getElementById('poemTrack');
        if (!track) return;

        track.innerHTML = poems.map((poem, index) => {
            const author = extractAuthor(poem.text);
            const preview = getPreview(poem.text);
            const fullText = encodeURIComponent(poem.text.replace(/\([^)]+\)$/, '').trim());

            return `
                <div class="poemCarousel__slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <div class="poemSlide__author">${author}</div>
                    <div class="poemSlide__text">${preview}</div>
                    <div class="poemSlide__actions">
                        <button class="poemSlide__btn" data-action="read" data-text="${fullText}" data-author="${author}">
                            Читати повністю
                        </button>
                        <a href="./poetry/" class="poemSlide__btn">
                            До всіх віршів →
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // Додаємо обробники для кнопок "Читати повністю"
        track.querySelectorAll('[data-action="read"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = decodeURIComponent(e.target.dataset.text);
                const author = e.target.dataset.author;
                openPoemModal(text, author);
            });
        });
    }

    // Рендер точок
    function renderDots() {
        const dotsContainer = document.getElementById('poemDots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = poems.map((_, index) => `
            <button class="poemDot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Вірш ${index + 1}"></button>
        `).join('');

        dotsContainer.querySelectorAll('.poemDot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                goToSlide(index);
                stopAutoplay(); // Зупиняємо автоплей при ручному свайпі
            });
        });
    }

    // Навігація
    function setupNavigation() {
        const prevBtn = document.getElementById('poemPrev');
        const nextBtn = document.getElementById('poemNext');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(currentSlide - 1);
                stopAutoplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToSlide(currentSlide + 1);
                stopAutoplay();
            });
        }

        // Touch swipe
        const track = document.getElementById('poemTrack');
        if (track) {
            let touchStartX = 0;
            let touchEndX = 0;

            track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });

            track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });

            function handleSwipe() {
                if (touchEndX < touchStartX - 50) {
                    goToSlide(currentSlide + 1);
                    stopAutoplay();
                }
                if (touchEndX > touchStartX + 50) {
                    goToSlide(currentSlide - 1);
                    stopAutoplay();
                }
            }
        }
    }

    // Перехід до слайду
    function goToSlide(index) {
        if (index < 0) index = poems.length - 1;
        if (index >= poems.length) index = 0;

        currentSlide = index;

        // Оновлюємо слайди
        document.querySelectorAll('.poemCarousel__slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        // Оновлюємо точки
        document.querySelectorAll('.poemDot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // Автоплей
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 3000);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    // Модальне вікно (спрощена версія)
    function openPoemModal(text, author) {
        let modal = document.getElementById('poemFullModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'poemFullModal';
            modal.className = 'oracleModal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="oracleCard" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                    <h3 class="poemModalAuthor" style="font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 20px;"></h3>
                    <div class="poemModalText" style="font-family: 'Marck Script', cursive; font-size: 19px; line-height: 1.7; white-space: pre-line; margin-bottom: 24px;"></div>
                    <button class="oracleClose" id="poemFullClose" type="button">Закрити</button>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#poemFullClose').addEventListener('click', () => {
                modal.classList.remove('isOpen');
                modal.setAttribute('aria-hidden', 'true');
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('isOpen');
                    modal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        modal.querySelector('.poemModalAuthor').textContent = author;
        modal.querySelector('.poemModalText').textContent = text;
        modal.classList.add('isOpen');
        modal.setAttribute('aria-hidden', 'false');
    }

    // Ініціалізація
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousel);
    } else {
        initCarousel();
    }
})();