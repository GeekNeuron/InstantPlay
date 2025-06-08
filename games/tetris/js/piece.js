class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        const typeId = this.randomizeTetrominoType(COLORS.length - 1);
        this.shape = SHAPES[typeId];
        this.color = "black";
        this.updateColor();
        this.x = 0;
        this.y = 0;
    }

    // --- FINALIZED DRAW METHOD with new logic for side panels ---
    draw(defaultBlockSize = BLOCK_SIZE, center = false) {
        this.ctx.fillStyle = this.color;
        let blockSize = defaultBlockSize;

        if (center) {
            blockSize = this.ctx.canvas.width / 4; // Side panels are always 4x4 grids
        }
        
        const radius = blockSize / 6;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let drawX, drawY;
                    if (center) {
                        // Logic to center the piece on the 4x4 grid
                        const pieceMatrixWidth = this.shape[0].length;
                        const offsetX = (4 - pieceMatrixWidth) / 2;
                        
                        // Special offset for I and O pieces for better visual centering
                        let y_offset = 0;
                        if (pieceMatrixWidth === 4 || pieceMatrixWidth === 2) { // I or O piece
                           y_offset = 0.5;
                        }

                        drawX = (x + offsetX) * blockSize;
                        drawY = (y + y_offset) * blockSize;
                    } else {
                        drawX = (this.x + x) * blockSize;
                        drawY = (this.y + y) * blockSize;
                    }
                    
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

    move(p) { this.x = p.x; this.y = p.y; this.shape = p.shape; }
    randomizeTetrominoType(noOfTypes) { return Math.floor(Math.random() * noOfTypes + 1); }
    setStartingPosition() { this.x = Math.floor((COLS - this.shape[0].length) / 2); }
    rotate() { const newShape = this.shape[0].map((_, colIndex) => this.shape.map(row => row[colIndex])); newShape.forEach(row => row.reverse()); this.shape = newShape; }
    updateColor() { const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(this.shape)); if (typeId !== -1) this.color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${typeId}`).trim(); }
}
