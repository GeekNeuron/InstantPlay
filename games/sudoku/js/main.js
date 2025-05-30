class Game {
    constructor() {
        this.sudoku = new Sudoku();
        this.ui = new UI();
        this.currentTheme = this.ui.loadThemePreference();
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.checkSolutionBtn = document.getElementById('checkSolutionBtn');
        this.solveBtn = document.getElementById('solveBtn'); // Optional

        this.ui.themeSwitcherBtn.addEventListener('click', () => {
            this.currentTheme = this.ui.toggleTheme(this.currentTheme);
        });

        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkSolutionBtn.addEventListener('click', () => this.checkUserSolution());
        this.solveBtn.addEventListener('click', () => this.solveCurrentPuzzle());


        this.startNewGame(); // Start a game on load
    }

    startNewGame() {
        const difficulty = this.difficultySelect.value;
        const puzzleGrid = this.sudoku.generatePuzzle(difficulty);
        // The generatePuzzle method in Sudoku class now also stores the solution internally
        this.ui.renderBoard(puzzleGrid, puzzleGrid); // Pass the generated puzzle as initial state too
        this.ui.clearMessage();
    }

    checkUserSolution() {
        const userBoard = this.ui.getCurrentBoardState();
        let allFilled = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (userBoard[r][c] === 0) {
                    allFilled = false;
                    break;
                }
            }
            if (!allFilled) break;
        }

        if (!allFilled) {
            this.ui.showMessage('Please fill all cells before checking.', 'error');
            return;
        }

        if (this.sudoku.checkSolution(userBoard)) {
            this.ui.showMessage('Congratulations! You solved it! 🎉', 'success');
        } else {
            this.ui.showMessage('Incorrect solution. Keep trying!', 'error');
            // Optional: Highlight incorrect cells
        }
    }

    solveCurrentPuzzle() {
        if (this.sudoku.solution) {
            this.ui.fillSolvedBoard(this.sudoku.solution);
            this.ui.showMessage('Puzzle solved!', 'info');
        } else {
            this.ui.showMessage('No puzzle loaded to solve.', 'error');
        }
    }
}

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(); // Make it global for easy debugging if needed
});
