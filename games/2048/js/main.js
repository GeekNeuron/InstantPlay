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
        restartGameButton.addEventListener('click', () => game.startNewGame());
    }

    // Theme Switcher Logic
    const storedTheme = localStorage.getItem('2048Theme');
    const defaultTheme = 'light-theme';
    const currentTheme = (storedTheme === 'light-theme' || storedTheme === 'dark-theme') ? storedTheme : defaultTheme;
    
    document.body.className = ''; 
    document.body.classList.add(currentTheme); 

    if (themeSwitcherButton) {
        themeSwitcherButton.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('dark-theme');
            const newTheme = isCurrentlyDark ? 'light-theme' : 'dark-theme';
            
            document.body.classList.remove(isCurrentlyDark ? 'dark-theme' : 'light-theme');
            document.body.classList.add(newTheme);
            localStorage.setItem('2048Theme', newTheme);
        });
    }

    // Disable context menu (right-click) unless Shift key is pressed
    // or if the target is an input/textarea (e.g., for dev tools)
    window.addEventListener('contextmenu', function (e) {
        const targetNodeName = e.target.nodeName.toUpperCase();
        if (e.shiftKey || targetNodeName === 'INPUT' || targetNodeName === 'TEXTAREA' || e.target.isContentEditable) {
            return; // Allow context menu
        }
        e.preventDefault();
    }, false);
    
    game.startNewGame();
});
