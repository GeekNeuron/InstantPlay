// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS } from './constants.js';
import { populateLegend } from './legend.js'; // Import populateLegend

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const difficultySelectElement = document.getElementById('difficulty-select');

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

function populateDifficultyOptions() {
    if (difficultySelectElement) {
        difficultySelectElement.innerHTML = ''; // Clear existing options
        for (const levelKey in DIFFICULTY_LEVELS) {
            const levelValue = DIFFICULTY_LEVELS[levelKey];
            const levelDisplayName = DIFFICULTY_SETTINGS[levelValue]?.name || levelValue;
            const option = document.createElement('option');
            option.value = levelValue;
            option.textContent = levelDisplayName;
            difficultySelectElement.appendChild(option);
        }
        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
            difficultySelectElement.value = savedDifficulty;
        } else {
            difficultySelectElement.value = DIFFICULTY_LEVELS.MEDIUM; // Default if nothing saved
        }
    }
}

function handleDifficultyChange(event) {
    const selectedDifficulty = event.target.value;
    if (gameInstance && typeof gameInstance.setDifficulty === 'function') {
        gameInstance.setDifficulty(selectedDifficulty);
        localStorage.setItem('snakeGameDifficulty', selectedDifficulty);
    }
}

function initGame() {
    loadTheme();
    populateDifficultyOptions();
    populateLegend(); // Call to populate the game items legend

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
            null, // messageOverlayId (if you have one, e.g., 'gameMessageOverlay')
            initialDifficulty
        );
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const pageWrapper = document.querySelector('.page-wrapper') || document.body;
        pageWrapper.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initGame);
