// assets/js/powerups.js

import { getRandomGridPosition } from './utils.js';
import { GRID_SIZE } from './constants.js';

/**
 * @fileoverview Manages power-ups and power-downs in the game.
 */

export const POWERUP_TYPES = {
    SPEED_BOOST: 'speedBoost',
    SLOW_MOTION: 'slowMotion',
    SCORE_MULTIPLIER: 'scoreMultiplier',
    SHIELD: 'shield', // Pass through self or one obstacle
    SHORTEN_TAIL: 'shortenTail',
    // Add more types as features are developed
};

// Define appearance and duration for each power-up
const POWERUP_PROPERTIES = {
    [POWERUP_TYPES.SPEED_BOOST]: { color: '#42f5b0', duration: 5000, symbol: 'S+' }, // 5 seconds
    [POWERUP_TYPES.SLOW_MOTION]: { color: '#f5ad42', duration: 5000, symbol: 'S-' },
    [POWERUP_TYPES.SCORE_MULTIPLIER]: { color: '#f542dd', duration: 10000, symbol: '2x' },
    [POWERUP_TYPES.SHIELD]: { color: '#429ef5', duration: 7000, symbol: 'H' },
    [POWERUP_TYPES.SHORTEN_TAIL]: { color: '#ffffff', symbol: 'T-' }, // Instantaneous
};


export class PowerUpManager {
    /**
     * @param {Board} board Reference to the game board
     * @param {Snake} snake Reference to the snake
     * @param {Game} game Reference to the main game instance for applying effects
     */
    constructor(board, snake, game) {
        this.board = board;
        this.snake = snake;
        this.game = game; // To apply global effects like score multiplier or game speed
        this.activePowerUps = []; // Power-ups currently on the board
        this.activeEffects = []; // Effects currently applied to the snake/game
        this.spawnInterval = 15000; // Spawn a power-up every 15 seconds (example)
        this.lastSpawnTime = 0;
        this.gridSize = GRID_SIZE;
    }

    /**
     * Updates power-up states, spawns new ones, and manages active effects.
     * @param {number} currentTime The current game time.
     */
    update(currentTime) {
        // Spawn new power-ups periodically
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnRandomPowerUp();
            this.lastSpawnTime = currentTime;
        }

        // Check for collected power-ups
        const headPos = this.snake.getHeadPosition();
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (headPos.x === powerUp.position.x && headPos.y === powerUp.position.y) {
                this.activateEffect(powerUp, currentTime);
                this.game.sfx.play('powerUp'); // Play sound effect
                return false; // Remove from board
            }
            return true;
        });

        // Update durations of active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.duration && currentTime >= effect.endTime) {
                this.deactivateEffect(effect);
                return false; // Effect expired
            }
            return true;
        });
    }

    spawnRandomPowerUp() {
        if (this.activePowerUps.length >= 2) return; // Limit number of power-ups on screen

        const typeKeys = Object.keys(POWERUP_TYPES);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const type = POWERUP_TYPES[randomTypeKey];
        const properties = POWERUP_PROPERTIES[type];

        let position;
        do {
            position = getRandomGridPosition(this.board.cols, this.board.rows);
        } while (
            this.board.isObstacle(position) ||
            this.snake.isSnakeSegment(position) ||
            this.activePowerUps.some(p => p.position.x === position.x && p.position.y === position.y) ||
            (this.game.food && this.game.food.getPosition().x === position.x && this.game.food.getPosition().y === position.y) // Avoid food
        );

        this.activePowerUps.push({
            type: type,
            position: position,
            color: properties.color,
            symbol: properties.symbol, // For drawing
            spawnTime: performance.now(), // For timed life if needed
            properties: properties
        });
    }

    activateEffect(powerUp, currentTime) {
        console.log(`Activating power-up: ${powerUp.type}`);
        const effect = {
            type: powerUp.type,
            startTime: currentTime,
            duration: powerUp.properties.duration,
            endTime: powerUp.properties.duration ? currentTime + powerUp.properties.duration : null,
            originalValue: null // Store original value if changed (e.g., speed)
        };

        switch (powerUp.type) {
            case POWERUP_TYPES.SPEED_BOOST:
                effect.originalValue = this.snake.speed;
                this.snake.speed *= 1.5; // Increase speed by 50%
                this.game.updateGameSpeed(); // Game class method to update interval
                break;
            case POWERUP_TYPES.SLOW_MOTION:
                effect.originalValue = this.snake.speed;
                this.snake.speed *= 0.66; // Decrease speed
                this.game.updateGameSpeed();
                break;
            case POWERUP_TYPES.SCORE_MULTIPLIER:
                effect.originalValue = this.game.scoreMultiplier || 1;
                this.game.scoreMultiplier = (this.game.scoreMultiplier || 1) * 2;
                break;
            case POWERUP_TYPES.SHIELD:
                this.game.isShieldActive = true; // A flag in the game or snake object
                break;
            case POWERUP_TYPES.SHORTEN_TAIL:
                this.snake.body.splice(Math.max(1, Math.floor(this.snake.body.length / 2))); // Remove half, keep head
                if (this.snake.body.length === 0) this.snake.reset(this.snake.body[0].x, this.snake.body[0].y); // Should not happen ideally
                break;
        }
        if(effect.duration) { // Only add to activeEffects if it has a duration
            this.activeEffects.push(effect);
        }
    }

    deactivateEffect(effect) {
        console.log(`Deactivating effect: ${effect.type}`);
        switch (effect.type) {
            case POWERUP_TYPES.SPEED_BOOST:
            case POWERUP_TYPES.SLOW_MOTION:
                this.snake.speed = effect.originalValue;
                this.game.updateGameSpeed();
                break;
            case POWERUP_TYPES.SCORE_MULTIPLIER:
                this.game.scoreMultiplier = effect.originalValue;
                break;
            case POWERUP_TYPES.SHIELD:
                this.game.isShieldActive = false;
                break;
            // SHORTEN_TAIL is instantaneous, no deactivation needed
        }
    }

    /**
     * Draws active power-ups on the board.
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        this.activePowerUps.forEach(powerUp => {
            context.fillStyle = powerUp.color;
            const x = powerUp.position.x * this.gridSize;
            const y = powerUp.position.y * this.gridSize;

            // Draw a circle or a rounded rect
            context.beginPath();
            context.arc(
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                this.gridSize / 2.2, // Slightly smaller than cell
                0, 2 * Math.PI
            );
            context.fill();

            // Draw symbol
            context.fillStyle = '#000'; // Black or white for contrast
            context.font = `bold ${this.gridSize / 2}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(powerUp.symbol, x + this.gridSize / 2, y + this.gridSize / 2);
        });
    }

    reset() {
        this.activePowerUps = [];
        // Deactivate all ongoing effects cleanly
        this.activeEffects.forEach(effect => this.deactivateEffect(effect)); // Ensure cleanup
        this.activeEffects = [];
        this.lastSpawnTime = 0; // Reset spawn timer
    }
}
