class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(COLORS.length - 1);
        this.shape = SHAPES[typeId];
        this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim();
        this.x = 0;
        this.y = 0;
    }

    // --- MODIFIED & FINAL DRAW METHOD ---
    draw(blockSize = BLOCK_SIZE, center = false) {
        this.ctx.fillStyle = this.color;
        const radius = blockSize / 6;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX, drawY;

                    if (center) {
                        // New logic for perfect centering in side boxes
                        const pieceWidth = this.shape[0].length * blockSize;
                        const pieceHeight = this.shape.length * blockSize;
                        const offsetX = (this.ctx.canvas.width - pieceWidth) / 2;
                        const offsetY = (this.ctx.canvas.height - pieceHeight) / 2;
                        drawX = offsetX + (x * blockSize);
                        drawY = offsetY + (y * blockSize);
                    } else {
                        // Default drawing on the main game board
                        drawX = (this.x + x) * blockSize;
                        drawY = (this.y + y) * blockSize;
                    }
                    
                    // Draw the rounded rectangle path
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX + radius, drawY);
                    this.ctx.lineTo(drawX + blockSize - radius, drawY);
                    this.ctx.arcTo(drawX + blockSize, drawY, drawX + blockSize, drawY + radius, radius);
                    this.ctx.lineTo(drawX + blockSize, drawY + blockSize - radius);
                    this.ctx.arcTo(drawX + blockSize, drawY + blockSize, drawX + blockSize - radius, drawY + blockSize, radius);
                    this.ctx.lineTo(drawX + radius, drawY + blockSize);
                    this.ctx.arcTo(drawX, drawY + blockSize, drawX, drawY + blockSize - radius, radius);
                    this.ctx.lineTo(drawX, drawY + radius);
                    this.ctx.arcTo(drawX, drawY, drawX + radius, drawY, radius);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            });
        });
    }

    move(p) {
        this.x = p.x;
        this.y = p.y;
        this.shape = p.shape;
    }

    randomizeTetrominoType(noOfTypes) {
        return Math.floor(Math.random() * noOfTypes + 1);
    }
    
    setStartingPosition() {
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
    }

    rotate() {
        const newShape = this.shape[0].map((_, colIndex) => this.shape.map(row => row[colIndex]));
        newShape.forEach(row => row.reverse());
        this.shape = newShape;
    }
    
    // Update color when theme changes
    updateColor() {
        const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(this.shape));
        if (typeId !== -1) {
            this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim();
        }
    }
}
