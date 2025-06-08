class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(SHAPES.length - 1);
        this.shape = SHAPES[typeId];
        this.color = "black";
        this.updateColor();
        this.x = 0;
        this.y = 0;
    }

    // --- FINALIZED DRAW METHOD with new logic for side panels ---
    draw(blockSize = BLOCK_SIZE, center = false) {
        this.ctx.fillStyle = this.color;
        
        // Use a smaller, consistent block size for side panels for a better look
        const renderBlockSize = center ? blockSize * 0.75 : blockSize;
        const radius = renderBlockSize / 6;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX, drawY;

                    if (center) {
                        // --- NEW ROBUST CENTERING LOGIC ---
                        // 1. Calculate the piece's dimensions in pixels
                        const piecePixelWidth = this.shape[0].length * renderBlockSize;
                        const piecePixelHeight = this.shape.length * renderBlockSize;

                        // 2. Calculate the offset needed to center it in the canvas
                        const offsetX = (this.ctx.canvas.width - piecePixelWidth) / 2;
                        const offsetY = (this.ctx.canvas.height - piecePixelHeight) / 2;
                        
                        // 3. Set the final drawing coordinates
                        drawX = offsetX + (x * renderBlockSize);
                        drawY = offsetY + (y * renderBlockSize);
                    } else {
                        // Default drawing on the main game board
                        drawX = (this.x + x) * renderBlockSize;
                        drawY = (this.y + y) * renderBlockSize;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX + radius, drawY);
                    this.ctx.lineTo(drawX + renderBlockSize - radius, drawY);
                    this.ctx.arcTo(drawX + renderBlockSize, drawY, drawX + renderBlockSize, drawY + radius, radius);
                    this.ctx.lineTo(drawX + renderBlockSize, drawY + renderBlockSize - radius);
                    this.ctx.arcTo(drawX + renderBlockSize, drawY + renderBlockSize, drawX + renderBlockSize - radius, drawY + renderBlockSize, radius);
                    this.ctx.lineTo(drawX + radius, drawY + renderBlockSize);
                    this.ctx.arcTo(drawX, drawY + renderBlockSize, drawX, drawY + renderBlockSize - radius, radius);
                    this.ctx.lineTo(drawX, drawY + radius);
                    this.ctx.arcTo(drawX, drawY, drawX + radius, drawY, radius);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            });
        });
    }

    move(p) { this.x = p.x; this.y = p.y; this.shape = p.shape; }
    randomizeTetrominoType(noOfTypes) { return Math.floor(Math.random() * noOfTypes + 1); }
    setStartingPosition() { this.x = Math.floor((COLS - this.shape[0].length) / 2); }
    rotate() { const newShape = this.shape[0].map((_, colIndex) => this.shape.map(row => row[colIndex])); newShape.forEach(row => row.reverse()); this.shape = newShape; }
    updateColor() { const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(this.shape)); if (typeId > 0) this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim(); }
}
