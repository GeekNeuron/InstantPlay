// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV3')) || 0; // New key for this version
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
        this.grid.setupBackgroundCells();
        this.grid.addRandomTile();
        this.grid.addRandomTile();
        this.updateScoreDisplay();
        this.gameOverModal.classList.remove('show');
        // console.log("New game started.");
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV3', this.bestScore.toString());
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

        let initialBoardStateForComparison = this.grid.getBoardState();
        let currentScoreChange = 0;
        let moveAnimations = [];
        let tilesToRemoveAfterAnimation = []; // Store tiles that merged

        // Create a 2D array of tile objects from the current grid
        let objectBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        // Rotate board so all logic can be "slide left"
        let boardToProcess = this.rotateBoardWithObjects(objectBoard, direction, 'toLogic');
        let boardChangedInLogic = false;

        for (let r = 0; r < this.gridSize; r++) {
            let currentRow = boardToProcess[r];
            let newLogicalRow = []; // Holds tile objects after slide & merge for this row's logic

            // 1. Slide non-null tiles to the left
            for (let c = 0; c < this.gridSize; c++) {
                if (currentRow[c]) {
                    newLogicalRow.push(currentRow[c]);
                }
            }

            // 2. Merge adjacent identical tiles
            for (let c = 0; c < newLogicalRow.length - 1; c++) {
                if (newLogicalRow[c] && newLogicalRow[c+1] && newLogicalRow[c].value === newLogicalRow[c+1].value) {
                    let tileToKeep = newLogicalRow[c];
                    let tileToRemove = newLogicalRow[c+1];
                    
                    tileToKeep.setValue(tileToKeep.value * 2); // This updates value and calls adjustFontSize
                    tileToKeep.merged(); // Explicitly call merged animation
                    currentScoreChange += tileToKeep.value;
                    
                    tilesToRemoveAfterAnimation.push(tileToRemove); // Mark for removal
                    
                    newLogicalRow.splice(c + 1, 1); // Remove from this processing row
                    boardChangedInLogic = true; 
                }
            }
            
            // Fill rest of newLogicalRow with nulls to maintain gridSize
            while (newLogicalRow.length < this.gridSize) {
                newLogicalRow.push(null);
            }
            boardToProcess[r] = newLogicalRow; // Update the processed row in the rotated board
        }

        // Rotate board back to original orientation
        let finalObjectBoardLayout = this.rotateBoardWithObjects(boardToProcess, direction, 'fromLogic');

        // Update tile.x, tile.y for all tiles based on finalObjectBoardLayout
        // and collect move animation promises
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tile = finalObjectBoardLayout[r][c];
                if (tile) {
                    if (tile.x !== r || tile.y !== c) { // If tile's logical position needs to change
                        moveAnimations.push(tile.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        boardChangedInLogic = true; 
                    } else {
                        // Even if it didn't change logical cell, ensure its visual position is correct
                        // This can happen if a tile didn't move but others did around it.
                        // tile.updateVisualPosition(r, c, this.gridSize, this.grid.gridContainerElement);
                        // moveTo already handles this, so this might be redundant if moveTo is always called.
                        // However, if a tile is in its final spot but wasn't "moved" by logic, its visual might need refresh.
                        // Let's rely on moveTo for now.
                    }
                }
            }
        }
        
        // Check if the board actually changed values/positions compared to start of move
        // This is an additional check to boardChangedInLogic which is set during slide/merge
        let visualBoardChanged = false;
        if (!boardChangedInLogic && moveAnimations.length === 0) { // If logic didn't detect change, check visual
            let finalBoardStateAfterLogic = this.grid.getBoardState(); // Get current values
             for(let r=0; r<this.gridSize; r++){
                for(let c=0; c<this.gridSize; c++){
                    if(initialBoardStateForComparison[r][c] !== finalBoardStateAfterLogic[r][c]){
                        visualBoardChanged = true;
                        break;
                    }
                }
                if(visualBoardChanged) break;
            }
        }


        if (boardChangedInLogic || moveAnimations.length > 0 || visualBoardChanged) {
            if (currentScoreChange > 0) {
                this.updateScore(currentScoreChange);
            }
            
            if (moveAnimations.length > 0) {
                await Promise.all(moveAnimations); // Wait for all move animations
            }

            // Remove merged tiles from the main grid.tiles array and DOM
            tilesToRemoveAfterAnimation.forEach(tile => this.grid.removeTileObject(tile));
            
            // A small delay might be needed for merge pop animations to visually complete
            // before adding a new tile, if pop animation has a delay.
            // Current pop animation has a 0.05s delay.
            if (tilesToRemoveAfterAnimation.length > 0) {
                 await new Promise(resolve => setTimeout(resolve, 100)); // e.g., 100ms
            }


            this.grid.addRandomTile();

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }

        this.isMoving = false;
        return boardChangedInLogic || moveAnimations.length > 0 || visualBoardChanged;
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
        // console.log("Game Over! Final Score:", this.score);
    }
}
