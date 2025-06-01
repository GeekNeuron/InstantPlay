// assets/js/input.js

import { KEYS, GAME_STATE } from './constants.js'; // Ensure GAME_STATE is imported

export class InputHandler {
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
            // Optional log for any keydown to see if listener is active
            // console.log("InputHandler: Key pressed:", event.key, "Current game state:", this.game.gameState);

            let newDx = null, newDy = null;

            switch (event.key) {
                case KEYS.ARROW_UP:
                case KEYS.W:
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
                    console.log("InputHandler: SPACE key pressed. Current game state:", this.game.gameState);
                    event.preventDefault(); // Prevent page scroll if space is pressed
                    this.game.togglePause(); // Handles start, pause, resume
                    return; // No direction change, action handled
                case KEYS.ESCAPE:
                    console.log("InputHandler: ESCAPE key pressed. Current game state:", this.game.gameState);
                    this.game.handleEscape(); // Usually toggles pause
                    return; // No direction change
                default:
                    return; // Ignore other keys
            }

            // If a valid movement key was pressed, queue the direction
            if (newDx !== null && newDy !== null) {
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
                // Prevent default actions like scrolling only if game is in a state where touch interaction is for the game
                if (this.game.gameState === GAME_STATE.PLAYING || this.game.gameState === GAME_STATE.PAUSED || this.game.gameState === GAME_STATE.READY) {
                    event.preventDefault();
                }
            }
        }, { passive: false }); // passive: false to allow preventDefault

        gameArea.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1) { // Single touch
                const touchEndX = event.changedTouches[0].screenX;
                const touchEndY = event.changedTouches[0].screenY;
                this.handleSwipe(touchEndX, touchEndY);
                if (this.game.gameState === GAME_STATE.PLAYING || this.game.gameState === GAME_STATE.PAUSED || this.game.gameState === GAME_STATE.READY) {
                     event.preventDefault();
                }
            }
        }, { passive: false });
    }

    /**
     * Processes the swipe gesture based on start and end coordinates
     * and queues the corresponding direction change or triggers game start on tap.
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
                newDx = (deltaX > 0) ? 1 : -1; // Right or Left
                newDy = 0;
            }
        } else { // Vertical swipe or tap
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                newDx = 0;
                newDy = (deltaY > 0) ? 1 : -1; // Down or Up
            }
        }

        if (newDx !== null && newDy !== null) { // It was a swipe for direction
            this.queuedDirection = { dx: newDx, dy: newDy };
            console.log("InputHandler: Swipe detected for direction.", this.queuedDirection);
        } else if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
            // This is considered a tap because swipe distance was not met
            console.log("InputHandler: Tap detected. Current game state:", this.game.gameState);
             // GAME_STATE is used here, so its import is crucial
             if (this.game.gameState === GAME_STATE.READY || this.game.gameState === GAME_STATE.GAME_OVER) {
                console.log("InputHandler: Tap is triggering game.start()");
                this.game.start();
            }
        }
    }

    /**
     * Applies the queued direction change to the snake.
     * This is called by the game loop before the snake moves.
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
