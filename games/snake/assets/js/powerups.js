// assets/js/powerups.js

import { getRandomGridPosition, arePositionsEqual, getCssVariable } from './utils.js';
// --- اصلاح: وارد کردن ROWS, COLS و GRID_SIZE ---
import { GRID_SIZE, ROWS, COLS } from './constants.js';

export const POWERUP_COLLECTIBLE_TYPES = {
    SHIELD: 'shield',
    SCORE_BOOST_ITEM: 'scoreBoostItem',
};

const POWERUP_PROPERTIES = {
    [POWERUP_COLLECTIBLE_TYPES.SHIELD]: {
        color: 'var(--powerup-color-shield)',
        duration: 10000,
        symbol: '🛡️',
        effect: (game) => { game.isShieldActive = true; game.shieldHitCount = 0; console.log("Shield Activated!"); },
        deactivate: (game) => { game.isShieldActive = false; console.log("Shield Deactivated."); },
        onHitWhileActive: (game) => {
            game.shieldHitCount = (game.shieldHitCount || 0) + 1;
            if (game.shieldHitCount >= 1) {
                return true; // Shield breaks
            }
            return false; // Shield remains
        }
    },
    [POWERUP_COLLECTIBLE_TYPES.SCORE_BOOST_ITEM]: {
        color: 'var(--powerup-color-scoreboost)',
        symbol: '💰',
        scoreAmount: 100,
        effect: (game, powerUpData) => {
            game.score += powerUpData.scoreAmount;
            game.uiManager.updateScore(game.score);
            console.log(`+${powerUpData.scoreAmount} points!`);
        },
        duration: null,
    },
};

export class PowerUpManager {
    constructor(board, snake, game) {
        this.board = board;
        this.snake = snake;
        this.game = game;
        this.activePowerUpItems = [];
        this.activeEffects = [];
        this.spawnInterval = 10000;
        this.lastSpawnTime = 0;
        this.maxOnScreen = 1;
        this.gridSize = GRID_SIZE; // GRID_SIZE از constants.js وارد شده
    }

    update(currentTime) {
        if (this.activePowerUpItems.length < this.maxOnScreen && (currentTime - this.lastSpawnTime > this.spawnInterval + Math.random() * 5000)) {
            this.spawnRandomPowerUpItem();
            this.lastSpawnTime = currentTime;
        }

        const headPos = this.snake.getHeadPosition();
        this.activePowerUpItems = this.activePowerUpItems.filter(item => {
            if (arePositionsEqual(headPos, item.position)) {
                this.applyCollectibleEffect(item, currentTime);
                // this.game.sfx.play('powerUp'); // --- حذف فراخوانی صدا ---
                return false;
            }
            return true;
        });

        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.endTime && currentTime >= effect.endTime) {
                if (effect.properties.deactivate) {
                    effect.properties.deactivate(this.game, effect.data);
                }
                return false;
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
        // --- استفاده از ROWS و COLS وارد شده ---
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
            type: type,
            position: position,
            symbol: properties.symbol,
            color: properties.color,
            properties: properties,
            spawnTime: performance.now(),
        });
        console.log(`Spawned power-up item: ${type} at ${position.x},${position.y}`);
    }

    applyCollectibleEffect(item, currentTime) {
        console.log(`Collected power-up: ${item.type}`);
        const properties = item.properties;
        if (properties.effect) {
            properties.effect(this.game, properties);
        }
        if (properties.duration && properties.deactivate) {
            this.activeEffects.push({
                type: item.type,
                endTime: currentTime + properties.duration,
                properties: properties,
                data: properties
            });
        }
    }

    isEffectActive(effectType) {
        return this.activeEffects.some(effect => effect.type === effectType);
    }

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
                    this.activeEffects.splice(effectIndex, 1);
                    return true;
                }
                return true; // Hit absorbed, effect remains (e.g. multi-hit shield)
            }
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
                effect.properties.deactivate(this.game, effect.data);
            }
        });
        this.activeEffects = [];
        this.activePowerUpItems = [];
        this.lastSpawnTime = performance.now();
    }
}
