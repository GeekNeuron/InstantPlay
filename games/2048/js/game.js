// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScorePro')) || 0;
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
        if (this.isMoving) return; // Don't start if animating
        this.score = 0;
        this.gameOver = false;
        this.grid.setupBackgroundCells(); // Clears old tiles and recreates cells
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
            localStorage.setItem('2048BestScorePro', this.bestScore.toString());
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

        let board = this.grid.getBoardState();
        let initialBoardForComparison = JSON.parse(JSON.stringify(board)); // For checking if anything moved
        let scoreFromThisMove = 0;
        let animationPromises = [];

        // Create a representation of the board with tile objects for easier manipulation
        let objectBoard = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).null);
        this.grid.tiles.forEach(tile => {
            if (tile.x !== undefined && tile.y !== undefined) {
                objectBoard[tile.x][tile.y] = tile;
            }
        });
        
        let rotatedObjectBoard = JSON.parse(JSON.stringify(objectBoard)); // For rotation, will hold tile objects or null

        if (direction === 'ArrowUp') rotatedObjectBoard = this.rotateObjectBoard(objectBoard, 1);
        else if (direction === 'ArrowRight') rotatedObjectBoard = this.rotateObjectBoard(objectBoard, 2);
        else if (direction === 'ArrowDown') rotatedObjectBoard = this.rotateObjectBoard(objectBoard, 3);
        else rotatedObjectBoard = objectBoard; // ArrowLeft needs no rotation for logic

        let somethingMovedThisTurn = false;

        for (let r = 0; r < this.gridSize; r++) {
            let row = rotatedObjectBoard[r];
            let newRow = []; // Will hold tile objects after slide & merge
            let writeIndex = 0;

            // 1. Slide non-null tiles to the left
            for (let c = 0; c < this.gridSize; c++) {
                if (row[c]) {
                    if (writeIndex !== c) {
                        // Tile moved
                        somethingMovedThisTurn = true;
                    }
                    newRow[writeIndex] = row[c];
                    writeIndex++;
                }
            }
             // Fill rest of newRow with null
            for (let i = writeIndex; i < this.gridSize; i++) {
                newRow[i] = null;
            }


            // 2. Merge adjacent identical tiles
            for (let c = 0; c < this.gridSize - 1; c++) {
                if (newRow[c] && newRow[c+1] && newRow[c].value === newRow[c+1].value) {
                    let tileToKeep = newRow[c];
                    let tileToRemove = newRow[c+1];
                    
                    tileToKeep.setValue(tileToKeep.value * 2);
                    scoreFromThisMove += tileToKeep.value;
                    
                    // Animate merge: tileToRemove moves to tileToKeep's new position, then is removed
                    // tileToKeep gets pop animation
                    // For simplicity here, we'll mark tileToRemove for later removal.
                    // The visual update will handle their final positions.
                    newRow[c+1] = null; // Mark for removal from logical row
                    this.grid.removeTile(tileToRemove); // Remove from main tiles array & DOM
                    tileToKeep.merged(); // Trigger pop animation

                    somethingMovedThisTurn = true;
                    // Shift subsequent tiles left by one more spot
                    for (let k = c + 1; k < this.gridSize -1; k++) {
                        newRow[k] = newRow[k+1];
                    }
                    newRow[this.gridSize -1] = null;
                }
            }
            
            // 3. Slide again after merge
            let finalRow = [];
            writeIndex = 0;
            for(let c=0; c<this.gridSize; c++){
                if(newRow[c]){
                    finalRow[writeIndex++] = newRow[c];
                }
            }
            for (let i = writeIndex; i < this.gridSize; i++) {
                finalRow[i] = null;
            }
            rotatedObjectBoard[r] = finalRow;
        }

        // Rotate back
        let finalObjectBoard = rotatedObjectBoard;
        if (direction === 'ArrowUp') finalObjectBoard = this.rotateObjectBoard(rotatedObjectBoard, 3);
        else if (direction === 'ArrowRight') finalObjectBoard = this.rotateObjectBoard(rotatedObjectBoard, 2);
        else if (direction === 'ArrowDown') finalObjectBoard = this.rotateObjectBoard(rotatedObjectBoard, 1);

        // 4. Update tile positions and collect animation promises
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let tile = finalObjectBoard[r][c];
                if (tile) {
                    if (tile.x !== r || tile.y !== c) { // If tile's logical position needs updating
                        animationPromises.push(tile.moveTo(r, c, this.gridSize, this.grid.gridContainerElement));
                        // somethingMovedThisTurn is already true if it logically moved
                    }
                }
            }
        }
        
        // Check if the board actually changed values/positions compared to start of move
        let finalBoardState = this.grid.getBoardState(); // Get state after potential merges and logical moves
        let boardChangedLogically = false;
        for(let r=0; r<this.gridSize; r++){
            for(let c=0; c<this.gridSize; c++){
                if(initialBoardForComparison[r][c] !== finalBoardState[r][c]){
                    boardChangedLogically = true;
                    break;
                }
            }
            if(boardChangedLogically) break;
        }
        // If only positions changed but values are same (e.g. a 2 slides into empty space)
        // somethingMovedThisTurn should catch this.
        // We rely on boardChangedLogically or animationPromises.length for adding new tile

        if (animationPromises.length > 0 || boardChangedLogically || (somethingMovedThisTurn && scoreFromThisMove === 0)) {
            if (scoreFromThisMove > 0) {
                this.updateScore(scoreFromThisMove);
            }
            await Promise.all(animationPromises); // Wait for all move animations
            
            // Short delay before adding new tile to let merge animations (pop) finish if any
            // if (scoreFromThisMove > 0) await new Promise(resolve => setTimeout(resolve, 100));

            this.grid.addRandomTile();

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }

        this.isMoving = false;
        return (animationPromises.length > 0 || boardChangedLogically);
    }

    // Rotates a board of TILE OBJECTS (or null)
    rotateObjectBoard(objectBoard, times) {
        let currentBoard = objectBoard.map(row => [...row]); // Deep copy of rows with references to original tiles
        for (let t = 0; t < times; t++) {
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
            return false; // There's an empty cell
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
        this.gameOverModal.classList.add('show'); // Use class for modal display
        console.log("Game Over! Final Score:", this.score);
    }
}
