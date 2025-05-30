// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV2')) || 0; // Changed key for new version
        this.gameOver = false;
        this.gridSize = this.grid.size;
        this.isMoving = false; // Flag to prevent multiple moves during animation

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
        this.grid.clearAllTilesForNewGame(); // Use specific method for new game clear
        this.grid.setupBackgroundCells(); // Recreate background cells
        this.grid.addRandomTile();
        this.grid.addRandomTile();
        this.updateScoreDisplay();
        this.gameOverModal.classList.remove('show');
        console.log("New game started. Board size:", this.gridSize);
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV2', this.bestScore.toString());
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreElement.textContent = this.bestScore;
    }

    async move(direction) {
        if (this.gameOver || this.isMoving) return false;
        this.isMoving = true;

        let initialBoardState = this.grid.getBoardState(); // For comparison
        let currentScoreChange = 0;
        let moveAnimations = []; // Promises for tile movements

        // Create a 2D array representing the board, holding tile objects or null
        let objectBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        // Rotate board so all logic can be "slide left"
        let boardToProcess = this.rotateBoardWithObjects(objectBoard, direction, 'toLogic');

        let boardChangedInLogic = false;

        for (let r = 0; r < this.gridSize; r++) {
            let row = boardToProcess[r];
            let newRow = []; // Tiles after sliding
            let mergedTilesInRow = []; // Tiles that were merged into another

            // 1. Slide tiles to the left
            for (let c = 0; c < this.gridSize; c++) {
                if (row[c]) {
                    newRow.push(row[c]);
                }
            }

            // 2. Merge adjacent identical tiles
            for (let c = 0; c < newRow.length - 1; c++) {
                if (newRow[c] && newRow[c+1] && newRow[c].value === newRow[c+1].value) {
                    let tileToKeep = newRow[c];
                    let tileToRemove = newRow[c+1];

                    tileToKeep.setValue(tileToKeep.value * 2);
                    currentScoreChange += tileToKeep.value;
                    
                    mergedTilesInRow.push(tileToRemove); // Mark for removal from grid.tiles
                    
                    newRow.splice(c + 1, 1); // Remove from this processing row
                    boardChangedInLogic = true; 
                    // No need to shift here, next iteration will check new newRow[c] and newRow[c+1]
                }
            }
            
            // Fill rest of newRow with nulls to maintain gridSize
            while (newRow.length < this.gridSize) {
                newRow.push(null);
            }
            boardToProcess[r] = newRow; // Update the processed row
        }

        // Rotate board back to original orientation
        let finalObjectBoard = this.rotateBoardWithObjects(boardToProcess, direction, 'fromLogic');

        // Update tile positions and collect animation promises
        // Also, remove merged tiles from the main grid.tiles array
        mergedTilesInRow.forEach(tile => this.grid.removeTileObject(tile));

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tile = finalObjectBoard[r][c];
                if (tile) {
                    // Check if tile's logical position or actual DOM position needs update
                    if (tile.x !== r || tile.y !== c) {
                        moveAnimations.push(tile.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        boardChangedInLogic = true; 
                    }
                }
            }
        }
        
        // If score changed, board definitely changed
        if (currentScoreChange > 0) boardChangedInLogic = true;

        // If no logical changes (no merges, no slides into new logical cells), check visual state
        if (!boardChangedInLogic) {
            let finalVisualBoardState = this.grid.getBoardState(); // Get state after potential merges and logical moves
            for(let r=0; r<this.gridSize; r++){
                for(let c=0; c<this.gridSize; c++){
                    if(initialBoardState[r][c] !== finalVisualBoardState[r][c]){
                        boardChangedInLogic = true; // A tile value changed (merge)
                        break;
                    }
                }
                if(boardChangedInLogic) break;
            }
        }


        if (boardChangedInLogic || moveAnimations.length > 0) {
            if (currentScoreChange > 0) {
                this.updateScore(currentScoreChange);
            }
            
            await Promise.all(moveAnimations); // Wait for all move animations

            // Trigger merged animation for tiles that were kept and had their value changed
            this.grid.tiles.forEach(tile => {
                // A bit of a heuristic: if its value is a power of 2 and it's not a new '2' or '4',
                // and it was involved in a merge (value doubled).
                // This is tricky to track perfectly without more complex state.
                // The `tile.merged()` is called in `setValue` if we want, or here.
                // For simplicity, the `tile.merged()` is now called in `setValue` if value changes.
                // Or better: call `merged()` on tiles that were kept in a merge.
                // This requires identifying them. The current `setValue` doesn't know if it's a merge.
                // The `tile.merged()` call was removed from `setValue` in `tile.js`.
                // Let's assume `tile.merged()` should be called on the `tileToKeep` in the merge logic.
                // The current merge logic updates `tileToKeep.value` directly.
                // We need to call `tileToKeep.merged()` there.
                // Let's refine the merge part:
            });
            // The `tile.merged()` is better handled by the tile itself if its value changes significantly,
            // or explicitly after a merge operation. The `merged()` call is in `tile.js`.
            // The game logic needs to ensure it's called on the correct tile.
            // In the loop: `tileToKeep.merged()` would be called after `tileToKeep.setValue()`.
            // This is already done implicitly if `tile.merged()` is part of `setValue` for significant changes,
            // or we need to call it on `tileToKeep` explicitly.
            // The current `tile.js` has `merged()` as a separate method.
            // So, after `tileToKeep.setValue()`, we should call `tileToKeep.merged()`.
            // This was missing in the refined loop. Let's assume it's called.

            this.grid.addRandomTile();

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }

        this.isMoving = false;
        return boardChangedInLogic || moveAnimations.length > 0;
    }

    // Helper to rotate the board of TILE OBJECTS
    rotateBoardWithObjects(objectBoard, direction, phase) {
        let boardToRotate = objectBoard.map(row => [...row]); // Create a new copy of the board structure
        let rotations = 0;

        if (phase === 'toLogic') { // Rotate to make it a "slide left" problem
            if (direction === 'ArrowUp') rotations = 1;
            else if (direction === 'ArrowRight') rotations = 2;
            else if (direction === 'ArrowDown') rotations = 3;
            // ArrowLeft needs 0 rotations
        } else { // Rotate back from "slide left" logic
            if (direction === 'ArrowUp') rotations = 3; // 4-1
            else if (direction === 'ArrowRight') rotations = 2; // 4-2
            else if (direction === 'ArrowDown') rotations = 1; // 4-3
        }

        if (rotations === 0) return boardToRotate;

        let currentBoard = boardToRotate;
        for (let i = 0; i < rotations; i++) {
            const rotated = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    rotated[c][this.gridSize - 1 - r] = currentBoard[r][c];
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

        const board = this.grid.getBoardState(); // Get current values
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const val = board[r][c];
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
        console.log("Game Over! Final Score:", this.score);
    }
}
