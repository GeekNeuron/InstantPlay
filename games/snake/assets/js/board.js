// assets/js/board.js

import { GRID_SIZE, ROWS, COLS } from './constants.js';
// import { COLORS } from './constants.js'; // Uncomment when COLORS are defined

/**
 * @fileoverview Manages the game board rendering and state.
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

        // Set canvas dimensions based on grid
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;

        // Store obstacle positions if any
        this.obstacles = []; // Example: [{x: 5, y: 5}, {x: 5, y: 6}]
    }

    /**
     * Clears the canvas and draws the game board.
     */
    draw() {
        // Clear the canvas (use theme color)
        // Using CSS variable directly might be tricky for canvas fillStyle if not resolved.
        // It's often better to get the computed style once or define colors in JS constants.
        const canvasBgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg-color').trim();
        this.context.fillStyle = canvasBgColor || '#CDC1B4'; // Fallback color
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Optional: Draw grid lines (can be performance intensive for large grids)
        // this.drawGridLines();

        // Draw any obstacles
        this.drawObstacles();
    }

    /**
     * Optional: Draws grid lines on the board for visual aid.
     */
    drawGridLines() {
        this.context.strokeStyle = '#AAA'; // A light color for grid lines
        this.context.lineWidth = 0.5;

        for (let x = 0; x <= this.cols; x++) {
            this.context.beginPath();
            this.context.moveTo(x * this.gridSize, 0);
            this.context.lineTo(x * this.gridSize, this.canvas.height);
            this.context.stroke();
        }

        for (let y = 0; y <= this.rows; y++) {
            this.context.beginPath();
            this.context.moveTo(0, y * this.gridSize);
            this.context.lineTo(this.canvas.width, y * this.gridSize);
            this.context.stroke();
        }
    }

    /**
     * Adds an obstacle to the board.
     * @param {{x: number, y: number}} position - The position of the obstacle.
     */
    addObstacle(position) {
        if (!this.isObstacle(position)) {
            this.obstacles.push(position);
        }
    }

    /**
     * Draws all obstacles on the board.
     */
    drawObstacles() {
        // const obstacleColor = getComputedStyle(document.documentElement).getPropertyValue('--obstacle-color') || '#555555'; // Example
        const obstacleColor = '#555555'; // Placeholder for now
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            this.context.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
            // Add rounded corners or tile styling similar to 2048 if desired
            // this.context.roundRect(obstacle.x * this.gridSize, obstacle.y * this.gridSize, this.gridSize, this.gridSize, 4).fill();

        });
    }

    /**
     * Checks if a given position is an obstacle.
     * @param {{x: number, y: number}} position - The position to check.
     * @returns {boolean} True if the position is an obstacle.
     */
    isObstacle(position) {
        return this.obstacles.some(obs => obs.x === position.x && obs.y === position.y);
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
