// assets/js/input.js

import { KEYS, GAME_STATE } from './constants.js'; // Added GAME_STATE for logging

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.queuedDirection = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 30;
        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            // Log any keydown to see if listener is active
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
                    console.log("InputHandler: SPACE key pressed. Current game state:", this.game.gameState); // LOG ADDED
                    event.preventDefault();
                    this.game.togglePause();
                    return;
                case KEYS.ESCAPE:
                    console.log("InputHandler: ESCAPE key pressed. Current game state:", this.game.gameState); // LOG ADDED
                    this.game.handleEscape();
                    return;
                default:
                    return;
            }
            if (newDx !== null && newDy !== null) {
                this.queuedDirection = { dx: newDx, dy: newDy };
            }
        });
    }

    setupTouchListeners() {
        const gameArea = this.game.canvas;
        gameArea.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.touchStartX = event.touches[0].screenX;
                this.touchStartY = event.touches[0].screenY;
                if (this.game.gameState === GAME_STATE.PLAYING || this.game.gameState === GAME_STATE.PAUSED || this.game.gameState === GAME_STATE.READY) {
                    event.preventDefault();
                }
            }
        }, { passive: false });

        gameArea.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1) {
                const touchEndX = event.changedTouches[0].screenX;
                const touchEndY = event.changedTouches[0].screenY;
                this.handleSwipe(touchEndX, touchEndY);
                if (this.game.gameState === GAME_STATE.PLAYING || this.game.gameState === GAME_STATE.PAUSED || this.game.gameState === GAME_STATE.READY) {
                     event.preventDefault();
                }
            }
        }, { passive: false });
    }

    handleSwipe(touchEndX, touchEndY) {
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        let newDx = null, newDy = null;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                newDx = (deltaX > 0) ? 1 : -1;
                newDy = 0;
            }
        } else {
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                newDx = 0;
                newDy = (deltaY > 0) ? 1 : -1;
            }
        }

        if (newDx !== null && newDy !== null) {
            // This means it was a swipe for direction change
            this.queuedDirection = { dx: newDx, dy: newDy };
            console.log("InputHandler: Swipe detected for direction.", this.queuedDirection); // LOG ADDED
        } else if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
            // This is considered a tap
            console.log("InputHandler: Tap detected. Current game state:", this.game.gameState); // LOG ADDED
             if (this.game.gameState === GAME_STATE.READY || this.game.gameState === GAME_STATE.GAME_OVER) {
                console.log("InputHandler: Tap is triggering game.start()"); // LOG ADDED
                this.game.start();
            }
        }
    }

    applyQueuedDirection() {
        if (this.queuedDirection) {
            this.game.snake.changeDirection(this.queuedDirection.dx, this.queuedDirection.dy);
            this.queuedDirection = null;
        }
    }

    reset() {
        this.queuedDirection = null;
    }
}
