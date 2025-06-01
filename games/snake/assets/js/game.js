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
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE
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

        this.board = new Board(this.canvas, this.context);
        // this.sfx = new SoundEffectsManager(); // Sound system disabled
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);

        this.score = 0;
        this.scoreMultiplier = 1; // From collectible power-ups
        this.isShieldActive = false;
        this.shieldHitCount = 0; // Not actively used by current shield logic but available
        this.effectiveGameSpeed = this.snake.speed;

        // Combo related properties
        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1; // Score multiplier derived from combo count
        this.currentComboBonusScore = 0; // Flat bonus points from combo items

        this.init();
    }

    init() {
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame(); // This will also call updateComboDisplay
        this.gameState = GAME_STATE.READY;
        this.draw();
    }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        this.board.obstacles = [];
        this.board.setupDefaultObstacles();

        this.snake.reset(startX, startY);
        this.inputHandler.reset();
        this.food.spawnNew();
        this.powerUpManager.reset(); // Resets collectible power-up effects
        
        this.score = 0;
        this.uiManager.updateScore(this.score);
        
        this.scoreMultiplier = 1; // Reset collectible power-up multiplier
        this.isShieldActive = false; // Game's view of shield, reset by PowerUpManager too

        // Reset combo state
        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        if (this.uiManager) {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        this.updateGameSpeed();
    }

    start() {
        // this.sfx.resumeContext(); // Sound system disabled

        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame();
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
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
        const interval = 1000 / this.snake.speed; // Snake's speed can change due to food effects
        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval);
            this.inputHandler.applyQueuedDirection();
            this.update(timestamp); // Pass currentTime for timed effects
            this.draw();
        }
    }

    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime); // Manages collectible power-ups

        // Check for combo break due to time out, before processing food eating
        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) {
            // console.log(`Combo broken! Count was ${this.comboCount}. Time diff: ${currentTime - this.lastFoodEatTime}`);
            this.comboCount = 0;
            this.activeComboMultiplier = 1;
            this.currentComboBonusScore = 0;
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            // Handle Combo Logic
            if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime) < COMBO_TIMER_DURATION) {
                this.comboCount++;
            } else {
                this.comboCount = 1; // Start/restart combo
            }
            this.lastFoodEatTime = currentTime;

            // Calculate combo multiplier and flat bonus
            if (this.comboCount >= COMBO_MIN_FOR_MULTIPLIER) {
                this.activeComboMultiplier = COMBO_SCORE_MULTIPLIER;
            } else {
                this.activeComboMultiplier = 1;
            }
            this.currentComboBonusScore = (this.comboCount > 1) ? (this.comboCount - 1) * COMBO_ITEM_BONUS_SCORE : 0;
            
            // Calculate score for this food
            let baseFoodScore = foodData.score;
            // scoreMultiplier is from collectible items, activeComboMultiplier is from combo eating streak
            let finalScoreForFood = (baseFoodScore * this.activeComboMultiplier) + this.currentComboBonusScore;
            finalScoreForFood *= this.scoreMultiplier; // Apply collectible score multiplier last

            this.score += Math.round(finalScoreForFood); // Add to total score
            
            this.uiManager.updateScore(this.score);
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
            // this.sfx.play('eat'); // Sound disabled

            // Apply food's direct effect (e.g., speed change, extra growth)
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    // this.sfx.play('foodEffect'); // Sound disabled
                    break;
                case FOOD_EFFECTS.SLOW_DOWN:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    // this.sfx.play('foodEffect'); // Sound disabled
                    break;
                case FOOD_EFFECTS.EXTRA_GROWTH:
                    this.snake.grow(foodData.growAmount);
                    break;
                case FOOD_EFFECTS.NONE:
                default:
                    this.snake.grow(1); // Default growth
                    break;
            }
            this.food.spawnNew(); // Spawn new food after current one is eaten
        }

        // Check for game over conditions
        if (this.snake.checkCollision()) {
            let hitAbsorbedByShield = false;
            if (this.isShieldActive) { // game.isShieldActive is set by Shield power-up's effect
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    // this.sfx.play('shieldHit'); // Sound disabled
                    console.log("Game: Shield absorbed hit via PowerUpManager.");
                    hitAbsorbedByShield = true;
                    // isShieldActive flag should be managed by the PowerUpManager's deactivate logic for the shield
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
        this.context.fillStyle = 'white';
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
        this.context.fillStyle = '#FF5252';
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, yPos);
        yPos += titleFontSize * 1.2;
        this.context.font = `${scoreFontSize}px ${mainFont}`;
        this.context.fillStyle = 'white';
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.2;
        this.context.fillText(`High Score: ${this.uiManager.highScore}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.5;
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Tap to Restart', this.canvas.width / 2, yPos);
    }

    drawPausedMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const pausedFontSize = Math.min(24, GRID_SIZE * 1.6);
        this.context.font = `bold ${pausedFontSize}px ${mainFont}`;
        this.context.fillStyle = '#FFEB3B';
        this.context.textAlign = 'center';
        this.context.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2 + (pausedFontSize / 3) - 2);
    }

    gameOver() {
        // Reset combo state on game over
        this.comboCount = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        if (this.uiManager) {
             this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) {
            cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = null;
        }
        this.snake.revertSpeed(); // Ensure speed effects from food are off
        this.powerUpManager.reset(); // Ensure collectible power-up effects (like score multiplier) are off
        this.uiManager.updateHighScore();
        // this.sfx.play('gameOver'); // Sound disabled
        this.draw(); // Draw the game over message
    }

    togglePause() {
        // this.sfx.resumeContext(); // Sound system disabled
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
                this.gameLoopRequestId = null;
            }
            // this.sfx.play('click'); // Sound disabled
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
            // this.sfx.play('click'); // Sound disabled
            this.lastFrameTime = performance.now(); // Reset time to avoid jump
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    handleEscape() {
        this.togglePause();
    }

    updateGameSpeed() {
        this.effectiveGameSpeed = this.snake.speed;
        // console.log(`Game effective speed synced to snake.speed: ${this.effectiveGameSpeed.toFixed(2)}`);
    }
}
