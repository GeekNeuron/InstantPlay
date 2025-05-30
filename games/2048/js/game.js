// js/game.js

class Game {
    constructor(gridInstance, scoreElementId, bestScoreElementId, gameOverModalId, finalScoreElementId) {
        this.grid = gridInstance;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048BestScore')) || 0;
        this.gameOver = false;
        this.gridSize = this.grid.size; // Assuming grid size is accessible

        this.scoreElement = document.getElementById(scoreElementId);
        this.bestScoreElement = document.getElementById(bestScoreElementId);
        this.gameOverModal = document.getElementById(gameOverModalId);
        this.finalScoreElement = document.getElementById(finalScoreElementId);

        this.updateScoreDisplay();
        this.updateBestScoreDisplay();
    }

    startNewGame() {
        this.score = 0;
        this.gameOver = false;
        this.grid.clearAllTiles();
        // this.grid.setupBackgroundCells(); // Already done in grid constructor, ensure it's okay
        this.grid.addRandomTile();
        this.grid.addRandomTile();
        this.updateScoreDisplay();
        this.gameOverModal.style.display = 'none';
        console.log("New game started. Board size:", this.gridSize);
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreDisplay();
            localStorage.setItem('2048BestScore', this.bestScore.toString());
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreElement.textContent = this.bestScore;
    }

    async move(direction) {
        if (this.gameOver) return false;

        let board = this.grid.getBoardState(); // Get current state as a 2D array
        let originalBoard = JSON.parse(JSON.stringify(board)); // Deep copy for comparison
        let currentScoreChange = 0;

        // Rotate board to always process moves as if moving "left"
        if (direction === 'ArrowUp') board = this.rotateBoard(board, 1);
        else if (direction === 'ArrowRight') board = this.rotateBoard(board, 2);
        else if (direction === 'ArrowDown') board = this.rotateBoard(board, 3);

        // Process each row: slide tiles, merge, and calculate score
        for (let r = 0; r < this.gridSize; r++) {
            const { newRow, scoreAdded } = this.processRow(board[r]);
            board[r] = newRow;
            currentScoreChange += scoreAdded;
        }

        // Rotate board back to original orientation
        if (direction === 'ArrowUp') board = this.rotateBoard(board, 3);
        else if (direction === 'ArrowRight') board = this.rotateBoard(board, 2);
        else if (direction === 'ArrowDown') board = this.rotateBoard(board, 1);
        
        const moved = !this.areBoardsEqual(originalBoard, board);

        if (moved) {
            this.updateScore(currentScoreChange);
            // Animate the moves on the visual grid
            await this.animateBoardChanges(originalBoard, board, direction);
            this.grid.addRandomTile();

            if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        }
        return moved;
    }

    processRow(row) {
        let newRow = row.filter(val => val !== 0); // Remove zeros
        let scoreAdded = 0;

        // Merge tiles
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i+1]) {
                newRow[i] *= 2;
                scoreAdded += newRow[i];
                newRow.splice(i + 1, 1); // Remove the merged tile
            }
        }

        // Fill with zeros at the end
        while (newRow.length < this.gridSize) {
            newRow.push(0);
        }
        return { newRow, scoreAdded };
    }

    // This is the most complex part: mapping state changes to tile object animations.
    // This is a simplified conceptual placeholder. A full implementation is non-trivial.
    async animateBoardChanges(oldBoard, newBoard, direction) {
        // For a true animation, you'd need to:
        // 1. Identify which tiles moved, which merged, which are new.
        // 2. For moved tiles: update their x,y and call grid.moveTile().
        // 3. For merged tiles: update one tile's value, remove the other, call grid.mergeTiles().
        // 4. Use Promise.all to wait for all animations.

        // Simplified: Re-render the grid based on newBoard.
        // This will not have smooth animations between states but reflects the result.
        // For full animations, you need to track tile identities or do complex diffing.
        this.grid.renderBoard(newBoard);
        // To make it somewhat "animated", you'd call grid.moveTile for each tile that changed position,
        // and grid.mergeTiles for merges. This requires a more sophisticated diff of oldBoard and newBoard.
        // The current `grid.renderBoard` will just replace tiles.
    }


    areBoardsEqual(board1, board2) {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (board1[r][c] !== board2[r][c]) return false;
            }
        }
        return true;
    }

    rotateBoard(board, times) {
        let currentBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        for (let t = 0; t < times; t++) {
            const rotated = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
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
        // Check for possible merges
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const val = board[r][c];
                if (c < this.gridSize - 1 && val === board[r][c+1]) return false; // Check right
                if (r < this.gridSize - 1 && val === board[r+1][c]) return false; // Check down
            }
        }
        return true; // No empty cells and no possible merges
    }

    triggerGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.style.display = 'flex';
        console.log("Game Over! Final Score:", this.score);
    }
}
