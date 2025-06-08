// assets/js/board.js
import { GRID_SIZE, ROWS, COLS, OBSTACLE_TYPES, BLINKING_OBSTACLE_ON_DURATION, BLINKING_OBSTACLE_OFF_DURATION, OBSTACLE_CONFIG } from './constants.js';
import { getCssVariable, arePositionsEqual } from './utils.js';

export class Board {
    constructor(canvas, context) { /* ... as before ... */ }
    setupObstacles(configKey = OBSTACLE_CONFIG.STANDARD) { /* ... as before ... */ }
    updateObstacles(currentTime) { /* ... as before ... */ }

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
        this.context.lineWidth = 1; // A crisp 1px line
        const offset = 0; // Removing 0.5 offset can sometimes help with rendering consistency

        if (this.context.lineWidth > 0 && gridLineColor !== 'transparent') {
            for (let i = 1; i < this.cols; i++) { // Loop from 1 to avoid drawing over border
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
    
    addObstacle(obstacleData) { /* ... as before ... */ }
    drawObstacles() { /* ... as before ... */ }
    isObstacle(position) { /* ... as before ... */ }
    isOutOfBounds(position) { /* ... as before ... */ }
}
