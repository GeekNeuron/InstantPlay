// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    if (!gridContainer) {
        console.error("Error: Grid container element not found in the DOM!");
        return;
    }

    const grid = new Grid(gridContainer);
    const game = new Game(grid, 'score', 'best-score', 'game-over-modal', 'final-score');
    const inputManager = new InputManager(game); // Assuming InputManager is defined elsewhere

    const newGameButton = document.getElementById('new-game-button');
    const restartGameButton = document.getElementById('restart-game-button');
    const themeSwitcherButton = document.getElementById('theme-switcher');

    if (newGameButton) {
        newGameButton.addEventListener('click', () => game.startNewGame());
    }
    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => game.startNewGame());
    }

    // Theme Switcher Logic
    const currentTheme = localStorage.getItem('2048Theme') || 'light-theme';
    document.body.className = currentTheme; // Apply stored theme or default
    if (themeSwitcherButton) {
        themeSwitcherButton.textContent = currentTheme === 'dark-theme' ? '☀️ Light Mode' : '🌙 Dark Mode';

        themeSwitcherButton.addEventListener('click', () => {
            if (document.body.classList.contains('light-theme')) {
                document.body.classList.replace('light-theme', 'dark-theme');
                themeSwitcherButton.textContent = '☀️ Light Mode';
                localStorage.setItem('2048Theme', 'dark-theme');
            } else {
                document.body.classList.replace('dark-theme', 'light-theme');
                themeSwitcherButton.textContent = '🌙 Dark Mode';
                localStorage.setItem('2048Theme', 'light-theme');
            }
        });
    }
    
    // Start the first game
    game.startNewGame();
});
