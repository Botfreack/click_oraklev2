// poem-of-day.js — рандомний вірш дня
(() => {
    "use strict";

    let todayPoem = null;

    // Функція для отримання автора
    function extractAuthor(text) {
        const match = text.match(/\(([^)]+)\)$/);
        return match ? match[1].trim() : "Невідомий автор";
    }

    // Вибір рандомного вірша (зберігається на день)
    function getTodayPoem() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('poemOfDayDate');
        const savedPoem = localStorage.getItem('poemOfDayData');

        // Якщо вже вибирали сьогодні — повертаємо збережений
        if (savedDate === today && savedPoem) {
            return JSON.parse(savedPoem);
        }

        // Інакше вибираємо новий рандомний
        const dates = Object.keys(window.POEMS || {});
        if (dates.length === 0) return null;

        const randomDate = dates[Math.floor(Math.random() * dates.length)];
        const poem = window.POEMS[randomDate];

        const poemData = {
            date: randomDate,
            ...poem
        };

        // Зберігаємо в localStorage
        localStorage.setItem('poemOfDayDate', today);
        localStorage.setItem('poemOfDayData', JSON.stringify(poemData));

        return poemData;
    }

    // Відображення вірша (тільки превью - перші 8 рядків)
    function displayTodayPoem() {
        todayPoem = getTodayPoem();

        if (!todayPoem) {
            document.getElementById('poemBody').textContent = 'Вірші завантажуються...';
            return;
        }

        const author = extractAuthor(todayPoem.text);
        const fullText = todayPoem.text.replace(/\([^)]+\)$/, '').trim();

        // ✅ Показуємо весь текст (не превью)
        document.getElementById('poemAuthor').textContent = author;
        document.getElementById('poemBody').textContent = fullText;
    }

    // ✅ Модальне вікно для повного вірша
    function openPoemModal() {
        if (!todayPoem) return;

        const author = extractAuthor(todayPoem.text);
        const fullText = todayPoem.text.replace(/\([^)]+\)$/, '').trim();

        let modal = document.getElementById('poemFullModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'poemFullModal';
            modal.className = 'oracleModal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="oracleCard" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                    <h3 class="poemModalAuthor" style="font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 20px; text-align: left;"></h3>
                    <div class="poemModalText" style="font-family: 'Marck Script', cursive; font-size: 19px; line-height: 1.7; white-space: pre-line; margin-bottom: 24px; text-align: center;"></div>
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

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('isOpen')) {
                    modal.classList.remove('isOpen');
                    modal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        modal.querySelector('.poemModalAuthor').textContent = author;
        modal.querySelector('.poemModalText').textContent = fullText;
        modal.classList.add('isOpen');
        modal.setAttribute('aria-hidden', 'false');
    }

    // ✅ Обробники подій
    function setupEventListeners() {
        const readBtn = document.getElementById('readFullPoem');
        if (readBtn) {
            readBtn.addEventListener('click', openPoemModal);
        }
    }

    // Ініціалізація
    function init() {
        displayTodayPoem();
        setupEventListeners(); // ✅ Додаємо обробник
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();