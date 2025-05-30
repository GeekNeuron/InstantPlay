// js/app.js (Conceptual)
document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sudokuBoardElement = document.getElementById('sudokuBoard');

    let solutionBoard = [];
    let currentPuzzle = []; // The initial state of the puzzle (with 0s)
    let userBoard = [];     // The user's current progress
    let selectedCellElement = null;

    function startGame() {
        UI.clearMessage();
        const difficulty = difficultySelect.value;
        solutionBoard = Sudoku.generateSolution();
        currentPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = currentPuzzle.map(row => [...row]); // Deep copy for user interaction

        Board.render(sudokuBoardElement, userBoard, currentPuzzle, handleCellClick, handleCellInput);
        if(selectedCellElement) selectedCellElement.classList.remove('selected');
        selectedCellElement = null;
    }

    function handleCellClick(row, col, cellElement) {
        if (selectedCellElement) {
            selectedCellElement.classList.remove('selected');
        }
        // Only add 'selected' if it's not a readonly cell's text content itself (allow selecting inputs)
        if (!cellElement.classList.contains('readonly') || cellElement.querySelector('input')) {
             cellElement.classList.add('selected');
             selectedCellElement = cellElement;
        } else {
            selectedCellElement = null; // Don't keep non-input readonly cells selected
        }
    }

    function handleCellInput(row, col, value, cellElement) {
        userBoard[row][col] = value;
        cellElement.classList.remove('error'); // Clear previous error
        UI.clearMessage();

        if (value !== 0) { // Only validate if a number is entered
            if (!Sudoku.isMoveValid(userBoard, row, col, value)) {
                cellElement.classList.add('error');
                UI.showMessage('Invalid move!', 'error');
            } else {
                if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
                    UI.showMessage('Congratulations! Puzzle Solved!', 'success');
                    // Optionally disable board or show a modal
                }
            }
        }
    }

    function resetGame() {
        if (currentPuzzle.length === 0) return; // No game started
        UI.clearMessage();
        userBoard = currentPuzzle.map(row => [...row]);
        Board.render(sudokuBoardElement, userBoard, currentPuzzle, handleCellClick, handleCellInput);
        if(selectedCellElement) selectedCellElement.classList.remove('selected');
        selectedCellElement = null;
    }

    // Initialize
    UI.init();
    newGameBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    difficultySelect.addEventListener('change', startGame); // Start new game on difficulty change

    startGame(); // Start a game on page load
});
