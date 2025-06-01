// assets/js/main.js

import { Game } from './game.js';
// --- DIFFICULTY_LEVELS و DIFFICULTY_SETTINGS برای پر کردن منو و ارسال به Game استفاده می‌شوند ---
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS } from './constants.js';
import { populateLegend } from './legend.js';

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const difficultySelectElement = document.getElementById('difficulty-select');

let gameInstance = null;

const THEME_FILES = { /* ... as before ... */ };
let currentTheme = 'light';

function toggleTheme() { /* ... as before ... */ }
function loadTheme() { /* ... as before ... */ }

/**
 * Populates the difficulty dropdown menu with Easy, Medium, Hard.
 */
function populateDifficultyOptions() {
    if (difficultySelectElement) {
        difficultySelectElement.innerHTML = ''; // Clear existing options

        // Iterate through the simplified DIFFICULTY_LEVELS enum/object
        for (const levelKey in DIFFICULTY_LEVELS) { // e.g., EASY, MEDIUM, HARD
            const levelValue = DIFFICULTY_LEVELS[levelKey]; // The string value like 'EASY'
            const levelDisplayName = DIFFICULTY_SETTINGS[levelValue]?.name || levelValue; // Get "Easy" from settings

            const option = document.createElement('option');
            option.value = levelValue; // Store the key, e.g., 'EASY'
            option.textContent = levelDisplayName; // Display "Easy"
            difficultySelectElement.appendChild(option);
        }

        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        // Check if savedDifficulty is one of the valid new keys
        if (savedDifficulty && DIFFICULTY_LEVELS[savedDifficulty]) {
            difficultySelectElement.value = savedDifficulty;
        } else {
            // Default to Medium if saved value is invalid or not found
            difficultySelectElement.value = DIFFICULTY_LEVELS.MEDIUM;
            localStorage.setItem('snakeGameDifficulty', DIFFICULTY_LEVELS.MEDIUM); // Save default
        }
    }
}

function handleDifficultyChange(event) {
    const selectedDifficultyKey = event.target.value; // This will be 'EASY', 'MEDIUM', or 'HARD'
    if (gameInstance && typeof gameInstance.setDifficulty === 'function') {
        gameInstance.setDifficulty(selectedDifficultyKey);
        localStorage.setItem('snakeGameDifficulty', selectedDifficultyKey);
    }
}

function initGame() {
    loadTheme();
    populateDifficultyOptions(); // Populate with new difficulty levels
    populateLegend();

    if (themeToggleElement) { /* ... theme listener ... */ }
    if (difficultySelectElement) {
        difficultySelectElement.addEventListener('change', handleDifficultyChange);
    } else {
        console.error("Difficulty select element ('difficulty-select') not found!");
    }

    try {
        const initialDifficultyKey = difficultySelectElement ? difficultySelectElement.value : DIFFICULTY_LEVELS.MEDIUM;
        gameInstance = new Game(
            'gameCanvas', 'score', 'highscore',
            'combo-display', null, initialDifficultyKey // Pass the key like 'MEDIUM'
        );
    } catch (error) { /* ... error handling ... */ }
}

document.addEventListener('DOMContentLoaded', initGame);
