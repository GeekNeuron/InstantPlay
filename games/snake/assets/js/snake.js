// assets/js/snake.js

import { GRID_SIZE, INITIAL_SNAKE_SPEED } from './constants.js';
// import { COLORS } from './constants.js'; // Uncomment when COLORS are defined
import { arePositionsEqual } from './utils.js';

/**
 * @fileoverview Represents the snake in the game.
 */

export class Snake {
    /**
     * Creates a new Snake.
     * @param {number} startX - Initial X position of the snake's head on the grid.
     * @param {number} startY - Initial Y position of the snake's head on the grid.
     * @param {Board} board - Reference to the game board for boundary checks.
     */
    constructor(startX, startY, board) {
        this.board = board;
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }]; // Head is the first element
        this.dx = 1; // Initial movement direction: 1 for right, -1 for left, 0 for vertical
        this.dy = 0; // Initial movement direction: 1 for down, -1 for up, 0 for horizontal
        this.speed = INITIAL_SNAKE_SPEED; // Can be adjusted by power-ups or levels
        this.isGrowing = false;
        this.colorHead = getComputedStyle(document.documentElement).getPropertyValue('--snake-head-color').trim() || '#62c462';
        this.colorBody = getComputedStyle(document.documentElement).getPropertyValue('--snake-body-color').trim() || '#86e586';
    }

    /**
     * Updates the snake's position based on its current direction.
     */
    move() {
        const head = { x: this.body[0].x + this.dx, y: this.body[0].y + this.dy };
        this.body.unshift(head); // Add new head

        if (this.isGrowing) {
            this.isGrowing = false; // Reset growth flag
        } else {
            this.body.pop(); // Remove tail unless growing
        }
    }

    /**
     * Changes the snake's direction. Prevents reversing directly onto itself.
     * @param {number} newDx - The new X direction (-1, 0, or 1).
     * @param {number} newDy - The new Y direction (-1, 0, or 1).
     */
    changeDirection(newDx, newDy) {
        // Prevent moving in the opposite direction immediately
        if (this.body.length > 1 && this.dx === -newDx && this.dy === -newDy) {
            return;
        }
        // Ensure only one direction is non-zero (no diagonal movement)
        if (Math.abs(newDx) + Math.abs(newDy) !== 1) {
            return;
        }
        this.dx = newDx;
        this.dy = newDy;
    }

    /**
     * Marks the snake to grow on its next move.
     * @param {number} [segments=1] - Number of segments to grow by.
     */
    grow(segments = 1) {
        // For simplicity, basic snake grows by one segment per food.
        // This flag will prevent tail removal on the next 'move' call.
        // For multiple segments, this needs more complex handling or repeat calls.
        this.isGrowing = true;
    }

    /**
     * Checks for collisions with walls or itself.
     * @returns {boolean} True if a collision occurred.
     */
    checkCollision() {
        const head = this.body[0];

        // Wall collision
        if (this.board.isOutOfBounds(head) || this.board.isObstacle(head)) {
            return true;
        }

        // Self-collision (check if head collides with any part of its body, excluding the head itself)
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
     * Checks if a given position is part of the snake's body.
     * @param {{x: number, y: number}} position - The position to check.
     * @param {boolean} [includeHead=true] - Whether to include the head in the check.
     * @returns {boolean}
     */
    isSnakeSegment(position, includeHead = true) {
        const start = includeHead ? 0 : 1;
        for (let i = start; i < this.body.length; i++) {
            if (arePositionsEqual(position, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Draws the snake on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
        this.body.forEach((segment, index) => {
            context.fillStyle = (index === 0) ? this.colorHead : this.colorBody;
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            // Simple rect drawing for now. Can enhance with rounded corners for a "tile" look.
            // context.fillRect(x, y, this.gridSize, this.gridSize);

            // Rounded rectangle for a softer look (similar to 2048 tiles)
            // The native roundRect is becoming more available, but a helper might be needed for full compatibility.
            // For simplicity, we'll use fillRect and rely on CSS for overall game container styling.
            // If individual snake segments need to look like distinct, rounded tiles:
            const cornerRadius = GRID_SIZE / 5; // Adjust for desired roundness
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

            // Optional: Add a slight border or highlight for segments
            // context.strokeStyle = 'rgba(0,0,0,0.1)';
            // context.lineWidth = 1;
            // context.stroke();
        });
    }

    /**
     * Resets the snake to its initial state.
     * @param {number} startX
     * @param {number} startY
     */
    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;
        this.isGrowing = false;
        this.speed = INITIAL_SNAKE_SPEED; // Reset speed
    }
}
