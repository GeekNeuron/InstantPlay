// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameBtn = document.getElementById('newGameBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sudokuBoardElement = document.getElementById('sudokuBoard');
    const closeGameBtn = document.getElementById('closeGameBtn');
    const newGameFromWinBtn = document.getElementById('newGameFromWinBtn');
    const timerDisplayElement = document.getElementById('timerDisplay'); // For click listener

    // localStorage Keys
    const USER_BOARD_KEY = 'sudokuUserBoard_GN_v2'; // Incremented version
    const INITIAL_PUZZLE_KEY = 'sudokuInitialPuzzle_GN_v2';
    const SOLUTION_BOARD_KEY = 'sudokuSolutionBoard_GN_v2';
    const DIFFICULTY_KEY = 'sudokuDifficulty_GN_v2';
    const ELAPSED_TIME_KEY = 'sudokuElapsedTime_GN_v2';
    const GAME_HISTORY_KEY = 'sudokuGameHistory_GN_v1';

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
    const MAX_HISTORY_ITEMS = 30; // Limit history size

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
        stopTimer(); // Clear any existing interval
        elapsedTimeInSeconds = resumedTime;
        startTime = Date.now() - (elapsedTimeInSeconds * 1000);
        updateTimer(); // Update display immediately
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        // elapsedTimeInSeconds is already updated by updateTimer
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
            if (storedHistory) {
                gameHistory = JSON.parse(storedHistory);
            } else {
                gameHistory = [];
            }
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
        gameHistory.unshift({ difficulty, time: timeString, date: dateISOString }); // Add to beginning
        if (gameHistory.length > MAX_HISTORY_ITEMS) {
            gameHistory.pop(); // Remove oldest if limit exceeded
        }
        saveGameHistory();
    }
    
    function handleTimerClick() {
        UI.toggleGameHistory(undefined, gameHistory); // undefined toggles, pass current history
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

            if (savedUserBoard && savedInitialPuzzle && savedSolutionBoard) {
                userBoard = savedUserBoard;
                initialPuzzle = savedInitialPuzzle;
                solutionBoard = savedSolutionBoard;
                gameWon = false;
                UI.setBoardDisabled(false);
                Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
                UI.hideEndGameControls();
                
                const resumedTime = savedElapsedTime ? parseInt(savedElapsedTime, 10) : 0;
                startTimer(resumedTime); // Start timer with loaded time

                UI.showMessage("بازی قبلی بارگذاری شد.", "info", 2000);
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
        // Difficulty, Theme, and History are preserved
    }

    // --- Game Logic ---
    function startGame(forceNew = false) {
        UI.clearMessage();
        UI.hideEndGameControls();
        UI.setBoardDisabled(false);
        gameWon = false;
        resetTimer(); // Reset timer for any new game start scenario

        if (!forceNew && loadGameState()) {
            // Game was loaded, timer already started by loadGameState
            return;
        }
        
        const difficulty = UI.getSelectedDifficulty();
        solutionBoard = Sudoku.generateSolution();
        initialPuzzle = Sudoku.createPuzzle(solutionBoard, difficulty);
        userBoard = Utils.deepCopy2DArray(initialPuzzle);
        
        Board.render(sudokuBoardElement, userBoard, initialPuzzle, handleCellClick, handleCellInput);
        clearSelection();
        startTimer(); // Start timer from 0 for a brand new game
        saveGameState();
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
                    UI.showMessage("تبریک! شما برنده شدید!", 'success');
                    Board.highlightRelatedCells(row, col, userBoard);
                    UI.setBoardDisabled(true);
                    UI.showEndGameControls();
                    addGameToHistory(UI.getSelectedDifficulty(), elapsedTimeInSeconds, new Date().toISOString());
                    clearSavedBoardState();
                } else if (Sudoku.isBoardFull(userBoard)) {
                    UI.showMessage("بازی اشتباه است و تمام نشده. اعداد خود را بررسی کنید.", 'error', 5000);
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
        resetTimer(); // Reset timer
        startTimer(); // And start it for the reset puzzle
        saveGameState();
    }

    // --- Event Listeners & Initialization ---
    loadGameHistory(); // Load history at the very beginning
    UI.init(handleTimerClick); // Pass callback for timer click

    newGameBtn.addEventListener('click', () => startGame(true));
    resetBtn.addEventListener('click', resetGame);
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

    startGame(false); // Initial game load/start

    document.addEventListener('click', (event) => {
        if (gameWon && document.getElementById('endGameControls').style.display !== 'none') {
             // If game is won and end game controls are visible, don't clear selection for clicks outside board
            const endControls = document.getElementById('endGameControls');
            if (endControls && endControls.contains(event.target)) return; // Click on end game controls
        }
        if (UI.isHistoryVisible && document.getElementById('gameHistoryDropdown').style.display !== 'none') {
            // If history is visible, let UI module handle clicks outside
            return;
        }


        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && !gameContainer.contains(event.target)) {
            clearSelection();
        } else if (selectedCell.element && !selectedCell.element.contains(event.target)) {
            const controls = document.querySelector('.header-controls');
            // Check if click is on timer itself, if so, history toggle will handle it
            if (timerDisplayElement && timerDisplayElement.contains(event.target)) return;
            
            let clickedOnControl = false;
            if (controls && controls.contains(event.target)) clickedOnControl = true;

            if (!clickedOnControl) {
                 clearSelection();
            }
        }
    });

    window.addEventListener('beforeunload', () => {
        if (!gameWon) { // Only save if game is in progress
            saveGameState();
        }
    });
});
