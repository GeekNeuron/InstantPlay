// assets/js/board.js

import { GRID_SIZE, ROWS, COLS } from './constants.js';
// import { COLORS } from './constants.js'; // If using COLORS.GRID_LINE_COLOR

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

        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;

        this.obstacles = [];
    }

    /**
     * Clears the canvas and draws the game board.
     */
    draw() {
        const canvasBgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg-color').trim();
        this.context.fillStyle = canvasBgColor || '#CDC1B4'; // Fallback
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGridLines(); // <-- Enabled grid lines
        this.drawObstacles();
    }

    /**
     * Draws grid lines on the board for visual aid.
     */
    drawGridLines() {
        // Consider using a CSS variable for theme-aware grid lines if needed
        // For now, a semi-transparent black or a light grey.
        // const gridLineColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color').trim() || 'rgba(0, 0, 0, 0.08)';
        this.context.strokeStyle = 'rgba(0, 0, 0, 0.08)'; // A subtle grid line color
        this.context.lineWidth = 1; // Keep lines thin

        for (let x = 0; x <= this.cols; x++) {
            this.context.beginPath();
            this.context.moveTo(x * this.gridSize + 0.5, 0); // +0.5 for sharper lines
            this.context.lineTo(x * this.gridSize + 0.5, this.canvas.height);
            this.context.stroke();
        }

        for (let y = 0; y <= this.rows; y++) {
            this.context.beginPath();
            this.context.moveTo(0, y * this.gridSize + 0.5);
            this.context.lineTo(this.canvas.width, y * this.gridSize + 0.5);
            this.context.stroke();
        }
    }

    addObstacle(position) {
        if (!this.isObstacle(position)) {
            this.obstacles.push(position);
        }
    }

    drawObstacles() {
        const obstacleColor = '#555555'; // Placeholder
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            this.context.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        });
    }

    isObstacle(position) {
        return this.obstacles.some(obs => obs.x === position.x && obs.y === position.y);
    }

    isOutOfBounds(position) {
        return (
            position.x < 0 ||
            position.x >= this.cols ||
            position.y < 0 ||
            position.y >= this.rows
        );
    }
}
