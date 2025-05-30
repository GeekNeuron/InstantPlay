// js/grid.js

const DEFAULT_GRID_SIZE = 4;

class Grid {
    constructor(gridContainerElement, size = DEFAULT_GRID_SIZE) {
        this.gridContainerElement = gridContainerElement;
        this.size = size;
        this.tiles = []; // Active game tiles

        this.setupBackgroundCells();
    }

    setupBackgroundCells() {
        this.gridContainerElement.innerHTML = ''; // Clear previous grid including tiles
        this.tiles = []; // Clear tiles array

        // Create background cells
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            this.gridContainerElement.append(cell);
        }
    }

    getRandomEmptyCellPosition() {
        const emptyPositions = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.getTileAt(r, c)) {
                    emptyPositions.push({ r, c });
                }
            }
        }
        if (emptyPositions.length === 0) return null;
        return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    }

    addRandomTile() {
        const position = this.getRandomEmptyCellPosition();
        if (position) {
            // Value is random (2 or 4) by Tile constructor default
            const newTile = new Tile(this.gridContainerElement); 
            newTile.setPosition(position.r, position.c, this.size, this.gridContainerElement);
            this.tiles.push(newTile);
            return newTile;
        }
        return null;
    }

    getTileAt(row, col) {
        return this.tiles.find(tile => tile.x === row && tile.y === col);
    }
    
    // Removes a specific tile instance from the grid and the internal array
    removeTileObject(tileInstance) {
        if (!tileInstance) return;
        tileInstance.remove(true); // Remove with animation
        this.tiles = this.tiles.filter(t => t !== tileInstance);
    }
    
    clearAllTilesForNewGame() {
        this.tiles.forEach(tile => tile.remove(false)); // No animation needed for full clear
        this.tiles = [];
    }

    getBoardState() {
        const board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.tiles.forEach(tile => {
            if (tile.x !== undefined && tile.x >= 0 && tile.y !== undefined && tile.y >= 0) {
                board[tile.x][tile.y] = tile.value;
            }
        });
        return board;
    }
}
