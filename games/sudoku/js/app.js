// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const validateBtn = document.getElementById('validateBtn');
    const solveBtn = document.getElementById('solveBtn');
    const sudokuBoardElement = document.getElementById('sudokuBoard');

    let solutionBoard = [];     // The complete solution for the current puzzle
    let initialPuzzle = [];     // The puzzle board given to the user (with 0s for empty)
    let userBoard = [];         // The user's current state of the board
    
    let selectedCell = { row: -1, col: -1, element: null, inputElement: null }; // Track selected cell

    /**
     * Starts a new Sudoku game.
     */
    function startGame() {
        UI.clearMessage();
        UI.setBoardDisabled(false);
        const difficulty = UI.getSelectedDifficulty();
        
        solutionBoard = Sudoku.generateSolution();
        initialPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);

        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection(); // Clear any previous selection visual state
        console.log("New game started. Difficulty:", difficulty);
        // console.log("Solution:", solutionBoard); // For debugging
        // console.log("Puzzle:", initialPuzzle);
    }

    /**
     * Handles clicks on a cell for selection and highlighting.
     * @param {number} row - Clicked row index.
     * @param {number} col - Clicked column index.
     * @param {HTMLElement} cellElement - The DOM element of the clicked cell.
     * @param {HTMLInputElement|null} inputElement - The input element within the cell, if any.
     */
    function handleCellClick(row, col, cellElement, inputElement) {
        selectedCell = { row, col, element: cellElement, inputElement };
        Board.highlightRelatedCells(row, col, userBoard);
        // If it's an input cell, focus should already be handled by Board.js
        // If it's a readonly cell, the highlightRelatedCells is the main action.
    }
    
    function clearSelection() {
        selectedCell = { row: -1, col: -1, element: null, inputElement: null };
        Board.clearAllHighlights();
    }

    /**
     * Handles input changes in a cell.
     * @param {number} row - Row index of the input.
     * @param {number} col - Column index of the input.
     * @param {number} value - The new integer value (0 for empty).
     * @param {HTMLElement} cellElement - The DOM element of the cell.
     * @param {HTMLInputElement} inputElement - The input element.
     */
    function handleCellInput(row, col, value, cellElement, inputElement) {
        // Update userBoard immediately
        userBoard[row][col] = value;
        cellElement.dataset.value = value; // Update data attribute for styling or selection

        // Clear previous error state on this cell before re-validating
        cellElement.classList.remove('error');
        UI.clearMessage(); // Clear general messages

        if (value !== Sudoku.EMPTY_CELL) {
            // Check if the move is valid against Sudoku rules (row, col, box conflicts)
            if (!Sudoku.isMoveValid(userBoard, row, col, value)) {
                cellElement.classList.add('error');
                // UI.showMessage('This number conflicts with another in its row, column, or box.', 'error', 3000);
            } else {
                // If move is valid, check if the board is now solved
                if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
                    UI.showMessage('Congratulations! Puzzle Solved!', 'success');
                    Board.highlightRelatedCells(row, col, userBoard); // Final highlight
                    UI.setBoardDisabled(true); // Disable board after solving
                } else {
                    // If not solved, but board is full, means there's an error somewhere
                    if (Sudoku.isBoardFull(userBoard)) {
                         UI.showMessage('Board is full, but not solved. Check for errors.', 'info', 3000);
                         // Optionally, run a full validation here
                    }
                }
            }
        }
        // Re-highlight related cells because the value of the current cell changed
        Board.highlightRelatedCells(row, col, userBoard);
    }

    /**
     * Resets the current puzzle to its initial state.
     */
    function resetGame() {
        if (initialPuzzle.length === 0) { // No game started
            UI.showMessage("Start a new game first.", "info", 2000);
            return;
        }
        UI.clearMessage();
        UI.setBoardDisabled(false);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        console.log("Game reset.");
    }

    /**
     * Validates the entire user board against the solution and highlights errors.
     */
    function validateUserSolution() {
        if (userBoard.length === 0) {
            UI.showMessage("Start a new game first.", "info", 2000);
            return;
        }
        UI.clearMessage();
        let errorsFound = 0;
        let correctCells = 0;
        let totalFilledByUser = 0;

        for (let r = 0; r < Sudoku.GRID_SIZE; r++) {
            for (let c = 0; c < Sudoku.GRID_SIZE; c++) {
                const cellElement = Board.getCellElement(r, c);
                if (cellElement && !cellElement.classList.contains('readonly')) {
                    cellElement.classList.remove('error'); // Clear previous errors
                    if (userBoard[r][c] !== Sudoku.EMPTY_CELL) {
                        totalFilledByUser++;
                        if (userBoard[r][c] !== solutionBoard[r][c]) {
                            cellElement.classList.add('error');
                            errorsFound++;
                        } else {
                            correctCells++;
                        }
                    }
                }
            }
        }

        if (errorsFound > 0) {
            UI.showMessage(`${errorsFound} error(s) found. Keep trying!`, 'error', 3000);
        } else if (totalFilledByUser === 0) {
            UI.showMessage('Board is empty. Fill in some numbers first!', 'info', 3000);
        } else if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
             UI.showMessage('Congratulations! Puzzle Solved!', 'success');
             UI.setBoardDisabled(true);
        } else if (Sudoku.isBoardFull(userBoard) && errorsFound === 0) { // Should be caught by isBoardSolved
             UI.showMessage('Board is full and seems correct, but not flagged as solved. Hmm.', 'info');
        } else {
            UI.showMessage('No errors found in filled cells, but the puzzle is not complete.', 'info', 3000);
        }
    }
    
    /**
     * Solves the current puzzle and displays the solution.
     */
    function solvePuzzle() {
        if (solutionBoard.length === 0) {
            UI.showMessage("Start a new game first to have a puzzle to solve.", "info", 3000);
            return;
        }
        UI.clearMessage();
        userBoard = Utils.deepCopy2DArray(solutionBoard); // Show the full solution
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        UI.showMessage('Puzzle solved!', 'success');
        UI.setBoardDisabled(true);
        clearSelection();
    }

    /**
     * Handles clicks on the number palette.
     * @param {number} number - The number clicked (0 for clear).
     */
    function handlePaletteClick(number) {
        if (selectedCell.element && selectedCell.inputElement) {
            selectedCell.inputElement.value = (number === Sudoku.EMPTY_CELL) ? '' : number.toString();
            // Manually trigger input event to process the change
            const event = new Event('input', { bubbles: true, cancelable: true });
            selectedCell.inputElement.dispatchEvent(event);
            // Optionally, move to the next empty cell or maintain focus
            // selectedCell.inputElement.focus(); 
        } else if (selectedCell.element) {
            // UI.showMessage("Select an empty cell to input a number.", "info", 2000);
        }
    }

    // Initialize UI elements (theme, palette)
    UI.init(handlePaletteClick);

    // Setup event listeners for game controls
    newGameBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    validateBtn.addEventListener('click', validateUserSolution);
    solveBtn.addEventListener('click', solvePuzzle);
    difficultySelect.addEventListener('change', startGame); // Start new game on difficulty change

    // Start the first game on page load
    startGame();

    // Clicking outside the board clears selection
    document.addEventListener('click', (event) => {
        if (!sudokuBoardElement.contains(event.target) && !document.getElementById('numberPalette').contains(event.target)) {
            if (selectedCell.element) { // Only clear if something was selected
                // Check if the click was on a control that might open a new game etc.
                const controls = document.querySelector('.controls-wrapper');
                if (!controls.contains(event.target)) {
                     clearSelection();
                }
            }
        }
    });
});
