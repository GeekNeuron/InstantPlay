// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV4')) || 0; // New key
        this.gameOver = false;
        this.gridSize = this.grid.size;
        this.isMoving = false;

        this.scoreElement = document.getElementById(scoreElementId);
        this.bestScoreElement = document.getElementById(bestScoreElementId);
        this.gameOverModal = document.getElementById(gameOverModalId);
        this.finalScoreElement = document.getElementById(finalScoreElementId);

        this.updateScoreDisplay();
        this.updateBestScoreDisplay();
    }

    startNewGame() {
        if (this.isMoving) return; 
        this.score = 0;
        this.gameOver = false;
        this.grid.clearAllTilesForNewGame();
        this.grid.setupBackgroundCells(); // Re-creates .grid-cell elements
        this.grid.addRandomTile();
        this.grid.addRandomTile();
        this.updateScoreDisplay();
        this.gameOverModal.classList.remove('show');
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV4', this.bestScore.toString());
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreElement.textContent = this.bestScore;
    }

    // --- Core Game Logic: Move and Merge ---
    async move(direction) {
        if (this.gameOver || this.isMoving) return false;
        this.isMoving = true;

        let boardChanged = false;
        let currentMoveScore = 0;
        const animationPromises = [];

        // Create a 2D array representing the logical board, holding tile objects or null
        let logicalBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        // Rotate for processing (all moves become "left")
        let processedBoard = this.rotateBoardWithObjects(logicalBoard, direction, 'toLogic');

        for (let r = 0; r < this.gridSize; r++) {
            let row = processedBoard[r];
            let newRow = []; // Tiles after sliding
            
            // 1. Slide non-null tiles to the start of the row
            for (let c = 0; c < this.gridSize; c++) {
                if (row[c]) {
                    newRow.push(row[c]);
                }
            }

            // 2. Merge adjacent identical tiles
            let mergedThisRow = false;
            for (let c = 0; c < newRow.length - 1; c++) {
                if (newRow[c] && newRow[c+1] && newRow[c].value === newRow[c+1].value) {
                    let tileToKeep = newRow[c];
                    let tileToRemove = newRow[c+1];
                    
                    // Update value of the kept tile (setValue will trigger merged animation)
                    tileToKeep.setValue(tileToKeep.value * 2); 
                    currentMoveScore += tileToKeep.value;
                    
                    // Mark the other tile for removal from the main grid.tiles array
                    tileToRemove.markedForRemoval = true; 
                    
                    newRow.splice(c + 1, 1); // Remove from this processing row
                    boardChanged = true;
                    mergedThisRow = true;
                }
            }
            
            // Fill rest of newRow with nulls to maintain gridSize
            while (newRow.length < this.gridSize) {
                newRow.push(null);
            }
            processedBoard[r] = newRow; // Update the processed row in the rotated board
        }

        // Rotate board back to original orientation
        let finalLayout = this.rotateBoardWithObjects(processedBoard, direction, 'fromLogic');

        // Update tile positions and collect animation promises
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tile = finalLayout[r][c];
                if (tile) {
                    // If tile's current logical position (tile.x, tile.y) is different from its new position (r,c)
                    // OR if it was part of a merge (its value changed), it needs to be animated.
                    if (tile.x !== r || tile.y !== c) {
                        animationPromises.push(tile.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        boardChanged = true; 
                    } else {
                        // If it didn't move cells but its value changed (merge in place), ensure visual update
                        // tile.setValue(tile.value); // This is already done during merge logic
                    }
                }
            }
        }
        
        if (animationPromises.length > 0) {
            await Promise.all(animationPromises);
        }

        // Remove tiles that were merged away
        const tilesActuallyRemoved = [];
        this.grid.tiles = this.grid.tiles.filter(tile => {
            if (tile.markedForRemoval) {
                tilesActuallyRemoved.push(tile.remove()); // tile.remove() handles DOM removal
                return false; // Remove from grid.tiles array
            }
            return true;
        });
        if (tilesActuallyRemoved.length > 0) {
            // If there were removals, wait for their animations (though short)
            // await Promise.all(tilesActuallyRemoved); // tile.remove() is not async currently
             await new Promise(resolve => setTimeout(resolve, 150)); // Wait for removal transitions
        }


        if (boardChanged) {
            if (currentMoveScore > 0) {
                this.updateScore(currentMoveScore);
            }
            this.grid.addRandomTile(); // Add new tile only if the board changed

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }

        this.isMoving = false;
        return boardChanged;
    }

    rotateBoardWithObjects(objectBoard, direction, phase) {
        let boardToRotate = objectBoard.map(row => [...row]);
        let rotations = 0;

        if (phase === 'toLogic') {
            if (direction === 'ArrowUp') rotations = 1;
            else if (direction === 'ArrowRight') rotations = 2;
            else if (direction === 'ArrowDown') rotations = 3;
        } else { 
            if (direction === 'ArrowUp') rotations = 3;
            else if (direction === 'ArrowRight') rotations = 2;
            else if (direction === 'ArrowDown') rotations = 1;
        }

        if (rotations === 0) return boardToRotate;

        let currentBoard = boardToRotate;
        for (let i = 0; i < rotations; i++) {
            const rotated = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            for (let r_idx = 0; r_idx < this.gridSize; r_idx++) {
                for (let c_idx = 0; c_idx < this.gridSize; c_idx++) {
                    rotated[c_idx][this.gridSize - 1 - r_idx] = currentBoard[r_idx][c_idx];
                }
            }
            currentBoard = rotated;
        }
        return currentBoard;
    }

    checkGameOver() {
        if (this.grid.getRandomEmptyCellPosition()) {
            return false; 
        }

        const board = this.grid.getBoardState();
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const val = board[r][c];
                if (val === 0) continue; // Should not happen if no empty cells, but good check
                if (c < this.gridSize - 1 && val === board[r][c+1]) return false;
                if (r < this.gridSize - 1 && val === board[r+1][c]) return false;
            }
        }
        return true;
    }

    triggerGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.classList.add('show');
    }
}
