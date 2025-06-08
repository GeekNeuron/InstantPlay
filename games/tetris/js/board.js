class Board {
    constructor(ctx) {
        this.ctx = ctx;
        this.nextCtx = document.getElementById('next-canvas').getContext('2d');
        this.holdCtx = document.getElementById('hold-canvas').getContext('2d');
        this.grid = this.getEmptyGrid();
        this.piece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
    }

    getEmptyGrid() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
    
    reset() {
        this.grid = this.getEmptyGrid();
        this.heldPiece = null;
        this.canHold = true;
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.draw();
    }

    drawGrid() {
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color');
        this.ctx.lineWidth = 1;
        for (let i = 1; i < COLS; i++) { this.ctx.beginPath(); this.ctx.moveTo(i * BLOCK_SIZE, 0); this.ctx.lineTo(i * BLOCK_SIZE, this.ctx.canvas.height); this.ctx.stroke(); }
        for (let i = 1; i < ROWS; i++) { this.ctx.beginPath(); this.ctx.moveTo(0, i * BLOCK_SIZE); this.ctx.lineTo(this.ctx.canvas.width, i * BLOCK_SIZE); this.ctx.stroke(); }
    }

    draw() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid();
        this.drawGhostPiece();
        this.grid.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE, BLOCK_SIZE); }); });
        if (this.piece) this.piece.draw(); // Draw falling piece if it exists
        this.drawNextPiece();
        this.drawHeldPiece();
    }

    // --- NEW: Function to draw the hard drop animation frame ---
    drawHardDropAnimation(startY, endY) {
        // First, draw the normal board state without the falling piece
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid();
        this.grid.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE, BLOCK_SIZE); }); });

        const trailLength = endY - startY;
        
        // Draw the trail of the piece.
        for (let y = startY; y < endY; y++) {
            const progress = (y - startY) / trailLength;
            const alpha = 0.3 * (1 - progress); // Fades out along the trail
            this.ctx.globalAlpha = alpha;
            
            this.piece.shape.forEach((row, pieceY) => {
                row.forEach((value, pieceX) => {
                    if (value > 0) {
                        this.drawBlock(this.ctx, this.piece.x + pieceX, y + pieceY, value, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
        }
        
        // Draw the final solid piece at the bottom
        this.ctx.globalAlpha = 1.0;
        this.piece.y = endY;
        this.piece.draw();
    }

    drawBlock(context, x, y, value, width, height) {
        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = Math.min(width, height) / 6;
        const blockX = x * width;
        const blockY = y * height;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(blockX + radius, blockY); context.lineTo(blockX + width - radius, blockY);
        context.arcTo(blockX + width, blockY, blockX + width, blockY + radius, radius);
        context.lineTo(blockX + width, blockY + height - radius);
        context.arcTo(blockX + width, blockY + height, blockX + width - radius, blockY + height, radius);
        context.lineTo(blockX + radius, blockY + height);
        context.arcTo(blockX, blockY + height, blockX, blockY + height - radius, radius);
        context.lineTo(blockX, blockY + radius);
        context.arcTo(blockX, blockY, blockX + radius, blockY, radius);
        context.closePath();
        context.fill();
    }
    
    drawPieceOnSideCanvas(context, piece) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        if (!piece) return;
        const matrix = piece.shape;
        const maxDimension = Math.max(matrix[0].length, matrix.length);
        const blockSize = context.canvas.width / (maxDimension + SIDE_PANEL_PADDING);
        const piecePixelWidth = matrix[0].length * blockSize;
        const piecePixelHeight = matrix.length * blockSize;
        const offsetX = (context.canvas.width - piecePixelWidth) / 2;
        const offsetY = (context.canvas.height - piecePixelHeight) / 2;
        const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(piece.shape));
        if (typeId > 0) { matrix.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(context, (offsetX / blockSize) + x, (offsetY / blockSize) + y, value, blockSize, blockSize); }); }); }
    }
    drawHeldPiece() { this.drawPieceOnSideCanvas(this.holdCtx, this.heldPiece); }
    drawNextPiece() { this.drawPieceOnSideCanvas(this.nextCtx, this.nextPiece); }
    calculateGhostPosition() { let ghost = JSON.parse(JSON.stringify(this.piece)); while (this.isValid(ghost)) ghost.y++; ghost.y--; return ghost; }
    drawGhostPiece() { const ghost = this.calculateGhostPosition(); this.ctx.globalAlpha = 0.2; ghost.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, ghost.x + x, ghost.y + y, value, BLOCK_SIZE, BLOCK_SIZE); }); }); this.ctx.globalAlpha = 1.0; }
    hold() { if (!this.canHold) return; if (this.heldPiece) { [this.piece, this.heldPiece] = [this.heldPiece, this.piece]; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); } else { this.heldPiece = this.piece; this.getNewPiece(); } this.canHold = false; }
    getNewPiece() { this.piece = this.nextPiece; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); this.nextPiece = new Piece(this.nextCtx); this.canHold = true; }
    isValid(p) { return p.shape.every((row, dy) => { return row.every((value, dx) => { let x = p.x + dx; let y = p.y + dy; return (value === 0 || (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y))); }); }); }
    isInsideWalls(x) { return x >= 0 && x < COLS; }
    isAboveFloor(y) { return y < ROWS; }
    isNotOccupied(x, y) { return this.grid[y] && this.grid[y][x] === 0; }
    freeze() { this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.grid[y + this.piece.y][x + this.piece.x] = value; }); }); this.clearLines(); }
    clearLines() { let linesCleared = 0; this.grid.forEach((row, y) => { if (row.every(value => value > 0)) { linesCleared++; this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); } }); if (linesCleared > 0) game.updateScore(linesCleared); }
}
