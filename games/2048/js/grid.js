// js/grid.js

const DEFAULT_GRID_SIZE = 4;

class Grid {
    constructor(gridContainerElement, size = DEFAULT_GRID_SIZE) {
        this.gridContainerElement = gridContainerElement;
        this.size = size;
        this.cells = []; // For background cells
        this.tiles = []; // For active game tiles

        this.gridContainerElement.style.setProperty('--grid-size-param', this.size);
        this.setupBackgroundCells();
    }

    setupBackgroundCells() {
        this.gridContainerElement.innerHTML = ''; // Clear previous grid
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            this.gridContainerElement.append(cell);
            this.cells.push(cell);
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
            const newTile = new Tile(this.gridContainerElement); // Value is random (2 or 4) by default
            newTile.setPosition(position.r, position.c, this.size);
            this.tiles.push(newTile);
            return newTile;
        }
        return null;
    }

    getTileAt(row, col) {
        return this.tiles.find(tile => tile.x === row && tile.y === col);
    }

    async moveTile(tile, toRow, toCol) {
        tile.setPosition(toRow, toCol, this.size);
        await tile.waitForTransition(); // Wait for CSS transition to finish
    }

    async mergeTiles(tileToKeep, tileToRemove, newValue) {
        // Update value and trigger merge animation on the tile being kept
        tileToKeep.setValue(newValue);
        tileToKeep.merged();

        // Remove the other tile from the array and DOM
        this.tiles = this.tiles.filter(t => t !== tileToRemove);
        tileToRemove.remove();

        // Wait for the merge animation (pop) on the kept tile
        await tileToKeep.waitForTransition(true);
    }

    clearAllTiles() {
        this.tiles.forEach(tile => tile.remove());
        this.tiles = [];
    }

    // Converts the current tile setup into a 2D array of values (for game logic)
    getBoardState() {
        const board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.tiles.forEach(tile => {
            if (tile.x !== undefined && tile.y !== undefined) {
                board[tile.x][tile.y] = tile.value;
            }
        });
        return board;
    }

    // This function reconstructs the visual grid based on a board state.
    // Used for initializing or complex state changes, but movements should ideally
    // manipulate existing tile objects for animation.
    renderBoard(board) {
        this.clearAllTiles();
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (board[r][c] !== 0) {
                    const tile = new Tile(this.gridContainerElement, board[r][c]);
                    tile.setPosition(r, c, this.size);
                    this.tiles.push(tile);
                }
            }
        }
    }
}
