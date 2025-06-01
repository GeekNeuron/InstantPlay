// assets/js/ui.js

export class UIManager {
    /**
     * @param {HTMLElement | null} scoreElement - The HTML element to display the current score.
     * @param {HTMLElement | null} highScoreElement - The HTML element to display the high score.
     * @param {HTMLElement | null} [messageOverlayElement=null] - Optional: an overlay DOM element for game messages.
     * @param {Game} [gameInstance=null] - Optional: reference to the game for restart functionality from modals.
     */
    constructor(scoreElement, highScoreElement, messageOverlayElement = null, gameInstance = null) {
        this.scoreElement = scoreElement;
        this.highScoreElement = highScoreElement;
        this.messageOverlayElement = messageOverlayElement; // This is the parameter received
        this.game = gameInstance;

        this.currentScore = 0;
        this.highScore = 0;

        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();

        // --- بررسی دقیق‌تر و اصلاح شده برای messageOverlayElement ---
        if (this.messageOverlayElement &&
            typeof this.messageOverlayElement === 'object' && // باید یک آبجکت باشد (عناصر DOM آبجکت هستند)
            typeof this.messageOverlayElement.querySelector === 'function') { // باید متد querySelector را داشته باشد

            // این بخش فقط در صورتی اجرا می‌شود که messageOverlayElement یک عنصر DOM معتبر باشد
            const messageButton = this.messageOverlayElement.querySelector('#messageButton'); // فرض می‌کنیم دکمه‌ای با این ID در overlay وجود دارد
            if (messageButton) {
                messageButton.addEventListener('click', () => {
                    this.hideMessageOverlay();
                    // اینجا می‌توان اقدامات دیگری برای دکمه تعریف کرد اگر لازم باشد
                });
            }
        } else if (this.messageOverlayElement) {
            // این بخش اجرا می‌شود اگر messageOverlayElement مقدار داشته باشد (null یا undefined نباشد)
            // اما یک عنصر DOM معتبر با متد querySelector نباشد.
            console.warn(
                "UIManager Constructor: 'messageOverlayElement' provided but it's not a valid DOM element with 'querySelector' method.",
                "Value received for messageOverlayElement:", this.messageOverlayElement,
                "Type:", typeof this.messageOverlayElement
            );
        }
        // اگر messageOverlayElement برابر با null یا undefined باشد، هر دو شرط بالا false خواهند بود و خطایی رخ نمی‌دهد.
    }

    updateScore(newScore) {
        this.currentScore = newScore;
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.currentScore;
        }
    }

    resetScore() {
        this.updateScore(0);
    }

    updateHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
    }

    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('snakeGameHighScore', this.highScore.toString());
        } catch (e) {
            console.warn("Could not save high score to localStorage:", e);
        }
    }

    loadHighScore() {
        try {
            const savedHighScore = localStorage.getItem('snakeGameHighScore');
            this.highScore = parseInt(savedHighScore, 10) || 0;
        } catch (e) {
            console.warn("Could not load high score from localStorage:", e);
            this.highScore = 0;
        }
    }

    showMessageOverlay(titleText, bodyText, buttonText = 'OK', buttonAction = null) {
        if (!this.messageOverlayElement || typeof this.messageOverlayElement.querySelector !== 'function') {
            console.log(`UI Message (Overlay not available or invalid): ${titleText} - ${bodyText}`);
            return;
        }

        const titleEl = this.messageOverlayElement.querySelector('#messageTitle');
        const bodyEl = this.messageOverlayElement.querySelector('#messageTextBody');
        const buttonEl = this.messageOverlayElement.querySelector('#messageButton');

        if (titleEl) titleEl.textContent = titleText;
        if (bodyEl) bodyEl.textContent = bodyText;

        if (buttonEl) {
            buttonEl.textContent = buttonText;
            const newButton = buttonEl.cloneNode(true);
            buttonEl.parentNode.replaceChild(newButton, buttonEl);
            newButton.addEventListener('click', () => {
                if (buttonAction && typeof buttonAction === 'function') {
                    buttonAction();
                }
                this.hideMessageOverlay();
            });
        }
        this.messageOverlayElement.style.display = 'flex';
    }

    hideMessageOverlay() {
        if (this.messageOverlayElement) {
            this.messageOverlayElement.style.display = 'none';
        }
    }
}
