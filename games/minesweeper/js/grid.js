// js/grid.js
class Grid {
    constructor(rows, cols, numMines, boardElement, gameInstance) {
        this.rows = rows;
        this.cols = cols;
        this.numMines = numMines;
        this.boardElement = boardElement;
        this.game = gameInstance; // Reference to the Game instance
        this.tiles = []; // 2D array of Tile objects
        this.mineLocations = []; // Array of {r, c} for mine locations
    }

    create() {
        this.boardElement.innerHTML = ''; // Clear previous grid
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        this.tiles = [];
        for (let r = 0; r < this.rows; r++) {
            const rowTiles = [];
            for (let c = 0; c < this.cols; c++) {
                const tile = new Tile(r, c, this.game);
                this.boardElement.appendChild(tile.element);
                rowTiles.push(tile);
            }
            this.tiles.push(rowTiles);
        }
        this.updateTileSizes(); // Call to set initial sizes and font sizes
    }

    updateTileSizes() {
        // Calculate tile size dynamically based on container and grid dimensions
        const gapSize = parseInt(getComputedStyle(this.boardElement).gap) || 2;
        
        const container = this.boardElement.parentElement; // Assumes game-board-container
        const availableWidth = container.clientWidth - (this.boardElement.style.paddingLeft ? parseInt(this.boardElement.style.paddingLeft) * 2 : gapSize * 2);
        const availableHeight = container.clientHeight - (this.boardElement.style.paddingTop ? parseInt(this.boardElement.style.paddingTop) * 2 : gapSize * 2);

        let tileSizeW = (availableWidth - (this.cols - 1) * gapSize) / this.cols;
        let tileSizeH = (availableHeight - (this.rows - 1) * gapSize) / this.rows;
        
        let tileSize = Math.floor(Math.min(tileSizeW, tileSizeH));

        const maxTilePixels = 40; 
        const minTilePixels = 18; 

        tileSize = Math.min(tileSize, maxTilePixels);
        tileSize = Math.max(tileSize, minTilePixels);
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tileElement = this.tiles[r][c].element;
                tileElement.style.width = `${tileSize}px`;
                tileElement.style.height = `${tileSize}px`;
                tileElement.style.fontSize = `${Math.max(8, Math.floor(tileSize * 0.55))}px`; // Adjusted for better visibility
            }
        }
    }


    plantMines(firstClickTile) {
        this.mineLocations = [];
        let minesToPlant = this.numMines;

        // Ensure numMines is not more than available safe cells
        const totalCells = this.rows * this.cols;
        const safeZoneSize = 9; // 3x3 area around first click
        if (this.numMines > totalCells - safeZoneSize) {
            console.warn("Too many mines for the grid size, reducing mine count.");
            this.numMines = totalCells - safeZoneSize;
            minesToPlant = this.numMines;
            this.game.mines = this.numMines; // Update game instance
            this.game.updateMinesCountCallback(this.numMines - this.game.flagsPlaced);
        }


        while (minesToPlant > 0) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            const isFirstClickArea = Math.abs(r - firstClickTile.row) <= 1 && Math.abs(c - firstClickTile.col) <= 1;

            if (!this.tiles[r][c].isMine && !isFirstClickArea) {
                this.tiles[r][c].isMine = true;
                this.mineLocations.push({ r, c });
                minesToPlant--;
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.tiles[r][c].isMine) {
                    this.tiles[r][c].adjacentMines = this.countAdjacentMines(r, c);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue;
                const nr = row + rOffset;
                const nc = col + cOffset;
                if (this.isValid(nr, nc) && this.tiles[nr][nc].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    revealTile(tile) {
        if (tile.isRevealed || tile.isFlagged || this.game.gameOver) {
            return;
        }

        tile.reveal();
        
        if (tile.isMine) { // Check if it was a mine *after* revealing it internally
            this.game.endGame(false); 
            return;
        }
        
        this.game.incrementRevealedTiles(); // Only increment if not a mine

        if (tile.adjacentMines === 0) {
            for (let rOffset = -1; rOffset <= 1; rOffset++) {
                for (let cOffset = -1; cOffset <= 1; cOffset++) {
                    if (rOffset === 0 && cOffset === 0) continue;
                    const nr = tile.row + rOffset;
                    const nc = tile.col + cOffset;
                    if (this.isValid(nr, nc)) {
                        this.revealTile(this.tiles[nr][nc]);
                    }
                }
            }
        }
    }
    
    revealAllMines(isWin) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.tiles[r][c];
                if (tile.isMine) {
                     // If player lost, reveal all mines.
                    // If player won, reveal mines that weren't flagged as correctly flagged.
                    if (!isWin) {
                        tile.revealAsMine(false); // Just show as a bomb
                    } else if (isWin && !tile.isFlagged) {
                        tile.revealAsMine(false); // Won, but this mine wasn't flagged (show bomb)
                    } else if (isWin && tile.isFlagged) {
                        tile.revealAsMine(true); // Won, and correctly flagged (show as green flag)
                    }
                } else if (tile.isFlagged && !tile.isMine) { // Incorrectly flagged non-mine
                    tile.revealAsWrongFlag();
                }
            }
        }
    }


    isValid(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    destroy() {
        this.tiles.forEach(row => row.forEach(tile => tile.destroy()));
        this.tiles = [];
        this.mineLocations = [];
    }
}
