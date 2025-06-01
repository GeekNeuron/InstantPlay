// assets/js/board.js

import { GRID_SIZE, ROWS, COLS } from './constants.js'; // ROWS, COLS needed for obstacle setup
import { getCssVariable, arePositionsEqual } from './utils.js';

/**
 * @fileoverview Manages the game board rendering, state, and obstacles.
 */

export class Board {
    /**
     * Creates a new game board.
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
     * @param {CanvasRenderingContext2D} context - The 2D rendering context of the canvas.
     */
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.rows = ROWS;
        this.cols = COLS;
        this.gridSize = GRID_SIZE;

        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;

        this.obstacles = []; // Initialize an empty array for obstacles
    }

    /**
     * Sets up a predefined layout of default obstacles.
     * This method is called typically at the start of a new game.
     */
    setupDefaultObstacles() {
        this.obstacles = []; // Clear any existing obstacles first

        // Example Obstacle Layout:
        // A short horizontal line in the middle
        const midY = Math.floor(ROWS / 2);
        for (let i = 0; i < 6; i++) {
            this.addObstacle({ x: Math.floor(COLS / 2) - 3 + i, y: midY });
        }

        // Two small vertical lines
        const midX = Math.floor(COLS / 2);
        if (ROWS > 15 && COLS > 10) { // Ensure board is large enough
            for (let i = 0; i < 4; i++) {
                this.addObstacle({ x: midX - 5, y: Math.floor(ROWS / 4) + i });
                this.addObstacle({ x: midX + 5, y: Math.floor(3 * ROWS / 4) - i });
            }
        }
        console.log("Board: Default obstacles set up.", this.obstacles.length, "obstacles added.");
    }


    /**
     * Clears the canvas and draws the game board, grid lines, and obstacles.
     */
    draw() {
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#CDC1B4');
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGridLines();
        this.drawObstacles(); // Call to draw the obstacles
    }

    /**
     * Draws grid lines on the board for visual aid.
     */
    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', 'rgba(0,0,0,0.08)');
        this.context.strokeStyle = gridLineColor;
        this.context.lineWidth = 1;
        const offset = 0.5; // For sharper lines

        for (let x = 0; x <= this.cols; x++) {
            this.context.beginPath();
            this.context.moveTo(x * this.gridSize + offset, 0);
            this.context.lineTo(x * this.gridSize + offset, this.canvas.height);
            this.context.stroke();
        }

        for (let y = 0; y <= this.rows; y++) {
            this.context.beginPath();
            this.context.moveTo(0, y * this.gridSize + offset);
            this.context.lineTo(this.canvas.width, y * this.gridSize + offset);
            this.context.stroke();
        }
    }

    /**
     * Adds an obstacle to the board if the position is valid and not already an obstacle.
     * @param {{x: number, y: number}} position - The position of the obstacle.
     */
    addObstacle(position) {
        if (!this.isObstacle(position) &&
            position.x >= 0 && position.x < this.cols &&
            position.y >= 0 && position.y < this.rows) {
            this.obstacles.push(position);
        } else {
            // console.warn("Board: Attempted to add invalid or duplicate obstacle at", position);
        }
    }

    /**
     * Draws all defined obstacles on the board.
     */
    drawObstacles() {
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#555555'); // Fetch color from CSS
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            // Simple filled rectangle for obstacles
            this.context.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
            // Optional: Add rounded corners or different style for obstacles
            // const x = obstacle.x * this.gridSize;
            // const y = obstacle.y * this.gridSize;
            // const cornerRadius = this.gridSize / 5;
            // this.context.beginPath();
            // this.context.moveTo(x + cornerRadius, y);
            // ... (draw rounded rect path) ...
            // this.context.fill();
        });
    }

    /**
     * Checks if a given position is an obstacle.
     * @param {{x: number, y: number}} position - The position to check.
     * @returns {boolean} True if the position is an obstacle.
     */
    isObstacle(position) {
        return this.obstacles.some(obs => arePositionsEqual(obs, position));
    }

    /**
     * Checks if a given position is outside the board boundaries.
     * @param {{x: number, y: number}} position - The position to check.
     * @returns {boolean} True if the position is outside the board.
     */
    isOutOfBounds(position) {
        return (
            position.x < 0 ||
            position.x >= this.cols ||
            position.y < 0 ||
            position.y >= this.rows
        );
    }
}
