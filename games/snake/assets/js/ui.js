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
        this.comboDisplayElement = comboDisplayElement;
        this.messageOverlayElement = messageOverlayElement;
        this.game = gameInstance;

        this.currentScore = 0;
        this.highScore = 0;

        // --- Achievement Notification ---
        this.achievementNotificationElement = document.getElementById('achievement-notification');
        this.achievementTimeout = null; // To manage hiding the notification

        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();
        if (this.comboDisplayElement) { // Initialize combo display if element exists
            this.updateComboDisplay(0, 1, 0); // Initial state: no combo
        }

        // Setup button listener for modal ONLY if messageOverlayElement is a valid DOM element
        if (this.messageOverlayElement &&
            typeof this.messageOverlayElement === 'object' &&
            typeof this.messageOverlayElement.querySelector === 'function') {
            
            const messageButton = this.messageOverlayElement.querySelector('#messageButton');
            if (messageButton) {
                messageButton.addEventListener('click', () => {
                    this.hideMessageOverlay();
                });
            }
        } else if (this.messageOverlayElement) { // messageOverlayElement was truthy but not a valid DOM element
            console.warn(
                "UIManager Constructor: 'messageOverlayElement' was provided but it's not a valid DOM element with 'querySelector' method.",
                "Value received:", this.messageOverlayElement,
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
            console.warn("UIManager: Could not save high score to localStorage.", e);
        }
    }

    loadHighScore() {
        try {
            const savedHighScore = localStorage.getItem('snakeGameHighScore');
            this.highScore = parseInt(savedHighScore, 10) || 0;
        } catch (e) {
            this.highScore = 0; // Default to 0 on error
            console.warn("UIManager: Could not load high score from localStorage.", e);
        }
    }

    updateComboDisplay(count, multiplier, bonus) {
        if (this.comboDisplayElement) {
            if (count > 1) { // Only show combo if count is 2 or more
                let displayText = `Combo: ${count}x `;
                if (multiplier > 1) {
                    displayText += `(Score x${multiplier.toFixed(1)}) `;
                }
                if (bonus > 0 && count > 1) {
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

    /**
     * Shows a temporary notification when an achievement is unlocked.
     * @param {string} name - The name of the achievement.
     * @param {string} description - The description of the achievement.
     * @param {string} icon - The icon/emoji for the achievement.
     */
    showAchievementUnlockedNotification(name, description, icon) {
        if (!this.achievementNotificationElement) {
            console.log(`Achievement Unlocked (UI element 'achievement-notification' not found): ${icon} ${name} - ${description}`);
            return;
        }

        // Sanitize inputs slightly if they were to come from less trusted sources (not an issue here)
        const safeName = name || "Achievement Unlocked!";
        const safeDescription = description || "";
        const safeIcon = icon || '🏆';

        this.achievementNotificationElement.innerHTML = `
            <span class="achievement-icon">${safeIcon}</span>
            <div class="achievement-text">
                <div class="achievement-title">${safeName}</div>
                <div class="achievement-desc">${safeDescription}</div>
            </div>
        `;
        this.achievementNotificationElement.classList.add('show');

        // Clear previous timeout if any, to prevent premature hiding if multiple achievements unlock quickly
        if (this.achievementTimeout) {
            clearTimeout(this.achievementTimeout);
        }

        // Hide notification after a few seconds
        this.achievementTimeout = setTimeout(() => {
            if (this.achievementNotificationElement) { // Check if element still exists
                 this.achievementNotificationElement.classList.remove('show');
            }
        }, 4000); // Show for 4 seconds
    }

    // showMessageOverlay and hideMessageOverlay methods remain for potential future modal use
    showMessageOverlay(titleText, bodyText, buttonText = 'OK', buttonAction = null) {
        if (!this.messageOverlayElement || typeof this.messageOverlayElement.querySelector !== 'function') {
            // console.log(`UI Message (Overlay not available or invalid): ${titleText} - ${bodyText}`);
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
            if(buttonEl.parentNode) {
                 buttonEl.parentNode.replaceChild(newButton, buttonEl);
            }
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
