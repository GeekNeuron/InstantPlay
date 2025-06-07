class Board {
    constructor(ctx, nextCtx) {
        this.ctx = ctx;
        this.nextCtx = nextCtx;
        this.grid = this.getEmptyGrid();
        this.piece = null;
        this.nextPiece = null;
    }

    getEmptyGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    reset() {
        this.grid = this.getEmptyGrid();
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
        this.draw();
    }

    draw() {
        // Draw main board
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.drawBlock(this.ctx, x, y, COLORS[value], BLOCK_SIZE);
                }
            });
        });
        this.piece.draw();
        
        // Draw next piece
        this.nextCtx.canvas.width = 4 * NEXT_CANVAS_BLOCK_SIZE;
        this.nextCtx.canvas.height = 4 * NEXT_CANVAS_BLOCK_SIZE;
        this.nextPiece.ctx = this.nextCtx; // Use next context
        this.nextPiece.draw(NEXT_CANVAS_BLOCK_SIZE, true); // Draw smaller and centered.
    }
    
    drawBlock(context, x, y, color, size) {
        context.fillStyle = color;
        context.fillRect(x * size, y * size, size, size);
        context.strokeStyle = '#000';
        context.strokeRect(x * size, y * size, size, size);
        // Neon effect
        context.shadowColor = color;
        context.shadowBlur = 15;
    }

    isValid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (
                    value === 0 ||
                    (this.isInsideWalls(x) && this.isAboveFloor(y) && this.isNotOccupied(x, y))
                );
            });
        });
    }

    isInsideWalls(x) {
        return x >= 0 && x < COLS;
    }

    isAboveFloor(y) {
        return y < ROWS;
    }

    isNotOccupied(x, y) {
        return this.grid[y] && this.grid[y][x] === 0;
    }

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
    
    getNewPiece() {
        this.piece = this.nextPiece;
        this.piece.ctx = this.ctx;
        this.piece.setStartingPosition();
        this.nextPiece = new Piece(this.nextCtx);
    }
}
