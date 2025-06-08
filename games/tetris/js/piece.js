class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(SHAPES.length - 1);
        this.shape = SHAPES[typeId];
        this.color = "black";
        this.x = 0;
        this.y = 0;
        this.updateColor();
    }

    draw(blockSize = BLOCK_SIZE, center = false) {
        this.updateColor();
        this.ctx.fillStyle = this.color;
        
        let renderBlockSize = blockSize;
        if (center) {
            const matrix = this.shape;
            const maxDimension = Math.max(matrix[0].length, matrix.length);
            renderBlockSize = this.ctx.canvas.width / (maxDimension + 1.2);
        }
        
        const radius = renderBlockSize / 6;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX, drawY;
                    if (center) {
                        const piecePixelWidth = this.shape[0].length * renderBlockSize;
                        const piecePixelHeight = this.shape.length * renderBlockSize;
                        const offsetX = (this.ctx.canvas.width - piecePixelWidth) / 2;
                        const offsetY = (this.ctx.canvas.height - piecePixelHeight) / 2;
                        drawX = offsetX + (x * renderBlockSize);
                        drawY = offsetY + (y * renderBlockSize);
                    } else {
                        drawX = (this.x + x) * blockSize;
                        drawY = (this.y + y) * blockSize;
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
    rotate() { const newShape = this.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse()); this.shape = newShape; }
    updateColor() { const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(this.shape)); if (typeId > 0) this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim(); }
}
