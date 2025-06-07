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

        if (!this.canvas) {
            console.error("Board Constructor: CRITICAL - Canvas element is NULL!");
            return; 
        }
        console.log(`Board Constructor: Canvas element found. GRID_SIZE=${GRID_SIZE}, COLS=${COLS}, ROWS=${ROWS}`);
        
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.error("Board Constructor: CRITICAL - Canvas dimensions calculated to zero!", this.canvas.width, this.canvas.height);
        } else {
            console.log("Board Constructor: Canvas ATTRIBUTES set to:", this.canvas.width, "x", this.canvas.height);
        }
        this.obstacles = [];
    }

    setupObstacles(configKey = OBSTACLE_CONFIG.STANDARD) {
        this.obstacles = []; 
        console.log("Board.setupObstacles: Called with configKey:", configKey);

        switch (configKey) {
            case OBSTACLE_CONFIG.NONE:
                console.log("Board: No obstacles generated (Config: NONE).");
                break;
            case OBSTACLE_CONFIG.STANDARD:
                console.log("Board: Setting up STANDARD obstacles.");
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
                break;
            case OBSTACLE_CONFIG.CHALLENGING:
                console.log("Board: Setting up CHALLENGING obstacles.");
                for (let i = 0; i < 7; i++) {
                    this.addObstacle({ x: Math.floor(COLS / 2) - 3 + i, y: Math.floor(ROWS / 4) -1, type: OBSTACLE_TYPES.STATIC });
                    this.addObstacle({ x: Math.floor(COLS / 2) - 3 + i, y: Math.floor(3 * ROWS / 4) +1, type: OBSTACLE_TYPES.STATIC });
                }
                if (COLS > 15) {
                    this.addObstacle({
                        x: 3, y: Math.floor(ROWS / 2),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.6, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.6
                    });
                    this.addObstacle({
                        x: COLS - 4, y: Math.floor(ROWS / 2),
                        type: OBSTACLE_TYPES.BLINKING, isVisible: false, lastToggleTime: performance.now(),
                        onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.6, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.6
                    });
                }
                break;
            default:
                console.warn("Board: Unknown obstacle configuration key in setupObstacles:", configKey);
                break;
        }
        console.log("Board: Total obstacles after setup:", this.obstacles.length);
        if (this.obstacles.length > 0) console.log("Board: First obstacle details:", JSON.stringify(this.obstacles[0]));
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
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#DDDDDD'); // Fallback slightly darker gray
        console.log("Board.draw(): Filling canvas. Color:", canvasBgColor, ". Canvas attribute WxH:", this.canvas.width, "x", this.canvas.height);
        // Log actual displayed size (influenced by CSS) vs internal bitmap size
        console.log("Board.draw(): Canvas client CSS WxH:", this.canvas.clientWidth, "x", this.canvas.clientHeight);

        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.error("Board.draw(): CRITICAL - Canvas has zero width or height. Not drawing board fill.");
            return;
        }
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGridLines();
        this.drawObstacles();
    }

    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', '#AAAAAA'); // Fallback noticeable gray
        this.context.lineWidth = 1; 
        this.context.strokeStyle = gridLineColor;
        console.log("Board.drawGridLines(): Attempting to draw. Color:", gridLineColor, "LineWidth:", this.context.lineWidth);

        const offset = 0.5;
        // Check if color is valid and not fully transparent
        const GCO = this.context.globalAlpha; // Store current globalAlpha
        this.context.globalAlpha = 1; // Ensure lines are not transparent due to globalAlpha

        if (this.context.lineWidth > 0 && gridLineColor && gridLineColor !== 'transparent' && !gridLineColor.startsWith('rgba') || (gridLineColor.startsWith('rgba') && parseFloat(gridLineColor.split(',')[3]) > 0) ) {
            let linesDrawn = 0;
            for (let x = 0; x <= this.cols; x++) {
                this.context.beginPath(); this.context.moveTo(x * this.gridSize + offset, 0);
                this.context.lineTo(x * this.gridSize + offset, this.canvas.height); this.context.stroke();
                linesDrawn++;
            }
            for (let y = 0; y <= this.rows; y++) {
                this.context.beginPath(); this.context.moveTo(0, y * this.gridSize + offset);
                this.context.lineTo(this.canvas.width, y * this.gridSize + offset); this.context.stroke();
                linesDrawn++;
            }
            console.log(`Board.drawGridLines(): ${linesDrawn} line draw operations performed.`);
        } else {
            console.warn("Board.drawGridLines(): Skipped drawing grid lines due to invalid color or lineWidth. Color:", gridLineColor, "LineWidth:", this.context.lineWidth);
        }
        this.context.globalAlpha = GCO; // Restore globalAlpha
    }
    
    addObstacle(obstacleData) {
        if (!obstacleData || typeof obstacleData.x !== 'number' || typeof obstacleData.y !== 'number') {
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
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#333333'); // Fallback dark gray
        this.context.fillStyle = obstacleColor;
        let drawnCount = 0;
        this.obstacles.forEach(obstacle => {
            if (obstacle.isVisible) {
                this.context.fillRect(
                    obstacle.x * this.gridSize, obstacle.y * this.gridSize,
                    this.gridSize, this.gridSize
                );
                drawnCount++;
            }
        });
        if (this.obstacles.length > 0 || drawnCount > 0) {
            console.log(`Board.drawObstacles(): Drawn ${drawnCount} / ${this.obstacles.length} obstacles. Color: ${obstacleColor}`);
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
