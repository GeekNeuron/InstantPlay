// assets/js/food.js
import { GRID_SIZE, ROWS, COLS, FOOD_TYPES } from './constants.js';
import { getRandomGridPosition, getCssVariable, arePositionsEqual } from './utils.js';

// Helper function to draw a rounded rectangle (can also be in utils.js)
function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
    context.fill();
}

export class Food {
    // ... (constructor and spawnNew methods as before) ...
    constructor(board, snake, powerUpManager) { /* ... */ }
    spawnNew() { /* ... */ }

    draw(context) {
        if (!this.data || !this.position || this.position.x === -1) return;
        
        const foodColorValue = getCssVariable(this.data.color, '#FF0000');
        context.fillStyle = foodColorValue;
        
        const x = this.position.x * this.gridSize;
        const y = this.position.y * this.gridSize;
        const cornerRadius = this.gridSize / 3; // Make food slightly more rounded

        // Use the helper function for drawing
        drawRoundedRect(context, x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, cornerRadius);
    }

    getPosition() { return this.position; }
    getData() { return this.data; }
}
