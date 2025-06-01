// assets/js/board.js

import { GRID_SIZE, ROWS, COLS } from './constants.js';
import { getCssVariable } from './utils.js'; // For theme-aware colors

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
        // Example: this.addObstacle({x: Math.floor(COLS/2), y: Math.floor(ROWS/2)});
    }

    /**
     * Clears the canvas and draws the game board.
     */
    draw() {
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#CDC1B4');
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGridLines(); // Enabled grid lines
        this.drawObstacles();
    }

    /**
     * Draws grid lines on the board for visual aid.
     */
    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', 'rgba(0,0,0,0.08)');
        this.context.strokeStyle = gridLineColor;
        this.context.lineWidth = 1; // Keep lines thin

        // Offset by 0.5 for sharper lines on canvas
        const offset = 0.5;
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
     * Adds an obstacle to the board.
     * @param {{x: number, y: number}} position - The position of the obstacle.
     */
    addObstacle(position) {
        if (!this.isObstacle(position) && !this.isOutOfBounds(position)) {
            this.obstacles.push(position);
        }
    }

    /**
     * Draws all obstacles on the board.
     */
    drawObstacles() {
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#555555');
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            this.context.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
            // For rounded obstacles:
            // const x = obstacle.x * this.gridSize;
            // const y = obstacle.y * this.gridSize;
            // const cornerRadius = this.gridSize / 5;
            // this.context.beginPath();
            // this.context.moveTo(x + cornerRadius, y);
            // ... (draw rounded rect like snake segments)
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
