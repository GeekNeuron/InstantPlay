// assets/js/ui.js

/**
 * @fileoverview Manages UI updates for the game (score, messages, high score).
 */

export class UIManager {
    /**
     * @param {HTMLElement} scoreElement - The HTML element to display the current score.
     * @param {HTMLElement} highScoreElement - The HTML element to display the high score.
     * @param {HTMLElement} [messageOverlayElement] - Optional: an overlay element for game messages.
     * @param {Game} [gameInstance] - Optional: reference to the game for restart functionality from modals.
     */
    constructor(scoreElement, highScoreElement, messageOverlayElement = null, gameInstance = null) {
        this.scoreElement = scoreElement;
        this.highScoreElement = highScoreElement;
        this.messageOverlayElement = messageOverlayElement; // e.g., a modal div
        this.game = gameInstance; // Store game instance for potential callbacks

        this.currentScore = 0;
        this.highScore = 0;

        this.loadHighScore(); // Load high score from localStorage
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();

        // If using a modal for messages, setup its button if it exists
        if (this.messageOverlayElement) {
            const messageButton = this.messageOverlayElement.querySelector('#messageButton');
            if (messageButton) {
                messageButton.addEventListener('click', () => this.hideMessageOverlay());
            }
        }
    }

    /**
     * Updates the displayed current score.
     * @param {number} newScore - The new score to display.
     */
    updateScore(newScore) {
        this.currentScore = newScore;
        this.updateScoreDisplay();
    }

    /**
     * Updates the score DOM element with the current score.
     */
    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.currentScore;
        }
    }

    /**
     * Resets the current score to 0 and updates the display.
     */
    resetScore() {
        this.updateScore(0);
    }

    /**
     * Updates the high score if the current score is higher, saves it, and updates display.
     */
    updateHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
    }

    /**
     * Updates the high score DOM element.
     */
    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore;
        }
    }

    /**
     * Saves the current high score to localStorage.
     */
    saveHighScore() {
        try {
            localStorage.setItem('snakeGameHighScore', this.highScore.toString());
        } catch (e) {
            console.warn("Could not save high score to localStorage:", e);
        }
    }

    /**
     * Loads the high score from localStorage. If not found, defaults to 0.
     */
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
     * Displays a message using a modal overlay if available.
     * (This is an example, the Game class currently draws messages on canvas).
     * @param {string} titleText - The title of the message/modal.
     * @param {string} bodyText - The main body of the message.
     * @param {string} [buttonText='OK'] - Text for the button.
     * @param {function} [buttonAction=null] - Action for the button. If null, button hides overlay.
     */
    showMessageOverlay(titleText, bodyText, buttonText = 'OK', buttonAction = null) {
        if (!this.messageOverlayElement) {
            console.log(`UI Message: ${titleText} - ${bodyText}`); // Fallback to console
            return;
        }

        const titleEl = this.messageOverlayElement.querySelector('h2') || this.messageOverlayElement.querySelector('p#messageText'); // Adjust selector
        const bodyEl = this.messageOverlayElement.querySelector('p#messageText') || this.messageOverlayElement.querySelector('.modal-body-text'); // Adjust selector
        const buttonEl = this.messageOverlayElement.querySelector('button');

        if (titleEl) titleEl.textContent = titleText; // Simplistic, assumes structure
        if (bodyEl && titleEl !== bodyEl) bodyEl.textContent = bodyText;
        else if (titleEl === bodyEl) titleEl.innerHTML = `<strong>${titleText}</strong><br>${bodyText}`;


        if (buttonEl) {
            buttonEl.textContent = buttonText;
            // Clone and replace to remove old listeners, then add new one
            const newButton = buttonEl.cloneNode(true);
            buttonEl.parentNode.replaceChild(newButton, buttonEl);
            newButton.addEventListener('click', () => {
                if (buttonAction) {
                    buttonAction();
                }
                this.hideMessageOverlay();
            });
        }
        this.messageOverlayElement.style.display = 'flex'; // Or 'block' depending on CSS for modal
    }

    /**
     * Hides the message overlay.
     */
    hideMessageOverlay() {
        if (this.messageOverlayElement) {
            this.messageOverlayElement.style.display = 'none';
        }
    }

    // The Game class currently draws its own messages (Ready, Paused, Game Over) on the canvas.
    // If we switch to using this UIManager for those, the Game class would call:
    // e.g., this.uiManager.showMessageOverlay("Game Over!", `Your Score: ${finalScore}`, "Play Again", () => this.game.start());
}
