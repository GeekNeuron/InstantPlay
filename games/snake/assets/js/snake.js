// assets/js/snake.js

import { GRID_SIZE } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

// Helper function to draw a rounded rectangle, moved here for self-containment
function drawRoundedRect(context, x, y, width, height, radius) {
    if (radius > width / 2) radius = width / 2;
    if (radius > height / 2) radius = height / 2;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y,   x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x,   y + height, x, y,   radius);
    context.arcTo(x,   y,   x + width, y,   radius);
    context.closePath();
    context.fill();
}

export class Snake {
    constructor(startX, startY, board, game) {
        this.board = board;
        this.game = game;
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }];
        this.dx = 1; 
        this.dy = 0;
        this.initialSpeed = 5; // Default fallback, Game class must set the actual initial speed.
        this.speed = this.initialSpeed;
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        this.segmentsToGrow = 0;
        this.skinColors = null; // Will be set by game.applySkin()
    }

    setSkin(colors) {
        this.skinColors = colors;
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
        const isTurningBack = this.body.length > 1 && this.dx === -newDx && this.dy === -newDy;
        const isDiagonal = Math.abs(newDx) + Math.abs(newDy) !== 1;
        const isSameDirection = this.dx === newDx && this.dy === newDy;
        
        if (isTurningBack || isDiagonal || isSameDirection) {
            return;
        }
        
        this.dx = newDx;
        this.dy = newDy;
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
        if (this.speed < 0.5) this.speed = 0.5; // Minimum speed clamp

        if (this.game) {
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
        if (this.game) {
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
        if (!this.body || this.body.length === 0 || !this.skinColors) {
            // console.warn("Snake.draw(): Aborted. No body or no skin set.");
            return;
        }

        const colorHead = getCssVariable(this.skinColors['--snake-head-color'], '#4CAF50');
        const colorBody = getCssVariable(this.skinColors['--snake-body-color'], '#8BC34A');
        
        this.body.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const cornerRadius = this.gridSize / 3; // Controls roundness
            const padding = 1; // Gap between segments

            context.fillStyle = (index === 0) ? colorHead : colorBody;
            drawRoundedRect(context, x + padding, y + padding, this.gridSize - (padding * 2), this.gridSize - (padding * 2), cornerRadius);
            
            if (index === 0) {
                this.drawSnakeEyes(context, x, y);
            }
        });
    }

    drawSnakeEyes(context, x, y) {
        if (!this.skinColors) return;
        const colorEye = getCssVariable(this.skinColors['--snake-eye-color'], '#FFFFFF');
        context.fillStyle = colorEye;
        
        const eyeSize = Math.max(2, Math.floor(this.gridSize / 6));
        const pupilSize = Math.max(1, Math.floor(eyeSize / 2));
        const eyeOffsetFromCenter = this.gridSize / 4;

        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;

        let eye1X, eye1Y, eye2X, eye2Y;
        const currentDX = this.dx !== 0 ? this.dx : (this.body.length > 1 ? (this.body[0].x - this.body[1].x) : 1);
        const currentDY = this.dy !== 0 ? this.dy : (this.body.length > 1 ? (this.body[0].y - this.body[1].y) : 0);

        if (Math.abs(currentDX) > 0) { // Moving horizontally
            eye1X = centerX + (currentDX * eyeOffsetFromCenter * 0.5);
            eye1Y = centerY - eyeOffsetFromCenter;
            eye2X = centerX + (currentDX * eyeOffsetFromCenter * 0.5);
            eye2Y = centerY + eyeOffsetFromCenter;
        } else { // Moving vertically or stationary
            eye1X = centerX - eyeOffsetFromCenter;
            eye1Y = centerY + (currentDY * eyeOffsetFromCenter * 0.5);
            eye2X = centerX + eyeOffsetFromCenter;
            eye2Y = centerY + (currentDY * eyeOffsetFromCenter * 0.5);
        }

        // Draw white part of eyes
        context.beginPath();
        context.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2);
        context.fill();
        
        context.beginPath();
        context.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2);
        context.fill();
        
        // Draw pupils
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(eye1X + (this.dx * pupilSize * 0.5), eye1Y + (this.dy * pupilSize * 0.5), pupilSize / 2, 0, Math.PI * 2);
        context.fill();
        
        context.beginPath();
        context.arc(eye2X + (this.dx * pupilSize * 0.5), eye2Y + (this.dy * pupilSize * 0.5), pupilSize / 2, 0, Math.PI * 2);
        context.fill();
    }
    
    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;
        this.segmentsToGrow = 0;
        this.speed = this.initialSpeed;

        if (this.activeSpeedEffectTimeout) {
            clearTimeout(this.activeSpeedEffectTimeout);
        }
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        
        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }
    }
}
