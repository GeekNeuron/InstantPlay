// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
// import { SoundEffectsManager } from './sfx.js'; // Sound system is disabled
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js';
import {
    ROWS, COLS, GAME_STATE, FOOD_EFFECTS, INITIAL_SNAKE_SPEED, GRID_SIZE,
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE,
    SURVIVAL_START_SPEED, SURVIVAL_SPEED_INCREASE_INTERVAL, SURVIVAL_SPEED_INCREASE_AMOUNT, GAME_MODES
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId = null, messageOverlayId = null) {
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

        // --- Game Mode Selection ---
        // To test different modes, change this value:
        this.currentGameMode = GAME_MODES.SURVIVAL; 
        // this.currentGameMode = GAME_MODES.CLASSIC;
        console.log("Game Mode Set To:", this.currentGameMode);


        // --- Survival Mode Specific ---
        this.lastSurvivalSpeedIncreaseTime = 0; // Timestamp of the last speed increase in survival mode

        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);

        this.score = 0;
        this.scoreMultiplier = 1; // From collectible power-ups
        this.isShieldActive = false;
        this.shieldHitCount = 0; 
        this.effectiveGameSpeed = this.snake.speed; // For logging or other systems if needed

        // Combo related properties
        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;

        this.init();
    }

    init() {
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame(); // This will also call updateComboDisplay to clear it
        this.gameState = GAME_STATE.READY;
        this.draw();
    }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        this.board.obstacles = []; // Clear previous obstacles
        this.board.setupDefaultObstacles(); // Setup new obstacles for this game

        // Set snake's initial speed based on the current game mode
        if (this.currentGameMode === GAME_MODES.SURVIVAL) {
            this.snake.initialSpeed = SURVIVAL_START_SPEED;
            this.lastSurvivalSpeedIncreaseTime = performance.now(); // Set for the first interval check
            console.log(`Game Reset: Survival Mode. Start speed: ${this.snake.initialSpeed}`);
        } else { // Classic mode (or any other mode not explicitly survival)
            this.snake.initialSpeed = INITIAL_SNAKE_SPEED;
            console.log(`Game Reset: Classic Mode. Start speed: ${this.snake.initialSpeed}`);
        }
        // Snake's reset method will use its this.initialSpeed to set its current this.speed
        this.snake.reset(startX, startY); 

        this.inputHandler.reset();
        this.food.spawnNew(); 
        this.powerUpManager.reset(); 
        
        this.score = 0;
        this.uiManager.updateScore(this.score);
        
        this.scoreMultiplier = 1; 
        this.isShieldActive = false; 

        // Reset combo state
        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        if (this.uiManager && typeof this.uiManager.updateComboDisplay === 'function') { 
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        this.updateGameSpeed(); // Reflects the initial speed of the mode in game.effectiveGameSpeed
    }

    start() {
        // this.sfx.resumeContext(); // Sound system disabled

        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            // Reset survival speed increase timer specifically at game start if in survival mode
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.lastSurvivalSpeedIncreaseTime = performance.now();
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
        // Interval based on the snake's current speed (which can be affected by food effects or survival mode)
        const interval = 1000 / this.snake.speed; 
        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval); 
            this.inputHandler.applyQueuedDirection();
            this.update(timestamp); 
            this.draw();
        }
    }

    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime); 

        // Survival Mode: Increase speed over time
        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) {
            if (currentTime - this.lastSurvivalSpeedIncreaseTime > SURVIVAL_SPEED_INCREASE_INTERVAL) {
                // Increase the snake's current speed directly.
                // Food effects will apply temporarily on top of this progressively increasing speed.
                this.snake.speed += SURVIVAL_SPEED_INCREASE_AMOUNT;
                
                // If a food speed effect is active, its base (speedBeforeFoodEffect) also needs to conceptually increase,
                // so when it reverts, it reverts to a higher base.
                if (this.snake.speedBeforeFoodEffect !== null) {
                    this.snake.speedBeforeFoodEffect += SURVIVAL_SPEED_INCREASE_AMOUNT;
                }

                // console.log(`Survival Speed Increased to: ${this.snake.speed.toFixed(2)}`);
                this.updateGameSpeed(); // Update game's tracker/log
                this.lastSurvivalSpeedIncreaseTime = currentTime;
            }
        }

        // Combo break check
        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) {
            this.comboCount = 0;
            this.activeComboMultiplier = 1;
            this.currentComboBonusScore = 0;
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        // Food eating and combo logic
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime) < COMBO_TIMER_DURATION) {
                this.comboCount++;
            } else {
                this.comboCount = 1;
            }
            this.lastFoodEatTime = currentTime;

            if (this.comboCount >= COMBO_MIN_FOR_MULTIPLIER) {
                this.activeComboMultiplier = COMBO_SCORE_MULTIPLIER;
            } else {
                this.activeComboMultiplier = 1;
            }
            this.currentComboBonusScore = (this.comboCount > 1) ? (this.comboCount - 1) * COMBO_ITEM_BONUS_SCORE : 0;
            
            let baseFoodScore = foodData.score;
            let finalScoreForFood = (baseFoodScore + this.currentComboBonusScore) * this.activeComboMultiplier;
            finalScoreForFood *= this.scoreMultiplier; 

            this.score += Math.round(finalScoreForFood);
            
            this.uiManager.updateScore(this.score);
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
            
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    break;
                case FOOD_EFFECTS.SLOW_DOWN:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    break;
                case FOOD_EFFECTS.EXTRA_GROWTH:
                    this.snake.grow(foodData.growAmount);
                    break;
                default:
                    this.snake.grow(1);
                    break;
            }
            this.food.spawnNew();
        }

        // Collision check
        if (this.snake.checkCollision()) {
            let hitAbsorbedByShield = false;
            if (this.isShieldActive) { 
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    hitAbsorbedByShield = true;
                }
            }
            if (!hitAbsorbedByShield) {
                this.gameOver();
            }
        }
    }

    draw() {
        this.board.draw();
        this.food.draw(this.context);
        this.powerUpManager.draw(this.context);
        this.snake.draw(this.context);

        if (this.gameState === GAME_STATE.GAME_OVER) this.drawGameOverMessage();
        else if (this.gameState === GAME_STATE.PAUSED) this.drawPausedMessage();
        else if (this.gameState === GAME_STATE.READY) this.drawReadyMessage();
    }

    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(24, GRID_SIZE * 1.5);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game 🌌', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawGameOverMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 2.5);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.8);
        const scoreFontSize = Math.min(18, GRID_SIZE * 1.2);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        let yPos = this.canvas.height / 2 - 40;
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--food-color', '#FF5252');
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, yPos);
        yPos += titleFontSize * 1.2;
        this.context.font = `${scoreFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.2;
        this.context.fillText(`High Score: ${this.uiManager.highScore}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.5;
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Tap to Restart', this.canvas.width / 2, yPos);
    }

    drawPausedMessage() {
        const overlayBgColor = getCssVariable('--modal-overlay-bg', 'rgba(0, 0, 0, 0.75)');
        this.context.fillStyle = overlayBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const boxWidth = Math.min(this.canvas.width * 0.7, 300);
        const boxHeight = GRID_SIZE * 10;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;
        
        const boxBgColor = getCssVariable('--modal-content-bg', '#333333');
        this.context.fillStyle = boxBgColor;
        this.context.fillRect(boxX, boxY, boxWidth, boxHeight);

        const boxBorderColor = getCssVariable('--border-color', '#444444');
        this.context.strokeStyle = boxBorderColor;
        this.context.lineWidth = 2;
        this.context.strokeRect(boxX, boxY, boxWidth, boxHeight);

        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleColor = getCssVariable('--accent-color', '#FFEB3B');
        const instructionColor = getCssVariable('--modal-text-color', '#FFFFFF');

        const titleFontSize = Math.min(28, GRID_SIZE * 1.7);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = titleColor;
        this.context.textAlign = 'center';
        let textY = boxY + boxHeight * 0.35;
        this.context.fillText('GAME PAUSED', this.canvas.width / 2, textY);

        const instructionFontSize = Math.min(15, GRID_SIZE * 0.9);
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillStyle = instructionColor;
        textY += titleFontSize * 0.8 + instructionFontSize * 0.5;
        this.context.fillText('Press SPACE / ESC / TAP to Resume', this.canvas.width / 2, textY);
    }

    gameOver() {
        this.comboCount = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        if (this.uiManager && this.uiManager.updateComboDisplay) {
             this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) {
            cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = null;
        }
        this.snake.revertSpeed(); 
        this.powerUpManager.reset(); 
        this.uiManager.updateHighScore();
        this.draw();
    }

    togglePause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
                this.gameLoopRequestId = null;
            }
            this.draw(); 
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.start();
        }
    }

    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    handleEscape() {
        this.togglePause();
    }

    updateGameSpeed() {
        this.effectiveGameSpeed = this.snake.speed;
        // console.log(`Game effective speed synced: ${this.effectiveGameSpeed.toFixed(2)}`);
    }
}
