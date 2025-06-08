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

    getEmptyGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    reset() {
        this.grid = this.getEmptyGrid();
        this.heldPiece = null;
        this.canHold = true;
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.draw();
    }

    // --- NEW: Draws the background grid ---
    drawGrid() {
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line-color');
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let i = 1; i < COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * BLOCK_SIZE, 0);
            this.ctx.lineTo(i * BLOCK_SIZE, this.ctx.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let i = 1; i < ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * BLOCK_SIZE);
            this.ctx.lineTo(this.ctx.canvas.width, i * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    draw() {
        // Clear canvas with the theme's grid background color
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg');
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        this.drawGrid();
        this.drawGhostPiece();

        // Draw the frozen pieces on the board
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.drawBlock(this.ctx, x, y, value, BLOCK_SIZE);
                }
            });
        });

        this.piece.draw();
        this.drawNextPiece();
        this.drawHeldPiece();
    }

    // --- MODIFIED: Draws rounded blocks using CSS variables for color ---
    drawBlock(context, x, y, value, size) {
        const color = getComputedStyle(document.documentElement).getPropertyValue(`--piece-color-${value}`).trim();
        const radius = 5;
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
    
    calculateGhostPosition() {
        let ghost = JSON.parse(JSON.stringify(this.piece));
        while (this.isValid(ghost)) {
            ghost.y++;
        }
        ghost.y--;
        return ghost;
    }

    drawGhostPiece() {
        const ghost = this.calculateGhostPosition();
        this.ctx.globalAlpha = 0.2;
        ghost.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.drawBlock(this.ctx, ghost.x + x, ghost.y + y, value, BLOCK_SIZE);
                }
            });
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawHeldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCtx.canvas.width, this.holdCtx.canvas.height);
        if (this.heldPiece) {
            this.heldPiece.ctx = this.holdCtx;
            this.heldPiece.draw(NEXT_CANVAS_BLOCK_SIZE, true);
        }
    }

    hold() {
        if (!this.canHold) return;
        if (this.heldPiece) {
            [this.piece, this.heldPiece] = [this.heldPiece, this.piece];
            this.piece.ctx = this.ctx;
            this.piece.setStartingPosition();
        } else {
            this.heldPiece = this.piece;
            this.getNewPiece();
        }
        this.canHold = false;
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCtx.canvas.width, this.nextCtx.canvas.height);
        if (this.nextPiece) {
            this.nextPiece.ctx = this.nextCtx;
            this.nextPiece.draw(NEXT_CANVAS_BLOCK_SIZE, true);
        }
    }

    getNewPiece() {
        this.piece = this.nextPiece;
        this.piece.ctx = this.ctx;
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.canHold = true;
    }

    isValid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (value === 0 || (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y)));
            });
        });
    }

    isInsideWalls(x) { return x >= 0 && x < COLS; }
    isAboveFloor(y) { return y < ROWS; }
    isNotOccupied(x, y) { return this.grid[y] && this.grid[y][x] === 0; }

    freeze() {
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.grid[y + this.piece.y][x + this.piece.x] = value;
                }
            });
        });
        this.clearLines();
    }

    clearLines() {
        let linesCleared = 0;
        this.grid.forEach((row, y) => {
            if (row.every(value => value > 0)) {
                linesCleared++;
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
            }
        });
        if (linesCleared > 0) {
            game.updateScore(linesCleared);
        }
    }
}
