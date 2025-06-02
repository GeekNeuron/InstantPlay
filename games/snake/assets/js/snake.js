// assets/js/snake.js

import { GRID_SIZE } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Snake {
    constructor(startX, startY, board, game) {
        this.board = board;
        this.game = game;
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;
        this.initialSpeed = 5; 
        this.speed = this.initialSpeed;
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        this.segmentsToGrow = 0;
        this.colorHead = '';
        this.colorBody = '';
        console.log(`Snake: Initialized at (${startX},${startY}). Initial speed set to ${this.initialSpeed} by constructor default.`);
    }

    move() { /* ... as before ... */ }
    changeDirection(newDx, newDy) { /* ... as before ... */ }
    grow(segments = 1) { /* ... as before ... */ }
    setTemporarySpeed(factor, duration) { /* ... as before ... */ }
    revertTemporarySpeed() { /* ... as before ... */ }
    checkCollision() { /* ... as before ... */ }
    getHeadPosition() { return this.body[0]; }
    isSnakeSegment(position, includeHead = true) { /* ... as before ... */ }

    draw(context) {
        if (!this.body || this.body.length === 0) {
            console.warn("Snake.draw(): Attempted to draw but snake body is empty or undefined.");
            return;
        }
        this.colorHead = getCssVariable('var(--snake-head-color)', '#3A9943'); // Slightly different fallback
        this.colorBody = getCssVariable('var(--snake-body-color)', '#4CAF50'); // Slightly different fallback
        console.log(`Snake.draw(): Drawing snake. Length: ${this.body.length}. Head: (${this.body[0]?.x},${this.body[0]?.y}). HeadColor: ${this.colorHead}`);

        this.body.forEach((segment, index) => {
            if (typeof segment.x !== 'number' || typeof segment.y !== 'number') {
                console.warn("Snake.draw(): Invalid segment data", segment);
                return; 
            }
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

    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;
        this.segmentsToGrow = 0;
        // this.initialSpeed is set by Game class prior to calling this.
        this.speed = this.initialSpeed; 
        console.log(`Snake.reset(): Speed set to ${this.speed} (from initialSpeed: ${this.initialSpeed}). Position: (${startX},${startY})`);

        if (this.activeSpeedEffectTimeout) clearTimeout(this.activeSpeedEffectTimeout);
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        
        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }
    }
}
