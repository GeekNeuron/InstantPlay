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
        console.log("Game Constructor: Canvas and context obtained.");

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
        
        console.log(`Game Initializing with Mode: ${this.currentGameMode}, Difficulty: ${this.difficultySettings.name}`);

        this.lastSurvivalSpeedIncreaseTime = 0;
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);

        this.board = new Board(this.canvas, this.context); // Board constructor logs canvas details
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

    setDifficulty(difficultyLevelKey) { /* ... as before ... */ }
    setGameMode(modeKey) { /* ... as before ... */ }

    init() {
        console.log("Game.init(): Initializing UI and resetting game state.");
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame(); 
        this.gameState = GAME_STATE.READY;
        console.log("Game.init(): Game READY. Drawing initial screen.");
        if (this.uiManager.updateComboDisplay) {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        this.draw(performance.now());
    }

    resetGame() {
        console.log("Game.resetGame(): Resetting game elements.");
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
        console.log("Game.start() called. Current state:", this.gameState);
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
            console.log("Game.start(): Game loop initiated.");
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
    
    createParticleBurst(x, y, count, colorCssVar, baseSpeed, lifeSpan, particleSize, gravity) { /* ... as before ... */ }
    triggerScreenShake(magnitude, duration, startTime) { /* ... as before ... */ }

    update(currentTime) {
        this.board.updateObstacles(currentTime);
        this.snake.move();
        this.powerUpManager.update(currentTime);
        this.particles.forEach((p, i) => { if (!p.isAlive()) this.particles.splice(i, 1); else p.update(16); });
        if (this.isShaking && (currentTime - this.shakeStartTime >= this.shakeDuration)) this.isShaking = false;

        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) { /* ... survival speed logic ... */ }
        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) { /* ... combo break logic ... */ }
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) { /* ... food eating & achievement checks ... */ }
        if (this.snake.checkCollision()) { /* ... collision & shield logic ... */ }
    }

    draw(timestamp) {
        console.log(`Game.draw() called. Game state: ${this.gameState}. Shaking: ${this.isShaking}`);
        if(!this.context) {
            console.error("Game.draw(): CRITICAL - context is null!");
            return;
        }

        this.context.save(); 
        if (this.isShaking) {
            const elapsedShakeTime = (timestamp || performance.now()) - this.shakeStartTime;
            if (elapsedShakeTime < this.shakeDuration) {
                const remainingRatio = 1 - (elapsedShakeTime / this.shakeDuration);
                const currentMagnitude = this.shakeMagnitude * remainingRatio;
                const shakeX = (Math.random() - 0.5) * 2 * currentMagnitude;
                const shakeY = (Math.random() - 0.5) * 2 * currentMagnitude;
                this.context.translate(shakeX, shakeY);
            } else {
                this.isShaking = false; 
            }
        }

        this.board.draw(); // board.draw() logs its own details
        
        console.log("Game.draw(): Attempting to draw food, powerups, snake, particles.");
        if (this.food && typeof this.food.draw === 'function') this.food.draw(this.context); else console.warn("Game.draw(): this.food or this.food.draw is not available.");
        if (this.powerUpManager && typeof this.powerUpManager.draw === 'function') this.powerUpManager.draw(this.context); else console.warn("Game.draw(): this.powerUpManager or this.powerUpManager.draw is not available.");
        if (this.snake && typeof this.snake.draw === 'function') this.snake.draw(this.context); else console.warn("Game.draw(): this.snake or this.snake.draw is not available.");
        
        this.particles.forEach(particle => particle.draw(this.context));
        
        // Draw game state messages
        if (this.gameState === GAME_STATE.GAME_OVER && !this.isShaking) {
             this.drawGameOverMessage();
        } else if (this.gameState === GAME_STATE.GAME_OVER && this.isShaking) {
            // Optionally draw simpler message during shake
        } else if (this.gameState === GAME_STATE.PAUSED) {
             this.drawPausedMessage();
        } else if (this.gameState === GAME_STATE.READY) {
             this.drawReadyMessage();
        }
        
        this.context.restore(); 
    }

    drawReadyMessage() { /* ... as before ... */ }
    drawGameOverMessage() { /* ... as before ... */ }
    drawPausedMessage() { /* ... as before ... */ }
    gameOver(currentTime) { /* ... as before ... */ }
    togglePause() { /* ... as before ... */ }
    resume() { /* ... as before ... */ }
    handleEscape() { this.togglePause(); }
    updateGameSpeed() { this.effectiveGameSpeed = this.snake.speed; }
}
