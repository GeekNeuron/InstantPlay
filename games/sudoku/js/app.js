// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    // const validateBtn = document.getElementById('validateBtn'); // Removed
    const sudokuBoardElement = document.getElementById('sudokuBoard');

    let solutionBoard = [];
    let initialPuzzle = [];
    let userBoard = [];
    
    let selectedCell = { row: -1, col: -1, element: null, inputElement: null };

    function startGame() {
        UI.clearMessage();
        UI.setBoardDisabled(false);
        const difficulty = UI.getSelectedDifficulty();
        
        solutionBoard = Sudoku.generateSolution();
        initialPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);

        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
    }

    function handleCellClick(row, col, cellElement, inputElement) {
        selectedCell = { row, col, element: cellElement, inputElement };
        Board.highlightRelatedCells(row, col, userBoard);
    }
    
    function clearSelection() {
        if (selectedCell.element || selectedCell.inputElement) {
            Board.clearAllHighlights();
        }
        selectedCell = { row: -1, col: -1, element: null, inputElement: null };
    }

    function handleCellInput(row, col, value, cellElement, inputElement) {
        userBoard[row][col] = value;
        cellElement.dataset.value = value;

        cellElement.classList.remove('error');
        if(inputElement) { // Check if inputElement exists
            inputElement.classList.remove('error'); // For box-shadow on input
            // Also remove explicit error border if any was set directly
            inputElement.style.borderColor = ''; 
        }


        UI.clearMessage();

        if (value !== Sudoku.EMPTY_CELL) {
            // Basic validation for immediate feedback (conflicts)
            if (!Sudoku.isMoveValid(userBoard, row, col, value)) {
                cellElement.classList.add('error');
                if(inputElement) inputElement.classList.add('error');
            } else {
                // Check for win condition if the move is valid
                if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
                    UI.showMessage('Congratulations! Puzzle Solved!', 'success');
                    Board.highlightRelatedCells(row, col, userBoard);
                    UI.setBoardDisabled(true);
                } else {
                    // If not solved, but board is full, means there's an error somewhere
                    // This state is harder to reach without a "Check Solution" button
                    // as users might not know they made a mistake until the very end.
                    if (Sudoku.isBoardFull(userBoard)) {
                         UI.showMessage('Board is full, but not solved. Check your numbers.', 'info', 4000);
                    }
                }
            }
        }
        Board.highlightRelatedCells(row, col, userBoard);
    }

    function resetGame() {
        if (initialPuzzle.length === 0) {
            UI.showMessage("Start a new game first.", "info", 2000);
            return;
        }
        UI.clearMessage();
        UI.setBoardDisabled(false);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
    }

    // Removed validateUserSolution function as the button is gone.

    // Removed handlePaletteClick function.

    UI.init(); // Removed onPaletteClick argument

    newGameBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    // Removed event listener for validateBtn
    difficultySelect.addEventListener('change', startGame);

    startGame();

    document.addEventListener('click', (event) => {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && !gameContainer.contains(event.target)) {
            clearSelection();
        } else if (selectedCell.element && !selectedCell.element.contains(event.target)) {
            const controls = document.querySelector('.header-controls');
            let clickedOnControl = false;
            if (controls && controls.contains(event.target)) clickedOnControl = true;

            if (!clickedOnControl) {
                 clearSelection();
            }
        }
    });
});
