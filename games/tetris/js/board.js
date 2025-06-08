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
        // NEW: Unified animation queue
        this.animations = [];
    }

    getEmptyGrid() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
    
    reset() {
        this.grid = this.getEmptyGrid();
        this.heldPiece = null;
        this.canHold = true;
        this.animations = []; // Clear animations on reset
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
    }
    
    // --- NEW: Central animation update and drawing function ---
    updateAndDraw() {
        const now = performance.now();
        // Remove finished animations from the queue
        this.animations = this.animations.filter(anim => now - anim.startTime < anim.duration);

        // --- Drawing Start ---
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawGrid();

        // Prepare scales for ripple animations
        const animationScales = new Map();
        this.animations.filter(a => a.type === 'ripple').forEach(anim => {
            const progress = (now - anim.startTime) / anim.duration;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3; // Pulse effect
            animationScales.set(`${anim.x},${anim.y}`, scale);
        });

        // Draw the frozen pieces on the board, applying ripple scale if needed
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const scale = animationScales.get(`${x},${y}`) || 1;
                    this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE, scale);
                }
            });
        });
        
        // Handle hard drop animation
        const hardDropAnim = this.animations.find(a => a.type === 'hard-drop');
        if (hardDropAnim) {
            this.drawHardDropTrail(hardDropAnim);
        } else if (this.piece) {
            // Draw normal piece only if not hard dropping
            this.drawGhostPiece();
            this.piece.draw();
        }
        
        this.drawNextPiece();
        this.drawHeldPiece();
    }
    
    drawBlock(context, x, y, value, size, scale = 1.0) {
        const scaledSize = size * scale;
        const blockX = (x * size) + (size - scaledSize) / 2;
        const blockY = (y * size) + (size - scaledSize) / 2;
        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = scaledSize / 6;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(blockX + radius, blockY);
        context.lineTo(blockX + scaledSize - radius, blockY);
        context.arcTo(blockX + scaledSize, blockY, blockX + scaledSize, blockY + radius, radius);
        context.lineTo(blockX + scaledSize, blockY + scaledSize - radius);
        context.arcTo(blockX + scaledSize, blockY + scaledSize, blockX + scaledSize - radius, blockY + scaledSize, radius);
        context.lineTo(blockX + radius, blockY + scaledSize);
        context.arcTo(blockX, blockY + scaledSize, blockX, blockY + scaledSize - radius, radius);
        context.lineTo(blockX, blockY + radius);
        context.arcTo(blockX, blockY, blockX + radius, blockY, radius);
        context.closePath();
        context.fill();
    }

    // --- NEW Animation Triggers ---
    triggerRipple(impactX, landingPieceBlocks) {
        for (let col = 0; col < COLS; col++) {
            const distance = Math.abs(col - impactX);
            setTimeout(() => {
                for (let row = 0; row < ROWS; row++) {
                    if (this.grid[row][col] > 0 && !landingPieceBlocks.has(`${col},${row-1}`)) {
                        this.animations.push({ type: 'ripple', x: col, y: row, startTime: performance.now(), duration: 350 });
                        break;
                    }
                }
            }, distance * 40);
        }
    }

    triggerHardDrop() {
        if (!this.piece) return;
        const startY = this.piece.y;
        let p = { ...this.piece };
        while (this.isValid(p)) p.y++;
        p.y--;
        const endY = p.y;
        if (endY <= startY) { return false; } // No drop, no animation

        // Add animation to the queue
        this.animations.push({ type: 'hard-drop', piece: this.piece, startY, endY, startTime: performance.now(), duration: 150 });
        
        // Immediately move and freeze the piece in the logical grid
        this.piece.y = endY;
        this.freeze();
        this.piece = null; // Hide the "real" piece while animation plays
        return true;
    }
    
    drawHardDropTrail(anim) {
        const trailLength = anim.endY - anim.startY;
        for (let y = anim.startY; y < anim.endY; y++) {
            const progress = (y - anim.startY) / trailLength;
            const alpha = 0.4 * (1 - progress * progress); // Fades out non-linearly
            this.ctx.globalAlpha = alpha;
            anim.piece.shape.forEach((row, pieceY) => {
                row.forEach((value, pieceX) => {
                    if (value > 0) {
                        const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(anim.piece.shape));
                        this.drawBlock(this.ctx, anim.piece.x + pieceX, y + pieceY, typeId, BLOCK_SIZE);
                    }
                });
            });
        }
        // Draw the final piece solidly at the bottom of the trail
        this.ctx.globalAlpha = 1.0;
        const finalPiece = { ...anim.piece, y: anim.endY };
        finalPiece.shape.forEach((row, pieceY) => {
            row.forEach((value, pieceX) => {
                if (value > 0) {
                    const typeId = SHAPES.findIndex(shape => JSON.stringify(shape) === JSON.stringify(finalPiece.shape));
                    this.drawBlock(this.ctx, finalPiece.x + pieceX, finalPiece.y + pieceY, typeId, BLOCK_SIZE);
                }
            });
        });
    }

    freeze() {
        const landingPieceBlocks = new Set();
        this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) landingPieceBlocks.add(`${this.piece.x + x},${this.piece.y + y}`); }); });
        const impactX = this.piece.x + Math.floor(this.piece.shape[0].length / 2);
        this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.grid[y + this.piece.y][x + this.piece.x] = value; }); });
        this.clearLines();
        this.triggerRipple(impactX, landingPieceBlocks);
    }
    
    // --- Other methods are reverted to the stable version ---
    drawGrid(context) { /* ... same as stable version ... */ }
    drawPieceOnSideCanvas(context, piece) { context.clearRect(0, 0, context.canvas.width, context.canvas.height); if (piece) piece.draw(BLOCK_SIZE, true); }
    drawHeldPiece() { this.drawPieceOnSideCanvas(this.holdCtx, this.heldPiece); }
    drawNextPiece() { this.drawPieceOnSideCanvas(this.nextCtx, this.nextPiece); }
    calculateGhostPosition() { if(!this.piece) return null; let ghost = JSON.parse(JSON.stringify(this.piece)); while (this.isValid(ghost)) ghost.y++; ghost.y--; return ghost; }
    drawGhostPiece() { const ghost = this.calculateGhostPosition(); if(!ghost) return; this.ctx.globalAlpha = 0.2; ghost.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) this.drawBlock(this.ctx, ghost.x + x, ghost.y + y, value, BLOCK_SIZE); }); }); this.ctx.globalAlpha = 1.0; }
    hold() { if (!this.canHold || !this.piece) return; if (this.heldPiece) { [this.piece, this.heldPiece] = [this.heldPiece, this.piece]; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); } else { this.heldPiece = this.piece; this.getNewPiece(); } this.canHold = false; }
    getNewPiece() { if (this.animations.some(a => a.type === 'hard-drop')) return; this.piece = this.nextPiece; this.piece.ctx = this.ctx; this.piece.setStartingPosition(); this.nextPiece = new Piece(this.nextCtx); this.canHold = true; }
    isValid(p) { if(!p) return false; return p.shape.every((row, dy) => { return row.every((value, dx) => { let x = p.x + dx; let y = p.y + dy; return (value === 0 || (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y))); }); }); }
    isInsideWalls(x) { return x >= 0 && x < COLS; }
    isAboveFloor(y) { return y < ROWS; }
    isNotOccupied(x, y) { return this.grid[y] && this.grid[y][x] === 0; }
    clearLines() { let linesCleared = 0; this.grid.forEach((row, y) => { if (row.every(value => value > 0)) { linesCleared++; this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); } }); if (linesCleared > 0) game.updateScore(linesCleared); }
}
