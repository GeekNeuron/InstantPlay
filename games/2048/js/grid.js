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
        // this.tiles = []; // This is handled by clearAllTilesForNewGame
        const cellsFragment = document.createDocumentFragment();
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cellsFragment.appendChild(cell);
        }
        this.gridContainerElement.appendChild(cellsFragment);
        // console.log("Background cells created.");
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
        if (emptyPositions.length === 0) {
            // console.log("No empty cells found.");
            return null;
        }
        const randomIdx = Math.floor(Math.random() * emptyPositions.length);
        // console.log(`Found ${emptyPositions.length} empty cells. Picking one at random: ${JSON.stringify(emptyPositions[randomIdx])}`);
        return emptyPositions[randomIdx];
    }

    addRandomTile() {
        const position = this.getRandomEmptyCellPosition();
        if (position) {
            const newTile = new Tile(this.gridContainerElement); 
            newTile.setPosition(position.r, position.c, this.size, this.gridContainerElement);
            this.tiles.push(newTile);
            // console.log(`Added new tile ${newTile.id} (val ${newTile.value}) at (${position.r},${position.c}). Total tiles: ${this.tiles.length}`);
            return newTile;
        }
        // console.log("Failed to add random tile: No empty cell.");
        return null;
    }

    getTileAt(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        // Ensure we don't find tiles marked for removal that haven't been fully processed out yet
        return this.tiles.find(tile => tile.x === row && tile.y === col && !tile.markedForRemoval);
    }
    
    removeTileObject(tileInstance) {
        if (!tileInstance) return Promise.resolve();
        // console.log(`Request to remove tile ${tileInstance.id} (val ${tileInstance.value}) from grid.tiles array.`);
        this.tiles = this.tiles.filter(t => t.id !== tileInstance.id); // Filter by unique ID
        return tileInstance.remove(); 
    }
    
    clearAllTilesForNewGame() {
        // console.log(`Clearing all ${this.tiles.length} tiles for new game.`);
        // Create a promise for each removal if tile.remove() is async, though here it's sync for (false)
        this.tiles.forEach(tile => tile.remove(false)); 
        this.tiles = [];
    }

    // For debugging
    // printLogicalBoardState(label = "Logical Board State") {
    //     const board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    //     this.tiles.forEach(tile => {
    //         if (tile.x !== -1 && tile.y !== -1 && !tile.markedForRemoval) { // Check for valid positions
    //             board[tile.x][tile.y] = tile.value;
    //         }
    //     });
    //     console.log(label + ":");
    //     board.forEach(row => console.log(row.map(val => String(val).padStart(4, ' ')).join(' | ')));
    //     console.log(`Actual tiles in grid.tiles: ${this.tiles.length}`);
    //     this.tiles.forEach(t => console.log(`  Tile ID: ${t.id}, Val: ${t.value}, Pos: (${t.x},${t.y}), Marked: ${t.markedForRemoval}`));
    // }
}
