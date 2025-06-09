// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js';
import { Particle } from './particle.js';
import { AchievementManager } from './achievementManager.js';
import {
    ROWS, COLS, GAME_STATE, FOOD_EFFECTS, GRID_SIZE,
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE,
    SURVIVAL_SPEED_INCREASE_INTERVAL, SURVIVAL_SPEED_INCREASE_AMOUNT_BASE, GAME_MODES,
    PARTICLE_COUNT_FOOD_CONSUMPTION, PARTICLE_LIFESPAN_FOOD, PARTICLE_BASE_SPEED_FOOD, PARTICLE_SIZE_FOOD, PARTICLE_GRAVITY_FOOD,
    SCREEN_SHAKE_MAGNITUDE_GAME_OVER, SCREEN_SHAKE_DURATION_GAME_OVER,
    OBSTACLE_CONFIG,
    DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId, messageOverlayId, initialDifficultyKey, initialGameMode) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const comboDisplayElement = comboDisplayId ? document.getElementById(comboDisplayId) : null;
        const resolvedMessageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.gameIntervalId = null; // For setInterval

        this.currentGameMode = initialGameMode;
        this.currentDifficultyLevel = initialDifficultyKey;
        this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
        
        this.lastSurvivalSpeedIncreaseTime = 0;
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);

        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);
        this.achievementManager = new AchievementManager(this.uiManager);

        this.score = 0; this.scoreMultiplier = 1; this.isShieldActive = false;
        this.comboCount = 0; this.lastFoodEatTime = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        this.particles = []; this.isShaking = false; this.shakeMagnitude = 0; this.shakeDuration = 0; this.shakeStartTime = 0;
        this.foodEatenThisGame = 0; this.maxComboThisGame = 0; this.gameStartTime = 0;

        this.init();
    }

    setDifficulty(difficultyLevelKey) {
        if (DIFFICULTY_SETTINGS[difficultyLevelKey] && difficultyLevelKey !== this.currentDifficultyLevel) {
            this.currentDifficultyLevel = difficultyLevelKey;
            this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
            this.gameState = GAME_STATE.READY; // Go to ready screen
            if (this.gameIntervalId) clearInterval(this.gameIntervalId); // Stop current game
            this.resetGame(); 
            this.draw();
        }
    }

    setGameMode(modeKey) {
        if (Object.values(GAME_MODES).includes(modeKey) && modeKey !== this.currentGameMode) {
            this.currentGameMode = modeKey;
            this.gameState = GAME_STATE.READY;
            if (this.gameIntervalId) clearInterval(this.gameIntervalId);
            this.resetGame();
            this.draw();
        }
    }

    init() {
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame(); 
        this.gameState = GAME_STATE.READY;
        if (this.uiManager.updateComboDisplay) {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        this.draw();
    }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);
        this.board.setupObstacles(this.difficultySettings.obstacleConfig); 

        if (this.currentGameMode === GAME_MODES.SURVIVAL) {
            this.snake.initialSpeed = this.difficultySettings.survivalStartSpeed || this.difficultySettings.initialSpeed;
            this.lastSurvivalSpeedIncreaseTime = performance.now();
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
        } else {
            this.snake.initialSpeed = this.difficultySettings.initialSpeed;
        }
        this.snake.reset(startX, startY); 

        this.inputHandler.reset();
        this.food.spawnNew(); 
        this.powerUpManager.reset(); 
        this.score = 0; this.uiManager.updateScore(this.score);
        this.scoreMultiplier = 1; this.isShieldActive = false; 
        this.comboCount = 0; this.lastFoodEatTime = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        if (this.uiManager && typeof this.uiManager.updateComboDisplay === 'function') {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        this.particles = []; this.isShaking = false;
        this.foodEatenThisGame = 0; this.maxComboThisGame = 0; this.gameStartTime = 0;
        // No need to call updateGameSpeed here, as it's called when the loop starts/resumes.
    }

    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.gameStartTime = performance.now();
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.lastSurvivalSpeedIncreaseTime = this.gameStartTime;
            }
            this.updateGameInterval();
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    gameLoop() {
        if (this.gameState !== GAME_STATE.PLAYING) {
            console.warn("Game loop called while not in PLAYING state. This should not happen.");
            clearInterval(this.gameIntervalId);
            return;
        }
        const currentTime = performance.now();
        this.inputHandler.applyQueuedDirection();
        this.update(currentTime); 
        this.draw(currentTime);
    }
    
    updateGameInterval() {
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);
        const intervalTime = 1000 / this.snake.speed;
        this.gameIntervalId = setInterval(() => this.gameLoop(), intervalTime);
    }
    
    createParticleBurst(/*...*/) { /* ... */ }
    triggerScreenShake(/*...*/) { /* ... */ }

    update(currentTime) {
        this.board.updateObstacles(currentTime);
        this.snake.move();
        this.powerUpManager.update(currentTime);
        this.particles.forEach((p, i) => { if (!p.isAlive()) this.particles.splice(i, 1); else p.update(16); });
        if (this.isShaking && (currentTime - this.shakeStartTime >= this.shakeDuration)) this.isShaking = false;

        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) {
            if (currentTime - this.lastSurvivalSpeedIncreaseTime > SURVIVAL_SPEED_INCREASE_INTERVAL) {
                let speedIncrease = this.currentSurvivalSpeedIncreaseAmount;
                if (this.snake.speedBeforeFoodEffect !== null) {
                    this.snake.speedBeforeFoodEffect += speedIncrease;
                } else {
                     this.snake.speed += speedIncrease;
                }
                if (this.snake.speed < 0.5) this.snake.speed = 0.5;
                this.updateGameInterval(); // Update interval to reflect new speed
                this.lastSurvivalSpeedIncreaseTime = currentTime;
            }
        }

        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) {
            // ... combo break logic ...
        }

        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            // ... food eating & achievement check logic ...
        }

        if (this.snake.checkCollision()) {
            // ... collision & shield logic ...
        }
    }

    draw(timestamp) {
        if(!this.context) return;
        this.context.save(); 
        if (this.isShaking) { /* ... shake logic ... */ }
        this.board.draw();
        this.food.draw(this.context);
        this.powerUpManager.draw(this.context);
        this.snake.draw(this.context);
        this.particles.forEach(particle => particle.draw(this.context));
        if (this.gameState === GAME_STATE.GAME_OVER && !this.isShaking) { this.drawGameOverMessage(); }
        else if (this.gameState === GAME_STATE.GAME_OVER && this.isShaking) { /* ... */ }
        else if (this.gameState === GAME_STATE.PAUSED) { this.drawPausedMessage(); }
        else if (this.gameState === GAME_STATE.READY) { this.drawReadyMessage(); }
        this.context.restore(); 
    }

    drawReadyMessage() { /* ... as before ... */ }
    drawGameOverMessage() { /* ... as before ... */ }
    drawPausedMessage() { /* ... as before ... */ }

    gameOver(currentTime) {
        if (this.gameIntervalId) {
            clearInterval(this.gameIntervalId);
            this.gameIntervalId = null;
        }
        // ... (rest of gameOver logic as before, including achievement checks and screen shake) ...
    }

    togglePause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameIntervalId) {
                clearInterval(this.gameIntervalId);
                this.gameIntervalId = null;
            }
            this.draw(performance.now());
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.start();
        }
    }

    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.updateGameInterval();
        }
    }

    handleEscape() { this.togglePause(); }

    updateGameSpeed() { // Called by snake when its speed changes due to food effects
        if (this.gameState === GAME_STATE.PLAYING) {
            this.updateGameInterval();
        }
    }
}
