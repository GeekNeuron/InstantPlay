export class UIManager {
    constructor(uiElements, gameInstance = null) {
        this.scoreElement = uiElements.score;
        this.highScoreElement = uiElements.highScore;
        this.comboDisplayElement = uiElements.comboDisplay;
        this.levelInfoElement = uiElements.levelInfo;
        this.achievementNotificationElement = uiElements.achievementNotification;
        this.messageOverlayElement = uiElements.messageOverlay;
        
        this.game = gameInstance;
        this.currentScore = 0;
        this.highScore = 0;
        this.lastComboCount = 0;
        this.achievementTimeout = null;

        this.loadHighScore();
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();
        this.updateComboDisplay(0, 1);
        this.hideLevelInfo();
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

    resetScore() { this.updateScore(0); }

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
        try { localStorage.setItem('snakeGameHighScore', this.highScore.toString()); }
        catch (e) { console.warn("Could not save high score:", e); }
    }

    loadHighScore() {
        try { this.highScore = parseInt(localStorage.getItem('snakeGameHighScore'), 10) || 0; }
        catch (e) { this.highScore = 0; }
    }

    updateComboDisplay(count, multiplier) {
        if (this.comboDisplayElement) {
            if (count > this.lastComboCount && count > 1) {
                this.comboDisplayElement.classList.remove('combo-pop');
                void this.comboDisplayElement.offsetWidth;
                this.comboDisplayElement.classList.add('combo-pop');
            }
            if (count > 1) {
                let displayText = `Combo: ${count}x`;
                if (multiplier > 1) { displayText += ` (${multiplier.toFixed(1)}x)`; }
                this.comboDisplayElement.textContent = displayText;
                this.comboDisplayElement.style.visibility = 'visible';
            } else {
                this.comboDisplayElement.textContent = '';
                this.comboDisplayElement.style.visibility = 'hidden';
            }
            this.lastComboCount = count;
        }
    }

    updateLevelInfo(levelNum, objective, progress) {
        if (!this.levelInfoElement) return;
        let objectiveText = '';
        if (objective.type === 'EAT_FOOD') {
            objectiveText = `Eat ${objective.amount} apples (${progress}/${objective.amount})`;
        } else if (objective.type === 'REACH_LENGTH') {
            objectiveText = `Reach length ${objective.amount} (${progress}/${objective.amount})`;
        }
        this.levelInfoElement.innerHTML = `Level ${levelNum}: ${objectiveText}`;
        this.levelInfoElement.style.visibility = 'visible';
    }

    hideLevelInfo() {
        if (this.levelInfoElement) {
            this.levelInfoElement.style.visibility = 'hidden';
        }
    }

    showAchievementNotification(achievement) {
        if (!this.achievementNotificationElement) return;
        this.achievementNotificationElement.innerHTML = `
            <span class="achievement-icon">${achievement.icon || '🏆'}</span>
            <div class="achievement-text">
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>`;
        this.achievementNotificationElement.classList.add('show');
        if (this.achievementTimeout) clearTimeout(this.achievementTimeout);
        this.achievementTimeout = setTimeout(() => {
            this.achievementNotificationElement.classList.remove('show');
        }, 4000);
    }
}
