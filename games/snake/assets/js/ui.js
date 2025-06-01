// assets/js/ui.js

export class UIManager {
    /**
     * @param {HTMLElement | null} scoreElement - The HTML element to display the current score.
     * @param {HTMLElement | null} highScoreElement - The HTML element to display the high score.
     * @param {HTMLElement | null} [comboDisplayElement=null] - Optional: an element for combo display.
     * @param {HTMLElement | null} [messageOverlayElement=null] - Optional: an overlay DOM element for game messages.
     * @param {Game} [gameInstance=null] - Optional: reference to the game for callbacks.
     */
    constructor(scoreElement, highScoreElement, comboDisplayElement = null, messageOverlayElement = null, gameInstance = null) {
        this.scoreElement = scoreElement;
        this.highScoreElement = highScoreElement;
        this.comboDisplayElement = comboDisplayElement; // Store combo display element
        this.messageOverlayElement = messageOverlayElement;
        this.game = gameInstance;

        this.currentScore = 0;
        this.highScore = 0;

        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();
        if(this.comboDisplayElement) { // Initialize combo display if element exists
            this.updateComboDisplay(0, 1, 0);
        }


        // Setup button listener ONLY if messageOverlayElement is a valid DOM element
        if (this.messageOverlayElement &&
            typeof this.messageOverlayElement === 'object' &&
            typeof this.messageOverlayElement.querySelector === 'function') {
            
            const messageButton = this.messageOverlayElement.querySelector('#messageButton');
            if (messageButton) {
                messageButton.addEventListener('click', () => {
                    this.hideMessageOverlay();
                });
            }
        } else if (this.messageOverlayElement) {
            console.warn(
                "UIManager Constructor: 'messageOverlayElement' provided but it's not a valid DOM element with 'querySelector' method.",
                "Value received for messageOverlayElement:", this.messageOverlayElement,
                "Type:", typeof this.messageOverlayElement
            );
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
     * Updates the combo display UI.
     * @param {number} count - Current combo count.
     * @param {number} multiplier - Current combo score multiplier for food base score.
     * @param {number} bonus - Current flat bonus points from combo items.
     */
    updateComboDisplay(count, multiplier, bonus) {
        if (this.comboDisplayElement) {
            if (count > 1) { // Only show combo if count is 2 or more
                let displayText = `Combo: ${count}x `;
                if (multiplier > 1) { // Show multiplier if it's active
                    displayText += `(x${multiplier.toFixed(1)}) `;
                }
                if (bonus > 0) { // Show bonus points if any
                    displayText += `(+${bonus} pts)`;
                }
                this.comboDisplayElement.textContent = displayText.trim();
                this.comboDisplayElement.style.visibility = 'visible';
            } else {
                this.comboDisplayElement.textContent = ''; // Clear if no significant combo
                this.comboDisplayElement.style.visibility = 'hidden';
            }
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
            const newButton = buttonEl.cloneNode(true); // Clone to remove old listeners
            if(buttonEl.parentNode) {
                 buttonEl.parentNode.replaceChild(newButton, buttonEl);
            }
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
