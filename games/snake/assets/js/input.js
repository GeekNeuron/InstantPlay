// assets/js/input.js

import { KEYS } from './constants.js';

/**
 * @fileoverview Handles user input (keyboard and touch) for the game.
 */

export class InputHandler {
    constructor(game) {
        this.game = game; // Reference to the main game object to call its methods
        this.currentDirection = { dx: 1, dy: 0 }; // Initial direction (right)
        this.queuedDirection = null; // Buffer for next direction change

        // Touch input state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 30; // Minimum distance for a swipe to be registered

        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    /**
     * Sets up keyboard event listeners.
     */
    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            let newDx = this.currentDirection.dx;
            let newDy = this.currentDirection.dy;

            switch (event.key) {
                case KEYS.ARROW_UP:
                case KEYS.W:
                    if (this.currentDirection.dy === 0) { newDx = 0; newDy = -1; }
                    break;
                case KEYS.ARROW_DOWN:
                case KEYS.S:
                    if (this.currentDirection.dy === 0) { newDx = 0; newDy = 1; }
                    break;
                case KEYS.ARROW_LEFT:
                case KEYS.A:
                    if (this.currentDirection.dx === 0) { newDx = -1; newDy = 0; }
                    break;
                case KEYS.ARROW_RIGHT:
                case KEYS.D:
                    if (this.currentDirection.dx === 0) { newDx = 1; newDy = 0; }
                    break;
                case KEYS.SPACE:
                    this.game.togglePause(); // Example: Space to pause/resume
                    event.preventDefault(); // Prevent page scroll
                    return; // No direction change
                case KEYS.ESCAPE:
                    // Handle Escape key (e.g., pause, open menu)
                    this.game.handleEscape();
                    return;
            }

            // Queue the direction change to be applied at the start of the next game tick
            // This prevents issues with rapid key presses within a single game tick.
            if (newDx !== this.currentDirection.dx || newDy !== this.currentDirection.dy) {
                 this.queuedDirection = { dx: newDx, dy: newDy };
            }
        });
    }

    /**
     * Sets up touch event listeners for swipe gestures.
     */
    setupTouchListeners() {
        const gameArea = this.game.canvas; // Or a larger touch-sensitive div

        gameArea.addEventListener('touchstart', (event) => {
            this.touchStartX = event.changedTouches[0].screenX;
            this.touchStartY = event.changedTouches[0].screenY;
            event.preventDefault(); // Prevent scrolling/zooming
        }, { passive: false });

        gameArea.addEventListener('touchend', (event) => {
            this.touchEndX = event.changedTouches[0].screenX;
            this.touchEndY = event.changedTouches[0].screenY;
            this.handleSwipe();
            event.preventDefault();
        }, { passive: false });
    }

    /**
     * Processes the swipe gesture and determines direction.
     */
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        let newDx = this.currentDirection.dx;
        let newDy = this.currentDirection.dy;

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0 && this.currentDirection.dx === 0) { // Swipe Right
                    newDx = 1; newDy = 0;
                } else if (deltaX < 0 && this.currentDirection.dx === 0) { // Swipe Left
                    newDx = -1; newDy = 0;
                }
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                if (deltaY > 0 && this.currentDirection.dy === 0) { // Swipe Down
                    newDx = 0; newDy = 1;
                } else if (deltaY < 0 && this.currentDirection.dy === 0) { // Swipe Up
                    newDx = 0; newDy = -1;
                }
            }
        }
        if (newDx !== this.currentDirection.dx || newDy !== this.currentDirection.dy) {
            this.queuedDirection = { dx: newDx, dy: newDy };
       }
    }


    /**
     * Applies the queued direction change to the snake and updates currentDirection.
     * This should be called by the game loop before the snake moves.
     */
    applyQueuedDirection() {
        if (this.queuedDirection) {
            // Check if the new direction is not directly opposite to the current one
            // (This check is also in Snake.changeDirection, but good to have early)
            if (!(this.queuedDirection.dx === -this.currentDirection.dx && this.currentDirection.dx !== 0) &&
                !(this.queuedDirection.dy === -this.currentDirection.dy && this.currentDirection.dy !== 0)) {
                this.game.snake.changeDirection(this.queuedDirection.dx, this.queuedDirection.dy);
                this.currentDirection.dx = this.queuedDirection.dx;
                this.currentDirection.dy = this.queuedDirection.dy;
            }
            this.queuedDirection = null; // Clear the queue
        }
    }

    /**
     * Resets the input handler's state (e.g., for a new game).
     */
    reset() {
        this.currentDirection = { dx: 1, dy: 0 }; // Default to right
        this.queuedDirection = null;
    }
}
