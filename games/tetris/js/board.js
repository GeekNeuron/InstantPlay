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
        this.rippleAnimations = []; // Holds active ripple animations
    }

    getEmptyGrid() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
    
    reset() {
        this.grid = this.getEmptyGrid();
        this.heldPiece = null;
        this.canHold = true;
        this.rippleAnimations = []; // Reset animations on new game
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.draw();
    }

    drawGrid() { /* ... same as before ... */ }

    // --- MODIFIED: Draw method now handles ripple animation frames ---
    draw() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid();
        
        // --- Ripple Animation Logic ---
        const now = performance.now();
        const animationScales = new Map();
        // Update existing animations and build a map of scales for the current frame
        this.rippleAnimations = this.rippleAnimations.filter(anim => {
            const elapsedTime = now - anim.startTime;
            if (elapsedTime > anim.duration) return false; // Remove finished animation
            
            const progress = elapsedTime / anim.duration;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3; // "Pulse" effect
            animationScales.set(`${anim.x},${anim.y}`, scale);
            return true;
        });

        // Draw the frozen pieces on the board, applying animation scale if needed
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const scale = animationScales.get(`${x},${y}`) || 1;
                    this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE, BLOCK_SIZE, scale);
                }
            });
        });
        
        // The rest of the drawing
        if (this.piece) {
            this.drawGhostPiece();
            this.piece.draw();
        }
        this.drawNextPiece();
        this.drawHeldPiece();
    }
    
    // --- MODIFIED: drawBlock now accepts a scale parameter ---
    drawBlock(context, x, y, value, width, height, scale = 1.0) {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const blockX = (x * width) + (width - scaledWidth) / 2;
        const blockY = (y * height) + (height - scaledHeight) / 2;

        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = Math.min(scaledWidth, scaledHeight) / 6;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(blockX + radius, blockY);
        context.lineTo(blockX + scaledWidth - radius, blockY);
        context.arcTo(blockX + scaledWidth, blockY, blockX + scaledWidth, blockY + radius, radius);
        context.lineTo(blockX + scaledWidth, blockY + scaledHeight - radius);
        context.arcTo(blockX + scaledWidth, blockY + scaledHeight, blockX + scaledWidth - radius, blockY + scaledHeight, radius);
        context.lineTo(blockX + radius, blockY + scaledHeight);
        context.arcTo(blockX, blockY + scaledHeight, blockX, blockY + scaledHeight - radius, radius);
        context.lineTo(blockX, blockY + radius);
        context.arcTo(blockX, blockY, blockX + radius, blockY, radius);
        context.closePath();
        context.fill();
    }

    // --- NEW: Function to start the ripple animation ---
    startRipple(impactX, landingPieceBlocks) {
        const waveDelay = 60; // ms delay for wave propagation
        const animDuration = 400; // ms duration for each block's pulse

        for (let col = 0; col = COLS; col++) {
            const col_distance = Math.abs(col - impactX);
            setTimeout(() => {
                // Find the highest block in this column to start the ripple from
                for (let row = 0; row < ROWS; row++) {
                    // Animate if the block exists and was not part of the piece that just landed
                    if (this.grid[row][col] > 0 && !landingPieceBlocks.has(`${col},${row-1}`)) {
                        this.rippleAnimations.push({
                            x: col, y: row,
                            startTime: performance.now(),
                            duration: animDuration
                        });
                        break; // Animate only the top block of each column
                    }
                }
            }, col_distance * waveDelay);
        }
    }
    
    // --- MODIFIED: freeze() now triggers the ripple ---
    freeze() {
        const landingPieceBlocks = new Set();
        // Record where the landing piece's blocks are, so they don't animate
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    landingPieceBlocks.add(`${this.piece.x + x},${this.piece.y + y}`);
                }
            });
        });
        
        // Find the horizontal center of the piece to start the wave
        const pieceWidth = this.piece.shape[0].length;
        const impactX = this.piece.x + Math.floor(pieceWidth / 2);

        // Freeze the piece onto the grid
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.grid[y + this.piece.y][x + this.piece.x] = value;
                }
            });
        });
        
        this.clearLines();
        this.startRipple(impactX, landingPieceBlocks);
    }
    
    // ... all other methods like drawPieceOnSideCanvas, hold, next, etc., are the same as the final previous version ...
    drawGrid(context, columns, rows) {const a_blockSize = context.canvas.width / columns; context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color'); context.lineWidth = 1; for (let i = 1; i < columns; i++) { context.beginPath(); context.moveTo(i * a_blockSize, 0); context.lineTo(i * a_blockSize, context.canvas.height); context.stroke(); } for (let i = 1; i < rows; i++) { context.beginPath(); context.moveTo(0, i * a_blockSize); context.lineTo(context.canvas.width, i * a_blockSize); context.stroke(); } }
    drawPieceOnSideCanvas(context, piece) { context.clearRect(0, 0, context.canvas.width, context.canvas.height); if (!piece) return; const matrix = piece.shape; const maxDimension = Math.max(matrix[0].length, matrix.length); const blockSize = context.canvas.width / (maxDimension + SIDE_PANEL_PADDING); const piecePixelWidth = matrix[0].length * blockSize; const piecePixelHeight = matrix.length * blockSize; const offsetX = (context.canvas.width - piecePixelWidth) / 2; const offsetY = (context.canvas.height - piecePixelHeight) / 2; const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(piece.shape)); if (typeId > 0) { matrix.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(context, (offsetX / blockSize) + x, (offsetY / blockSize) + y, value, blockSize, blockSize); }); }); } }
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
    clearLines() { let linesCleared = 0; this.grid.forEach((row, y) => { if (row.every(value => value > 0)) { linesCleared++; this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); } }); if (linesCleared > 0) game.updateScore(linesCleared); }
}
