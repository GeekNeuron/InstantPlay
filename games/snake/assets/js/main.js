// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS } from './constants.js'; // Import difficulty constants

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const difficultySelectElement = document.getElementById('difficulty-select'); // Get difficulty select element

let gameInstance = null; // To hold the game instance

const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
let currentTheme = 'light';

function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme && THEME_FILES[savedTheme]) {
        currentTheme = savedTheme;
    }
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
}

/**
 * Populates the difficulty dropdown menu.
 */
function populateDifficultyOptions() {
    if (difficultySelectElement) {
        for (const levelKey in DIFFICULTY_LEVELS) {
            const levelValue = DIFFICULTY_LEVELS[levelKey]; // e.g., 'BEGINNER'
            const levelDisplayName = DIFFICULTY_SETTINGS[levelValue]?.name || levelValue; // Use defined name or key
            
            const option = document.createElement('option');
            option.value = levelValue;
            option.textContent = levelDisplayName;
            difficultySelectElement.appendChild(option);
        }
        // Set default selection from localStorage or constants
        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
            difficultySelectElement.value = savedDifficulty;
        } else {
            difficultySelectElement.value = DIFFICULTY_LEVELS.MEDIUM; // Default if nothing saved
        }
    }
}

/**
 * Handles changes in the difficulty selection.
 * @param {Event} event - The change event from the select element.
 */
function handleDifficultyChange(event) {
    const selectedDifficulty = event.target.value;
    if (gameInstance && typeof gameInstance.setDifficulty === 'function') {
        gameInstance.setDifficulty(selectedDifficulty);
        localStorage.setItem('snakeGameDifficulty', selectedDifficulty); // Save preference
        // The game.setDifficulty method should handle resetting the game if needed.
    }
}

function initGame() {
    loadTheme();
    populateDifficultyOptions(); // Populate difficulty options

    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
        themeToggleElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    } else {
        console.error("Theme toggle element ('page-title-clickable') not found!");
    }

    if (difficultySelectElement) {
        difficultySelectElement.addEventListener('change', handleDifficultyChange);
    } else {
        console.error("Difficulty select element ('difficulty-select') not found!");
    }

    try {
        const initialDifficulty = difficultySelectElement ? difficultySelectElement.value : DIFFICULTY_LEVELS.MEDIUM;
        gameInstance = new Game(
            'gameCanvas',
            'score',
            'highscore',
            'combo-display',
            null, // messageOverlayId
            initialDifficulty // Pass initial difficulty to game constructor
        );
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const gameContainer = document.querySelector('.page-wrapper') || document.body;
        gameContainer.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initGame);
