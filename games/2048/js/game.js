// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV5')) || 0; // New key
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
        // console.clear(); // Optional: clear console on new game
        // console.log("--- New Game Started ---");
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV5', this.bestScore.toString());
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
        // console.log(`Move initiated: ${direction}`);

        let boardChanged = false;
        let currentMoveScore = 0;
        
        // Represent the board with tile objects for manipulation
        let currentObjectBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        // Rotate for processing (all moves effectively become "slide left")
        let processedBoard = this.rotateBoardWithObjects(currentObjectBoard, direction, 'toLogic');
        // console.log("Board rotated for processing:", JSON.stringify(processedBoard.map(row => row.map(t => t ? t.value : 0))));


        const tilesToAnimateMove = []; // { tile, newR, newC }
        const tilesToAnimateMerge = []; // { tileKept, tileRemoved }

        for (let r = 0; r < this.gridSize; r++) {
            let row = processedBoard[r];
            let newLogicalRow = []; // Holds tile objects after slide & merge for this row's logic

            // 1. Slide non-null tiles to the start of the row
            for (let c = 0; c < this.gridSize; c++) {
                if (row[c]) {
                    newLogicalRow.push(row[c]);
                }
            }

            // 2. Merge adjacent identical tiles
            for (let c = 0; c < newLogicalRow.length - 1; c++) {
                if (newLogicalRow[c] && newLogicalRow[c+1] && newLogicalRow[c].value === newLogicalRow[c+1].value) {
                    let tileToKeep = newLogicalRow[c];
                    let tileToRemove = newLogicalRow[c+1];
                    
                    // Prepare for merge animation and state update
                    tilesToAnimateMerge.push({ tileKept: tileToKeep, tileRemoved: tileToRemove });
                    currentMoveScore += tileToKeep.value * 2; // Score is the value of the new tile
                    
                    // Temporarily mark tileToKeep with its future value for layout purposes
                    // The actual setValue will happen after animation.
                    tileToKeep.futureValue = tileToKeep.value * 2;
                    tileToRemove.markedForRemoval = true; // Mark for removal from grid.tiles

                    newLogicalRow.splice(c + 1, 1); // Remove from this processing row for layout
                    boardChanged = true; 
                }
            }
            
            // Fill rest of newLogicalRow with nulls
            while (newLogicalRow.length < this.gridSize) {
                newLogicalRow.push(null);
            }
            processedBoard[r] = newLogicalRow;
        }
        // console.log("Board after slide/merge logic (before back-rotation):", JSON.stringify(processedBoard.map(row => row.map(t => t ? (t.futureValue || t.value) : 0))));

        // Rotate board back to original orientation
        let finalLayoutPlan = this.rotateBoardWithObjects(processedBoard, direction, 'fromLogic');
        // console.log("Final layout plan (after back-rotation):", JSON.stringify(finalLayoutPlan.map(row => row.map(t => t ? (t.futureValue || t.value) : 0))));


        // --- Animation Phase ---
        const movePromises = [];

        // Part 1: Animate tiles moving to their new positions (including those that will merge)
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tileInPlannedPos = finalLayoutPlan[r][c];
                if (tileInPlannedPos && !tileInPlannedPos.markedForRemoval) {
                    if (tileInPlannedPos.x !== r || tileInPlannedPos.y !== c) {
                        // console.log(`Planning move for Tile ${tileInPlannedPos.id} (val ${tileInPlannedPos.value}) from (${tileInPlannedPos.x},${tileInPlannedPos.y}) to (${r},${c})`);
                        movePromises.push(tileInPlannedPos.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        boardChanged = true;
                    }
                }
            }
        }
        
        // Animate tiles that are part of a merge to move to the kept tile's final position
        for (const mergeInfo of tilesToAnimateMerge) {
            const { tileKept, tileRemoved } = mergeInfo;
            // Find final position of tileKept from finalLayoutPlan
            let finalKeptR = -1, finalKeptC = -1;
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (finalLayoutPlan[r][c] === tileKept) {
                        finalKeptR = r; finalKeptC = c; break;
                    }
                }
                if (finalKeptR !== -1) break;
            }

            if (finalKeptR !== -1 && tileRemoved.x !== finalKeptR || tileRemoved.y !== finalKeptC) {
                 // console.log(`Planning move for REMOVED Tile ${tileRemoved.id} (val ${tileRemoved.value}) to (${finalKeptR},${finalKeptC}) before removal`);
                movePromises.push(tileRemoved.moveTo(finalKeptR, finalKeptC, this.gridSize, this.grid.gridContainerElement));
                boardChanged = true;
            }
        }

        if (movePromises.length > 0) {
            await Promise.all(movePromises);
        }
        // console.log("All move animations completed.");

        // Part 2: Process merges (update values, trigger merge animations, remove old tiles)
        const removalPromises = [];
        for (const mergeInfo of tilesToAnimateMerge) {
            mergeInfo.tileKept.setValue(mergeInfo.tileKept.futureValue); // This now triggers .merged() via setValue
            delete mergeInfo.tileKept.futureValue; // Clean up temporary property
            removalPromises.push(this.grid.removeTileObject(mergeInfo.tileRemoved)); // removeTileObject calls tile.remove()
        }

        if (removalPromises.length > 0) {
            await Promise.all(removalPromises);
            // console.log("All removal animations completed.");
        }
        
        if (boardChanged) {
            if (currentMoveScore > 0) {
                this.updateScore(currentMoveScore);
            }
            
            // console.log("Board changed, adding new tile.");
            this.grid.addRandomTile();

            if (this.checkGameOver()) {
                // console.log("Game Over triggered.");
                this.triggerGameOver();
            }
        } else {
            // console.log("Board did not change.");
        }

        this.isMoving = false;
        return boardChanged;
    }

    // Helper to rotate the board of TILE OBJECTS
    rotateBoardWithObjects(objectBoard, direction, phase) {
        // Ensure deep copy of the board structure, but keep tile object references
        let boardToRotate = objectBoard.map(row => [...row]); 
        let rotations = 0;

        // Determine number of 90-degree clockwise rotations
        if (phase === 'toLogic') { // Rotate to make it a "slide left" problem
            if (direction === 'ArrowUp') rotations = 1;      // Up -> Rotate 90 deg CW
            else if (direction === 'ArrowRight') rotations = 2; // Right -> Rotate 180 deg CW
            else if (direction === 'ArrowDown') rotations = 3;  // Down -> Rotate 270 deg CW
            // ArrowLeft needs 0 rotations
        } else { // Rotate back from "slide left" logic
            if (direction === 'ArrowUp') rotations = 3;      // From Up (was 1 CW) -> 3 CW (or 1 ACW) to revert
            else if (direction === 'ArrowRight') rotations = 2; // From Right (was 2 CW) -> 2 CW to revert
            else if (direction === 'ArrowDown') rotations = 1;  // From Down (was 3 CW) -> 1 CW to revert
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
        // Check for possible merges
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tile = this.grid.getTileAt(r, c);
                if (!tile) continue; // Should not happen if no empty cells
                const val = tile.value;
                
                // Check right
                const rightTile = this.grid.getTileAt(r, c + 1);
                if (rightTile && rightTile.value === val) return false;
                
                // Check down
                const downTile = this.grid.getTileAt(r + 1, c);
                if (downTile && downTile.value === val) return false;
            }
        }
        return true; // No empty cells and no possible merges
    }

    triggerGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.classList.add('show');
    }
}
