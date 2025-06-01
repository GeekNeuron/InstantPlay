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
        this.messageOverlayElement = messageOverlayElement; // Should be a DOM element or null
        this.game = gameInstance;

        this.currentScore = 0;
        this.highScore = 0;

        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();

        // Setup button listener ONLY if messageOverlayElement is a valid DOM element
        if (this.messageOverlayElement && typeof this.messageOverlayElement.querySelector === 'function') {
            const messageButton = this.messageOverlayElement.querySelector('#messageButton'); // Assumes a button with this ID exists in the overlay
            if (messageButton) {
                messageButton.addEventListener('click', () => {
                    this.hideMessageOverlay();
                    // Potentially add specific button actions if needed, passed via showMessageOverlay
                });
            }
        } else if (messageOverlayElement) {
            // This case means messageOverlayElement was truthy but not a valid element for querySelector
            console.warn("UIManager: messageOverlayElement was provided but is not a valid DOM element for querySelector.", messageOverlayElement);
        }
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

    /**
     * Displays a message using the modal overlay if available and configured.
     * @param {string} titleText - The title for the message.
     * @param {string} bodyText - The main content of the message.
     * @param {string} [buttonText='OK'] - Text for the action button.
     * @param {function} [buttonAction=null] - Custom action for the button click. If null, default is to hide overlay.
     */
    showMessageOverlay(titleText, bodyText, buttonText = 'OK', buttonAction = null) {
        if (!this.messageOverlayElement || typeof this.messageOverlayElement.querySelector !== 'function') {
            console.log(`UI Message (Overlay not available): ${titleText} - ${bodyText}`);
            return;
        }

        const titleEl = this.messageOverlayElement.querySelector('#messageTitle'); // Assumes an element with id="messageTitle"
        const bodyEl = this.messageOverlayElement.querySelector('#messageTextBody');   // Assumes an element with id="messageTextBody"
        const buttonEl = this.messageOverlayElement.querySelector('#messageButton');

        if (titleEl) titleEl.textContent = titleText;
        if (bodyEl) bodyEl.textContent = bodyText;

        if (buttonEl) {
            buttonEl.textContent = buttonText;
            // Clone and replace to ensure old event listeners are removed before adding new one
            const newButton = buttonEl.cloneNode(true);
            buttonEl.parentNode.replaceChild(newButton, buttonEl);
            newButton.addEventListener('click', () => {
                if (buttonAction && typeof buttonAction === 'function') {
                    buttonAction();
                }
                this.hideMessageOverlay(); // Always hide after action or by default
            });
        }
        this.messageOverlayElement.style.display = 'flex'; // Or 'block' or your preferred display style for modal
    }

    hideMessageOverlay() {
        if (this.messageOverlayElement) {
            this.messageOverlayElement.style.display = 'none';
        }
    }
}
