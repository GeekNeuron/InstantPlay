// assets/js/board.js

import { GRID_SIZE, ROWS, COLS, OBSTACLE_TYPES, BLINKING_OBSTACLE_ON_DURATION, BLINKING_OBSTACLE_OFF_DURATION } from './constants.js';
import { getCssVariable, arePositionsEqual } from './utils.js';

/**
 * @fileoverview Manages the game board rendering, state, and obstacles (including blinking ones).
 */
export class Board {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.rows = ROWS;
        this.cols = COLS;
        this.gridSize = GRID_SIZE;
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        this.obstacles = []; // Stores all obstacle objects
    }

    /**
     * Sets up a predefined layout of default obstacles, including static and blinking types.
     * This method is called typically at the start of a new game (via game.resetGame).
     */
    setupDefaultObstacles() {
        this.obstacles = []; // Clear any existing obstacles first

        // Example Static Obstacles: A short horizontal line not quite in the middle
        const staticMidY = Math.floor(ROWS / 3) + 1;
        for (let i = 0; i < 6; i++) {
            this.addObstacle({
                x: Math.floor(COLS / 2) - 3 + i,
                y: staticMidY,
                type: OBSTACLE_TYPES.STATIC
            });
        }

        // Example Blinking Obstacles: Two blinking obstacles
        const blinkingY = Math.floor(2 * ROWS / 3);
        if (COLS > 12) { // Ensure enough space for these
            this.addObstacle({
                x: Math.floor(COLS / 4) + 1, y: blinkingY,
                type: OBSTACLE_TYPES.BLINKING,
                isVisible: true, // Start visible
                lastToggleTime: performance.now(),
                onDuration: BLINKING_OBSTACLE_ON_DURATION,
                offDuration: BLINKING_OBSTACLE_OFF_DURATION
            });
            this.addObstacle({
                x: Math.floor(3 * COLS / 4) - 1, y: blinkingY,
                type: OBSTACLE_TYPES.BLINKING,
                isVisible: false, // Start invisible for variation
                lastToggleTime: performance.now(),
                onDuration: BLINKING_OBSTACLE_ON_DURATION - 500, // Slightly different timing
                offDuration: BLINKING_OBSTACLE_OFF_DURATION + 500
            });
        }
        // console.log("Board: Default obstacles set up. Total:", this.obstacles.length);
    }

    /**
     * Updates the state of dynamic obstacles (e.g., blinking obstacles).
     * This should be called in each game update cycle.
     * @param {number} currentTime - The current game time (e.g., from performance.now()).
     */
    updateObstacles(currentTime) {
        this.obstacles.forEach(obs => {
            if (obs.type === OBSTACLE_TYPES.BLINKING) {
                const duration = obs.isVisible ? obs.onDuration : obs.offDuration;
                if (currentTime - obs.lastToggleTime > duration) {
                    obs.isVisible = !obs.isVisible;
                    obs.lastToggleTime = currentTime;
                    // console.log(`Obstacle at ${obs.x},${obs.y} is now ${obs.isVisible ? 'Visible' : 'Invisible'}`);
                }
            }
        });
    }

    /**
     * Clears the canvas and draws the game board, grid lines, and all visible obstacles.
     */
    draw() {
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#CDC1B4');
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGridLines();
        this.drawObstacles(); // Draws obstacles based on their current state
    }

    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', 'rgba(0,0,0,0.08)');
        this.context.strokeStyle = gridLineColor;
        this.context.lineWidth = 1;
        const offset = 0.5; // For sharper lines on canvas
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
     * Adds an obstacle object to the obstacles array.
     * Initializes blinking obstacle properties if they are not provided.
     * @param {object} obstacleData - Object containing x, y, type, and optionally isVisible, lastToggleTime, onDuration, offDuration for blinking type.
     */
    addObstacle(obstacleData) {
        if (!obstacleData || typeof obstacleData.x !== 'number' || typeof obstacleData.y !== 'number') {
            console.error("Board: Invalid obstacle data (missing x or y) provided to addObstacle.", obstacleData);
            return;
        }

        // Check if position is valid and not already an obstacle (by coordinates)
        const existingObstacleAtPos = this.obstacles.some(obs => obs.x === obstacleData.x && obs.y === obstacleData.y);
        if (existingObstacleAtPos ||
            obstacleData.x < 0 || obstacleData.x >= this.cols ||
            obstacleData.y < 0 || obstacleData.y >= this.rows) {
            // console.warn("Board: Attempted to add invalid, out-of-bounds, or duplicate obstacle at", obstacleData);
            return;
        }

        const newObstacle = {
            x: obstacleData.x,
            y: obstacleData.y,
            type: obstacleData.type || OBSTACLE_TYPES.STATIC, // Default to static if type not provided
        };

        if (newObstacle.type === OBSTACLE_TYPES.BLINKING) {
            newObstacle.isVisible = typeof obstacleData.isVisible === 'boolean' ? obstacleData.isVisible : true;
            newObstacle.lastToggleTime = typeof obstacleData.lastToggleTime === 'number' ? obstacleData.lastToggleTime : performance.now();
            newObstacle.onDuration = typeof obstacleData.onDuration === 'number' ? obstacleData.onDuration : BLINKING_OBSTACLE_ON_DURATION;
            newObstacle.offDuration = typeof obstacleData.offDuration === 'number' ? obstacleData.offDuration : BLINKING_OBSTACLE_OFF_DURATION;
        } else { // For STATIC or any other type not explicitly 'blinking'
            newObstacle.isVisible = true; // Static obstacles are always considered visible for collision/drawing
        }
        this.obstacles.push(newObstacle);
    }

    /**
     * Draws all defined and currently visible obstacles on the board.
     */
    drawObstacles() {
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#555555');
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            if (obstacle.isVisible) { // Only draw obstacles that are currently visible
                this.context.fillRect(
                    obstacle.x * this.gridSize,
                    obstacle.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            }
        });
    }

    /**
     * Checks if a given position contains an active (visible) obstacle.
     * @param {{x: number, y: number}} position - The position to check.
     * @returns {boolean} True if the position is an active (visible) obstacle.
     */
    isObstacle(position) {
        return this.obstacles.some(obs =>
            obs.isVisible && // Crucial check for blinking obstacles
            arePositionsEqual(obs, position)
        );
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
