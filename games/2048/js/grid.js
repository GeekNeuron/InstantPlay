// js/grid.js

const DEFAULT_GRID_SIZE = 4;

class Grid {
    constructor(gridContainerElement, size = DEFAULT_GRID_SIZE) {
        this.gridContainerElement = gridContainerElement;
        this.size = size;
        this.tiles = []; // Active game tiles

        // CSS variables can also control grid layout, this is for JS logic if needed
        // this.gridContainerElement.style.setProperty('--grid-size-param', this.size);
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
            const newTile = new Tile(this.gridContainerElement); // Value is random by default
            newTile.setPosition(position.r, position.c, this.size, this.gridContainerElement);
            this.tiles.push(newTile);
            return newTile;
        }
        return null;
    }

    getTileAt(row, col) {
        return this.tiles.find(tile => tile.x === row && tile.y === col);
    }

    removeTile(tileInstance) {
        tileInstance.remove(true); // Remove with animation
        this.tiles = this.tiles.filter(t => t !== tileInstance);
    }
    
    clearAllTiles() {
        this.tiles.forEach(tile => tile.remove()); // Simple removal, no animation needed here usually
        this.tiles = [];
    }

    getBoardState() {
        const board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.tiles.forEach(tile => {
            if (tile.x !== undefined && tile.y !== undefined) {
                board[tile.x][tile.y] = tile.value;
            }
        });
        return board;
    }
}
