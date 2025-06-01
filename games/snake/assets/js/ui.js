// assets/js/ui.js

/**
 * @fileoverview Manages UI updates for the game (score, messages, etc.).
 */

export class UIManager {
    /**
     * @param {HTMLElement} scoreElement - The HTML element to display the current score.
     * @param {HTMLElement} highScoreElement - The HTML element to display the high score.
     * @param {HTMLElement} [messageElement] - Optional: an element for game messages.
     */
    constructor(scoreElement, highScoreElement, messageElement = null) {
        this.scoreElement = scoreElement;
        this.highScoreElement = highScoreElement;
        this.messageElement = messageElement; // e.g., for "Game Over", "Paused"

        this.currentScore = 0;
        this.highScore = 0;
        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();
    }

    /**
     * Updates the displayed score.
     * @param {number} newScore - The new score to display.
     */
    updateScore(newScore) {
        this.currentScore = newScore;
        this.updateScoreDisplay();
    }

    /**
     * Updates the score DOM element.
     */
    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.currentScore;
        }
    }

    /**
     * Resets the current score to 0.
     */
    resetScore() {
        this.updateScore(0);
    }

    /**
     * Updates the high score if the current score is higher.
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
     * Saves the high score to localStorage.
     */
    saveHighScore() {
        localStorage.setItem('snakeGameHighScore', this.highScore.toString());
    }

    /**
     * Loads the high score from localStorage.
     */
    loadHighScore() {
        const savedHighScore = localStorage.getItem('snakeGameHighScore');
        if (savedHighScore !== null) {
            this.highScore = parseInt(savedHighScore, 10) || 0;
        } else {
            this.highScore = 0;
        }
    }

    /**
     * Displays a message to the user.
     * @param {string} text - The message to display.
     * @param {string} [type='info'] - Type of message ('info', 'error', 'success').
     */
    showMessage(text, type = 'info') {
        if (this.messageElement) {
            this.messageElement.textContent = text;
            this.messageElement.className = `game-message message-${type}`; // For styling
            this.messageElement.style.display = 'block';
        } else {
            console.log(`UI Message (${type}): ${text}`);
        }
    }

    /**
     * Hides the message display.
     */
    hideMessage() {
        if (this.messageElement) {
            this.messageElement.style.display = 'none';
        }
    }

    /**
     * Shows a "Game Over" screen or message.
     * @param {number} finalScore - The player's final score.
     */
    showGameOverScreen(finalScore) {
        // This could involve more complex DOM manipulation or just a message.
        // For now, using the message element.
        // this.showMessage(`Game Over! Score: ${finalScore}. Press Space to Restart.`, 'gameOver');
        // This might be better handled by the game state logic showing/hiding a dedicated overlay.
        console.log(`Game Over! Final Score: ${finalScore}`);
        // Example of how you might show a modal (you'd need CSS for .modal, .modal-content)
        /*
        const gameOverModal = document.createElement('div');
        gameOverModal.id = 'gameOverModal';
        gameOverModal.className = 'modal'; // Style this class
        gameOverModal.innerHTML = `
            <div class="modal-content">
                <h2>Game Over!</h2>
                <p>Your Score: ${finalScore}</p>
                <p>High Score: ${this.highScore}</p>
                <button id="restartGameButton">Play Again</button>
            </div>
        `;
        document.body.appendChild(gameOverModal);
        document.getElementById('restartGameButton').addEventListener('click', () => {
            this.game.restart(); // Assuming game object has a restart method
            document.body.removeChild(gameOverModal);
        });
        */
    }

    /**
     * Shows a "Paused" screen or message.
     */
    showPauseScreen() {
        // this.showMessage('Paused. Press Space to Resume.', 'pause');
        console.log("Game Paused");
         // Similar to gameOver, could be a modal or overlay
    }

    hidePauseScreen() {
        // this.hideMessage();
        console.log("Game Resumed");
    }
}
