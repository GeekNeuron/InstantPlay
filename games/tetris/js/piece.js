class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(COLORS.length - 1);
        this.shape = SHAPES[typeId];
        this.color = COLORS[typeId];
        this.x = 0;
        this.y = 0;
    }

    // --- MODIFIED FUNCTION TO DRAW ROUNDED BLOCKS ---
    draw(blockSize = BLOCK_SIZE, center = false) {
        this.ctx.fillStyle = this.color;
        const radius = blockSize / 6; // Make radius proportional to the block size

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX = (this.x + x) * blockSize;
                    let drawY = (this.y + y) * blockSize;
                    
                    if (center) {
                       const centeredX = x + (4 - this.shape[0].length) / 2;
                       const centeredY = y + (4 - this.shape.length) / 2;
                       drawX = centeredX * blockSize;
                       drawY = centeredY * blockSize;
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

                    // Optional border
                    this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    this.ctx.stroke();
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
        // Transpose and reverse rows to rotate
        const newShape = this.shape[0].map((_, colIndex) => this.shape.map(row => row[colIndex]));
        newShape.forEach(row => row.reverse());
        this.shape = newShape;
    }
}
