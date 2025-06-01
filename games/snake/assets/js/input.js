// assets/js/input.js

import { KEYS } from './constants.js';

/**
 * @fileoverview Handles user input (keyboard and touch) for the game.
 */

export class InputHandler {
    /**
     * @param {Game} game - Reference to the main game object to call its methods (e.g., togglePause, snake.changeDirection).
     */
    constructor(game) {
        this.game = game;
        this.queuedDirection = null; // Stores the next direction to be applied {dx, dy}

        // Touch input state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 30; // Minimum pixel distance for a swipe

        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    /**
     * Sets up keyboard event listeners for snake movement and game actions.
     */
    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            // Prevent default browser actions for arrow keys and space if game is active
            if (this.game.gameState === 'playing' || this.game.gameState === 'paused' || this.game.gameState === 'ready') {
                 if (Object.values(KEYS).includes(event.key) && event.key !== KEYS.ESCAPE) { // Allow escape for browser
                    // event.preventDefault(); // Be careful with this, can block dev tools etc.
                 }
            }

            let newDx = null, newDy = null;

            switch (event.key) {
                case KEYS.ARROW_UP:
                case KEYS.W:
                    // Prevent moving down if currently moving up (implicitly handled by queuedDirection logic now)
                    newDx = 0; newDy = -1;
                    break;
                case KEYS.ARROW_DOWN:
                case KEYS.S:
                    newDx = 0; newDy = 1;
                    break;
                case KEYS.ARROW_LEFT:
                case KEYS.A:
                    newDx = -1; newDy = 0;
                    break;
                case KEYS.ARROW_RIGHT:
                case KEYS.D:
                    newDx = 1; newDy = 0;
                    break;
                case KEYS.SPACE:
                    event.preventDefault(); // Prevent page scroll if space is pressed
                    this.game.togglePause(); // Handles start, pause, resume
                    return; // No direction change, action handled
                case KEYS.ESCAPE:
                    // No preventDefault for Escape, allow browser default (e.g., exit fullscreen)
                    this.game.handleEscape(); // Usually toggles pause
                    return; // No direction change
                default:
                    return; // Ignore other keys
            }

            // If a valid movement key was pressed, queue the direction
            if (newDx !== null && newDy !== null) {
                // Only queue if it's a change from current snake direction or if snake is short
                // The snake itself will prevent 180-degree turns.
                 this.queuedDirection = { dx: newDx, dy: newDy };
            }
        });
    }

    /**
     * Sets up touch event listeners for swipe gestures.
     * Attaches to the game canvas.
     */
    setupTouchListeners() {
        const gameArea = this.game.canvas; // Listen on the canvas element

        gameArea.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) { // Single touch
                this.touchStartX = event.touches[0].screenX;
                this.touchStartY = event.touches[0].screenY;
                // event.preventDefault(); // Only prevent if game is active to allow scrolling on page otherwise
                if (this.game.gameState === 'playing' || this.game.gameState === 'paused' || this.game.gameState === 'ready') {
                    event.preventDefault();
                }
            }
        }, { passive: false }); // passive: false to allow preventDefault

        gameArea.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1) { // Single touch
                const touchEndX = event.changedTouches[0].screenX;
                const touchEndY = event.changedTouches[0].screenY;
                this.handleSwipe(touchEndX, touchEndY);
                if (this.game.gameState === 'playing' || this.game.gameState === 'paused' || this.game.gameState === 'ready') {
                     event.preventDefault();
                }
            }
        }, { passive: false });
    }

    /**
     * Processes the swipe gesture based on start and end coordinates
     * and queues the corresponding direction change.
     * @param {number} touchEndX - The X coordinate of the touch end.
     * @param {number} touchEndY - The Y coordinate of the touch end.
     */
    handleSwipe(touchEndX, touchEndY) {
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        let newDx = null, newDy = null;

        // Determine if swipe is primarily horizontal or vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                newDx = (deltaX > 0) ? 1 : -1;
                newDy = 0;
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                newDx = 0;
                newDy = (deltaY > 0) ? 1 : -1;
            }
        }

        if (newDx !== null && newDy !== null) {
            this.queuedDirection = { dx: newDx, dy: newDy };
        } else if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
            // If it's a tap (not a swipe), and game is ready or over, treat as start/restart
             if (this.game.gameState === GAME_STATE.READY || this.game.gameState === GAME_STATE.GAME_OVER) {
                this.game.start();
            } else if (this.game.gameState === GAME_STATE.PAUSED && (this.game.canvas === event.target)) {
                 // Optional: Tap on canvas to resume if paused
                 // this.game.resume();
            }
        }
    }

    /**
     * Applies the queued direction change to the snake.
     * This is called by the game loop before the snake moves.
     * The snake's own `changeDirection` method handles 180-degree turn prevention.
     */
    applyQueuedDirection() {
        if (this.queuedDirection) {
            this.game.snake.changeDirection(this.queuedDirection.dx, this.queuedDirection.dy);
            this.queuedDirection = null; // Clear the queue after applying
        }
    }

    /**
     * Resets the input handler's state (e.g., clears queued direction).
     * Called when a new game starts.
     */
    reset() {
        this.queuedDirection = null;
    }
}
