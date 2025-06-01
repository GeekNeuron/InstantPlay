// assets/js/main.js

import { Game } from './game.js';

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');

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
    localStorage.setItem('snakeGameTheme', currentTheme);
    // console.log(`Theme changed to ${currentTheme}`);
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
 */
function initGame() {
    // console.log("Initializing Snake Game...");
    loadTheme(); // Load theme preference on init

    // Event Listeners for theme toggle
    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
        themeToggleElement.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent click event from firing immediately after
            toggleTheme();
        });
    } else {
        console.error("Theme toggle element ('page-title-clickable') not found!");
    }

    // --- Initialize the Game ---
    try {
        // Pass IDs of HTML elements for score, high score, and combo display
        const gameInstance = new Game(
            'gameCanvas',
            'score',
            'highscore',
            'combo-display', // ID for the combo display span
            null             // Pass null for messageOverlayId if not using the modal overlay from HTML for game messages
        );
        // console.log("Game instance created successfully.");
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console. <br>Make sure canvas and score elements exist in HTML.</p>`;
        }
    }
}

// Start the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);
