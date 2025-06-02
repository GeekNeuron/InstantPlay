// assets/js/food.js
import { GRID_SIZE, ROWS, COLS, FOOD_TYPES } from './constants.js';
import { getRandomGridPosition, getCssVariable, arePositionsEqual } from './utils.js';

export class Food {
    constructor(board, snake, powerUpManager) {
        this.board = board;
        this.snake = snake;
        this.powerUpManager = powerUpManager;
        this.gridSize = GRID_SIZE;
        this.position = { x: -1, y: -1 };
        this.data = null;
        console.log("Food: Constructor called. Attempting initial spawn.");
        this.spawnNew();
    }

    spawnNew() {
        console.log("Food.spawnNew(): Attempting to spawn new food.");
        const rand = Math.random();
        let cumulativeProbability = 0;
        let chosenTypeKey = 'DEFAULT';
        const foodTypeKeys = Object.keys(FOOD_TYPES);

        if (foodTypeKeys.length > 0) {
            chosenTypeKey = foodTypeKeys[0]; // Fallback
            for (const key of foodTypeKeys) {
                if (FOOD_TYPES[key]) { // Ensure type exists
                    cumulativeProbability += FOOD_TYPES[key].probability;
                    if (rand <= cumulativeProbability) {
                        chosenTypeKey = key;
                        break;
                    }
                }
            }
        }
        this.data = FOOD_TYPES[chosenTypeKey];
        if (!this.data) {
            console.error("Food.spawnNew(): CRITICAL - Failed to assign food data for type:", chosenTypeKey, ". Defaulting.");
            this.data = FOOD_TYPES.DEFAULT;
        }

        let newPosition;
        let attempts = 0;
        const maxAttempts = ROWS * COLS * 2; // Increased max attempts
        do {
            newPosition = getRandomGridPosition(this.board.cols, this.board.rows);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Food.spawnNew(): Max attempts reached to find free spot for food. Spawning at potentially occupied spot:", newPosition);
                break; 
            }
        } while (
            this.board.isObstacle(newPosition) ||
            this.snake.isSnakeSegment(newPosition) ||
            (this.powerUpManager && this.powerUpManager.isPowerUpAt(newPosition))
        );
        this.position = newPosition;
        console.log(`Food.spawnNew(): Spawned. Type: ${this.data?.id}, Pos: (${this.position?.x}, ${this.position?.y})`);
    }

    draw(context) {
        if (!this.data || !this.position || typeof this.position.x !== 'number' || this.position.x === -1) {
            console.warn("Food.draw(): Invalid data or position, not drawing food.", this.data, this.position);
            return;
        }
        const foodColorValue = getCssVariable(this.data.color, '#FF0000'); // Fallback bright red
        console.log(`Food.draw(): Drawing food type ${this.data.id} at (${this.position.x}, ${this.position.y}). Color: ${foodColorValue}`);
        context.fillStyle = foodColorValue;
        const x = this.position.x * this.gridSize;
        const y = this.position.y * this.gridSize;
        const cornerRadius = this.gridSize / 3;
        context.beginPath();
        context.moveTo(x + cornerRadius, y);
        context.lineTo(x + this.gridSize - cornerRadius, y);
        context.quadraticCurveTo(x + this.gridSize, y, x + this.gridSize, y + cornerRadius);
        context.lineTo(x + this.gridSize, y + this.gridSize - cornerRadius);
        context.quadraticCurveTo(x + this.gridSize, y + this.gridSize, x + this.gridSize - cornerRadius, y + this.gridSize);
        context.lineTo(x + cornerRadius, y + this.gridSize);
        context.quadraticCurveTo(x, y + this.gridSize, x, y + this.gridSize - cornerRadius);
        context.lineTo(x, y + cornerRadius);
        context.quadraticCurveTo(x, y, x + cornerRadius, y);
        context.closePath();
        context.fill();
    }

    getPosition() { return this.position; }
    getData() { return this.data; }
}
