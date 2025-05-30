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
        this.gridContainerElement.innerHTML = ''; 
        // this.tiles = []; // Clearing tiles is handled by clearAllTilesForNewGame
        const cellsFragment = document.createDocumentFragment();
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cellsFragment.appendChild(cell);
        }
        this.gridContainerElement.appendChild(cellsFragment);
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
            const newTile = new Tile(this.gridContainerElement); 
            newTile.setPosition(position.r, position.c, this.size, this.gridContainerElement);
            this.tiles.push(newTile);
            // console.log(`Added new tile ${newTile.id} (val ${newTile.value}) at (${position.r},${position.c})`);
            return newTile;
        }
        // console.log("No empty cell to add random tile.");
        return null;
    }

    getTileAt(row, col) {
        // Check bounds
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return this.tiles.find(tile => tile.x === row && tile.y === col && !tile.markedForRemoval);
    }
    
    // Removes a specific tile instance from the grid.tiles array and calls its DOM removal.
    // Returns the promise from tile.remove()
    removeTileObject(tileInstance) {
        if (!tileInstance) return Promise.resolve();
        // console.log(`Removing tile ${tileInstance.id} (val ${tileInstance.value}) from grid array.`);
        this.tiles = this.tiles.filter(t => t !== tileInstance);
        return tileInstance.remove(); // tile.remove() returns a promise
    }
    
    clearAllTilesForNewGame() {
        this.tiles.forEach(tile => tile.remove(false)); // No animation for full clear
        this.tiles = [];
    }

    // For debugging: Renders board based on this.tiles (current state)
    // printBoardState(label = "Current Grid State") {
    //     const board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    //     this.tiles.forEach(tile => {
    //         if (tile.x !== undefined && tile.x >= 0 && tile.y !== undefined && tile.y >= 0 && !tile.markedForRemoval) {
    //             board[tile.x][tile.y] = tile.value;
    //         }
    //     });
    //     console.log(label + ":");
    //     board.forEach(row => console.log(row.map(val => String(val).padStart(4, ' ')).join(' | ')));
    // }
}
