// assets/js/food.js

import { GRID_SIZE, ROWS, COLS } from './constants.js';
// import { COLORS } from './constants.js'; // Uncomment when COLORS are defined
import { getRandomGridPosition } from './utils.js';

/**
 * @fileoverview Manages food items in the game.
 */

export class Food {
    /**
     * Creates a new Food object.
     * @param {Board} board - Reference to the game board.
     * @param {Snake} snake - Reference to the snake object (to avoid spawning food on snake).
     */
    constructor(board, snake) {
        this.board = board;
        this.snake = snake; // To ensure food doesn't spawn on the snake
        this.gridSize = GRID_SIZE;
        this.position = { x: -1, y: -1 }; // Initial off-screen position
        this.type = 'default'; // 'default', 'golden', 'poison', etc.
        this.color = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim() || '#f76c6c';
        this.spawnNew();
    }

    /**
     * Spawns a new food item at a random valid position on the board.
     */
    spawnNew() {
        // Find a position that is not an obstacle and not on the snake
        do {
            this.position = getRandomGridPosition(this.board.cols, this.board.rows);
        } while (this.board.isObstacle(this.position) || this.snake.isSnakeSegment(this.position));

        // Later, implement different food types and their probabilities
        // For now, all food is 'default'
        this.type = 'default';
        this.color = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim() || '#f76c6c';

        // Example for different food types:
        // const rand = Math.random();
        // if (rand < 0.1) { // 10% chance for golden food
        //     this.type = 'golden';
        //     this.color = 'gold';
        // } else {
        //     this.type = 'default';
        //     this.color = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim() || '#f76c6c';
        // }
    }

    /**
     * Draws the food on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
        context.fillStyle = this.color;
        const x = this.position.x * this.gridSize;
        const y = this.position.y * this.gridSize;

        // Simple rect, can be enhanced
        // context.fillRect(x, y, this.gridSize, this.gridSize);

        // Rounded rectangle like snake segments
        const cornerRadius = GRID_SIZE / 4; // Food might be slightly more circular
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
    }

    /**
     * Gets the current position of the food.
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        return this.position;
    }
}
