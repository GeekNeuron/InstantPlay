// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { SoundEffectsManager } from './sfx.js';
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js'; // Import specific collectible types if needed for logic here
import { ROWS, COLS, GAME_STATE, FOOD_EFFECTS, INITIAL_SNAKE_SPEED, GRID_SIZE } from './constants.js'; // Ensure GRID_SIZE is imported
import { arePositionsEqual, getCssVariable } from './utils.js';

/**
 * @fileoverview Main game logic and orchestration class.
 */

export class Game {
    /**
     * Initializes the game instance.
     * @param {string} canvasId - ID of the HTML canvas element.
     * @param {string} scoreId - ID of the HTML element to display score.
     * @param {string} highScoreId - ID of the HTML element to display high score.
     * @param {string} [messageOverlayId] - Optional ID of an HTML element for modal messages.
     */
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
        // const messageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        // Initialize game components
        this.board = new Board(this.canvas, this.context);
        this.sfx = new SoundEffectsManager();
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, /* messageOverlayElement, */ this);

        this.score = 0;
        this.scoreMultiplier = 1;

        this.isShieldActive = false; // Game's view of whether a shield (from powerup) is active
        this.shieldHitCount = 0; // Example if shield could take multiple hits

        this.effectiveGameSpeed = this.snake.speed;

        this.init();
    }

    /**
     * Sets up the initial game state, ready to play.
     */
    init() {
        console.log("Game Initializing...");
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();

        this.resetGame();
        this.gameState = GAME_STATE.READY;
        console.log("Game Ready. Press Space, Escape, or Swipe/Tap to Start.");
        this.draw(); // Initial draw of the ready screen
    }

    /**
     * Resets the game to its starting state for a new round.
     */
    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);
        this.snake.reset(startX, startY);
        this.inputHandler.reset();
        this.food.spawnNew();
        this.powerUpManager.reset();
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.scoreMultiplier = 1;
        this.isShieldActive = false; // Shield is off by default
        this.shieldHitCount = 0;
        this.updateGameSpeed(); // Sync effectiveGameSpeed with snake's current (initial) speed
    }

    /**
     * Starts the game if it's ready or game over. Resumes if paused.
     * This is a key point for user interaction to resume AudioContext.
     */
    start() {
        this.sfx.resumeContext(); // Attempt to resume audio context on user gesture

        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame();
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
            console.log("Game Started/Restarted.");
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    /**
     * The main game loop, run via requestAnimationFrame.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            return;
        }

        this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));

        const deltaTime = timestamp - this.lastFrameTime;
        const interval = 1000 / this.snake.speed; // Interval based on snake's current speed

        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval);

            this.inputHandler.applyQueuedDirection();
            this.update(timestamp); // Pass current time for timed effects
            this.draw();
        }
    }

    /**
     * Updates all game logic for the current frame.
     * @param {number} currentTime - Current timestamp from performance.now().
     */
    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime);

        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            this.score += (foodData.score * this.scoreMultiplier);
            this.uiManager.updateScore(this.score);
            this.sfx.play('eat');

            let effectSoundPlayed = false;
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    this.sfx.play('foodEffect');
                    effectSoundPlayed = true;
                    break;
                case FOOD_EFFECTS.SLOW_DOWN:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    this.sfx.play('foodEffect');
                    effectSoundPlayed = true;
                    break;
                case FOOD_EFFECTS.EXTRA_GROWTH:
                    this.snake.grow(foodData.growAmount);
                    // No specific sound for extra growth beyond 'eat', unless desired
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
            // Check if a shield from PowerUpManager is active and can absorb the hit
            if (this.isShieldActive && this.powerUpManager.isEffectActive(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    this.sfx.play('shieldHit');
                    console.log("Shield absorbed a hit!");
                    hitAbsorbedByShield = true;
                    // isShieldActive flag might be turned off by the deactivate logic in PowerUpManager
                }
            }

            if (!hitAbsorbedByShield) {
                this.gameOver();
            }
        }
    }

    /**
     * Draws all game elements onto the canvas.
     */
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

        const mainFont = getCssVariable('--font-main', 'Arial'); // Fallback font
        const titleFontSize = Math.min(24, GRID_SIZE * 1.5); // GRID_SIZE is imported
        const instructionFontSize = Math.min(16, GRID_SIZE); // GRID_SIZE is imported

        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game 🌌', this.canvas.width / 2, this.canvas.height / 2 - 10);

        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawGameOverMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 2.5); // Adjusted height

        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.8);
        const scoreFontSize = Math.min(18, GRID_SIZE * 1.2);
        const instructionFontSize = Math.min(16, GRID_SIZE);

        let yPos = this.canvas.height / 2 - 40; // Start Y position for text

        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = '#FF5252'; // Reddish for Game Over
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, yPos);
        yPos += titleFontSize * 1.2;

        this.context.font = `${scoreFontSize}px ${mainFont}`;
        this.context.fillStyle = 'white';
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.2;

        this.context.fillText(`High Score: ${this.uiManager.highScore}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.5; // More space before instruction

        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Tap to Restart', this.canvas.width / 2, yPos);
    }

    drawPausedMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);

        const mainFont = getCssVariable('--font-main', 'Arial');
        const pausedFontSize = Math.min(24, GRID_SIZE * 1.6);

        this.context.font = `bold ${pausedFontSize}px ${mainFont}`;
        this.context.fillStyle = '#FFEB3B'; // Yellowish for Paused
        this.context.textAlign = 'center';
        this.context.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2 + (pausedFontSize / 3) - 2); // Adjust for better vertical center
    }


    /**
     * Handles game over sequence: updates state, stops loop, saves high score.
     */
    gameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) {
            cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = null;
        }
        this.snake.revertSpeed(); // Ensure speed is normal on game over
        this.uiManager.updateHighScore();
        this.sfx.play('gameOver');
        console.log(`Game Over. Final Score: ${this.score}. High Score: ${this.uiManager.highScore}`);
        this.draw(); // Draw game over message
    }

    /**
     * Toggles the game pause state if playing or paused.
     * If ready or game over, pressing space/escape (handled here) will start the game.
     */
    togglePause() {
        this.sfx.resumeContext(); // Good place to ensure context is active

        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
                this.gameLoopRequestId = null;
            }
            this.sfx.play('click');
            console.log("Game Paused.");
            this.draw();
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.start();
        }
    }

    /**
     * Resumes the game from a paused state.
     */
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.sfx.play('click');
            this.lastFrameTime = performance.now(); // Reset to avoid large jump
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
            console.log("Game Resumed.");
        }
    }

    /**
     * Handles the Escape key press, typically to toggle pause.
     */
    handleEscape() {
        this.togglePause();
    }

    /**
     * Called by Snake or other components when the snake's speed property changes.
     * The game loop directly uses `this.snake.speed`. This method is for logging or future use.
     */
    updateGameSpeed() {
        this.effectiveGameSpeed = this.snake.speed;
        // console.log(`Game's effective speed synced to snake.speed: ${this.effectiveGameSpeed.toFixed(2)}`);
    }
}
