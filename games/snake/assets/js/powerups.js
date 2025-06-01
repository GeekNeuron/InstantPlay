// assets/js/powerups.js

import { getRandomGridPosition, arePositionsEqual, getCssVariable } from './utils.js';
import { GRID_SIZE, ROWS, COLS } from './constants.js'; // Ensure ROWS and COLS are imported

export const POWERUP_COLLECTIBLE_TYPES = {
    SHIELD: 'shield',
    SCORE_BOOST_ITEM: 'scoreBoostItem', // This is an instant score addition
    SCORE_MULTIPLIER: 'scoreMultiplier' // New: Timed score multiplier
};

const POWERUP_PROPERTIES = {
    [POWERUP_COLLECTIBLE_TYPES.SHIELD]: {
        id: POWERUP_COLLECTIBLE_TYPES.SHIELD,
        color: 'var(--powerup-color-shield)', // e.g., a blue
        symbol: '🛡️',
        duration: 15000, // Shield lasts for 15 seconds OR one hit
        effect: (game) => {
            game.isShieldActive = true;
            game.shieldHitCount = 0; // Reset hit count for this shield instance
            console.log("Shield Activated! Lasts for " + POWERUP_PROPERTIES[POWERUP_COLLECTIBLE_TYPES.SHIELD].duration / 1000 + "s or 1 hit.");
        },
        deactivate: (game) => {
            game.isShieldActive = false;
            console.log("Shield Deactivated.");
        },
        // onHitWhileActive is called by game.js logic via powerUpManager.handleHitWithEffect
        // It determines if the shield should break after a hit.
        onHitWhileActive: (game) => {
            // For this shield, it breaks after 1 hit. The duration is a backup.
            console.log("Shield took a hit!");
            return true; // true means shield should break/deactivate
        }
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM]: {
        id: POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM,
        color: 'var(--powerup-color-scoreboost)', // e.g., a green or gold
        symbol: '💰',
        scoreAmount: 100, // Instant score boost
        effect: (game, powerUpData) => {
            game.score += powerUpData.scoreAmount;
            game.uiManager.updateScore(game.score);
            console.log(`PowerUp: +${powerUpData.scoreAmount} points!`);
        },
        duration: null, // Instantaneous, no deactivation needed via timer
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_MULTIPLIER]: {
        id: POWERUP_COLLECTIBLE_TYPES.SCORE_MULTIPLIER,
        color: 'var(--powerup-color-score-multiplier)', // e.g., a purple or vibrant yellow
        symbol: '2x', // Or could be dynamic e.g. based on multiplierFactor
        duration: 10000, // Multiplier lasts for 10 seconds
        multiplierFactor: 2,
        effect: (game, powerUpData) => {
            game.scoreMultiplier = powerUpData.multiplierFactor;
            console.log(`Score Multiplier (x${game.scoreMultiplier}) Activated! Lasts for ${powerUpData.duration / 1000}s.`);
        },
        deactivate: (game) => {
            game.scoreMultiplier = 1; // Reset to default multiplier
            console.log("Score Multiplier Deactivated. Score multiplier is x1.");
        }
    }
};

export class PowerUpManager {
    constructor(board, snake, game) {
        this.board = board;
        this.snake = snake;
        this.game = game;
        this.activePowerUpItems = [];
        this.activeEffects = [];
        this.spawnInterval = 12000; // Average spawn interval
        this.lastSpawnTime = 0;
        this.maxOnScreen = 1; // Max 1 collectible power-up on screen at a time
        this.gridSize = GRID_SIZE;
    }

    update(currentTime) {
        // Spawn new power-up items
        if (this.activePowerUpItems.length < this.maxOnScreen &&
            (currentTime - this.lastSpawnTime > this.spawnInterval + (Math.random() * 6000 - 3000)) ) { // Add some randomness to spawn
            this.spawnRandomPowerUpItem();
            this.lastSpawnTime = currentTime;
        }

        // Check for collected power-up items
        const headPos = this.snake.getHeadPosition();
        this.activePowerUpItems = this.activePowerUpItems.filter(item => {
            if (arePositionsEqual(headPos, item.position)) {
                this.applyCollectibleEffect(item, currentTime);
                // Sound was here: this.game.sfx.play('powerUp');
                return false; // Remove item from board
            }
            // Optional: Remove power-ups if they expire on the board (not implemented yet)
            // if (item.properties.lifeSpanOnBoard && currentTime > item.spawnTime + item.properties.lifeSpanOnBoard) return false;
            return true;
        });

        // Update durations of active effects from collectibles
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.endTime && currentTime >= effect.endTime) {
                if (effect.properties.deactivate) {
                    effect.properties.deactivate(this.game); // Pass game instance
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
        const typeID = POWERUP_COLLECTIBLE_TYPES[randomTypeKey]; // This gets the string value like 'shield'
        const properties = POWERUP_PROPERTIES[typeID]; // Use the ID to get properties

        if (!properties) {
            console.warn(`PowerUpManager: Properties for power-up type ID ${typeID} not found.`);
            return;
        }

        let position;
        let attempts = 0;
        const maxAttempts = ROWS * COLS;
        do {
            position = getRandomGridPosition(this.board.cols, this.board.rows);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("PowerUpManager: Could not find a free spot for power-up item.");
                return;
            }
        } while (
            this.board.isObstacle(position) ||
            this.snake.isSnakeSegment(position) ||
            this.isPowerUpAt(position) ||
            (this.game.food && arePositionsEqual(this.game.food.getPosition(), position))
        );

        this.activePowerUpItems.push({
            id: properties.id, // Store the ID
            position: position,
            symbol: properties.symbol,
            color: properties.color,
            properties: properties, // Full properties object
            spawnTime: performance.now(),
        });
        // console.log(`Spawned power-up item: ${properties.id} at ${position.x},${position.y}`);
    }

    applyCollectibleEffect(item, currentTime) {
        // console.log(`Collected power-up: ${item.id}`);
        const properties = item.properties;

        // Deactivate any existing effect of the same type before applying a new one
        // (e.g., picking up a new shield while an old one is active)
        const existingEffectIndex = this.activeEffects.findIndex(eff => eff.id === item.id && eff.properties.deactivate);
        if (existingEffectIndex > -1) {
            const oldEffect = this.activeEffects[existingEffectIndex];
            oldEffect.properties.deactivate(this.game);
            this.activeEffects.splice(existingEffectIndex, 1);
             console.log(`Deactivated existing effect of type ${item.id} before applying new one.`);
        }


        if (properties.effect) {
            properties.effect(this.game, properties); // Pass game and specific power-up data
        }

        if (properties.duration) { // Only add to activeEffects if it has a duration
            this.activeEffects.push({
                id: item.id,
                endTime: currentTime + properties.duration,
                properties: properties,
            });
        }
    }

    isEffectActive(effectTypeID) {
        // Check against game flags primarily for shield, as its deactivation is also collision-based
        if (effectTypeID === POWERUP_COLLECTIBLE_TYPES.SHIELD) {
            return this.game.isShieldActive;
        }
        // For other timed effects, check the activeEffects array
        return this.activeEffects.some(effect => effect.id === effectTypeID);
    }

    handleHitWithEffect(effectTypeID) {
        const effectIndex = this.activeEffects.findIndex(effect => effect.id === effectTypeID);
        if (effectIndex > -1) {
            const effect = this.activeEffects[effectIndex];
            if (effect.properties.onHitWhileActive) {
                const shouldDeactivate = effect.properties.onHitWhileActive(this.game);
                if (shouldDeactivate) {
                    if (effect.properties.deactivate) {
                        effect.properties.deactivate(this.game);
                    }
                    this.activeEffects.splice(effectIndex, 1);
                    return true; // Hit was absorbed, effect ended
                }
                return true; // Hit was absorbed, effect might remain (e.g. multi-hit shield not implemented yet)
            }
        }
        // If no specific onHitWhileActive, but a shield is active, it should still absorb and deactivate
         else if (effectTypeID === POWERUP_COLLECTIBLE_TYPES.SHIELD && this.game.isShieldActive) {
            // This case handles if the shield wasn't in activeEffects (e.g. duration ran out but flag still true somehow)
            // or if it doesn't have onHitWhileActive but should still deactivate on hit.
            const shieldProps = POWERUP_PROPERTIES[POWERUP_COLLECTIBLE_TYPES.SHIELD];
            if (shieldProps.deactivate) {
                shieldProps.deactivate(this.game);
            }
            // Ensure it's removed from activeEffects if it was there
            const shieldEffectIndex = this.activeEffects.findIndex(eff => eff.id === POWERUP_COLLECTIBLE_TYPES.SHIELD);
            if (shieldEffectIndex > -1) this.activeEffects.splice(shieldEffectIndex, 1);
            return true; // Hit absorbed
        }
        return false;
    }

    draw(context) {
        this.activePowerUpItems.forEach(item => {
            const itemColorValue = getCssVariable(item.color, 'purple');
            context.fillStyle = itemColorValue;
            const x = item.position.x * this.gridSize;
            const y = item.position.y * this.gridSize;
            context.beginPath();
            context.arc(
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                this.gridSize / 2.1,
                0, 2 * Math.PI
            );
            context.fill();
            context.fillStyle = getCssVariable('var(--text-color-on-accent)', '#FFFFFF');
            context.font = `bold ${this.gridSize / 1.8}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(item.symbol, x + this.gridSize / 2, y + this.gridSize / 2 + 1);
        });
    }

    isPowerUpAt(position) {
        return this.activePowerUpItems.some(p => arePositionsEqual(p.position, position));
    }

    reset() {
        this.activeEffects.forEach(effect => {
            if (effect.properties.deactivate) {
                // Ensure deactivation logic doesn't rely on state that's already reset in game
                // Pass a fresh game state view if necessary, or make deactivations idempotent
                effect.properties.deactivate(this.game);
            }
        });
        this.activeEffects = [];
        this.activePowerUpItems = [];
        this.lastSpawnTime = performance.now();
    }
}
