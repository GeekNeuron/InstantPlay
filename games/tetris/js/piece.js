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

    // --- SIMPLIFIED DRAW METHOD ---
    // This function is now ONLY responsible for drawing the falling piece on the main board.
    draw() {
        this.ctx.fillStyle = this.color;
        const radius = BLOCK_SIZE / 6;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const drawX = (this.x + x) * BLOCK_SIZE;
                    const drawY = (this.y + y) * BLOCK_SIZE;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX + radius, drawY);
                    this.ctx.lineTo(drawX + BLOCK_SIZE - radius, drawY);
                    this.ctx.arcTo(drawX + BLOCK_SIZE, drawY, drawX + BLOCK_SIZE, drawY + radius, radius);
                    this.ctx.lineTo(drawX + BLOCK_SIZE, drawY + BLOCK_SIZE - radius);
                    this.ctx.arcTo(drawX + BLOCK_SIZE, drawY + BLOCK_SIZE, drawX + BLOCK_SIZE - radius, drawY + BLOCK_SIZE, radius);
                    this.ctx.lineTo(drawX + radius, drawY + BLOCK_SIZE);
                    this.ctx.arcTo(drawX, drawY + BLOCK_SIZE, drawX, drawY + BLOCK_SIZE - radius, radius);
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
    
    updateColor() {
        const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(this.shape));
        if (typeId > 0) {
            this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim();
        }
    }
}
