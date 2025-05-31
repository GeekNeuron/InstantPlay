// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const checkSolutionBtn = document.getElementById('checkSolutionBtn'); // New Button
    const sudokuBoardElement = document.getElementById('sudokuBoard');
    const closeGameBtn = document.getElementById('closeGameBtn');
    const newGameFromWinBtn = document.getElementById('newGameFromWinBtn');
    const timerDisplayElement = document.getElementById('timerDisplay');

    // localStorage Keys
    const APP_PREFIX = 'geekNeuronSudoku_';
    const USER_BOARD_KEY = `${APP_PREFIX}userBoard_v2`;
    const INITIAL_PUZZLE_KEY = `${APP_PREFIX}initialPuzzle_v2`;
    const SOLUTION_BOARD_KEY = `${APP_PREFIX}solutionBoard_v2`;
    const DIFFICULTY_KEY = `${APP_PREFIX}difficulty_v2`;
    const ELAPSED_TIME_KEY = `${APP_PREFIX}elapsedTime_v2`;
    const GAME_HISTORY_KEY = `${APP_PREFIX}gameHistory_v1`;

    // Game State Variables
    let solutionBoard = [];
    let initialPuzzle = [];
    let userBoard = [];
    let selectedCell = { row: -1, col: -1, element: null, inputElement: null };
    let gameWon = false;

    // Timer Variables
    let timerInterval = null;
    let startTime = 0;
    let elapsedTimeInSeconds = 0;

    // Game History
    let gameHistory = [];
    const MAX_HISTORY_ITEMS = 30;

    // --- Timer Functions ---
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateTimer() {
        const now = Date.now();
        elapsedTimeInSeconds = Math.floor((now - startTime) / 1000);
        UI.updateTimerDisplay(formatTime(elapsedTimeInSeconds));
    }

    function startTimer(resumedTime = 0) {
        stopTimer();
        elapsedTimeInSeconds = resumedTime;
        startTime = Date.now() - (elapsedTimeInSeconds * 1000);
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        stopTimer();
        elapsedTimeInSeconds = 0;
        UI.updateTimerDisplay(formatTime(0));
    }

    // --- Game History Functions ---
    function loadGameHistory() {
        try {
            const storedHistory = localStorage.getItem(GAME_HISTORY_KEY);
            gameHistory = storedHistory ? JSON.parse(storedHistory) : [];
        } catch (e) {
            console.error("Error loading game history:", e);
            gameHistory = [];
        }
    }

    function saveGameHistory() {
        try {
            localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory));
        } catch (e) {
            console.error("Error saving game history:", e);
        }
    }

    function addGameToHistory(difficulty, timeInSeconds, dateISOString) {
        const timeString = formatTime(timeInSeconds);
        gameHistory.unshift({ difficulty, time: timeString, date: dateISOString });
        if (gameHistory.length > MAX_HISTORY_ITEMS) {
            gameHistory.pop();
        }
        saveGameHistory();
    }
    
    function handleTimerClick() {
        UI.toggleGameHistory(undefined, [...gameHistory]); 
    }

    // --- Game State Management ---
    function saveGameState() {
        if (gameWon) return;
        try {
            localStorage.setItem(USER_BOARD_KEY, JSON.stringify(userBoard));
            localStorage.setItem(INITIAL_PUZZLE_KEY, JSON.stringify(initialPuzzle));
            localStorage.setItem(SOLUTION_BOARD_KEY, JSON.stringify(solutionBoard));
            localStorage.setItem(DIFFICULTY_KEY, UI.getSelectedDifficulty());
            localStorage.setItem(ELAPSED_TIME_KEY, elapsedTimeInSeconds.toString());
        } catch (e) {
            console.error("Error saving game state:", e);
            UI.showMessage("Could not save game progress.", "error", 3000);
        }
    }

    function loadGameState() {
        try {
            const savedDifficulty = localStorage.getItem(DIFFICULTY_KEY);
            const savedUserBoard = JSON.parse(localStorage.getItem(USER_BOARD_KEY));
            const savedInitialPuzzle = JSON.parse(localStorage.getItem(INITIAL_PUZZLE_KEY));
            const savedSolutionBoard = JSON.parse(localStorage.getItem(SOLUTION_BOARD_KEY));
            const savedElapsedTime = localStorage.getItem(ELAPSED_TIME_KEY);

            if (savedDifficulty) UI.setSelectedDifficulty(savedDifficulty);

            if (savedUserBoard && savedInitialPuzzle && savedSolutionBoard &&
                savedUserBoard.length === Sudoku.GRID_SIZE &&
                savedInitialPuzzle.length === Sudoku.GRID_SIZE &&
                savedSolutionBoard.length === Sudoku.GRID_SIZE) {
                
                userBoard = savedUserBoard;
                initialPuzzle = savedInitialPuzzle;
                solutionBoard = savedSolutionBoard;
                gameWon = false;
                UI.setBoardDisabled(false);
                Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
                UI.hideEndGameControls();
                
                const resumedTime = savedElapsedTime ? parseInt(savedElapsedTime, 10) : 0;
                startTimer(resumedTime);

                UI.showMessage("Previous game loaded.", "info", 2000);
                return true;
            }
        } catch (e) {
            console.error("Error loading game state:", e);
            clearSavedBoardState();
        }
        return false;
    }

    function clearSavedBoardState() {
        localStorage.removeItem(USER_BOARD_KEY);
        localStorage.removeItem(INITIAL_PUZZLE_KEY);
        localStorage.removeItem(SOLUTION_BOARD_KEY);
        localStorage.removeItem(ELAPSED_TIME_KEY);
    }

    // --- Game Logic ---
    function startGame(forceNew = false) {
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(false);
        gameWon = false;
        resetTimer();

        if (!forceNew && loadGameState()) {
            return;
        }
        
        const difficulty = UI.getSelectedDifficulty();
        solutionBoard = Sudoku.generateSolution();
        initialPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        startTimer();
        saveGameState();
    }

    function handleCellClick(row, col, cellElement, inputElement) {
        if (gameWon) return;
        selectedCell = { row, col, element: cellElement, inputElement };
        Board.highlightRelatedCells(row, col, userBoard);
    }
    
    function clearSelection() {
        if (gameWon) return;
        if (UI.getIsHistoryVisible()) return;

        if (selectedCell.element || selectedCell.inputElement) {
            Board.clearAllHighlights();
        }
        selectedCell = { row: -1, col: -1, element: null, inputElement: null };
    }

    function handleCellInput(row, col, value, cellElement, inputElement) {
        if (gameWon) return;

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
                    stopTimer();
                    UI.showMessage("Congratulations! You won!", 'success');
                    Board.highlightRelatedCells(row, col, userBoard);
                    UI.setBoardDisabled(true);
                    UI.showEndGameControls();
                    addGameToHistory(UI.getSelectedDifficulty(), elapsedTimeInSeconds, new Date().toISOString());
                    clearSavedBoardState();
                } else if (Sudoku.isBoardFull(userBoard)) {
                    UI.showMessage("The board is full but incorrect. Please check your numbers or use 'Check Solution'.", 'error', 5000);
                }
            }
        }
        if (!gameWon) {
            saveGameState();
        }
        Board.highlightRelatedCells(row, col, userBoard);
    }

    function resetGame() {
        if (initialPuzzle.length === 0) {
            UI.showMessage("Start a new game first.", "info", 2000);
            return;
        }
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(false);
        gameWon = false;
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        resetTimer();
        startTimer();
        saveGameState();
        UI.showMessage("Game reset to its initial state.", "info", 2000);
    }

    /**
     * Validates the user's current board state and highlights errors.
     */
    function validateUserSolution() {
        if (gameWon || userBoard.length === 0) {
            UI.showMessage("Start or continue a game to check your solution.", "info", 3000);
            return;
        }
        UI.clearMessage();
        let errorsFound = 0;
        let filledCells = 0;

        for (let r = 0; r < Sudoku.GRID_SIZE; r++) {
            for (let c = 0; c < Sudoku.GRID_SIZE; c++) {
                const cellElement = Board.getCellElement(r, c);
                if (cellElement && !cellElement.classList.contains('readonly')) {
                    // Clear previous error state for this cell before re-validating
                    Board.updateCellDisplay(r, c, userBoard[r][c], false); 
                    
                    if (userBoard[r][c] !== Sudoku.EMPTY_CELL) {
                        filledCells++;
                        // Check if the number placed by user is correct according to the solution
                        if (userBoard[r][c] !== solutionBoard[r][c]) {
                            Board.updateCellDisplay(r, c, userBoard[r][c], true); // Mark as error
                            errorsFound++;
                        }
                        // Also, re-check general Sudoku rule validity for this cell, 
                        // as user might have created a new conflict that wasn't there before.
                        // This part is tricky because isMoveValid checks against the *current* board state.
                        // The primary check should be against the solutionBoard for correctness.
                        // If you want to highlight rule violations (e.g. two 5s in a row *placed by user*):
                        else if (!Sudoku.isMoveValid(userBoard, r, c, userBoard[r][c])) {
                            Board.updateCellDisplay(r, c, userBoard[r][c], true); // Mark as error
                            errorsFound++;
                        }

                    }
                }
            }
        }

        if (errorsFound > 0) {
            UI.showMessage(`${errorsFound} error(s) found. Keep trying!`, 'error', 3000);
        } else if (filledCells === 0) {
            UI.showMessage('Board is empty. Fill in some numbers to check.', 'info', 3000);
        } else if (Sudoku.isBoardSolved(userBoard, solutionBoard)) {
            // This case should ideally be caught by the win condition in handleCellInput
            UI.showMessage("Congratulations! You've solved it!", 'success');
            gameWon = true;
            stopTimer();
            UI.setBoardDisabled(true);
            UI.showEndGameControls();
            addGameToHistory(UI.getSelectedDifficulty(), elapsedTimeInSeconds, new Date().toISOString());
            clearSavedBoardState();
        } else if (Sudoku.isBoardFull(userBoard) && errorsFound === 0) {
            // This implies the board is full, no direct errors found against solution,
            // but isBoardSolved returned false. This is an edge case, likely means
            // isBoardSolved is the ultimate truth.
             UI.showMessage("Board is full, and no direct errors found, but it's not the solution.", 'info', 4000);
        }
         else {
            UI.showMessage('No errors found in your current entries. Keep going!', 'info', 3000);
        }
        // Re-highlight based on selected cell after validation
        if(selectedCell.element) {
            Board.highlightRelatedCells(selectedCell.row, selectedCell.col, userBoard);
        }
    }


    // --- Event Listeners & Initialization ---
    loadGameHistory();
    UI.init(handleTimerClick);

    newGameBtn.addEventListener('click', () => startGame(true));
    resetBtn.addEventListener('click', resetGame);
    checkSolutionBtn.addEventListener('click', validateUserSolution); // Listener for new button
    difficultySelect.addEventListener('change', () => startGame(true));

    closeGameBtn.addEventListener('click', () => {
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(true);
    });

    newGameFromWinBtn.addEventListener('click', () => {
        UI.hideEndGameControls();
        startGame(true);
    });

    startGame(false);

    document.addEventListener('click', (event) => {
        if (gameWon && document.getElementById('endGameControls').style.display !== 'none') {
            const endControls = document.getElementById('endGameControls');
            if (endControls && endControls.contains(event.target)) return;
        }
        if (UI.getIsHistoryVisible() && document.getElementById('gameHistoryDropdown').style.display !== 'none') {
            return;
        }

        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && !gameContainer.contains(event.target)) {
            if (!UI.getIsHistoryVisible()) {
                 clearSelection();
            }
        } else if (selectedCell.element && !selectedCell.element.contains(event.target)) {
            const controls = document.querySelector('.header-controls-wrapper'); // Updated selector
            const endControls = document.getElementById('endGameControls');
            
            let clickedOnControl = false;
            if (controls && controls.contains(event.target)) clickedOnControl = true;
            if (endControls && endControls.style.display !== 'none' && endControls.contains(event.target)) clickedOnControl = true;

            if (!clickedOnControl && !UI.getIsHistoryVisible()) {
                 clearSelection();
            }
        }
    });

    window.addEventListener('beforeunload', () => {
        if (!gameWon) {
            saveGameState();
        }
    });
});
