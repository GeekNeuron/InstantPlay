// js/game.js
class Game {
    constructor(rows, cols, mines, boardElement, updateMinesCountCallback, updateTimerCallback, showMessageCallback) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.boardElement = boardElement;
        this.updateMinesCountCallback = updateMinesCountCallback;
        this.updateTimerCallback = updateTimerCallback;
        this.showMessageCallback = showMessageCallback;

        this.grid = null;
        this.timerInterval = null;
        this.timeElapsed = 0;
        this.flagsPlaced = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.revealedTilesCount = 0;

        // Prevent default context menu on the game board
        this.boardElement.addEventListener('contextmenu', e => e.preventDefault());
    }

    setupGame() {
        this.gameOver = false;
        this.firstClick = true;
        this.timeElapsed = 0;
        this.flagsPlaced = 0;
        this.revealedTilesCount = 0;
        this.updateMinesCountCallback(this.mines - this.flagsPlaced);
        this.updateTimerCallback(this.timeElapsed);
        this.stopTimer();

        this.grid = new Grid(this.rows, this.cols, this.mines, this.boardElement, this);
        this.grid.create(); // Create the grid and tiles
        // Timer starts after the first click
    }

    handleTileClick(tile, isLeftClick) {
        if (this.gameOver || tile.isRevealed) {
            return;
        }

        if (this.firstClick) {
            if (isLeftClick) { // Only start game and plant mines on left click
                this.grid.plantMines(tile); // Plant mines after first click, away from it
                this.startTimer();
                this.firstClick = false;
            } else { // If first click is right-click (for flag), do nothing yet
                return;
            }
        }

        if (isLeftClick) {
            // If left-clicked on a flag, do nothing
            if (tile.isFlagged) {
                return;
            }
            this.grid.revealTile(tile);
        } else { // Right click
            this.toggleFlag(tile);
        }
        this.checkWinCondition();
    }
    
    toggleFlag(tile) {
        if (tile.isRevealed) return;

        if (tile.isFlagged) {
            tile.unflag();
            this.flagsPlaced--;
        } else {
            if (this.flagsPlaced < this.mines) {
                tile.flag();
                this.flagsPlaced++;
            } else {
                // console.log("Cannot place more flags than mines.");
                // this.showMessageCallback("Attention", "Cannot place more flags than available mines.");
            }
        }
        this.updateMinesCountCallback(this.mines - this.flagsPlaced);
    }

    checkWinCondition() {
        if (this.gameOver) return;

        const totalSafeTiles = this.rows * this.cols - this.mines;
        if (this.revealedTilesCount === totalSafeTiles && this.flagsPlaced <= this.mines) { // Ensure all safe tiles are revealed
            // Double check if all flagged tiles are indeed mines (optional, classic Minesweeper doesn't require all mines to be flagged)
            // For simplicity, we'll consider revealing all non-mine tiles as a win.
            this.endGame(true); // Player wins
        }
    }

    endGame(isWin) {
        this.gameOver = true;
        this.stopTimer();
        this.grid.revealAllMines(isWin); // Show all mines

        if (isWin) {
            this.showMessageCallback("You Won!", `Congratulations! You cleared the field in ${this.timeElapsed} seconds.`, true);
            this.updateMinesCountCallback(0); // Set remaining mines to 0 on win
        } else {
            this.showMessageCallback("Game Over!", "Unfortunately, you hit a mine. Try again!", true);
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateTimerCallback(this.timeElapsed);
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
    
    incrementRevealedTiles() {
        this.revealedTilesCount++;
    }

    destroy() {
        this.stopTimer();
        if (this.grid) {
            this.grid.destroy();
        }
        this.boardElement.innerHTML = ''; // Clear the board
    }
}
