// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { SoundEffectsManager } from './sfx.js';
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js'; // Import POWERUP_COLLECTIBLE_TYPES
import { ROWS, COLS, GAME_STATE, FOOD_EFFECTS, INITIAL_SNAKE_SPEED } from './constants.js';
import { arePositionsEqual } from './utils.js';

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
        if (!this.canvas) throw new Error(`Game.constructor: Canvas with id "${canvasId}" not found.`);
        this.context = this.canvas.getContext('2d');

        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const messageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        // Initialize game components
        this.board = new Board(this.canvas, this.context);
        this.sfx = new SoundEffectsManager(); // Init SFX early
        // Snake needs 'this' (game instance) for callbacks like updateGameSpeed
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        // PowerUpManager needs snake and game (for sfx, applying effects)
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        // Food needs board, snake, and powerUpManager (to avoid spawning on items)
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this); // InputHandler needs game for actions
        this.uiManager = new UIManager(scoreElement, highScoreElement, messageOverlayElement, this);

        this.score = 0;
        this.scoreMultiplier = 1; // For score-modifying effects (currently unused, example for power-up)

        // Shield specific state (managed by PowerUpManager effects, but game needs to know)
        this.isShieldActive = false;
        this.shieldHitCount = 0; // If shield can take multiple hits

        this.effectiveGameSpeed = this.snake.speed; // Game loop interval is based on snake's speed

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

        this.resetGame(); // Resets snake, food, score, power-ups
        this.gameState = GAME_STATE.READY;
        console.log("Game Ready. Press Space, Escape, or Swipe/Tap to Start.");
        this.draw(); // Initial draw of the ready screen
    }

    /**
     * Resets the game to its starting state for a new round.
     */
    resetGame() {
        const startX = Math.floor(COLS / 4); // Start snake on the left, middle-ish
        const startY = Math.floor(ROWS / 2);
        this.snake.reset(startX, startY); // Resets snake's position, speed, growth, etc.
        this.inputHandler.reset();          // Clears queued input
        this.food.spawnNew();               // Spawns the first piece of food
        this.powerUpManager.reset();        // Clears active power-ups and effects
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.scoreMultiplier = 1;           // Reset score multiplier
        this.isShieldActive = false;        // Deactivate shield
        this.shieldHitCount = 0;
        this.updateGameSpeed();             // Sync effectiveGameSpeed with snake's current speed
    }

    /**
     * Starts the game if it's ready or game over. Resumes if paused.
     */
    start() {
        // Attempt to resume audio context on first user interaction to start game
        this.sfx.resumeContext();

        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame();
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now(); // Set time for the first frame
            if(this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId); // Ensure no old loops running
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
            // If game state changed (e.g. to PAUSED or GAME_OVER), stop requesting new frames.
            if(this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            return;
        }

        // Request the next frame. Store the ID to cancel if needed.
        this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));

        const deltaTime = timestamp - this.lastFrameTime;
        // Interval based on the snake's current speed (which can be affected by food/power-ups)
        const interval = 1000 / this.snake.speed;

        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval); // Adjust for consistent timing

            // 1. Process Input
            this.inputHandler.applyQueuedDirection();

            // 2. Update Game State
            this.update(timestamp); // Pass current time for time-based logic (e.g., power-up durations)

            // 3. Render
            this.draw();
        }
    }

    /**
     * Updates all game logic for the current frame.
     * @param {number} currentTime - Current timestamp from performance.now(), for timed effects.
     */
    update(currentTime) {
        this.snake.move();
        this.powerUpManager.update(currentTime); // Update collectible power-ups (spawn, check collection, effects)

        // Check for collision with food
        const foodData = this.food.getData();
        if (foodData && arePositionsEqual(this.snake.getHeadPosition(), this.food.getPosition())) {
            this.score += (foodData.score * this.scoreMultiplier);
            this.uiManager.updateScore(this.score);
            this.sfx.play('eat');

            // Apply food effect
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    this.sfx.play('foodEffect'); // Sound for effect activation
                    break;
                case FOOD_EFFECTS.SLOW_DOWN:
                    this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration);
                    this.sfx.play('foodEffect');
                    break;
                case FOOD_EFFECTS.EXTRA_GROWTH:
                    this.snake.grow(foodData.growAmount);
                    break;
                case FOOD_EFFECTS.NONE:
                default:
                    this.snake.grow(1); // Default growth for standard food
                    break;
            }
            this.food.spawnNew(); // Spawn new food after current one is eaten
        }

        // Check for game over conditions (wall/obstacle/self collision)
        if (this.snake.checkCollision()) {
            let hitAbsorbed = false;
            if (this.isShieldActive) { // Check if shield from PowerUpManager is active
                // The PowerUpManager's handleHitWithEffect will manage shield state
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    this.sfx.play('shieldHit');
                    console.log("Shield absorbed a hit!");
                    hitAbsorbed = true;
                     // If shield breaks, isShieldActive will be set to false by PowerUpManager's deactivate logic
                }
            }

            if (!hitAbsorbed) {
                this.gameOver();
            }
        }
    }

    /**
     * Draws all game elements onto the canvas.
     */
    draw() {
        this.board.draw(); // Clears and draws board background, grid, obstacles
        this.food.draw(this.context);
        this.powerUpManager.draw(this.context); // Draw collectible power-up items
        this.snake.draw(this.context);

        // Draw game state messages (Ready, Paused, Game Over)
        if (this.gameState === GAME_STATE.GAME_OVER) this.drawGameOverMessage();
        else if (this.gameState === GAME_STATE.PAUSED) this.drawPausedMessage();
        else if (this.gameState === GAME_STATE.READY) this.drawReadyMessage();
    }

    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        this.context.font = `bold ${Math.min(24, GRID_SIZE * 1.5)}px ${getCssVariable('--font-main')}`;
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game 🌌', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.context.font = `${Math.min(16, GRID_SIZE)}px ${getCssVariable('--font-main')}`;
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawGameOverMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 3);
        this.context.font = `bold ${Math.min(28, GRID_SIZE * 1.8)}px ${getCssVariable('--font-main')}`;
        this.context.fillStyle = '#FF5252'; // Reddish for Game Over
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.context.font = `${Math.min(18, GRID_SIZE * 1.2)}px ${getCssVariable('--font-main')}`;
        this.context.fillStyle = 'white';
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.context.fillText(`High Score: ${this.uiManager.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
        this.context.font = `${Math.min(16, GRID_SIZE)}px ${getCssVariable('--font-main')}`;
        this.context.fillText('Press Space or Tap to Restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    drawPausedMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        this.context.font = `bold ${Math.min(24, GRID_SIZE * 1.6)}px ${getCssVariable('--font-main')}`;
        this.context.fillStyle = '#FFEB3B'; // Yellowish for Paused
        this.context.textAlign = 'center';
        this.context.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2 + 5); // Adjusted Y for better centering
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
        this.snake.revertSpeed(); // Ensure speed is normal for game over screen logic if any
        this.uiManager.updateHighScore(); // Check and save high score
        this.sfx.play('gameOver');
        console.log(`Game Over. Final Score: ${this.score}. High Score: ${this.uiManager.highScore}`);
        this.draw(); // Draw one last time to show game over message
    }

    /**
     * Toggles the game pause state if playing or paused.
     * If ready or game over, pressing space (handled here via togglePause) will start the game.
     */
    togglePause() {
        this.sfx.resumeContext(); // Ensure audio context is active for pause/resume sounds

        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) {
                cancelAnimationFrame(this.gameLoopRequestId);
                this.gameLoopRequestId = null;
            }
            this.sfx.play('click');
            console.log("Game Paused.");
            this.draw(); // Draw pause message
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.start(); // Allow space/escape to start/restart the game
        }
    }

    /**
     * Resumes the game from a paused state.
     */
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.sfx.play('click');
            this.lastFrameTime = performance.now(); // Reset lastFrameTime to avoid large jump in deltaTime
            if(this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
            console.log("Game Resumed.");
        }
    }

    /**
     * Handles the Escape key press, typically to toggle pause.
     */
    handleEscape() {
        this.togglePause(); // For now, Escape does the same as Space (pause/resume/start)
    }

    /**
     * Called by Snake or other components when the snake's speed property changes.
     * The game loop now directly uses `this.snake.speed` for its interval calculation.
     * This method can be used for logging or if other systems need to react to speed changes.
     */
    updateGameSpeed() {
        this.effectiveGameSpeed = this.snake.speed; // Sync local tracker if needed
        // console.log(`Game's tracked effective speed updated. Snake speed: ${this.snake.speed.toFixed(2)}`);
        // No need to restart the loop here; the loop's interval calculation will use the new snake.speed.
    }
}
