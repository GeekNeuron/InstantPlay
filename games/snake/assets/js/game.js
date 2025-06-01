// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { SoundEffectsManager } from './sfx.js';
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js';
import { ROWS, COLS, GAME_STATE, FOOD_EFFECTS, INITIAL_SNAKE_SPEED, GRID_SIZE } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, messageOverlayId = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Game.constructor: Canvas with id "${canvasId}" not found.`);
        }
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            throw new Error(`Game.constructor: Could not get 2D context from canvas "${canvasId}".`);
        }

        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const resolvedMessageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        this.board = new Board(this.canvas, this.context);
        this.sfx = new SoundEffectsManager();
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, resolvedMessageOverlayElement, this);

        this.score = 0;
        this.scoreMultiplier = 1;
        this.isShieldActive = false;
        this.shieldHitCount = 0;
        this.effectiveGameSpeed = this.snake.speed;

        this.init();
    }

    init() {
        console.log("Game.init(): Initializing game state..."); // LOG ADDED
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame();
        this.gameState = GAME_STATE.READY;
        console.log("Game.init(): Game state set to READY. Message: Press Space, Escape, or Swipe/Tap to Start."); // LOG ADDED
        this.draw();
    }

    resetGame() {
        console.log("Game.resetGame(): Resetting game elements."); // LOG ADDED
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);
        this.snake.reset(startX, startY);
        this.inputHandler.reset();
        this.food.spawnNew();
        this.powerUpManager.reset();
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.scoreMultiplier = 1;
        this.isShieldActive = false;
        this.shieldHitCount = 0;
        this.updateGameSpeed();
    }

    start() {
        console.log("Game.start() called. Current state before action:", this.gameState); // LOG ADDED
        this.sfx.resumeContext();

        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            console.log("Game.start(): Conditions met (READY or GAME_OVER). Resetting and starting game."); // LOG ADDED
            this.resetGame();
            this.gameState = GAME_STATE.PLAYING;
            console.log("Game.start(): Game state changed to:", this.gameState); // LOG ADDED
            this.lastFrameTime = performance.now();
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
            console.log("Game.start(): Game loop initiated with ID:", this.gameLoopRequestId); // LOG ADDED
        } else if (this.gameState === GAME_STATE.PAUSED) {
            console.log("Game.start(): Game was PAUSED. Calling this.resume()."); // LOG ADDED
            this.resume();
        } else {
            console.warn("Game.start(): Conditions not met to start/resume. Current state:", this.gameState); // LOG ADDED (Warn)
        }
    }

    gameLoop(timestamp) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            // console.log("Game.gameLoop(): Not playing, stopping loop. State:", this.gameState); // Optional log
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
            this.draw();
        }
    }

    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime);
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            this.score += (foodData.score * this.scoreMultiplier);
            this.uiManager.updateScore(this.score);
            this.sfx.play('eat');
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    this.sfx.play('foodEffect');
                    break;
                case FOOD_EFFECTS.SLOW_DOWN:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodA.duration);
                    this.sfx.play('foodEffect');
                    break;
                case FOOD_EFFECTS.EXTRA_GROWTH:
                    this.snake.grow(foodData.growAmount);
                    break;
                case FOOD_EFFECTS.NONE:
                default:
                    this.snake.grow(1);
                    break;
            }
            this.food.spawnNew();
        }
        if (this.snake.checkCollision()) {
            let hitAbsorbedByShield = false;
            if (this.isShieldActive && this.powerUpManager.isEffectActive(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    this.sfx.play('shieldHit');
                    console.log("Shield absorbed a hit!");
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
        console.log("Game.gameOver() called. Final score:", this.score); // LOG ADDED
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) {
            cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = null;
        }
        this.snake.revertSpeed();
        this.uiManager.updateHighScore();
        this.sfx.play('gameOver');
        this.draw();
    }

    togglePause() {
        console.log("Game.togglePause() called. Current state:", this.gameState); // LOG ADDED
        this.sfx.resumeContext();
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
                this.gameLoopRequestId = null;
            }
            this.sfx.play('click');
            console.log("Game.togglePause(): Game PAUSED."); // LOG ADDED
            this.draw();
        } else if (this.gameState === GAME_STATE.PAUSED) {
            console.log("Game.togglePause(): Game was PAUSED. Calling resume()."); // LOG ADDED
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            console.log("Game.togglePause(): State is READY or GAME_OVER. Calling this.start()."); // LOG ADDED
            this.start();
        }
    }

    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.sfx.play('click');
            this.lastFrameTime = performance.now();
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
            console.log("Game.resume(): Game RESUMED. Loop ID:", this.gameLoopRequestId); // LOG ADDED
        }
    }

    handleEscape() {
        console.log("Game.handleEscape() called. Current state:", this.gameState); // LOG ADDED
        this.togglePause();
    }

    updateGameSpeed() {
        this.effectiveGameSpeed = this.snake.speed;
        // console.log(`Game effective speed synced: ${this.effectiveGameSpeed}`); // Optional log
    }
}
