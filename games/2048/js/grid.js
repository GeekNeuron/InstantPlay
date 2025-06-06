// js/grid.js

const DEFAULT_GRID_SIZE = 4;

class Grid {
    constructor(gridContainerElement, size = DEFAULT_GRID_SIZE) {
        this.gridContainerElement = gridContainerElement;
        this.size = size;
        this.tiles = []; 

        this.setupBackgroundCells();
    }

    setupBackgroundCells() {
        this.gridContainerElement.innerHTML = ''; 
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
        if (emptyPositions.length === 0) {
            return null;
        }
        const randomIdx = Math.floor(Math.random() * emptyPositions.length);
        return emptyPositions[randomIdx];
    }

    addRandomTile() {
    const position = this.getRandomEmptyCellPosition();
    if (position) {
        const newTile = new Tile(this.gridContainerElement);
        newTile.setPosition(position.r, position.c, this.size, this.gridContainerElement, false);
        this.tiles.push(newTile);
        
        setTimeout(() => {
            if (newTile.triggerNumberPopAnimation) {
                newTile.triggerNumberPopAnimation();
            }
        }, 10);
        
        return newTile;
    }
    return null;
}

    getTileAt(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return this.tiles.find(tile => tile.x === row && tile.y === col && !tile.markedForRemoval);
    }
    
    removeTileObject(tileInstance) {
        if (!tileInstance) return Promise.resolve();
        this.tiles = this.tiles.filter(t => t.id !== tileInstance.id); 
        return tileInstance.remove(); 
    }
    
    clearAllTilesForNewGame() {
        this.tiles.forEach(tile => tile.remove(false)); 
        this.tiles = [];
    }
}
