class Board {
    constructor(ctx, nextCtx) {
        this.ctx = ctx;
        this.nextCtx = nextCtx;
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

    draw() {
        this.drawGhostPiece();

        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.drawBlock(this.ctx, x, y, COLORS[value], BLOCK_SIZE);
                }
            });
        });

        this.piece.draw();
        this.drawNextPiece();
        this.drawHeldPiece();
    }

    drawBlock(context, x, y, color, size) {
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = 15;
        context.fillRect(x * size, y * size, size, size);
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(0,0,0,0.5)';
        context.strokeRect(x * size, y * size, size, size);
    }
    
    // --- Ghost Piece Methods ---
    calculateGhostPosition() {
        let ghost = JSON.parse(JSON.stringify(this.piece)); // Deep copy
        while (this.isValid(ghost)) {
            ghost.y++;
        }
        ghost.y--;
        return ghost;
    }

    drawGhostPiece() {
        const ghost = this.calculateGhostPosition();
        this.ctx.globalAlpha = 0.3;
        ghost.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.drawBlock(this.ctx, ghost.x + x, ghost.y + y, COLORS[value], BLOCK_SIZE);
                }
            });
        });
        this.ctx.globalAlpha = 1.0;
    }

    // --- Hold Piece Methods ---
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
    
    // --- Next Piece Methods ---
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCtx.canvas.width, this.nextCtx.canvas.height);
        this.nextPiece.ctx = this.nextCtx;
        this.nextPiece.draw(NEXT_CANVAS_BLOCK_SIZE, true);
    }

    getNewPiece() {
        this.piece = this.nextPiece;
        this.piece.ctx = this.ctx;
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.canHold = true; // Allow holding again
    }

    // --- Core Logic ---
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
