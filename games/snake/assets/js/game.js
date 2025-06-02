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
    OBSTACLE_TYPES, OBSTACLE_CONFIG, ACHIEVEMENTS,
    DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId = null, messageOverlayId = null, 
                initialDifficultyKey = DIFFICULTY_LEVELS.MEDIUM, initialGameMode = GAME_MODES.CLASSIC) {
        
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Game.constructor: Canvas with id "${canvasId}" not found.`);
        this.context = this.canvas.getContext('2d');
        if (!this.context) throw new Error(`Game.constructor: Could not get 2D context from canvas "${canvasId}".`);

        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const comboDisplayElement = comboDisplayId ? document.getElementById(comboDisplayId) : null;
        const resolvedMessageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        this.currentGameMode = initialGameMode;
        this.currentDifficultyLevel = initialDifficultyKey;
        this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
        
        // console.log(`Game Initialized. Mode: ${this.currentGameMode}, Difficulty: ${this.difficultySettings.name}`);

        this.lastSurvivalSpeedIncreaseTime = 0;
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);

        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);
        this.achievementManager = new AchievementManager(this.uiManager);

        this.score = 0; this.scoreMultiplier = 1; this.isShieldActive = false; this.effectiveGameSpeed = 0;
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
            // console.log(`Difficulty changed to: ${this.difficultySettings.name}`);
            
            this.resetGame(); 
            this.gameState = GAME_STATE.READY;
            if (this.gameLoopRequestId) { cancelAnimationFrame(this.gameLoopRequestId); this.gameLoopRequestId = null; }
            this.draw(performance.now());
        } else if (difficultyLevelKey === this.currentDifficultyLevel) {
            // console.log("Difficulty is already set to:", this.difficultySettings.name);
        } else {
            console.warn("Attempted to set invalid difficulty level:", difficultyLevelKey);
        }
    }

    setGameMode(modeKey) {
        if (Object.values(GAME_MODES).includes(modeKey) && modeKey !== this.currentGameMode) {
            this.currentGameMode = modeKey;
            // console.log(`Game mode changed to: ${this.currentGameMode}`);
            this.resetGame();
            this.gameState = GAME_STATE.READY;
            if (this.gameLoopRequestId) { cancelAnimationFrame(this.gameLoopRequestId); this.gameLoopRequestId = null; }
            this.draw(performance.now());
        } else if (modeKey === this.currentGameMode) {
            // console.log("Game mode is already set to:", this.currentGameMode);
        } else {
            console.warn("Attempted to set invalid game mode:", modeKey);
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
        this.draw(performance.now());
    }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        this.board.obstacles = [];
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
        this.updateGameSpeed();
    }

    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            this.gameStartTime = this.lastFrameTime; 
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.lastSurvivalSpeedIncreaseTime = this.lastFrameTime;
            }
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    gameLoop(timestamp) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            return;
        }
        this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        const deltaTime = timestamp - this.lastFrameTime;
        const interval = 1000 / this.snake.speed; 
        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval);
            this.inputHandler.applyQueuedDirection();
            this.update(timestamp); 
            this.draw(timestamp);
        }
    }
    
    createParticleBurst(x, y, count, colorCssVar, baseSpeed, lifeSpan, particleSize, gravity) { /* ... (as before) ... */ }
    triggerScreenShake(magnitude, duration, startTime) { /* ... (as before) ... */ }

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
                    const factor = this.snake.speed / (this.snake.speedBeforeFoodEffect - speedIncrease);
                    this.snake.speed = this.snake.speedBeforeFoodEffect * factor;
                } else {
                     this.snake.speed += speedIncrease;
                }
                if (this.snake.speed < 0.5) this.snake.speed = 0.5;
                this.updateGameSpeed();
                this.lastSurvivalSpeedIncreaseTime = currentTime;
            }
        }

        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) { /* ... (combo break logic) ... */ }
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) { /* ... (food eating & achievement checks) ... */ }
        if (this.snake.checkCollision()) { /* ... (collision & shield logic) ... */ }
    }

    draw(timestamp) { /* ... (as before) ... */ }
    
    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100); // Adjusted box height
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(24, GRID_SIZE * 1.5);
        const detailFontSize = Math.min(14, GRID_SIZE * 0.9);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        let yPos = this.canvas.height / 2 - 25; // Adjusted starting Y

        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game', this.canvas.width / 2, yPos);
        
        yPos += titleFontSize * 0.9; // Adjusted spacing
        this.context.font = `${detailFontSize}px ${mainFont}`;
        const difficultyName = this.difficultySettings ? this.difficultySettings.name : "Medium";
        const modeName = this.currentGameMode.charAt(0).toUpperCase() + this.currentGameMode.slice(1);
        this.context.fillText(`Mode: ${modeName} | Difficulty: ${difficultyName}`, this.canvas.width / 2, yPos);
        
        yPos += detailFontSize * 1.5 + 8; // Adjusted spacing
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, yPos);
    }

    drawGameOverMessage() { /* ... (as before) ... */ }
    drawPausedMessage() { /* ... (as before) ... */ }
    gameOver(currentTime) { /* ... (as before, including achievement checks) ... */ }
    togglePause() { /* ... (as before) ... */ }
    resume() { /* ... (as before) ... */ }
    handleEscape() { this.togglePause(); }
    updateGameSpeed() { this.effectiveGameSpeed = this.snake.speed; }
}
