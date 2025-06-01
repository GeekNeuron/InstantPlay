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
    ROWS, COLS, GAME_STATE, FOOD_EFFECTS, /*INITIAL_SNAKE_SPEED,*/ GRID_SIZE, // INITIAL_SNAKE_SPEED no longer primary driver
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE,
    /*SURVIVAL_START_SPEED_BASE,*/ SURVIVAL_SPEED_INCREASE_INTERVAL, SURVIVAL_SPEED_INCREASE_AMOUNT_BASE, GAME_MODES,
    PARTICLE_COUNT_FOOD_CONSUMPTION, PARTICLE_LIFESPAN_FOOD, /* ... other particle/shake constants ... */
    OBSTACLE_TYPES, ACHIEVEMENTS,
    DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS // Import new Difficulty constants
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId = null, messageOverlayId = null, initialDifficultyKey = DIFFICULTY_LEVELS.MEDIUM) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        // ... (element fetching as before) ...
        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const comboDisplayElement = comboDisplayId ? document.getElementById(comboDisplayId) : null;
        const resolvedMessageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;


        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        this.currentGameMode = GAME_MODES.CLASSIC; // Default to Classic for now, or make it selectable
        // this.currentGameMode = GAME_MODES.SURVIVAL; 
        
        this.currentDifficultyLevel = initialDifficultyKey; // e.g., 'MEDIUM'
        this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
        
        console.log(`Game Initialized. Mode: ${this.currentGameMode}, Difficulty: ${this.difficultySettings.name}`);

        this.lastSurvivalSpeedIncreaseTime = 0;
        // Adjusted survival speed increase based on difficulty's factor
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);

        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);
        this.achievementManager = new AchievementManager(this.uiManager);

        // ... (other properties: score, multipliers, flags, combo, particles, shake, achievement trackers as before) ...
        this.score = 0; this.scoreMultiplier = 1; this.isShieldActive = false; this.effectiveGameSpeed = 0;
        this.comboCount = 0; this.lastFoodEatTime = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        this.particles = []; this.isShaking = false; /* ... */
        this.foodEatenThisGame = 0; this.maxComboThisGame = 0; this.gameStartTime = 0;

        this.init();
    }

    setDifficulty(difficultyLevelKey) {
        if (DIFFICULTY_SETTINGS[difficultyLevelKey] && difficultyLevelKey !== this.currentDifficultyLevel) {
            this.currentDifficultyLevel = difficultyLevelKey;
            this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
            // Update survival speed increase amount based on new difficulty
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
            console.log(`Difficulty changed to: ${this.difficultySettings.name}`);
            
            this.resetGame(); // Reset the game for the new difficulty to take full effect
            this.gameState = GAME_STATE.READY;
            if (this.gameLoopRequestId) { cancelAnimationFrame(this.gameLoopRequestId); this.gameLoopRequestId = null; }
            this.draw(performance.now());
        } else if (difficultyLevelKey === this.currentDifficultyLevel) {
            // console.log("Difficulty is already set to:", this.difficultySettings.name);
        } else {
            console.warn("Attempted to set invalid difficulty level:", difficultyLevelKey);
        }
    }

    init() { /* ... as before ... */ }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        // --- Setup obstacles based on difficulty setting ---
        this.board.obstacles = [];
        this.board.setupObstacles(this.difficultySettings.obstacleConfig);

        // Set snake's initial speed based on selected difficulty and game mode
        if (this.currentGameMode === GAME_MODES.SURVIVAL) {
            // Use difficulty's specific survival start speed or fallback
            this.snake.initialSpeed = this.difficultySettings.survivalStartSpeed || this.difficultySettings.initialSpeed;
            this.lastSurvivalSpeedIncreaseTime = performance.now();
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
        } else { // Classic mode
            this.snake.initialSpeed = this.difficultySettings.initialSpeed;
        }
        this.snake.reset(startX, startY); 

        this.inputHandler.reset();
        this.food.spawnNew(); 
        this.powerUpManager.reset(); 
        
        this.score = 0;
        this.uiManager.updateScore(this.score);
        
        this.scoreMultiplier = 1; 
        this.isShieldActive = false; 

        this.comboCount = 0; /* ... reset combo state ... */
        if (this.uiManager && typeof this.uiManager.updateComboDisplay === 'function') { /* ... */ }
        
        this.particles = []; 
        this.isShaking = false;

        this.foodEatenThisGame = 0; /* ... reset achievement trackers ... */
        this.maxComboThisGame = 0;
        this.gameStartTime = 0;

        this.updateGameSpeed();
    }

    start() { /* ... as before, gameStartTime is set here ... */ }
    gameLoop(timestamp) { /* ... as before ... */ }
    createParticleBurst(/*...*/) { /* ... as before ... */ }
    triggerScreenShake(/*...*/) { /* ... as before ... */ }

    update(currentTime) {
        this.board.updateObstacles(currentTime); // Update blinking obstacles
        this.snake.move();
        this.powerUpManager.update(currentTime);
        this.particles.forEach((p, i) => { if (!p.isAlive()) this.particles.splice(i, 1); else p.update(16); });
        if (this.isShaking && (currentTime - this.shakeStartTime >= this.shakeDuration)) this.isShaking = false;

        // Survival Mode: Increase speed over time
        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) {
            if (currentTime - this.lastSurvivalSpeedIncreaseTime > SURVIVAL_SPEED_INCREASE_INTERVAL) {
                let speedIncrease = this.currentSurvivalSpeedIncreaseAmount; // Use difficulty adjusted amount

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

        // Combo logic (as before)
        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) { /* ... */ }

        // Food eating (as before, calls achievement checks)
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) { /* ... */ }

        // Collision check (as before)
        if (this.snake.checkCollision()) { /* ... */ }
    }

    draw(timestamp) { /* ... as before ... */ }
    
    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(24, GRID_SIZE * 1.5);
        const detailFontSize = Math.min(14, GRID_SIZE * 0.9);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        let yPos = this.canvas.height / 2 - 25;

        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game', this.canvas.width / 2, yPos);
        
        yPos += titleFontSize * 0.8;
        this.context.font = `${detailFontSize}px ${mainFont}`;
        // Display current difficulty setting name
        const difficultyName = this.difficultySettings ? this.difficultySettings.name : 'Medium';
        this.context.fillText(`Mode: ${this.currentGameMode} | Difficulty: ${difficultyName}`, this.canvas.width / 2, yPos);
        
        yPos += detailFontSize * 1.5 + 5; // Added more space
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, yPos);
    }

    drawGameOverMessage() { /* ... as before ... */ }
    drawPausedMessage() { /* ... as before ... */ }
    gameOver(currentTime) { /* ... as before, calls achievement checks ... */ }
    togglePause() { /* ... as before ... */ }
    resume() { /* ... as before ... */ }
    handleEscape() { this.togglePause(); }
    updateGameSpeed() { this.effectiveGameSpeed = this.snake.speed; }
}
