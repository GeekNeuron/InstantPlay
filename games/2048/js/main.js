// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    if (!gridContainer) {
        console.error("Error: Grid container element not found in the DOM!");
        return;
    }

    const grid = new Grid(gridContainer); // Grid size can be passed as a second argument
    const game = new Game(grid, 'score', 'best-score', 'game-over-modal', 'final-score');
    const inputManager = new InputManager(game);

    const newGameButton = document.getElementById('new-game-button');
    const restartGameButton = document.getElementById('restart-game-button');

    if (newGameButton) {
        newGameButton.addEventListener('click', () => {
            game.startNewGame();
        });
    }

    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            game.startNewGame();
        });
    }

    // Start the first game
    game.startNewGame();
});
