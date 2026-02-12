// tarot.js — логіка гадання на Таро
(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    // Стан
    let selectedSpread = null;
    let drawnCards = [];

    // Отримати всі карти в один масив
    function getAllCards() {
        const cards = window.TAROT_CARDS;
        if (!cards) return [];

        return [
            ...cards.major,
            ...cards.cups,
            ...cards.wands,
            ...cards.swords,
            ...cards.pentacles
        ];
    }

    // Випадкові карти
    function drawRandomCards(num) {
        const allCards = getAllCards();
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, num);
    }

    // Отримати кількість карт для поточного розкладу
    function getCardsCountForSpread(spread) {
        return spread === "single" ? 1 : spread === "three" ? 3 : 10;
    }

    // Очистити UI читання (карти + тлумачення), не чіпаючи вибір розкладу
    function clearReadingUI() {
        // Сховати тлумачення
        $("tarotInterpretation")?.classList.remove("isOpen");

        // Очистити текст тлумачення
        const interp = $("tarotInterpretationContent");
        if (interp) interp.innerHTML = "";

        // Очистити карти
        const cardsBox = $("tarotCardsDisplay");
        if (cardsBox) {
            cardsBox.innerHTML = "";
            // клас контейнера виставиться заново в displayCards()
            cardsBox.className = "";
        }
    }

    // Відкрити модалку
    function openTarot() {
        const modal = $("tarotModal");
        if (!modal) return;

        modal.classList.add("isOpen");
        modal.setAttribute("aria-hidden", "false");

        window.track?.("tarot_open", { page: location.pathname });
    }

    // Закрити модалку
    function closeTarot() {
        const modal = $("tarotModal");
        if (!modal) return;

        modal.classList.remove("isOpen");
        modal.setAttribute("aria-hidden", "true");

        // Скинути стан
        resetReading();

        // Повернути на екран вибору (щоб не зависало в стані читання)
        $("tarotReading")?.classList.remove("isOpen");
        $("tarotSelection")?.classList.add("isOpen");

        // Очистити карти та тлумачення
        clearReadingUI();

        window.track?.("tarot_close", { page: location.pathname });
    }

    // Вибрати розклад
    function selectSpread(spread) {
        selectedSpread = spread;

        // Оновити UI
        document.querySelectorAll(".spreadOption").forEach(opt => {
            opt.classList.toggle("active", opt.dataset.spread === spread);
        });

        // Активувати кнопку
        const startBtn = $("tarotStartBtn");
        if (startBtn) startBtn.disabled = false;

        window.track?.("tarot_spread_select", {
            page: location.pathname,
            spread: spread
        });
    }

    // Почати гадання
    function startReading() {
        if (!selectedSpread) return;

        const numCards = getCardsCountForSpread(selectedSpread);

        // Витягнути карти
        drawnCards = drawRandomCards(numCards);

        // Сховати вибір, показати карти
        $("tarotSelection")?.classList.remove("isOpen");
        $("tarotReading")?.classList.add("isOpen");

        // Очистити попереднє (на всяк випадок)
        clearReadingUI();

        // Показати карти
        displayCards(drawnCards, selectedSpread);

        // Автоматично перевернути через 650 мс (під анімацію викладання)
        setTimeout(() => {
            flipAllCards();
            // Показати тлумачення після перевертання
            setTimeout(() => {
                showInterpretation();
            }, 900);
        }, 650);

        window.track?.("tarot_reading_start", {
            page: location.pathname,
            spread: selectedSpread
        });
    }

    // Рестарт розкладу (не виходимо з обраного режиму)
    function restartReading() {
        if (!selectedSpread) return;

        const numCards = getCardsCountForSpread(selectedSpread);

        // Очистити попереднє
        clearReadingUI();

        // Витягнути нові карти
        drawnCards = drawRandomCards(numCards);

        // Перемалювати карти у тому ж розкладі
        displayCards(drawnCards, selectedSpread);

        // Запустити перевертання
        setTimeout(() => {
            flipAllCards();
            setTimeout(() => {
                showInterpretation();
            }, 900);
        }, 650);

        window.track?.("tarot_restart_reading", {
            page: location.pathname,
            spread: selectedSpread
        });
    }

    // Показати карти
    function displayCards(cards, spread) {
        const container = $("tarotCardsDisplay");
        if (!container) return;

        container.innerHTML = "";

        // ✅ Вибрати клас контейнера (для кельтського буде хрест)
        container.className = (spread === "celtic") ? "cardsCelticCross" : "";

        cards.forEach((card, index) => {
            const slot = document.createElement("div");
            slot.className = "cardSlot";

            // ✅ Затримка для анімації викладання (CSS animation-delay)
            slot.style.animationDelay = `${index * 0.11}s`;

            // ✅ Позиція карти для CSS-розкладки (pos-1..pos-10)
            if (spread === "celtic") {
                slot.classList.add(`pos-${index + 1}`);
            }

            const cardEl = document.createElement("div");
            cardEl.className = "tarotCardFlip";
            cardEl.dataset.index = index;

            // ✅ 2-га карта в кельтському хресті — поперек (перешкода/вплив)
            if (spread === "celtic" && index === 1) {
                cardEl.classList.add("crossRotate");
            }

            const back = document.createElement("div");
            back.className = "cardFace cardBack";

            const front = document.createElement("div");
            front.className = "cardFace cardFront";

            // Зображення карти
            const img = document.createElement("img");
            img.src = window.CARD_IMAGE_BASE_URL + card.image;
            img.alt = card.name;
            img.loading = "lazy";

            front.appendChild(img);

            cardEl.appendChild(back);
            cardEl.appendChild(front);
            slot.appendChild(cardEl);

            // Підпис під карткою
            const label = document.createElement("div");
            label.className = "cardLabel";
            label.textContent = card.name;
            label.style.opacity = "0";
            slot.appendChild(label);

            container.appendChild(slot);
        });
    }

    // Перевернути всі карти (з красивою послідовністю)
    function flipAllCards() {
        const cards = document.querySelectorAll(".tarotCardFlip");

        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add("flipped");

                // Показуємо підпис ПІСЛЯ основного flip
                const label = card.parentElement?.querySelector(".cardLabel");
                if (label) {
                    label.style.transition = "opacity 420ms ease";
                    setTimeout(() => {
                        label.style.opacity = "1";
                    }, 520);
                }
            }, index * 200);
        });
    }

    // Показати тлумачення
    function showInterpretation() {
        const container = $("tarotInterpretationContent");
        if (!container) return;

        const positions = window.TAROT_POSITIONS?.[selectedSpread] || [];
        let html = "";

        // Кожна карта
        drawnCards.forEach((card, index) => {
            html += `
                <div class="cardMeaning">
                    <h4>${card.name}</h4>
                    <div class="position">${positions[index] || ""}</div>
                    <p>${card.meaning}</p>
                </div>
            `;
        });

        container.innerHTML = html;
        $("tarotInterpretation")?.classList.add("isOpen");
    }

    // Нове гадання (повертаємось на вибір розкладу)
    function newReading() {
        resetReading();

        // Очистити карти і тлумачення
        clearReadingUI();

        $("tarotReading")?.classList.remove("isOpen");
        $("tarotSelection")?.classList.add("isOpen");

        window.track?.("tarot_new_reading", { page: location.pathname });
    }

    // Скинути стан
    function resetReading() {
        selectedSpread = null;
        drawnCards = [];

        const startBtn = $("tarotStartBtn");
        if (startBtn) startBtn.disabled = true;

        $("tarotInterpretation")?.classList.remove("isOpen");

        document.querySelectorAll(".spreadOption").forEach(opt => {
            opt.classList.remove("active");
        });
    }

    // Ініціалізація
    document.addEventListener("DOMContentLoaded", () => {
        // Відкрити з меню
        document.addEventListener("tarot:open", openTarot);

        // Закрити модалку
        $("tarotCloseBtn")?.addEventListener("click", closeTarot);

        // Нове гадання (назад до вибору)
        $("tarotNewBtn")?.addEventListener("click", newReading);

        // Рестарт розкладу (нові карти, але лишаємось у режимі)
        $("tarotRestartBtn")?.addEventListener("click", restartReading);

        // Клік поза модалкою
        $("tarotModal")?.addEventListener("click", (e) => {
            if (e.target === $("tarotModal")) closeTarot();
        });

        // ESC
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && $("tarotModal")?.classList.contains("isOpen")) {
                closeTarot();
            }
        });

        // Вибір розкладу
        document.querySelectorAll(".spreadOption").forEach(opt => {
            opt.addEventListener("click", () => {
                selectSpread(opt.dataset.spread);
            });
        });

        // Почати гадання
        $("tarotStartBtn")?.addEventListener("click", startReading);
    });
})();
