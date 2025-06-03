// assets/js/snake.js

import { GRID_SIZE } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Snake {
    constructor(startX, startY, board, game) {
        this.board = board;
        this.game = game;
        this.gridSize = GRID_SIZE;
        this.body = [{ x: startX, y: startY }];
        this.dx = 1; // Initial movement: right
        this.dy = 0;
        this.initialSpeed = 5; // Default, Game class will set the actual initial speed.
        this.speed = this.initialSpeed;
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        this.segmentsToGrow = 0;

        // Colors will be fetched dynamically in draw method
        this.colorHead = '';
        this.colorBodyBase = ''; // Base color for body gradient
        this.colorEye = '';
        this.colorBodyHighlightRgb = ''; // For body segment highlight
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
            return; // Prevent 180-degree turn
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
        if (this.speed < 0.5) this.speed = 0.5;

        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }
        this.activeSpeedEffectTimeout = setTimeout(() => this.revertTemporarySpeed(), duration);
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

    // --- New Draw Method Inspired by GitSnake ---
    draw(context) {
        if (!this.body || this.body.length === 0) {
            console.warn("Snake.draw(): Snake body is empty.");
            return;
        }

        // Fetch colors dynamically to respond to theme changes
        this.colorHead = getCssVariable('var(--snake-head-color)', '#45b7b8');
        this.colorBodyBase = getCssVariable('var(--snake-body-color)', '#4ecdc4');
        this.colorEye = getCssVariable('var(--snake-eye-color)', '#FFFFFF');
        this.colorBodyHighlightRgb = getCssVariable('var(--snake-body-highlight-rgb)', "255, 255, 255").replace(/"/g, '');


        this.body.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            if (index === 0) {
                // Draw Snake Head
                this.drawSnakeHead(context, x, y);
            } else {
                // Draw Snake Body Segment
                this.drawSnakeBodySegment(context, x, y, index);
            }
        });
    }

    drawSnakeHead(context, x, y) {
        // Head body (slightly smaller to fit border/details within cell)
        context.fillStyle = this.colorHead;
        context.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);

        // Eyes
        context.fillStyle = this.colorEye;
        const eyeSize = Math.max(2, Math.floor(this.gridSize / 7)); // Responsive eye size
        const eyeOffset = Math.max(2, Math.floor(this.gridSize / 5)); // Responsive eye offset
        const pupilSize = Math.max(1, Math.floor(eyeSize / 2)); // Pupil can be black or very dark

        // Determine eye position based on direction (this.dx, this.dy)
        let eye1X, eye1Y, eye2X, eye2Y;

        if (this.dx === 1) { // Moving right
            eye1X = x + this.gridSize - eyeOffset - eyeSize; eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset - eyeSize; eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        } else if (this.dx === -1) { // Moving left
            eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset; eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        } else if (this.dy === -1) { // Moving up
            eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset - eyeSize; eye2Y = y + eyeOffset;
        } else if (this.dy === 1) { // Moving down
            eye1X = x + eyeOffset; eye1Y = y + this.gridSize - eyeOffset - eyeSize;
            eye2X = x + this.gridSize - eyeOffset - eyeSize; eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        } else { // Default eyes (e.g., when game starts, before first move if dx/dy are 0,0)
            eye1X = x + this.gridSize / 2 - eyeSize - eyeOffset / 2; eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize / 2 + eyeOffset / 2;          eye2Y = y + eyeOffset;
        }
        context.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        context.fillRect(eye2X, eye2Y, eyeSize, eyeSize);

        // Pupils (optional, simple black dots)
        // context.fillStyle = '#000000';
        // context.fillRect(eye1X + eyeSize / 2 - pupilSize / 2, eye1Y + eyeSize / 2 - pupilSize / 2, pupilSize, pupilSize);
        // context.fillRect(eye2X + eyeSize / 2 - pupilSize / 2, eye2Y + eyeSize / 2 - pupilSize / 2, pupilSize, pupilSize);
    }

    drawSnakeBodySegment(context, x, y, index) {
        // Base color for body segment (using the theme variable)
        // The GitSnake example uses an opacity gradient. We can simulate this or use a slightly darker shade.
        const opacity = Math.max(0.5, 1 - (index * 0.04)); // Opacity decreases for tail segments
        
        // To use RGBA with a hex color from CSS variable, we need to convert hex to RGB first.
        // Or, define body color in theme as an RGB string if direct RGBA manipulation is needed.
        // For simplicity, let's use globalAlpha.
        context.save();
        context.globalAlpha = opacity;
        context.fillStyle = this.colorBodyBase;
        context.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
        context.restore(); // Restore globalAlpha for other drawings

        // Inner highlight (from GitSnake)
        // It uses rgba(255, 255, 255, opacity * 0.2)
        // We use the --snake-body-highlight-rgb variable.
        if (this.colorBodyHighlightRgb) {
            const highlightOpacity = opacity * 0.25; // Make highlight more subtle
            context.fillStyle = `rgba(${this.colorBodyHighlightRgb}, ${highlightOpacity})`;
            context.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        }
    }
    // --- End of New Draw Method ---

    reset(startX, startY) {
        this.body = [{ x: startX, y: startY }];
        this.dx = 1;
        this.dy = 0;
        this.segmentsToGrow = 0;
        this.speed = this.initialSpeed;
        if (this.activeSpeedEffectTimeout) clearTimeout(this.activeSpeedEffectTimeout);
        this.speedBeforeFoodEffect = null;
        this.activeSpeedEffectTimeout = null;
        if (this.game && typeof this.game.updateGameSpeed === 'function') {
            this.game.updateGameSpeed();
        }
    }
}
