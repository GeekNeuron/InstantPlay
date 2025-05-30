// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    if (!gridContainer) {
        console.error("Error: Grid container element not found in the DOM!");
        return;
    }

    const grid = new Grid(gridContainer);
    const game = new Game(grid, 'score', 'best-score', 'game-over-modal', 'final-score');
    const inputManager = new InputManager(game);

    const newGameButton = document.getElementById('new-game-button');
    const restartGameButton = document.getElementById('restart-game-button');
    const themeSwitcherButton = document.getElementById('theme-switcher');

    if (newGameButton) {
        newGameButton.addEventListener('click', () => game.startNewGame());
    }
    if (restartGameButton) {
        // This button is inside the modal, modal visibility is handled by game.js
        restartGameButton.addEventListener('click', () => game.startNewGame());
    }

    // Theme Switcher Logic
    const storedTheme = localStorage.getItem('2048Theme');
    // Default to light theme if nothing is stored or if stored value is invalid
    const defaultTheme = 'light-theme';
    const currentTheme = (storedTheme === 'light-theme' || storedTheme === 'dark-theme') ? storedTheme : defaultTheme;
    
    document.body.className = ''; // Clear existing classes
    document.body.classList.add(currentTheme); // Apply stored theme or default

    if (themeSwitcherButton) {
        themeSwitcherButton.textContent = ''; // Icon is handled by CSS ::before

        themeSwitcherButton.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('dark-theme');
            const newTheme = isCurrentlyDark ? 'light-theme' : 'dark-theme';
            
            document.body.classList.remove(isCurrentlyDark ? 'dark-theme' : 'light-theme');
            document.body.classList.add(newTheme);
            localStorage.setItem('2048Theme', newTheme);
        });
    }
    
    // Start the first game
    game.startNewGame();
});
