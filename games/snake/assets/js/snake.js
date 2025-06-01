// assets/js/snake.js

import { GRID_SIZE } from './constants.js'; // INITIAL_SNAKE_SPEED is no longer imported
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Snake {
    constructor(startX, startY, board, game) {
        this.board = board;
        this.game = game;
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;

        // This 'initialSpeed' property will be set by the Game class based on current difficulty and mode.
        // Setting a default here is a fallback, but Game class should always override it before game starts.
        this.initialSpeed = 5; // Default fallback
        this.speed = this.initialSpeed;

        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;

        this.segmentsToGrow = 0;

        this.colorHead = '';
        this.colorBody = '';
    }

    move() {
        const head = { x: this.body[0].x + this.dx, y: this.body[0].y + this.dy };
        this.body.unshift(head);
        if (this.segmentsToGrow > 0) {
            this.segmentsToGrow--;
        } else {
            this.body.pop();
        }
    }

    changeDirection(newDx, newDy) {
        if (this.body.length > 1 && this.dx === -newDx && this.dy === -newDy) {
            return;
        }
        if (Math.abs(newDx) + Math.abs(newDy) === 1 && (this.dx !== newDx || this.dy !== newDy)) {
            this.dx = newDx;
            this.dy = newDy;
        }
    }

    grow(segments = 1) {
        this.segmentsToGrow += segments;
    }

    setTemporarySpeed(factor, duration) {
        if (this.activeSpeedEffectTimeout) {
            clearTimeout(this.activeSpeedEffectTimeout);
            if (this.speedBeforeFoodEffect !== null) {
                this.speed = this.speedBeforeFoodEffect;
            }
        }
        this.speedBeforeFoodEffect = this.speed;
        this.speed *= factor;
        if (this.speed < 0.5) this.speed = 0.5; // Min speed clamp

        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }

        this.activeSpeedEffectTimeout = setTimeout(() => {
            this.revertTemporarySpeed();
        }, duration);
    }

    revertTemporarySpeed() {
        if (this.speedBeforeFoodEffect !== null) {
            this.speed = this.speedBeforeFoodEffect;
        }
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }
    }

    checkCollision() {
        const head = this.body[0];
        if (this.board.isOutOfBounds(head) || this.board.isObstacle(head)) {
            return true;
        }
        for (let i = 1; i < this.body.length; i++) {
            if (arePositionsEqual(head, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    getHeadPosition() {
        return this.body[0];
    }

    isSnakeSegment(position, includeHead = true) {
        const startIndex = includeHead ? 0 : 1;
        for (let i = startIndex; i < this.body.length; i++) {
            if (arePositionsEqual(position, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    draw(context) {
        this.colorHead = getCssVariable('var(--snake-head-color)', '#62c462');
        this.colorBody = getCssVariable('var(--snake-body-color)', '#86e586');
        this.body.forEach((segment, index) => {
            context.fillStyle = (index === 0) ? this.colorHead : this.colorBody;
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const cornerRadius = this.gridSize / 4;
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
        });
    }

    /**
     * Resets the snake to its initial state.
     * `this.initialSpeed` is expected to be set by the Game class based on the current
     * game mode and difficulty before this reset method is called.
     * @param {number} startX - The initial X grid coordinate for the snake's head.
     * @param {number} startY - The initial Y grid coordinate for the snake's head.
     */
    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1; // Default direction right
        this.dy = 0;
        this.segmentsToGrow = 0;

        // this.initialSpeed should have been set by Game.resetGame() before calling snake.reset()
        this.speed = this.initialSpeed; // Reset current speed to the mode/difficulty-specific initial speed.

        if (this.activeSpeedEffectTimeout) {
            clearTimeout(this.activeSpeedEffectTimeout);
        }
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        
        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed(); // Reflect reset speed in game's effective speed tracker
        }
    }
}
