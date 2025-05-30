// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV6')) || 0; // New key
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
        if (this.isMoving) {
            // console.log("StartNewGame blocked: isMoving is true.");
            return;
        }
        // console.log("--- Starting New Game ---");
        this.score = 0;
        this.gameOver = false;
        this.grid.clearAllTilesForNewGame();
        this.grid.setupBackgroundCells(); 
        
        // console.log("Adding first tile...");
        this.grid.addRandomTile();
        // console.log("Adding second tile...");
        this.grid.addRandomTile();
        
        this.updateScoreDisplay();
        this.gameOverModal.classList.remove('show');
        // this.grid.printLogicalBoardState("Board after new game setup");
        // console.log("--- New Game Setup Complete ---");
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV6', this.bestScore.toString());
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreElement.textContent = this.bestScore;
    }

    async move(direction) {
        if (this.gameOver || this.isMoving) {
            // console.log(`Move blocked: gameOver=${this.gameOver}, isMoving=${this.isMoving}`);
            return false;
        }
        this.isMoving = true;
        // console.log(`--- Move Initiated: ${direction} ---`);
        // this.grid.printLogicalBoardState("Board before move");

        let boardChanged = false;
        let currentMoveScore = 0;
        
        let objectBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        let processedBoard = this.rotateBoardWithObjects(objectBoard, direction, 'toLogic');
        // console.log(`Board rotated for processing (${direction}):`);
        // processedBoard.forEach((row, rIdx) => console.log(`Row ${rIdx}: ${row.map(t => t ? `${t.id}(${t.value})` : '0').join(',')}`));

        const tilesToAnimateMove = []; // { tile, newR, newC } - for tiles that change cells
        const tilesToRemove = [];       // Tiles that merged into another

        for (let r = 0; r < this.gridSize; r++) {
            let row = processedBoard[r];
            let newLogicalRow = []; 
            
            for (let c = 0; c < this.gridSize; c++) { // Slide existing tiles
                if (row[c]) {
                    newLogicalRow.push(row[c]);
                }
            }

            for (let c = 0; c < newLogicalRow.length - 1; c++) { // Merge
                if (newLogicalRow[c] && newLogicalRow[c+1] && newLogicalRow[c].value === newLogicalRow[c+1].value) {
                    let tileToKeep = newLogicalRow[c];
                    let tileToRemove = newLogicalRow[c+1];
                    
                    tileToKeep.futureValue = tileToKeep.value * 2; // Store future value
                    tileToRemove.markedForRemoval = true;
                    tilesToRemove.push(tileToRemove);
                    
                    currentMoveScore += tileToKeep.futureValue;
                    newLogicalRow.splice(c + 1, 1); // Remove from processing row
                    boardChanged = true; 
                    // console.log(`Merge planned: ${tileToRemove.id}(${tileToRemove.value}) into ${tileToKeep.id}(${tileToKeep.value} -> ${tileToKeep.futureValue})`);
                }
            }
            
            while (newLogicalRow.length < this.gridSize) {
                newLogicalRow.push(null);
            }
            processedBoard[r] = newLogicalRow;
        }

        let finalLayoutPlan = this.rotateBoardWithObjects(processedBoard, direction, 'fromLogic');
        // console.log("Final layout plan (after back-rotation):");
        // finalLayoutPlan.forEach((row, rIdx) => console.log(`Row ${rIdx}: ${row.map(t => t ? `${t.id}(${t.futureValue || t.value})` : '0').join(',')}`));

        const animationPromises = [];

        // Phase 1: Animate tiles moving to their new positions
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tileInPlannedPos = finalLayoutPlan[r][c];
                if (tileInPlannedPos && !tileInPlannedPos.markedForRemoval) {
                    if (tileInPlannedPos.x !== r || tileInPlannedPos.y !== c) {
                        // console.log(`Animating move for Tile ${tileInPlannedPos.id} (val ${tileInPlannedPos.value}) from (${tileInPlannedPos.x},${tileInPlannedPos.y}) to (${r},${c})`);
                        animationPromises.push(tileInPlannedPos.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        boardChanged = true;
                    }
                }
            }
        }
        
        // Animate tiles that are part of a merge to move to the kept tile's final position
        for (const tileToRemove of tilesToRemove) {
            // Find the tile it merged into (the one not marked for removal at the same final spot)
            let tileKept = null;
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    const t = finalLayoutPlan[r][c];
                    if (t && t.futureValue && t.value * 2 === t.futureValue && !t.markedForRemoval) {
                         // This is a heuristic; a more robust way is to track merge pairs.
                         // For now, find the tile at the destination that has a futureValue.
                         // This needs a more direct link between tileToRemove and tileKept.
                         // Let's assume tileKept is the one at the same final position in finalLayoutPlan
                         // that isn't tileToRemove. This is complex if multiple merges target same spot.
                         // The current logic processes merges sequentially in a row, so this should be simpler.
                         // The tileToKeep is already in its final position in finalLayoutPlan.
                         // We need to find its coordinates (finalR, finalC).
                         let finalR = -1, finalC = -1;
                         for(let r_scan = 0; r_scan < this.gridSize; r_scan++){
                             for(let c_scan = 0; c_scan < this.gridSize; c_scan++){
                                 if(finalLayoutPlan[r_scan][c_scan] && finalLayoutPlan[r_scan][c_scan].futureValue && finalLayoutPlan[r_scan][c_scan].id !== tileToRemove.id){
                                     // This is a potential tileKept. Check if tileToRemove logically moved towards it.
                                     // This part is tricky. Let's simplify: move tileToRemove to tileKept's *original* position if it helps visuals,
                                     // or just let it be removed.
                                     // The simplest is to ensure tileKept is correctly positioned.
                                     // tileToRemove will just be removed.
                                     // The animation of tileToRemove "sliding into" tileKept is complex.
                                     // For now, we just ensure tileKept is in its final spot, and tileToRemove is removed.
                                     // The previous logic was to move tileToRemove to tileKept's *final* position.
                                     const keptTileInFinalPlan = Object.values(finalLayoutPlan).flat().find(t => t && t.id === tileToRemove.mergedInto?.id); // Requires mergedInto property
                                     // This is getting too complex without proper merge tracking.
                                     // Let's assume tileToRemove just animates to its "final" spot if it moved before merge, then gets removed.
                                     // The key is that tileKept is correctly animated to its final spot.
                                 }
                             }
                         }
                    }
                }
            }
        }


        if (animationPromises.length > 0) {
            await Promise.all(animationPromises);
            // console.log("All move animations completed.");
        }

        // Phase 2: Process merges (update values, trigger merge animations on kept tiles)
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tile = finalLayoutPlan[r][c];
                if (tile && tile.futureValue) {
                    // console.log(`Finalizing merge for Tile ${tile.id}: value ${tile.value} -> ${tile.futureValue}`);
                    tile.setValue(tile.futureValue); // setValue now also calls tile.merged()
                    delete tile.futureValue;
                }
            }
        }
        
        // Phase 3: Remove tiles marked for removal from DOM and grid.tiles array
        const removalPromises = [];
        for (const tileToRemove of tilesToRemove) {
            // console.log(`Removing Tile ${tileToRemove.id} (val ${tileToRemove.value}) from grid and DOM.`);
            removalPromises.push(this.grid.removeTileObject(tileToRemove));
        }
        if (removalPromises.length > 0) {
            await Promise.all(removalPromises);
            // console.log("All merged tiles removed.");
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
            // console.log("Board did not change after move attempt.");
        }
        // this.grid.printLogicalBoardState("Board after move");
        // console.log(`--- Move Ended: ${direction} ---`);
        this.isMoving = false;
        return boardChanged;
    }

    rotateBoardWithObjects(objectBoard, direction, phase) {
        let boardToRotate = objectBoard.map(row => row.map(tile => tile)); // Shallow copy of rows and tile references
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
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tile = this.grid.getTileAt(r, c);
                if (!tile) continue;
                const val = tile.value;
                
                const rightTile = this.grid.getTileAt(r, c + 1);
                if (rightTile && rightTile.value === val) return false;
                
                const downTile = this.grid.getTileAt(r + 1, c);
                if (downTile && downTile.value === val) return false;
            }
        }
        // console.log("No empty cells and no possible merges. Game Over.");
        return true;
    }

    triggerGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.classList.add('show');
    }
}
