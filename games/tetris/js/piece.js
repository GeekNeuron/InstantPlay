class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(COLORS.length - 1);
        this.shape = SHAPES[typeId];
        this.color = COLORS[typeId];
        this.x = 0;
        this.y = 0;
    }

    draw(blockSize = BLOCK_SIZE, center = false) {
        this.ctx.fillStyle = this.color;
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 15;
        
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX = this.x + x;
                    let drawY = this.y + y;
                    if(center) {
                       drawX = x + (4 - this.shape[0].length) / 2;
                       drawY = y + (4 - this.shape.length) / 2;
                    }
                    this.ctx.fillRect(drawX * blockSize, drawY * blockSize, blockSize, blockSize);
                    this.ctx.strokeStyle = '#000';
                    this.ctx.strokeRect(drawX * blockSize, drawY * blockSize, blockSize, blockSize);
                }
            });
        });
        // Reset shadow for other drawings.
        this.ctx.shadowBlur = 0;
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
