// Import game modules (will be created later)
// import Game from './game.js';
// import { THEME_FILES } from './constants.js'; // Example

// DOM Elements
const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highscore');

// Theme paths (assuming they are in assets/css/)
const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};

let currentTheme = 'light'; // Default theme

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme); // Save theme preference
    console.log(`Theme changed to ${currentTheme}`);
}

/**
 * Loads the saved theme from localStorage or defaults to light.
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme && THEME_FILES[savedTheme]) {
        currentTheme = savedTheme;
    }
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
}

/**
 * Initializes the game.
 * This function will be expanded significantly.
 */
function initGame() {
    console.log("Initializing Snake Game...");
    loadTheme(); // Load theme preference on init

    // Event Listeners
    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
        themeToggleElement.addEventListener('touchend', (e) => { // For touch devices
            e.preventDefault(); // Prevent click event from firing immediately after
            toggleTheme();
        });
    } else {
        console.error("Theme toggle element not found!");
    }

    // Placeholder for actual game setup
    // const game = new Game(canvasElement, scoreDisplay, highScoreDisplay);
    // game.start();

    console.log("Game setup complete (placeholder). Canvas and UI elements are ready.");
    // Example: Get canvas (will be passed to Board or Game module)
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // Set initial canvas size (will be dynamic later)
        canvas.width = 400;
        canvas.height = 400;
        // const ctx = canvas.getContext('2d');
        // ctx.fillStyle = 'grey'; // Test fill
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log("Canvas ready.");
    } else {
        console.error("Canvas element not found!");
    }
}

// Start the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);
