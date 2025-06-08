// assets/js/snake.js
import { GRID_SIZE } from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

// Helper function to draw a rounded rectangle
function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
    context.fill();
}


export class Snake {
    // ... (constructor and other logic methods remain the same) ...
    constructor(startX, startY, board, game) { /* ... */ }
    move() { /* ... */ }
    changeDirection(newDx, newDy) { /* ... */ }
    grow(segments = 1) { /* ... */ }
    setTemporarySpeed(factor, duration) { /* ... */ }
    revertTemporarySpeed() { /* ... */ }
    checkCollision() { /* ... */ }
    getHeadPosition() { return this.body[0]; }
    isSnakeSegment(position, includeHead = true) { /* ... */ }


    // --- Overhauled Draw Method for better rounded squares ---
    draw(context) {
        if (!this.body || this.body.length === 0) return;

        this.colorHead = getCssVariable('var(--snake-head-color)', '#4CAF50');
        this.colorBody = getCssVariable('var(--snake-body-color)', '#8BC34A');
        this.colorEye = getCssVariable('var(--snake-eye-color)', '#FFFFFF');

        this.body.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const cornerRadius = this.gridSize / 4; // Adjust for desired roundness

            if (index === 0) { // Head
                context.fillStyle = this.colorHead;
                drawRoundedRect(context, x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, cornerRadius);
                this.drawSnakeEyes(context, x, y);
            } else { // Body
                context.fillStyle = this.colorBody;
                drawRoundedRect(context, x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, cornerRadius);
            }
        });
    }

    drawSnakeEyes(context, x, y) {
        context.fillStyle = this.colorEye;
        const eyeSize = Math.max(2, Math.floor(this.gridSize / 6));
        const pupilSize = Math.max(1, Math.floor(eyeSize / 2));
        const eyeOffsetFromCenter = this.gridSize / 4;

        let eye1X, eye1Y, eye2X, eye2Y;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;

        if (Math.abs(this.dx) > 0) { // Moving horizontally
            eye1X = centerX + (this.dx * eyeOffsetFromCenter / 2);
            eye1Y = centerY - eyeOffsetFromCenter;
            eye2X = centerX + (this.dx * eyeOffsetFromCenter / 2);
            eye2Y = centerY + eyeOffsetFromCenter;
        } else { // Moving vertically
            eye1X = centerX - eyeOffsetFromCenter;
            eye1Y = centerY + (this.dy * eyeOffsetFromCenter / 2);
            eye2X = centerX + eyeOffsetFromCenter;
            eye2Y = centerY + (this.dy * eyeOffsetFromCenter / 2);
        }

        context.beginPath();
        context.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2);
        context.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2);
        context.fill();

        // Pupils
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(eye1X + (this.dx * pupilSize / 2), eye1Y + (this.dy * pupilSize / 2), pupilSize / 2, 0, Math.PI * 2);
        context.arc(eye2X + (this.dx * pupilSize / 2), eye2Y + (this.dy * pupilSize / 2), pupilSize / 2, 0, Math.PI * 2);
        context.fill();
    }

    reset(startX, startY) { /* ... as before ... */ }
}
