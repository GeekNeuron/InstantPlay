// assets/js/food.js

import { GRID_SIZE, ROWS, COLS, FOOD_TYPES } from './constants.js';
import { getRandomGridPosition, getCssVariable, arePositionsEqual } from './utils.js';

/**
 * @fileoverview Manages food items in the game, including different types and appearances.
 */

export class Food {
    /**
     * Creates a new Food object.
     * @param {Board} board - Reference to the game board.
     * @param {Snake} snake - Reference to the snake object (to avoid spawning food on snake).
     * @param {PowerUpManager} powerUpManager - Reference to the power-up manager (to avoid spawning food on power-ups).
     */
    constructor(board, snake, powerUpManager) {
        this.board = board;
        this.snake = snake;
        this.powerUpManager = powerUpManager; // Store reference
        this.gridSize = GRID_SIZE;
        this.position = { x: -1, y: -1 }; // Initial off-screen position
        this.data = null; // Will hold the full data object for the current food type from FOOD_TYPES

        this.spawnNew();
    }

    /**
     * Spawns a new food item of a random type at a valid position on the board.
     * A valid position is not an obstacle, not part of the snake, and not an active power-up.
     */
    spawnNew() {
        // Determine food type based on probabilities
        const rand = Math.random();
        let cumulativeProbability = 0;
        let chosenTypeKey = 'DEFAULT'; // Fallback if something goes wrong with probabilities

        // Ensure FOOD_TYPES is not empty and probabilities are somewhat sane
        const foodTypeKeys = Object.keys(FOOD_TYPES);
        if (foodTypeKeys.length === 0) {
            console.error("FOOD_TYPES in constants.js is empty!");
            this.data = { id: 'ERROR', color: 'var(--food-color)', score: 0, effect: 'none', probability: 1}; // Basic fallback
        } else {
            chosenTypeKey = foodTypeKeys[0]; // Default to the first type as a better fallback
            for (const key of foodTypeKeys) {
                cumulativeProbability += FOOD_TYPES[key].probability;
                if (rand <= cumulativeProbability) {
                    chosenTypeKey = key;
                    break;
                }
            }
            this.data = FOOD_TYPES[chosenTypeKey];
        }


        // Find a position that is not an obstacle, not on the snake, and not on a power-up
        let newPosition;
        let attempts = 0;
        const maxAttempts = ROWS * COLS; // Max possible free cells

        do {
            newPosition = getRandomGridPosition(this.board.cols, this.board.rows);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Could not find a free spot for food after max attempts. Board might be too full.");
                // If board is full, food might spawn on snake/obstacle as a last resort, or handle error
                break;
            }
        } while (
            this.board.isObstacle(newPosition) ||
            this.snake.isSnakeSegment(newPosition) ||
            (this.powerUpManager && this.powerUpManager.isPowerUpAt(newPosition))
        );
        this.position = newPosition;
    }

    /**
     * Draws the food on the canvas using its type-specific color and rounded shape.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
        if (!this.data || !this.position || this.position.x === -1) return; // Don't draw if not properly initialized

        const foodColorValue = getCssVariable(this.data.color, 'red'); // Fallback to red
        context.fillStyle = foodColorValue;

        const x = this.position.x * this.gridSize;
        const y = this.position.y * this.gridSize;
        const cornerRadius = this.gridSize / 3; // Slightly different rounding for food

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
     * Gets the current grid position of the food.
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        return this.position;
    }

    /**
     * Gets the full data object (type, score, effect, etc.) of the current food.
     * @returns {object | null} The food data object, or null if not set.
     */
    getData() {
        return this.data;
    }
}
