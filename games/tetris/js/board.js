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

    draw() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid(this.ctx, COLS, ROWS);
        if (this.piece) {
            this.drawGhostPiece();
            this.piece.draw();
        }
        this.grid.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE, BLOCK_SIZE); }); });
        this.drawNextPiece();
        this.drawHeldPiece();
    }

    drawGrid(context, columns, rows) {
        const blockSize = context.canvas.width / columns;
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color');
        context.lineWidth = 1;
        for (let i = 1; i < columns; i++) { context.beginPath(); context.moveTo(i * blockSize, 0); context.lineTo(i * blockSize, context.canvas.height); context.stroke(); }
        for (let i = 1; i < rows; i++) { context.beginPath(); context.moveTo(0, i * blockSize); context.lineTo(context.canvas.width, i * blockSize); context.stroke(); }
    }
    
    drawBlock(context, x, y, value, width, height) {
        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = Math.min(width, height) / 6;
        const blockX = x * width;
        const blockY = y * height;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(blockX + radius, blockY);
        context.lineTo(blockX + width - radius, blockY);
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
    
    // --- FINAL PROFESSIONAL REWRITE for Hold/Next ---
drawPieceOnSideCanvas(context, piece) {
    // Clear the canvas first
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Grid drawing code is now removed.

    if (!piece) return;

    // The stable rendering logic for the piece itself remains.
    piece.ctx = context;
    piece.draw(BLOCK_SIZE, true);
}

    drawHeldPiece() { this.drawPieceOnSideCanvas(this.holdCtx, this.heldPiece); }
    drawNextPiece() { this.drawPieceOnSideCanvas(this.nextCtx, this.nextPiece); }
    
    calculateGhostPosition() { if(!this.piece) return null; let ghost = JSON.parse(JSON.stringify(this.piece)); while (this.isValid(ghost)) ghost.y++; ghost.y--; return ghost; }
    drawGhostPiece() { const ghost = this.calculateGhostPosition(); if(!ghost) return; this.ctx.globalAlpha = 0.2; ghost.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, ghost.x + x, ghost.y + y, value, BLOCK_SIZE, BLOCK_SIZE); }); }); this.ctx.globalAlpha = 1.0; }
    hold() { if (!this.canHold || !this.piece) return; if (this.heldPiece) { [this.piece, this.heldPiece] = [this.heldPiece, this.piece]; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); } else { this.heldPiece = this.piece; this.getNewPiece(); } this.canHold = false; }
    getNewPiece() { this.piece = this.nextPiece; if(this.piece) this.piece.ctx = this.ctx; this.piece.setStartingPosition(); this.nextPiece = new Piece(this.nextCtx); this.canHold = true; }
    isValid(p) { if(!p) return false; return p.shape.every((row, dy) => { return row.every((value, dx) => { let x = p.x + dx; let y = p.y + dy; return (value === 0 || (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y))); }); }); }
    isInsideWalls(x) { return x >= 0 && x < COLS; }
    isAboveFloor(y) { return y < ROWS; }
    isNotOccupied(x, y) { return this.grid[y] && this.grid[y][x] === 0; }
    freeze() { this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.grid[y + this.piece.y][x + this.piece.x] = value; }); }); this.clearLines(); }
    clearLines() { let linesCleared = 0; this.grid.forEach((row, y) => { if (row.every(value => value > 0)) { linesCleared++; this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); } }); if (linesCleared > 0) game.updateScore(linesCleared); }
}
