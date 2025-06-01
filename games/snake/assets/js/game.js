// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { SoundEffectsManager } from './sfx.js';
import { PowerUpManager } from './powerups.js';
import { ROWS, COLS, GAME_STATE, FOOD_SCORE, INITIAL_SNAKE_SPEED } from './constants.js';

/**
 * @fileoverview Main game logic and orchestration.
 */

export class Game {
    constructor(canvasId, scoreId, highScoreId, messageId = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Canvas with id "${canvasId}" not found.`);
        this.context = this.canvas.getContext('2d');

        this.scoreElement = document.getElementById(scoreId);
        this.highScoreElement = document.getElementById(highScoreId);
        // this.messageElement = messageId ? document.getElementById(messageId) : null; // TODO: Add a message element in HTML

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        // Initialize components
        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board); // Start snake on left-middle
        this.food = new Food(this.board, this.snake); // Pass snake to avoid spawning on it
        this.inputHandler = new InputHandler(this); // Pass game instance for callbacks
        this.uiManager = new UIManager(this.scoreElement, this.highScoreElement /*, this.messageElement */);
        this.sfx = new SoundEffectsManager();
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);

        this.score = 0;
        this.scoreMultiplier = 1; // For power-ups
        this.isShieldActive = false; // For shield power-up

        this.gameSpeed = INITIAL_SNAKE_SPEED; // Updates per second

        this.init();
    }

    /**
     * Initializes the game.
     */
    init() {
        console.log("Game Initializing...");
        this.uiManager.resetScore();
        this.uiManager.loadHighScore(); // Load and display high score
        this.uiManager.updateHighScoreDisplay();

        this.resetGame();
        this.gameState = GAME_STATE.READY;
        console.log("Game Ready. Press Space or Swipe to Start.");
        this.uiManager.showMessage("Press Space or Swipe to Start", "info"); // Need a message element
        this.draw(); // Initial draw of ready state
    }

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
        this.isShieldActive = false;
        this.gameSpeed = INITIAL_SNAKE_SPEED;
        this.updateGameSpeed(); // To set the correct initial interval
    }


    /**
     * Starts the game loop.
     */
    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame();
            this.gameState = GAME_STATE.PLAYING;
            this.uiManager.hideMessage(); // Hide "Press Space" or "Game Over" message
            this.lastFrameTime = performance.now();
            this.gameLoop();
            console.log("Game Started.");
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    /**
     * The main game loop.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            return;
        }

        this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));

        const deltaTime = timestamp - this.lastFrameTime;
        const interval = 1000 / this.gameSpeed;

        if (deltaTime > interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval);

            // 1. Process Input
            this.inputHandler.applyQueuedDirection();

            // 2. Update Game State
            this.update(timestamp); // Pass current time for power-up manager

            // 3. Render
            this.draw();
        }
    }

    /**
     * Updates all game logic.
     * @param {number} currentTime - Current timestamp for time-based logic.
     */
    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime); // Update powerups (spawn, check collection, effects)

        // Check for collision with food
        if (arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            this.score += (FOOD_SCORE * this.scoreMultiplier);
            this.uiManager.updateScore(this.score);
            this.snake.grow();
            this.food.spawnNew();
            this.sfx.play('eat');
            // Maybe increase speed slightly on eating food (optional difficulty increase)
            // this.gameSpeed += 0.1; this.updateGameSpeed();
        }

        // Check for game over conditions
        if (this.snake.checkCollision()) {
            if (this.isShieldActive) {
                this.isShieldActive = false; // Shield absorbed one hit
                // Potentially remove the colliding segment if it was a self-collision
                // Or allow passing through walls once. For simplicity, shield just prevents game over once.
                console.log("Shield absorbed a hit!");
                this.sfx.play('powerUp'); // Or a specific shield break sound
            } else {
                this.gameOver();
            }
        }
    }

    /**
     * Draws all game elements.
     */
    draw() {
        this.board.draw(); // Clears and draws board background/obstacles
        this.food.draw(this.context);
        this.powerUpManager.draw(this.context);
        this.snake.draw(this.context);

        if (this.gameState === GAME_STATE.GAME_OVER) {
             this.drawGameOverMessage();
        } else if (this.gameState === GAME_STATE.PAUSED) {
             this.drawPausedMessage();
        } else if (this.gameState === GAME_STATE.READY) {
            this.drawReadyMessage();
        }
    }

    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        this.context.font = '20px Arial';
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText('Press Space or Swipe to Start', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawGameOverMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        this.context.font = '24px Arial';
        this.context.fillStyle = 'red';
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.context.font = '18px Arial';
        this.context.fillStyle = 'white';
        this.context.fillText(`Score: ${this.score}. Press Space to Restart.`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawPausedMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        this.context.font = '24px Arial';
        this.context.fillStyle = 'yellow';
        this.context.textAlign = 'center';
        this.context.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2);
    }


    /**
     * Handles game over sequence.
     */
    gameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) {
            cancelAnimationFrame(this.gameLoopRequestId);
        }
        this.uiManager.updateHighScore();
        this.sfx.play('gameOver');
        console.log(`Game Over. Final Score: ${this.score}. High Score: ${this.uiManager.highScore}`);
        // this.uiManager.showGameOverScreen(this.score); // More elaborate UI later
        this.draw(); // Draw one last time to show game over message
    }

    /**
     * Toggles the game pause state.
     */
    togglePause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
            }
            this.sfx.play('click'); // or a specific pause sound
            console.log("Game Paused.");
            // this.uiManager.showPauseScreen();
            this.draw(); // Draw pause message
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER){
            this.start(); // Allow space to start the game
        }
    }

    /**
     * Resumes the game from a paused state.
     */
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            // this.uiManager.hidePauseScreen();
            this.lastFrameTime = performance.now(); // Reset lastFrameTime to avoid large jump
            this.gameLoop();
            console.log("Game Resumed.");
        }
    }

    /**
     * Handles the Escape key press.
     */
    handleEscape() {
        if (this.gameState === GAME_STATE.PLAYING || this.gameState === GAME_STATE.PAUSED) {
            this.togglePause();
        }
        // Could also be used to go back to a main menu if one exists
    }

    /**
     * Updates the game's speed (interval of the game loop).
     */
    updateGameSpeed() {
        if (this.snake) { // Ensure snake exists if called early
             // The game loop itself uses this.gameSpeed to calculate the interval.
             // No direct timer needs to be cleared/reset here, the loop will adapt.
             console.log(`Game speed updated to: ${this.snake.speed} (effective: ${this.gameSpeed})`);
        }
    }
}

function arePositionsEqual(pos1, pos2) {
    if (!pos1 || !pos2) return false;
    return pos1.x === pos2.x && pos1.y === pos2.y;
}
