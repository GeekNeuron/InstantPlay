// assets/js/powerups.js

import { getRandomGridPosition, arePositionsEqual, getCssVariable } from './utils.js';
import { GRID_SIZE, ROWS, COLS } from './constants.js'; // Ensure ROWS and COLS are imported

export const POWERUP_COLLECTIBLE_TYPES = {
    SHIELD: 'shield',
    SCORE_BOOST_ITEM: 'scoreBoostItem',
    SCORE_MULTIPLIER: 'scoreMultiplier'
};

// Export POWERUP_PROPERTIES for use in the legend
export const POWERUP_PROPERTIES = {
    [POWERUP_COLLECTIBLE_TYPES.SHIELD]: {
        id: POWERUP_COLLECTIBLE_TYPES.SHIELD,
        displayName: 'Shield',
        description: 'Protects from one collision. Lasts for 15 seconds or until hit.',
        color: 'var(--powerup-color-shield)',
        symbol: '🛡️',
        duration: 15000, // Shield lasts for 15 seconds OR one hit
        effect: (game) => {
            game.isShieldActive = true;
            // game.shieldHitCount = 0; // Hit count is managed implicitly by deactivation
            console.log("Shield Activated! Lasts for " + (POWERUP_PROPERTIES[POWERUP_COLLECTIBLE_TYPES.SHIELD].duration / 1000) + "s or 1 hit.");
        },
        deactivate: (game) => {
            game.isShieldActive = false;
            console.log("Shield Deactivated.");
        },
        // onHitWhileActive is called by PowerUpManager.handleHitWithEffect
        // It determines if the shield should break after a hit.
        onHitWhileActive: (game) => {
            console.log("Shield took a hit!");
            return true; // true means shield should break/deactivate
        }
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM]: {
        id: POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM,
        displayName: 'Score Bonus',
        description: 'Instantly adds +100 points to your score.',
        color: 'var(--powerup-color-scoreboost)',
        symbol: '💰',
        scoreAmount: 100,
        effect: (game, powerUpData) => {
            game.score += powerUpData.scoreAmount;
            game.uiManager.updateScore(game.score);
            // console.log(`PowerUp: +${powerUpData.scoreAmount} points!`);
        },
        duration: null, // Instantaneous
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_MULTIPLIER]: {
        id: POWERUP_COLLECTIBLE_TYPES.SCORE_MULTIPLIER,
        displayName: 'Score Multiplier (2x)',
        description: 'Doubles all scores earned for 10 seconds.',
        color: 'var(--powerup-color-score-multiplier)',
        symbol: '2x',
        duration: 10000, // Multiplier lasts for 10 seconds
        multiplierFactor: 2,
        effect: (game, powerUpData) => {
            game.scoreMultiplier = powerUpData.multiplierFactor; // This is the game-wide multiplier from collectibles
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
        this.activePowerUpItems = []; // Power-ups currently visible on the board
        this.activeEffects = [];      // Effects currently applied to the snake/game from collectibles

        this.spawnInterval = 12000; // Average spawn interval
        this.lastSpawnTime = 0;
        this.maxOnScreen = 1; // Max 1 collectible power-up on screen at a time
        this.gridSize = GRID_SIZE;
    }

    update(currentTime) {
        // Try to spawn new power-up items
        if (this.activePowerUpItems.length < this.maxOnScreen &&
            (currentTime - this.lastSpawnTime > this.spawnInterval + (Math.random() * 6000 - 3000)) ) { // Add some randomness to spawn
            this.spawnRandomPowerUpItem();
            this.lastSpawnTime = currentTime;
        }

        // Check for collected power-up items by snake's head
        const headPos = this.snake.getHeadPosition();
        this.activePowerUpItems = this.activePowerUpItems.filter(item => {
            if (arePositionsEqual(headPos, item.position)) {
                this.applyCollectibleEffect(item, currentTime);
                // Sound was here: this.game.sfx.play('powerUp');
                return false; // Remove item from board
            }
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
        const availableTypeKeys = Object.keys(POWERUP_COLLECTIBLE_TYPES);
        if (availableTypeKeys.length === 0) return;

        const randomTypeKey = availableTypeKeys[Math.floor(Math.random() * availableTypeKeys.length)];
        const typeID = POWERUP_COLLECTIBLE_TYPES[randomTypeKey];
        const properties = POWERUP_PROPERTIES[typeID];

        if (!properties) {
            console.warn(`PowerUpManager: Properties for power-up type ID ${typeID} not found.`);
            return;
        }

        let position;
        let attempts = 0;
        const maxAttempts = ROWS * COLS; // ROWS and COLS are imported
        do {
            position = getRandomGridPosition(this.board.cols, this.board.rows);
            attempts++;
            if (attempts > maxAttempts) {
                // console.warn("PowerUpManager: Could not find a free spot for power-up item.");
                return; // Don't spawn if no spot found
            }
        } while (
            this.board.isObstacle(position) ||
            this.snake.isSnakeSegment(position) ||
            this.isPowerUpAt(position) || // Check against other collectible items
            (this.game.food && arePositionsEqual(this.game.food.getPosition(), position)) // Avoid food
        );

        this.activePowerUpItems.push({
            id: properties.id,
            position: position,
            symbol: properties.symbol,
            color: properties.color,
            properties: properties,
            spawnTime: performance.now(),
        });
        // console.log(`Spawned power-up item: ${properties.id} at ${position.x},${position.y}`);
    }

    applyCollectibleEffect(item, currentTime) {
        // console.log(`Collected power-up: ${item.id}`);
        const properties = item.properties;

        // Deactivate any existing effect of the same type before applying a new one
        const existingEffectIndex = this.activeEffects.findIndex(eff => eff.id === item.id && eff.properties.deactivate);
        if (existingEffectIndex > -1) {
            const oldEffect = this.activeEffects[existingEffectIndex];
            if (oldEffect.properties.deactivate) { // Check if deactivate exists
                 oldEffect.properties.deactivate(this.game);
            }
            this.activeEffects.splice(existingEffectIndex, 1);
            // console.log(`Deactivated existing effect of type ${item.id} before applying new one.`);
        }

        if (properties.effect) {
            properties.effect(this.game, properties);
        }

        if (properties.duration) {
            this.activeEffects.push({
                id: item.id,
                endTime: currentTime + properties.duration,
                properties: properties,
            });
        }
    }

    isEffectActive(effectTypeID) {
        if (effectTypeID === POWERUP_COLLECTIBLE_TYPES.SHIELD) {
            return this.game.isShieldActive;
        }
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
                return true; // Hit was absorbed, effect might remain
            }
        } else if (effectTypeID === POWERUP_COLLECTIBLE_TYPES.SHIELD && this.game.isShieldActive) {
            // This handles the case where the shield might be active on game state (isShieldActive = true)
            // but its timed effect in activeEffects might have just expired, or it's a shield that breaks on hit regardless of timer.
            const shieldProps = POWERUP_PROPERTIES[POWERUP_COLLECTIBLE_TYPES.SHIELD];
            if (shieldProps.deactivate) { // Deactivate the shield via its defined function
                shieldProps.deactivate(this.game);
            }
            // Also ensure it's removed from activeEffects if it happened to be there by timer
            const shieldEffectIndexInArray = this.activeEffects.findIndex(eff => eff.id === POWERUP_COLLECTIBLE_TYPES.SHIELD);
            if (shieldEffectIndexInArray > -1) this.activeEffects.splice(shieldEffectIndexInArray, 1);
            return true; // Hit was absorbed
        }
        return false;
    }

    draw(context) {
        this.activePowerUpItems.forEach(item => {
            const itemColorValue = getCssVariable(item.color, 'purple'); // Fallback color
            context.fillStyle = itemColorValue;
            const x = item.position.x * this.gridSize;
            const y = item.position.y * this.gridSize;
            context.beginPath();
            context.arc(
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                this.gridSize / 2.1, // Slightly smaller than cell for distinct look
                0, 2 * Math.PI
            );
            context.fill();

            // Draw symbol
            context.fillStyle = getCssVariable('var(--text-color-on-accent)', '#FFFFFF');
            context.font = `bold ${this.gridSize / 1.8}px Arial`; // Adjust size as needed
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(item.symbol, x + this.gridSize / 2, y + this.gridSize / 2 + 1); // Small offset for better centering of emojis
        });
    }

    isPowerUpAt(position) {
        return this.activePowerUpItems.some(p => arePositionsEqual(p.position, position));
    }

    reset() {
        // Deactivate any ongoing effects from collectibles
        this.activeEffects.forEach(effect => {
            if (effect.properties.deactivate) {
                effect.properties.deactivate(this.game);
            }
        });
        this.activeEffects = [];
        this.activePowerUpItems = [];
        this.lastSpawnTime = performance.now(); // Reset spawn timer for fairness on new game
    }
}
