// assets/js/powerups.js

import { getRandomGridPosition, arePositionsEqual } from './utils.js';
import { GRID_SIZE } from './constants.js';

/**
 * @fileoverview Manages collectible power-ups and power-downs in the game.
 * Distinct from food effects, these are items that appear on the board to be collected.
 */

// Define various types of power-ups/downs
export const POWERUP_COLLECTIBLE_TYPES = {
    SHIELD: 'shield',
    SCORE_BOOST_ITEM: 'scoreBoostItem', // e.g., a bag of points
    // INVINCIBILITY: 'invincibility', // Could allow passing through self/walls
    // CLEAR_OBSTACLES: 'clearObstacles',
    // ... more complex power-ups
};

// Define properties for each collectible power-up
const POWERUP_PROPERTIES = {
    [POWERUP_COLLECTIBLE_TYPES.SHIELD]: {
        color: 'var(--powerup-color-shield)', // e.g., a blue
        duration: 10000, // Shield lasts for 10 seconds or one hit
        symbol: '🛡️', // Shield emoji or letter 'S'
        effect: (game) => { game.isShieldActive = true; game.shieldHitCount = 0; console.log("Shield Activated!"); },
        deactivate: (game) => { game.isShieldActive = false; console.log("Shield Deactivated."); },
        onHitWhileActive: (game) => { // Special logic for shield
            game.shieldHitCount = (game.shieldHitCount || 0) + 1;
            if (game.shieldHitCount >= 1) { // Shield breaks after 1 hit
                return true; // true means shield should break/deactivate
            }
            return false; // false means shield remains active
        }
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM]: {
        color: 'var(--powerup-color-scoreboost)', // e.g., a green or gold
        symbol: '💰', // Money bag emoji or '$'
        scoreAmount: 100, // Instant score boost
        effect: (game, powerUpData) => { game.score += powerUpData.scoreAmount; game.uiManager.updateScore(game.score); console.log(`+${powerUpData.scoreAmount} points!`); },
        duration: null, // Instantaneous
    },
    // Define more power-ups here
};


export class PowerUpManager {
    /**
     * @param {Board} board Reference to the game board.
     * @param {Snake} snake Reference to the snake.
     * @param {Game} game Reference to the main game instance for applying effects and sounds.
     */
    constructor(board, snake, game) {
        this.board = board;
        this.snake = snake;
        this.game = game;
        this.activePowerUpItems = []; // Power-ups currently visible on the board
        this.activeEffects = [];      // Effects currently applied to the snake/game from collectibles

        this.spawnInterval = 10000; // Try to spawn a power-up collectible every 10-20 seconds (example)
        this.lastSpawnTime = 0;
        this.maxOnScreen = 1; // Max number of collectible power-ups on screen at once
        this.gridSize = GRID_SIZE;
    }

    /**
     * Updates power-up states: spawns new ones, checks for collection, manages active effect durations.
     * @param {number} currentTime The current game time from performance.now().
     */
    update(currentTime) {
        // Try to spawn new power-up items
        if (this.activePowerUpItems.length < this.maxOnScreen && (currentTime - this.lastSpawnTime > this.spawnInterval + Math.random() * 5000) ) {
            this.spawnRandomPowerUpItem();
            this.lastSpawnTime = currentTime;
        }

        // Check for collected power-up items by snake's head
        const headPos = this.snake.getHeadPosition();
        this.activePowerUpItems = this.activePowerUpItems.filter(item => {
            if (arePositionsEqual(headPos, item.position)) {
                this.applyCollectibleEffect(item, currentTime);
                this.game.sfx.play('powerUp'); // Play sound effect for collecting
                return false; // Remove item from board
            }
            // Optional: Remove power-ups if they expire on the board
            // if (item.lifeSpan && currentTime > item.spawnTime + item.lifeSpan) return false;
            return true;
        });

        // Update durations of active effects from collectibles
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.endTime && currentTime >= effect.endTime) {
                if (effect.properties.deactivate) {
                    effect.properties.deactivate(this.game, effect.data);
                }
                return false; // Effect expired
            }
            return true;
        });
    }

    spawnRandomPowerUpItem() {
        const availableTypes = Object.keys(POWERUP_COLLECTIBLE_TYPES);
        if (availableTypes.length === 0) return;

        const randomTypeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const type = POWERUP_COLLECTIBLE_TYPES[randomTypeKey];
        const properties = POWERUP_PROPERTIES[type];

        if (!properties) {
            console.warn(`Properties for power-up type ${type} not found.`);
            return;
        }

        let position;
        let attempts = 0;
        const maxAttempts = ROWS * COLS;
        do {
            position = getRandomGridPosition(this.board.cols, this.board.rows);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Could not find a free spot for power-up item.");
                return; // Don't spawn if no spot found
            }
        } while (
            this.board.isObstacle(position) ||
            this.snake.isSnakeSegment(position) ||
            this.isPowerUpAt(position) || // Check against other collectible items
            (this.game.food && arePositionsEqual(this.game.food.getPosition(), position)) // Avoid food
        );

        this.activePowerUpItems.push({
            type: type,
            position: position,
            symbol: properties.symbol,
            color: properties.color, // CSS variable name
            properties: properties,    // Full properties object
            spawnTime: performance.now(),
            // lifeSpan: 20000 // Optional: e.g., power-up disappears after 20s
        });
        console.log(`Spawned power-up item: ${type} at ${position.x},${position.y}`);
    }

    applyCollectibleEffect(item, currentTime) {
        console.log(`Collected power-up: ${item.type}`);
        const properties = item.properties;

        if (properties.effect) {
            properties.effect(this.game, properties); // Pass game and specific power-up data
        }

        // If the effect has a duration and a deactivate function, add it to activeEffects
        if (properties.duration && properties.deactivate) {
            this.activeEffects.push({
                type: item.type,
                endTime: currentTime + properties.duration,
                properties: properties, // Store properties for deactivation logic
                data: properties // Pass specific data if needed for deactivation
            });
        }
    }

    /**
     * Checks if a specific game effect (like Shield) is currently active.
     * @param {string} effectType - The type of effect to check (e.g., POWERUP_COLLECTIBLE_TYPES.SHIELD).
     * @returns {boolean} True if the effect is active.
     */
    isEffectActive(effectType) {
        return this.activeEffects.some(effect => effect.type === effectType);
    }

    /**
     * Called when snake collides and an effect (like Shield) might absorb the hit.
     * @param {string} effectType - The type of effect (e.g., POWERUP_COLLECTIBLE_TYPES.SHIELD).
     * @returns {boolean} True if the effect absorbed the hit and should be consumed/deactivated.
     */
    handleHitWithEffect(effectType) {
        const effectIndex = this.activeEffects.findIndex(effect => effect.type === effectType);
        if (effectIndex > -1) {
            const effect = this.activeEffects[effectIndex];
            if (effect.properties.onHitWhileActive) {
                const shouldDeactivate = effect.properties.onHitWhileActive(this.game);
                if (shouldDeactivate) {
                    if (effect.properties.deactivate) {
                        effect.properties.deactivate(this.game, effect.data);
                    }
                    this.activeEffects.splice(effectIndex, 1); // Remove effect
                    return true; // Hit was absorbed, effect ended
                }
                return true; // Hit was absorbed, effect remains
            }
        }
        return false; // No such active effect to absorb the hit
    }


    /**
     * Draws active power-up items on the board.
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        this.activePowerUpItems.forEach(item => {
            const itemColorValue = getCssVariable(item.color, 'purple'); // Fallback
            context.fillStyle = itemColorValue;

            const x = item.position.x * this.gridSize;
            const y = item.position.y * this.gridSize;

            // Draw a circle or a rounded rect for the item
            context.beginPath();
            context.arc(
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                this.gridSize / 2.1, // Slightly smaller than cell for distinct look
                0, 2 * Math.PI
            );
            context.fill();

            // Draw symbol (emoji or text)
            context.fillStyle = getCssVariable('var(--text-color-on-accent)', '#FFFFFF'); // Text color on power-up
            context.font = `bold ${this.gridSize / 1.8}px Arial`; // Adjust size as needed
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(item.symbol, x + this.gridSize / 2, y + this.gridSize / 2 + 1); // Small offset for better centering of emojis
        });
    }

    /**
     * Checks if there is an active collectible power-up item at the given grid position.
     * @param {{x: number, y: number}} position - The grid position to check.
     * @returns {boolean} True if a power-up item exists at the position.
     */
    isPowerUpAt(position) {
        return this.activePowerUpItems.some(p => arePositionsEqual(p.position, position));
    }


    reset() {
        // Deactivate any ongoing effects from collectibles
        this.activeEffects.forEach(effect => {
            if (effect.properties.deactivate) {
                effect.properties.deactivate(this.game, effect.data);
            }
        });
        this.activeEffects = [];
        this.activePowerUpItems = [];
        this.lastSpawnTime = performance.now(); // Reset spawn timer for fairness on new game
    }
}
// Add to theme files: --powerup-color-shield, --powerup-color-scoreboost, --text-color-on-accent
// e.g. in light-theme.css:
// --powerup-color-shield: #2196f3; /* Blue */
// --powerup-color-scoreboost: #4caf50; /* Green */
// --text-color-on-accent: #FFFFFF;
//
// e.g. in dark-theme.css:
// --powerup-color-shield: #90caf9; /* Lighter Blue */
// --powerup-color-scoreboost: #a5d6a7; /* Lighter Green */
// --text-color-on-accent: #000000; (or keep #FFFFFF if background is dark enough)
