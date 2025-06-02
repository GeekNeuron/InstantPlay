// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS, GAME_MODES } from './constants.js';
import { populateLegend } from './legend.js';

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const difficultySelectElement = document.getElementById('difficulty-select');
const modeSelectElement = document.getElementById('mode-select');

let gameInstance = null;

const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
let currentTheme = 'light';

function toggleTheme() {
    // console.log('toggleTheme function called. Current theme before change:', currentTheme);
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme);
    // console.log(`Theme changed to ${currentTheme}. Link href: ${themeLink.getAttribute('href')}`);
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
        difficultySelectElement.innerHTML = '';
        // Order based on the simplified 3 levels
        const difficultyOrder = [DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD];
        
        difficultyOrder.forEach(levelKey => {
            const levelDisplayName = DIFFICULTY_SETTINGS[levelKey]?.name || levelKey;
            const option = document.createElement('option');
            option.value = levelKey; // e.g., "EASY"
            option.textContent = levelDisplayName; // e.g., "Easy"
            difficultySelectElement.appendChild(option);
        });

        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        if (savedDifficulty && DIFFICULTY_LEVELS[savedDifficulty]) { // Check if saved key is valid
            difficultySelectElement.value = savedDifficulty;
        } else {
            difficultySelectElement.value = DIFFICULTY_LEVELS.MEDIUM; // Default
            localStorage.setItem('snakeGameDifficulty', DIFFICULTY_LEVELS.MEDIUM);
        }
    }
}

function populateModeOptions() {
    if (modeSelectElement) {
        modeSelectElement.innerHTML = '';
        // Order of game modes for display
        const modeOrder = [GAME_MODES.CLASSIC, GAME_MODES.SURVIVAL]; 

        modeOrder.forEach(modeValue => { // modeValue is 'classic' or 'survival'
            const modeDisplayName = modeValue.charAt(0).toUpperCase() + modeValue.slice(1);
            const option = document.createElement('option');
            option.value = modeValue;
            option.textContent = modeDisplayName;
            modeSelectElement.appendChild(option);
        });

        const savedMode = localStorage.getItem('snakeGameMode');
        if (savedMode && Object.values(GAME_MODES).includes(savedMode)) {
            modeSelectElement.value = savedMode;
        } else {
            modeSelectElement.value = GAME_MODES.CLASSIC; // Default to Classic
            localStorage.setItem('snakeGameMode', GAME_MODES.CLASSIC);
        }
    }
}

function handleDifficultyChange(event) {
    const selectedDifficultyKey = event.target.value;
    if (gameInstance && typeof gameInstance.setDifficulty === 'function') {
        gameInstance.setDifficulty(selectedDifficultyKey);
        localStorage.setItem('snakeGameDifficulty', selectedDifficultyKey);
    }
}

function handleModeChange(event) {
    const selectedMode = event.target.value;
    if (gameInstance && typeof gameInstance.setGameMode === 'function') {
        gameInstance.setGameMode(selectedMode);
        localStorage.setItem('snakeGameMode', selectedMode);
    }
}

function initGame() {
    loadTheme();
    populateDifficultyOptions();
    populateModeOptions();
    populateLegend();

    if (themeToggleElement) {
        // console.log("Attaching listeners to theme toggle element:", themeToggleElement);
        themeToggleElement.addEventListener('click', () => {
            // console.log("Title CLICKED");
            toggleTheme();
        });
        themeToggleElement.addEventListener('touchend', (e) => {
            // console.log("Title TOUCHED (touchend)");
            e.preventDefault(); // Important to prevent potential double toggle or page zoom
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

    if (modeSelectElement) {
        modeSelectElement.addEventListener('change', handleModeChange);
    } else {
        console.error("Mode select element ('mode-select') not found!");
    }

    try {
        const initialDifficultyKey = difficultySelectElement ? difficultySelectElement.value : DIFFICULTY_LEVELS.MEDIUM;
        const initialGameMode = modeSelectElement ? modeSelectElement.value : GAME_MODES.CLASSIC;

        gameInstance = new Game(
            'gameCanvas',
            'score',
            'highscore',
            'combo-display',
            null, 
            initialDifficultyKey,
            initialGameMode
        );
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const pageWrapper = document.querySelector('.page-wrapper') || document.body;
        pageWrapper.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initGame);
