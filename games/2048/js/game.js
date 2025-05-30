// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScoreProV_Final2')) || 0; // Updated key
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
            return;
        }
        this.score = 0;
        this.gameOver = false;
        this.grid.clearAllTilesForNewGame();
        this.grid.setupBackgroundCells(); 
        
        this.grid.addRandomTile();
        this.grid.addRandomTile();
        
        this.updateScoreDisplay();
        this.updateBestScoreDisplay(); // Update best score display on new game too
        this.gameOverModal.classList.remove('show');
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScoreProV_Final2', this.bestScore.toString());
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreElement.textContent = this.bestScore; // Corrected: should display this.bestScore
    }

    async move(direction) {
        if (this.gameOver || this.isMoving) {
            return false;
        }
        this.isMoving = true;

        let boardChanged = false;
        let currentMoveScore = 0;
        
        let objectBoard = Array(this.gridSize).fill(null).map((_, r) =>
            Array(this.gridSize).fill(null).map((__, c) => this.grid.getTileAt(r, c))
        );

        let processedBoard = this.rotateBoardWithObjects(objectBoard, direction, 'toLogic');
        const tilesToRemove = [];

        for (let r = 0; r < this.gridSize; r++) {
            let row = processedBoard[r];
            let newLogicalRow = []; 
            
            for (let c = 0; c < this.gridSize; c++) { 
                if (row[c]) {
                    newLogicalRow.push(row[c]);
                }
            }

            for (let c = 0; c < newLogicalRow.length - 1; c++) { 
                if (newLogicalRow[c] && newLogicalRow[c+1] && newLogicalRow[c].value === newLogicalRow[c+1].value) {
                    let tileToKeep = newLogicalRow[c];
                    let tileToRemove = newLogicalRow[c+1];
                    
                    tileToKeep.futureValue = tileToKeep.value * 2; 
                    tileToRemove.markedForRemoval = true;
                    tilesToRemove.push(tileToRemove);
                    
                    currentMoveScore += tileToKeep.futureValue;
                    newLogicalRow.splice(c + 1, 1); 
                    boardChanged = true; 
                }
            }
            
            while (newLogicalRow.length < this.gridSize) {
                newLogicalRow.push(null);
            }
            processedBoard[r] = newLogicalRow;
        }

        let finalLayoutPlan = this.rotateBoardWithObjects(processedBoard, direction, 'fromLogic');
        const animationPromises = [];

        for (let r_idx = 0; r_idx < this.gridSize; r_idx++) {
            for (let c_idx = 0; c_idx < this.gridSize; c_idx++) {
                let tileInPlannedPos = finalLayoutPlan[r_idx][c_idx];
                if (tileInPlannedPos && !tileInPlannedPos.markedForRemoval) {
                    if (tileInPlannedPos.x !== r_idx || tileInPlannedPos.y !== c_idx) {
                        animationPromises.push(tileInPlannedPos.moveTo(r_idx, c_idx, this.gridSize, this.grid.gridContainerElement));
                        boardChanged = true; 
                    }
                }
            }
        }
        
        if (animationPromises.length > 0) {
            await Promise.all(animationPromises);
        }

        // Update values for merged tiles (this will trigger number pop via tile.setValue)
        for (let r_idx = 0; r_idx < this.gridSize; r_idx++) {
            for (let c_idx = 0; c_idx < this.gridSize; c_idx++) {
                let tile = finalLayoutPlan[r_idx][c_idx]; 
                if (tile && tile.futureValue) { 
                    tile.setValue(tile.futureValue, false); // isNewTile = false
                    delete tile.futureValue;
                    boardChanged = true; 
                }
            }
        }
        
        const removalPromises = [];
        for (const tileToRemove of tilesToRemove) {
            removalPromises.push(this.grid.removeTileObject(tileToRemove));
        }
        if (removalPromises.length > 0) {
            await Promise.all(removalPromises);
        }
        
        if (boardChanged) {
            if (currentMoveScore > 0) {
                this.updateScore(currentMoveScore);
            }
            this.grid.addRandomTile(); // New tiles will get number pop via tile.setPosition(..., ..., ..., ..., true)

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }
        this.isMoving = false;
        return boardChanged;
    }

    rotateBoardWithObjects(objectBoard, direction, phase) {
        let boardToRotate = objectBoard.map(row => row.map(tile => tile)); 
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
        return true;
    }

    triggerGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.classList.add('show');
    }
}
