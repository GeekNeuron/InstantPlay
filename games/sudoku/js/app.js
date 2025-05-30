// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const validateBtn = document.getElementById('validateBtn');
    // const solveBtn = document.getElementById('solveBtn'); // Removed
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
        // console.log("New game started. Difficulty:", difficulty);
    }

    function handleCellClick(row, col, cellElement, inputElement) {
        selectedCell = { row, col, element: cellElement, inputElement };
        Board.highlightRelatedCells(row, col, userBoard);
    }
    
    function clearSelection() {
        if (selectedCell.element || selectedCell.inputElement) { // Only clear if something was meaningfully selected
            Board.clearAllHighlights(); // Clear visual highlights from Board module
        }
        selectedCell = { row: -1, col: -1, element: null, inputElement: null }; // Reset selected cell info
    }

    function handleCellInput(row, col, value, cellElement, inputElement) {
        userBoard[row][col] = value;
        cellElement.dataset.value = value;

        cellElement.classList.remove('error');
        // Check if input has error class for its box-shadow
        if(inputElement) inputElement.classList.remove('error');


        UI.clearMessage();

        if (value !== Sudoku.EMPTY_CELL) {
            if (!Sudoku.isMoveValid(userBoard, row, col, value)) {
                cellElement.classList.add('error');
                if(inputElement) inputElement.classList.add('error'); // For box-shadow
            } else {
                if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
                    UI.showMessage('Congratulations! Puzzle Solved!', 'success');
                    Board.highlightRelatedCells(row, col, userBoard);
                    UI.setBoardDisabled(true);
                } else {
                    if (Sudoku.isBoardFull(userBoard)) {
                         UI.showMessage('Board is full, but not solved. Use "Check Solution".', 'info', 4000);
                    }
                }
            }
        }
        Board.highlightRelatedCells(row, col, userBoard); // Re-highlight based on new board state
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
        // console.log("Game reset.");
    }

    function validateUserSolution() {
        if (userBoard.length === 0) {
            UI.showMessage("Start a new game first.", "info", 2000);
            return;
        }
        UI.clearMessage();
        let errorsFound = 0;
        let correctCells = 0;
        let totalFilledByUser = 0;
        let isFull = true;

        for (let r = 0; r < Sudoku.GRID_SIZE; r++) {
            for (let c = 0; c < Sudoku.GRID_SIZE; c++) {
                const cellElement = Board.getCellElement(r, c);
                const inputElement = cellElement ? cellElement.querySelector('input') : null;

                if (cellElement && !cellElement.classList.contains('readonly')) {
                    cellElement.classList.remove('error');
                    if(inputElement) inputElement.classList.remove('error');

                    if (userBoard[r][c] !== Sudoku.EMPTY_CELL) {
                        totalFilledByUser++;
                        if (userBoard[r][c] !== solutionBoard[r][c]) {
                            cellElement.classList.add('error');
                            if(inputElement) inputElement.classList.add('error');
                            errorsFound++;
                        } else {
                            correctCells++;
                        }
                    } else {
                        isFull = false; // Found an empty, user-editable cell
                    }
                } else if (cellElement && cellElement.classList.contains('readonly')) {
                    // For readonly cells, ensure they are part of the initial puzzle
                    if (initialPuzzle[r][c] === Sudoku.EMPTY_CELL) isFull = false;
                } else { // Should not happen if board is rendered correctly
                    isFull = false;
                }
            }
        }

        if (errorsFound > 0) {
            UI.showMessage(`${errorsFound} error(s) found. Keep trying!`, 'error', 3000);
        } else if (totalFilledByUser === 0 && !Sudoku.isBoardFull(initialPuzzle)) { // Check if puzzle wasn't just empty
            UI.showMessage('Board is empty. Fill in some numbers first!', 'info', 3000);
        } else if (isFull && errorsFound === 0) { // If board is full and no errors found
             UI.showMessage('Congratulations! Puzzle Solved!', 'success');
             UI.setBoardDisabled(true);
        } else if (errorsFound === 0 && totalFilledByUser > 0 && !isFull){
            UI.showMessage('No errors in filled cells, but the puzzle is not complete.', 'info', 3000);
        } else if (errorsFound === 0 && totalFilledByUser === 0 && Sudoku.isBoardFull(initialPuzzle)) {
            // This case is unlikely (an entirely pre-filled solvable board)
            UI.showMessage('This puzzle seems to be already solved or fully pre-filled!', 'info');
        }
    }
    
    function handlePaletteClick(number) {
        if (selectedCell.element && selectedCell.inputElement) {
            selectedCell.inputElement.value = (number === Sudoku.EMPTY_CELL) ? '' : number.toString();
            const event = new Event('input', { bubbles: true, cancelable: true });
            selectedCell.inputElement.dispatchEvent(event);
        } else if (selectedCell.element && selectedCell.element.classList.contains('readonly')) {
            // If a readonly cell is selected, perhaps highlight numbers matching palette click?
            // For now, do nothing or provide a small message.
            // UI.showMessage("Cannot change pre-filled numbers.", "info", 1500);
        }
    }

    UI.init(handlePaletteClick);

    newGameBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    validateBtn.addEventListener('click', validateUserSolution);
    // solveBtn.addEventListener('click', solvePuzzle); // Removed
    difficultySelect.addEventListener('change', startGame);

    startGame();

    document.addEventListener('click', (event) => {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && !gameContainer.contains(event.target)) {
            // Click was outside the game container entirely
            clearSelection();
        } else if (selectedCell.element && !selectedCell.element.contains(event.target)) {
            // Click was inside game container but outside the currently selected cell
            // Let palette clicks be handled by their own listeners
            const palette = document.getElementById('numberPalette');
            const controls = document.querySelector('.header-controls');
            const belowControls = document.querySelector('.below-board-controls');
            
            let clickedOnControl = false;
            if (palette && palette.contains(event.target)) clickedOnControl = true;
            if (controls && controls.contains(event.target)) clickedOnControl = true;
            if (belowControls && belowControls.contains(event.target)) clickedOnControl = true;

            if (!clickedOnControl) {
                 clearSelection();
            }
        }
    });
});
