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

    // This function now ONLY draws the main falling piece.
    draw() {
        this.updateColor(); // Ensure color is correct before drawing
        this.ctx.fillStyle = this.color;
        
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const drawX = (this.x + x);
                    const drawY = (this.y + y);
                    // This now calls the master drawBlock function from the Board
                    board.drawBlock(this.ctx, drawX, drawY, value, BLOCK_SIZE, BLOCK_SIZE);
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
