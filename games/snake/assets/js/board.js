// assets/js/board.js

import { GRID_SIZE, ROWS, COLS, OBSTACLE_TYPES, BLINKING_OBSTACLE_ON_DURATION, BLINKING_OBSTACLE_OFF_DURATION, OBSTACLE_CONFIG } from './constants.js';
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

        // --- LOG: Check canvas and calculated dimensions ---
        if (!this.canvas) {
            console.error("Board Constructor: Canvas element is NULL!");
        } else {
            console.log(`Board Constructor: Canvas found. GRID_SIZE=${GRID_SIZE}, COLS=${COLS}, ROWS=${ROWS}`);
        }
        
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.error("Board Constructor: Canvas dimensions calculated to zero!", this.canvas.width, this.canvas.height);
        } else {
            console.log("Board Constructor: Canvas dimensions ATTRIBUTES set to:", this.canvas.width, "x", this.canvas.height);
        }

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
                console.log("Board: No obstacles generated (Config: NONE).");
                break;
            case OBSTACLE_CONFIG.STANDARD: // Medium difficulty
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
                for (let i = 0; i < 5; i++) {
                    this.addObstacle({ x: Math.floor(COLS / 2) - 2 + i, y: Math.floor(ROWS / 4), type: OBSTACLE_TYPES.STATIC });
                    this.addObstacle({ x: Math.floor(COLS / 2) - 2 + i, y: Math.floor(3 * ROWS / 4), type: OBSTACLE_TYPES.STATIC });
                }
                if (COLS > 15) {
                    this.addObstacle({
                        x: 5, y: Math.floor(ROWS / 2),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.7, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.7
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
        console.log("Board: Total obstacles after setup:", this.obstacles.length);
    }

    /**
     * Updates the state of dynamic obstacles (e.g., blinking obstacles).
     * @param {number} currentTime - The current game time from performance.now().
     */
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

    /**
     * Clears the canvas and draws the game board, grid lines, and all visible obstacles.
     */
    draw() {
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#CDC1B4'); 
        console.log("Board.draw(): Filling canvas with color:", canvasBgColor, ". Canvas WxH:", this.canvas.width, this.canvas.height);
        // Log actual displayed size (influenced by CSS) vs internal bitmap size
        // console.log("Board.draw(): Canvas client WxH:", this.canvas.clientWidth, "x", this.canvas.clientHeight);

        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGridLines();
        this.drawObstacles();
    }

    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', 'rgba(0,0,0,0.08)');
        this.context.lineWidth = 1; 
        // console.log("Board.drawGridLines(): Drawing with color:", gridLineColor, "and lineWidth:", this.context.lineWidth);

        this.context.strokeStyle = gridLineColor;
        const offset = 0.5;
        if (this.context.lineWidth > 0 && gridLineColor && gridLineColor !== 'transparent' && !gridLineColor.endsWith('0)')) { // Check for fully transparent
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
        } else {
            console.warn("Board.drawGridLines(): Grid lines not drawn. Color:", gridLineColor, "LineWidth:", this.context.lineWidth);
        }
    }
    
    addObstacle(obstacleData) {
        if (!obstacleData || typeof obstacleData.x !== 'number' || typeof obstacleData.y !== 'number') {
            // console.error("Board: Invalid obstacle data to addObstacle.", obstacleData);
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

    drawObstacles() {
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#555555');
        this.context.fillStyle = obstacleColor;
        let drawnObstacles = 0;
        this.obstacles.forEach(obstacle => {
            if (obstacle.isVisible) {
                this.context.fillRect(
                    obstacle.x * this.gridSize,
                    obstacle.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                drawnObstacles++;
            }
        });
        if(this.obstacles.length > 0) {
            // console.log("Board.drawObstacles(): Attempted to draw. Visible obstacles:", drawnObstacles, "Total obstacles:", this.obstacles.length);
        }
    }

    isObstacle(position) {
        return this.obstacles.some(obs =>
            obs.isVisible && 
            arePositionsEqual(obs, position)
        );
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
