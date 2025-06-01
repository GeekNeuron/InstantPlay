// assets/js/board.js

import { GRID_SIZE, ROWS, COLS, OBSTACLE_TYPES, BLINKING_OBSTACLE_ON_DURATION, BLINKING_OBSTACLE_OFF_DURATION, OBSTACLE_CONFIG } from './constants.js';
import { getCssVariable, arePositionsEqual } from './utils.js';

export class Board {
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
     * Sets up obstacles based on the provided configuration key.
     * @param {string} configKey - A key from OBSTACLE_CONFIG (e.g., OBSTACLE_CONFIG.NONE).
     */
    setupObstacles(configKey = OBSTACLE_CONFIG.STANDARD) {
        this.obstacles = []; // Clear existing obstacles

        switch (configKey) {
            case OBSTACLE_CONFIG.NONE:
                // No obstacles for Easy mode
                console.log("Board: No obstacles generated (Easy mode).");
                break;
            case OBSTACLE_CONFIG.STANDARD: // Medium difficulty
                // A few static and blinking obstacles
                this.addObstacle({ x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                this.addObstacle({ x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                this.addObstacle({ x: Math.floor(COLS / 2),     y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                
                if (COLS > 10) {
                    this.addObstacle({
                        x: Math.floor(COLS / 4), y: Math.floor(2 * ROWS / 3),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION, offDuration: BLINKING_OBSTACLE_OFF_DURATION
                    });
                }
                console.log("Board: Standard obstacles set up.");
                break;
            case OBSTACLE_CONFIG.CHALLENGING: // Hard difficulty
                // More static obstacles
                for (let i = 0; i < 5; i++) {
                    this.addObstacle({ x: Math.floor(COLS / 2) - 2 + i, y: Math.floor(ROWS / 4), type: OBSTACLE_TYPES.STATIC });
                    this.addObstacle({ x: Math.floor(COLS / 2) - 2 + i, y: Math.floor(3 * ROWS / 4), type: OBSTACLE_TYPES.STATIC });
                }
                // More/faster blinking obstacles
                if (COLS > 15) {
                    this.addObstacle({
                        x: 5, y: Math.floor(ROWS / 2),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.7, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.7 // Faster blinking
                    });
                    this.addObstacle({
                        x: COLS - 6, y: Math.floor(ROWS / 2),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: false, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.7, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.7
                    });
                }
                console.log("Board: Challenging obstacles set up.");
                break;
            default:
                console.warn("Board: Unknown obstacle configuration key:", configKey);
                break;
        }
        // console.log("Board: Total obstacles:", this.obstacles.length);
    }

    updateObstacles(currentTime) {
        this.obstacles.forEach(obs => {
            if (obs.type === OBSTACLE_TYPES.BLINKING) {
                const duration = obs.isVisible ? obs.onDuration : obs.offDuration;
                if (currentTime - obs.lastToggleTime > duration) {
                    obs.isVisible = !obs.isVisible;
                    obs.lastToggleTime = currentTime;
                }
            }
        });
    }

    draw() {
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#CDC1B4');
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGridLines();
        this.drawObstacles();
    }

    drawGridLines() { /* ... as before ... */ }

    addObstacle(obstacleData) {
        if (!obstacleData || typeof obstacleData.x !== 'number' || typeof obstacleData.y !== 'number') {
            console.error("Board: Invalid obstacle data to addObstacle.", obstacleData);
            return;
        }
        const existingObstacleAtPos = this.obstacles.some(obs => obs.x === obstacleData.x && obs.y === obstacleData.y);
        if (existingObstacleAtPos || obstacleData.x < 0 || obstacleData.x >= this.cols || obstacleData.y < 0 || obstacleData.y >= this.rows) {
            return;
        }
        const newObstacle = {
            x: obstacleData.x, y: obstacleData.y,
            type: obstacleData.type || OBSTACLE_TYPES.STATIC,
        };
        if (newObstacle.type === OBSTACLE_TYPES.BLINKING) {
            newObstacle.isVisible = typeof obstacleData.isVisible === 'boolean' ? obstacleData.isVisible : true;
            newObstacle.lastToggleTime = typeof obstacleData.lastToggleTime === 'number' ? obstacleData.lastToggleTime : performance.now();
            newObstacle.onDuration = typeof obstacleData.onDuration === 'number' ? obstacleData.onDuration : BLINKING_OBSTACLE_ON_DURATION;
            newObstacle.offDuration = typeof obstacleData.offDuration === 'number' ? obstacleData.offDuration : BLINKING_OBSTACLE_OFF_DURATION;
        } else {
            newObstacle.isVisible = true;
        }
        this.obstacles.push(newObstacle);
    }

    drawObstacles() { /* ... as before ... */ }
    isObstacle(position) { /* ... as before ... */ }
    isOutOfBounds(position) { /* ... as before ... */ }
}
