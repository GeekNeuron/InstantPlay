// assets/js/snake.js

import { GRID_SIZE, INITIAL_SNAKE_SPEED } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

/**
 * @fileoverview Represents the snake in the game.
 */

export class Snake {
    /**
     * Creates a new Snake.
     * @param {number} startX - Initial X position of the snake's head on the grid.
     * @param {number} startY - Initial Y position of the snake's head on the grid.
     * @param {Board} board - Reference to the game board for boundary checks.
     * @param {Game} game - Reference to the main game instance for callbacks like updateGameSpeed.
     */
    constructor(startX, startY, board, game) {
        this.board = board;
        this.game = game; // Store game reference for callbacks
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }]; // Head is the first element
        this.dx = 1; // Initial movement direction: 1 for right
        this.dy = 0; // Initial movement direction: 0 for horizontal

        this.initialSpeed = INITIAL_SNAKE_SPEED; // Store the base speed for reference
        this.speed = this.initialSpeed;          // Current actual speed of the snake
        this.speedFactor = 1;                    // Current speed multiplier (1 means normal speed)
        this.activeSpeedEffectTimeout = null;    // Timeout ID for temporary speed effects

        this.segmentsToGrow = 0; // Number of segments to add on subsequent moves

        // Colors will be fetched on each draw to reflect theme changes
        this.colorHead = '';
        this.colorBody = '';
    }

    /**
     * Updates the snake's position based on its current direction.
     * Handles growth by not removing the tail if segmentsToGrow > 0.
     */
    move() {
        const head = { x: this.body[0].x + this.dx, y: this.body[0].y + this.dy };
        this.body.unshift(head); // Add new head

        if (this.segmentsToGrow > 0) {
            this.segmentsToGrow--; // Decrement growth counter
        } else {
            this.body.pop(); // Remove tail unless growing
        }
    }

    /**
     * Changes the snake's direction. Prevents reversing directly onto itself
     * and ensures movement is strictly horizontal or vertical.
     * @param {number} newDx - The new X direction (-1, 0, or 1).
     * @param {number} newDy - The new Y direction (-1, 0, or 1).
     */
    changeDirection(newDx, newDy) {
        // Prevent moving in the opposite direction immediately if snake has more than one segment
        if (this.body.length > 1 && this.dx === -newDx && this.dy === -newDy) {
            return;
        }
        // Ensure only one direction is non-zero (no diagonal movement)
        // And that the new direction is different from the current one to avoid redundant changes
        if (Math.abs(newDx) + Math.abs(newDy) === 1 && (this.dx !== newDx || this.dy !== newDy)) {
            this.dx = newDx;
            this.dy = newDy;
        }
    }

    /**
     * Queues a specific number of segments for the snake to grow by on its next moves.
     * @param {number} [segments=1] - Number of segments to grow by.
     */
    grow(segments = 1) {
        this.segmentsToGrow += segments;
    }

    /**
     * Sets a temporary speed for the snake by applying a speed factor.
     * @param {number} factor - The factor by which to multiply the initial base speed.
     * @param {number} duration - Duration of the speed effect in milliseconds.
     */
    setTemporarySpeed(factor, duration) {
        if (this.activeSpeedEffectTimeout) {
            clearTimeout(this.activeSpeedEffectTimeout); // Clear any existing speed effect
        }

        this.speedFactor = factor;
        this.speed = this.initialSpeed * this.speedFactor;
        if (this.speed <= 0) this.speed = 0.5; // Prevent speed from becoming zero or negative

        this.game.updateGameSpeed(); // Notify game to adjust loop interval

        this.activeSpeedEffectTimeout = setTimeout(() => {
            this.revertSpeed();
        }, duration);
        console.log(`Snake speed changed to: ${this.speed.toFixed(2)} (Factor: ${this.speedFactor}) for ${duration}ms`);
    }

    /**
     * Reverts the snake's speed to its normal rate (initialSpeed * 1).
     */
    revertSpeed() {
        this.speedFactor = 1; // Reset factor to normal
        this.speed = this.initialSpeed * this.speedFactor;
        this.activeSpeedEffectTimeout = null;
        this.game.updateGameSpeed(); // Notify game
        console.log("Snake speed reverted to normal: " + this.speed);
    }

    /**
     * Checks for collisions with walls, obstacles, or itself.
     * @returns {boolean} True if a collision occurred.
     */
    checkCollision() {
        const head = this.body[0];

        // Wall or Obstacle collision
        if (this.board.isOutOfBounds(head) || this.board.isObstacle(head)) {
            return true;
        }

        // Self-collision
        for (let i = 1; i < this.body.length; i++) {
            if (arePositionsEqual(head, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets the position of the snake's head.
     * @returns {{x: number, y: number}} The head position.
     */
    getHeadPosition() {
        return this.body[0];
    }

    /**
     * Checks if a given grid position is occupied by any part of the snake's body.
     * @param {{x: number, y: number}} position - The position to check.
     * @param {boolean} [includeHead=true] - Whether to include the head in the check.
     * @returns {boolean} True if the position is part of the snake.
     */
    isSnakeSegment(position, includeHead = true) {
        const startIndex = includeHead ? 0 : 1;
        for (let i = startIndex; i < this.body.length; i++) {
            if (arePositionsEqual(position, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Draws the snake on the canvas with rounded segments.
     * Head is drawn with a distinct color.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
        // Update colors from CSS variables to reflect theme changes dynamically
        this.colorHead = getCssVariable('var(--snake-head-color)', '#62c462');
        this.colorBody = getCssVariable('var(--snake-body-color)', '#86e586');

        this.body.forEach((segment, index) => {
            context.fillStyle = (index === 0) ? this.colorHead : this.colorBody;
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const cornerRadius = this.gridSize / 4; // Adjust for desired roundness

            context.beginPath();
            context.moveTo(x + cornerRadius, y);
            context.lineTo(x + this.gridSize - cornerRadius, y);
            context.quadraticCurveTo(x + this.gridSize, y, x + this.gridSize, y + cornerRadius);
            context.lineTo(x + this.gridSize, y + this.gridSize - cornerRadius);
            context.quadraticCurveTo(x + this.gridSize, y + this.gridSize, x + this.gridSize - cornerRadius, y + this.gridSize);
            context.lineTo(x + cornerRadius, y + this.gridSize);
            context.quadraticCurveTo(x, y + this.gridSize, x, y + this.gridSize - cornerRadius);
            context.lineTo(x, y + cornerRadius);
            context.quadraticCurveTo(x, y, x + cornerRadius, y);
            context.closePath();
            context.fill();
        });
    }

    /**
     * Resets the snake to its initial state (position, direction, speed, growth).
     * @param {number} startX - The initial X grid coordinate for the snake's head.
     * @param {number} startY - The initial Y grid coordinate for the snake's head.
     */
    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1; // Default direction right
        this.dy = 0;
        this.segmentsToGrow = 0;

        if (this.activeSpeedEffectTimeout) { // Clear any pending speed effects
            clearTimeout(this.activeSpeedEffectTimeout);
            this.activeSpeedEffectTimeout = null;
        }
        this.speedFactor = 1; // Reset speed factor
        this.speed = this.initialSpeed; // Reset speed to the base initial speed
        // Game's updateGameSpeed() will be called from game.resetGame()
    }
}
