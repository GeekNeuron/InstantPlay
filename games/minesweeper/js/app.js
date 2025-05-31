// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const gameTitleElement = document.getElementById('game-title');
    const bodyElement = document.body;
    const difficultySelectElement = document.getElementById('difficulty');
    const newGameButtonElement = document.getElementById('new-game-button');
    const gameBoardElement = document.getElementById('game-board');
    const minesCountElement = document.getElementById('mines-count');
    const timerElement = document.getElementById('timer');

    // Modal elements
    const messageModalElement = document.getElementById('message-modal');
    const messageTitleElement = document.getElementById('message-title');
    const messageTextElement = document.getElementById('message-text');
    const messageCloseButtonElement = document.getElementById('message-close-button');

    let gameInstance = null;

    // --- Theme Management ---
    function applyTheme(theme) {
        bodyElement.className = theme; // Removes all classes and adds the specified one
        localStorage.setItem('minesweeperTheme', theme);
    }

    function toggleTheme() {
        const currentTheme = bodyElement.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
        const newTheme = (currentTheme === 'light-theme') ? 'dark-theme' : 'light-theme';
        applyTheme(newTheme);
    }

    // Load saved theme or default to light-theme
    const savedTheme = localStorage.getItem('minesweeperTheme') || 'light-theme';
    applyTheme(savedTheme);

    if (gameTitleElement) {
        gameTitleElement.addEventListener('click', toggleTheme);
    }

    // --- Game Initialization ---
    function getDifficultySettings(difficultyValue) {
        switch (difficultyValue) {
            case 'beginner': return { rows: 8, cols: 8, mines: 10 };
            case 'easy': return { rows: 10, cols: 10, mines: 15 };
            case 'medium': return { rows: 16, cols: 16, mines: 40 };
            case 'hard': return { rows: 16, cols: 30, mines: 99 }; // Standard "Expert"
            case 'huge': return { rows: 24, cols: 24, mines: 120 };
            case 'extreme': return { rows: 30, cols: 30, mines: 200 };
            default: return { rows: 10, cols: 10, mines: 15 }; // Default to easy
        }
    }

    function startNewGame() {
        if (gameInstance) {
            gameInstance.destroy(); // Clean up previous game instance if any
        }
        const settings = getDifficultySettings(difficultySelectElement.value);
        
        // Pass UI update callbacks to the Game class
        gameInstance = new Game(
            settings.rows,
            settings.cols,
            settings.mines,
            gameBoardElement,
            (count) => { minesCountElement.textContent = count; },
            (time) => { timerElement.textContent = time; },
            showGameMessage // Pass the message function
        );
        gameInstance.setupGame();
        // Board container size update is handled by CSS and grid's own sizing
    }
    

    // --- Modal Message Handling ---
    function showGameMessage(title, message, isGameOver = false) {
        messageTitleElement.textContent = title;
        messageTextElement.textContent = message;
        messageModalElement.classList.add('show');
        // if (isGameOver) {
        //     // Optionally, change button text or add more buttons for game over
        // }
    }

    if (messageCloseButtonElement) {
        messageCloseButtonElement.addEventListener('click', () => {
            messageModalElement.classList.remove('show');
        });
    }
    // Close modal on escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && messageModalElement.classList.contains('show')) {
            messageModalElement.classList.remove('show');
        }
    });


    // --- Event Listeners ---
    if (difficultySelectElement) {
        difficultySelectElement.addEventListener('change', startNewGame);
    }
    if (newGameButtonElement) {
        newGameButtonElement.addEventListener('click', startNewGame);
    }

    // Initialize the first game
    startNewGame();

    // Adjust tile sizes on window resize for better responsiveness
    window.addEventListener('resize', () => {
        if (gameInstance && gameInstance.grid) {
            gameInstance.grid.updateTileSizes();
        }
    });
});
