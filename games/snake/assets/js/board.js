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

    setupObstacles(configKey = OBSTACLE_CONFIG.STANDARD) {
        this.obstacles = []; 
        switch (configKey) {
            case OBSTACLE_CONFIG.NONE: break;
            case OBSTACLE_CONFIG.STANDARD:
                this.addObstacle({ x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                this.addObstacle({ x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                this.addObstacle({ x: Math.floor(COLS / 2),     y: Math.floor(ROWS / 3), type: OBSTACLE_TYPES.STATIC });
                if (COLS > 10) {
                    this.addObstacle({ x: Math.floor(COLS / 4), y: Math.floor(2 * ROWS / 3), type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(), onDuration: BLINKING_OBSTACLE_ON_DURATION, offDuration: BLINKING_OBSTACLE_OFF_DURATION });
                }
                break;
            case OBSTACLE_CONFIG.CHALLENGING:
                for (let i = 0; i < 7; i++) {
                    this.addObstacle({ x: Math.floor(COLS / 2) - 3 + i, y: Math.floor(ROWS / 4) -1, type: OBSTACLE_TYPES.STATIC });
                    this.addObstacle({ x: Math.floor(COLS / 2) - 3 + i, y: Math.floor(3 * ROWS / 4) +1, type: OBSTACLE_TYPES.STATIC });
                }
                if (COLS > 15) {
                    this.addObstacle({ x: 3, y: Math.floor(ROWS / 2), type: OBSTACLE_TYPES.BLINKING, isVisible: true, lastToggleTime: performance.now(), onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.6, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.6 });
                    this.addObstacle({ x: COLS - 4, y: Math.floor(ROWS / 2), type: OBSTACLE_TYPES.BLINKING, isVisible: false, lastToggleTime: performance.now(), onDuration: BLINKING_OBSTACLE_ON_DURATION * 0.6, offDuration: BLINKING_OBSTACLE_OFF_DURATION * 0.6 });
                }
                break;
        }
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
        const canvasBgColor = getCssVariable('var(--canvas-bg-color)', '#e0e0e0');
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = canvasBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGridLines();
        this.drawObstacles();
    }

    drawGridLines() {
        const gridLineColor = getCssVariable('var(--grid-line-color)', '#ced4da');
        this.context.strokeStyle = gridLineColor;
        this.context.lineWidth = 1;
        const offset = 0; // Use 0 for solid lines, 0.5 for crispier lines on some displays

        if (this.context.lineWidth > 0 && gridLineColor !== 'transparent') {
            for (let i = 1; i < this.cols; i++) {
                this.context.beginPath();
                this.context.moveTo(i * this.gridSize + offset, 0);
                this.context.lineTo(i * this.gridSize + offset, this.canvas.height);
                this.context.stroke();
            }
            for (let i = 1; i < this.rows; i++) {
                this.context.beginPath();
                this.context.moveTo(0, i * this.gridSize + offset);
                this.context.lineTo(this.canvas.width, i * this.gridSize + offset);
                this.context.stroke();
            }
        }
    }
    
    addObstacle(obstacleData) {
        if (!obstacleData || typeof obstacleData.x !== 'number' || typeof obstacleData.y !== 'number') return;
        const existingObstacleAtPos = this.obstacles.some(obs => obs.x === obstacleData.x && obs.y === obstacleData.y);
        if (existingObstacleAtPos || obstacleData.x < 0 || obstacleData.x >= this.cols || obstacleData.y < 0 || obstacleData.y >= this.rows) return;
        
        const newObstacle = { x: obstacleData.x, y: obstacleData.y, type: obstacleData.type || OBSTACLE_TYPES.STATIC };
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
        const obstacleColor = getCssVariable('var(--obstacle-color)', '#495057');
        this.context.fillStyle = obstacleColor;
        this.obstacles.forEach(obstacle => {
            if (obstacle.isVisible) {
                this.context.fillRect(obstacle.x * this.gridSize, obstacle.y * this.gridSize, this.gridSize, this.gridSize);
            }
        });
    }

    isObstacle(position) {
        return this.obstacles.some(obs => obs.isVisible && arePositionsEqual(obs, position));
    }

    isOutOfBounds(position) {
        return (position.x < 0 || position.x >= this.cols || position.y < 0 || position.y >= this.rows);
    }
}
