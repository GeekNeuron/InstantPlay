// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sudokuBoardElement = document.getElementById('sudokuBoard');
    const closeGameBtn = document.getElementById('closeGameBtn');
    const newGameFromWinBtn = document.getElementById('newGameFromWinBtn');

    // localStorage Keys
    const USER_BOARD_KEY = 'sudokuUserBoard_GN_v1';
    const INITIAL_PUZZLE_KEY = 'sudokuInitialPuzzle_GN_v1';
    const SOLUTION_BOARD_KEY = 'sudokuSolutionBoard_GN_v1';
    const DIFFICULTY_KEY = 'sudokuDifficulty_GN_v1';

    // Game State Variables
    let solutionBoard = [];
    let initialPuzzle = [];
    let userBoard = [];
    let selectedCell = { row: -1, col: -1, element: null, inputElement: null };
    let gameWon = false; // Flag to track if the current game has been won

    // --- Game State Management ---
    function saveGameState() {
        if (gameWon) return; // Don't save a completed game state to be reloaded as "in-progress"
        try {
            localStorage.setItem(USER_BOARD_KEY, JSON.stringify(userBoard));
            localStorage.setItem(INITIAL_PUZZLE_KEY, JSON.stringify(initialPuzzle));
            localStorage.setItem(SOLUTION_BOARD_KEY, JSON.stringify(solutionBoard));
            localStorage.setItem(DIFFICULTY_KEY, UI.getSelectedDifficulty());
        } catch (e) {
            console.error("Error saving game state to localStorage:", e);
            UI.showMessage("Could not save game progress.", "error", 3000);
        }
    }

    function loadGameState() {
        try {
            const savedDifficulty = localStorage.getItem(DIFFICULTY_KEY);
            const savedUserBoard = JSON.parse(localStorage.getItem(USER_BOARD_KEY));
            const savedInitialPuzzle = JSON.parse(localStorage.getItem(INITIAL_PUZZLE_KEY));
            const savedSolutionBoard = JSON.parse(localStorage.getItem(SOLUTION_BOARD_KEY));

            if (savedDifficulty) {
                UI.setSelectedDifficulty(savedDifficulty);
            }

            if (savedUserBoard && savedInitialPuzzle && savedSolutionBoard &&
                savedUserBoard.length === Sudoku.GRID_SIZE &&
                savedInitialPuzzle.length === Sudoku.GRID_SIZE &&
                savedSolutionBoard.length === Sudoku.GRID_SIZE) {
                
                userBoard = savedUserBoard;
                initialPuzzle = savedInitialPuzzle;
                solutionBoard = savedSolutionBoard;
                gameWon = false; // Reset win flag when loading a game
                UI.setBoardDisabled(false);
                Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
                UI.hideEndGameControls(); // Ensure end game controls are hidden
                UI.showMessage("Game loaded.", "info", 2000);
                return true; // Game loaded successfully
            }
        } catch (e) {
            console.error("Error loading game state from localStorage:", e);
            // Clear potentially corrupted data
            clearSavedGameState(false); // Don't clear difficulty/theme here
        }
        return false; // No valid game state found
    }

    function clearSavedBoardState() { // Clears only board related data
        localStorage.removeItem(USER_BOARD_KEY);
        localStorage.removeItem(INITIAL_PUZZLE_KEY);
        localStorage.removeItem(SOLUTION_BOARD_KEY);
        // Difficulty and Theme are preserved
    }


    // --- Game Logic ---
    function startGame(forceNew = false) {
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(false);
        gameWon = false;

        if (!forceNew && loadGameState()) {
            // Game was loaded, exit here
            return;
        }
        
        // If no saved game or forceNew is true, start a fresh game
        const difficulty = UI.getSelectedDifficulty();
        solutionBoard = Sudoku.generateSolution();
        initialPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        saveGameState(); // Save the new game state
    }

    function handleCellClick(row, col, cellElement, inputElement) {
        if (gameWon) return;
        selectedCell = { row, col, element: cellElement, inputElement };
        Board.highlightRelatedCells(row, col, userBoard);
    }
    
    function clearSelection() {
        if (gameWon) return;
        if (selectedCell.element || selectedCell.inputElement) {
            Board.clearAllHighlights();
        }
        selectedCell = { row: -1, col: -1, element: null, inputElement: null };
    }

    function handleCellInput(row, col, value, cellElement, inputElement) {
        if (gameWon) return; // Prevent input if game already won

        userBoard[row][col] = value;
        cellElement.dataset.value = value;

        cellElement.classList.remove('error');
        if(inputElement) {
            inputElement.classList.remove('error');
            inputElement.style.borderColor = ''; 
        }
        UI.clearMessage();

        if (value !== Sudoku.EMPTY_CELL) {
            if (!Sudoku.isMoveValid(userBoard, row, col, value)) {
                cellElement.classList.add('error');
                if(inputElement) inputElement.classList.add('error');
            } else {
                if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
                    gameWon = true;
                    UI.showMessage("تبریک! شما برنده شدید!", 'success'); // Congratulations! You won!
                    Board.highlightRelatedCells(row, col, userBoard); // Final highlight
                    UI.setBoardDisabled(true);
                    UI.showEndGameControls();
                    clearSavedBoardState(); // Clear the board state so it doesn't reload a solved game
                } else if (Sudoku.isBoardFull(userBoard)) {
                    // This condition is met when the board is full BUT NOT solved
                    UI.showMessage("بازی اشتباه است و تمام نشده. اعداد خود را بررسی کنید.", 'error', 5000); // The game is incorrect and not finished. Check your numbers.
                }
            }
        }
        if (!gameWon) { // Only save if game is not yet won
            saveGameState();
        }
        Board.highlightRelatedCells(row, col, userBoard); // Re-highlight based on new board state
    }

    function resetGame() {
        if (initialPuzzle.length === 0) {
            UI.showMessage("ابتدا یک بازی جدید شروع کنید.", "info", 2000);
            return;
        }
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(false);
        gameWon = false;
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        saveGameState(); // Save the reset state
    }

    // --- Event Listeners ---
    UI.init(); // Initialize UI (Theme, etc.)

    newGameBtn.addEventListener('click', () => startGame(true)); // Force new game
    resetBtn.addEventListener('click', resetGame);
    difficultySelect.addEventListener('change', () => startGame(true)); // Force new game on difficulty change

    closeGameBtn.addEventListener('click', () => {
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(true); // Keep board disabled
    });

    newGameFromWinBtn.addEventListener('click', () => {
        UI.hideEndGameControls();
        // clearSavedBoardState(); // Already cleared when game was won
        startGame(true); // Start a new game
    });

    // Load game state or start a new game on page load
    startGame(false); // Try to load game, if fails, starts new

    document.addEventListener('click', (event) => {
        if (gameWon) return; // Don't clear selection if game is won and controls are shown

        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && !gameContainer.contains(event.target)) {
            clearSelection();
        } else if (selectedCell.element && !selectedCell.element.contains(event.target)) {
            const controls = document.querySelector('.header-controls');
            const endControls = document.getElementById('endGameControls');
            
            let clickedOnControl = false;
            if (controls && controls.contains(event.target)) clickedOnControl = true;
            if (endControls && endControls.style.display !== 'none' && endControls.contains(event.target)) clickedOnControl = true;


            if (!clickedOnControl) {
                 clearSelection();
            }
        }
    });

    // Optional: Save game state on page unload/hide for better persistence
    // window.addEventListener('beforeunload', saveGameState);
    // document.addEventListener('visibilitychange', () => {
    //     if (document.visibilityState === 'hidden') {
    //         saveGameState();
    //     }
    // });
});
