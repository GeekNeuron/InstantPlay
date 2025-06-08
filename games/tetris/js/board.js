// --- NEW: Control the size of pieces in Hold/Next boxes here ---
// Smaller number = BIGGER piece. Bigger number = SMALLER piece.
const SIDE_PANEL_PADDING = 2.2; 

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

    drawGrid(context, columns, rows) {
        const a_blockSize = context.canvas.width / columns;
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color');
        context.lineWidth = 1;
        for (let i = 1; i < columns; i++) {
            context.beginPath();
            context.moveTo(i * a_blockSize, 0);
            context.lineTo(i * a_blockSize, context.canvas.height);
            context.stroke();
        }
        for (let i = 1; i < rows; i++) {
            context.beginPath();
            context.moveTo(0, i * a_blockSize);
            context.lineTo(context.canvas.width, i * a_blockSize);
            context.stroke();
        }
    }

    draw() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid(this.ctx, COLS, ROWS);
        this.drawGhostPiece();
        this.grid.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE); }); });
        this.piece.draw();
        this.drawNextPiece();
        this.drawHeldPiece();
    }

    drawBlock(context, x, y, value, size) {
        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = size / 6;
        const blockX = x * size;
        const blockY = y * size;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(blockX + radius, blockY);
        context.lineTo(blockX + size - radius, blockY);
        context.arcTo(blockX + size, blockY, blockX + size, blockY + radius, radius);
        context.lineTo(blockX + size, blockY + size - radius);
        context.arcTo(blockX + size, blockY + size, blockX + size - radius, blockY + size, radius);
        context.lineTo(blockX + radius, blockY + size);
        context.arcTo(blockX, blockY + size, blockX, blockY + size - radius, radius);
        context.lineTo(blockX, blockY + radius);
        context.arcTo(blockX, blockY, blockX + radius, blockY, radius);
        context.closePath();
        context.fill();
    }
    
    // --- REWRITTEN as requested ---
    drawPieceOnSideCanvas(context, piece) {
        // Clear the canvas to make it transparent
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        if (!piece) return;

        const matrix = piece.shape;
        const maxDimension = Math.max(matrix[0].length, matrix.length);
        
        // Calculate block size using the new controllable padding variable
        const blockSize = context.canvas.width / (maxDimension + SIDE_PANEL_PADDING);

        const piecePixelWidth = matrix[0].length * blockSize;
        const piecePixelHeight = matrix.length * blockSize;
        const offsetX = (context.canvas.width - piecePixelWidth) / 2;
        const offsetY = (context.canvas.height - piecePixelHeight) / 2;
        
        const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(piece.shape));
        if (typeId > 0) {
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value > 0) {
                        this.drawBlock(context, (offsetX / blockSize) + x, (offsetY / blockSize) + y, value, blockSize);
                    }
                });
            });
        }
    }

    drawHeldPiece() {
        this.drawPieceOnSideCanvas(this.holdCtx, this.heldPiece);
    }

    drawNextPiece() {
        this.drawPieceOnSideCanvas(this.nextCtx, this.nextPiece);
    }
    
    calculateGhostPosition() { let ghost = JSON.parse(JSON.stringify(this.piece)); while (this.isValid(ghost)) ghost.y++; ghost.y--; return ghost; }
    hold() { if (!this.canHold) return; if (this.heldPiece) { [this.piece, this.heldPiece] = [this.heldPiece, this.piece]; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); } else { this.heldPiece = this.piece; this.getNewPiece(); } this.canHold = false; }
    getNewPiece() { this.piece = this.nextPiece; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); this.nextPiece = new Piece(this.nextCtx); this.canHold = true; }
    isValid(p) { return p.shape.every((row, dy) => { return row.every((value, dx) => { let x = p.x + dx; let y = p.y + dy; return (value === 0 || (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y))); }); }); }
    isInsideWalls(x) { return x >= 0 && x < COLS; }
    isAboveFloor(y) { return y < ROWS; }
    isNotOccupied(x, y) { return this.grid[y] && this.grid[y][x] === 0; }
    freeze() { this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.grid[y + this.piece.y][x + this.piece.x] = value; }); }); this.clearLines(); }
    clearLines() { let linesCleared = 0; this.grid.forEach((row, y) => { if (row.every(value => value > 0)) { linesCleared++; this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); } }); if (linesCleared > 0) game.updateScore(linesCleared); }
}
