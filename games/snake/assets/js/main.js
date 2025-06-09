// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS, GAME_MODES } from './constants.js';
import { populateLegend } from './legend.js';

// --- UI Elements ---
const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');

// Main Menu Elements
const mainMenuOverlay = document.getElementById('main-menu-overlay');
const startGameBtn = document.getElementById('start-game-btn');
const difficultySelectMenu = document.getElementById('difficulty-select-menu');
const modeSelectMenu = document.getElementById('mode-select-menu');

// Main Game UI Element
const gamePageWrapper = document.getElementById('game-page-wrapper');

let gameInstance = null;
let currentTheme = 'light';

const THEME_FILES = { /* ... as before ... */ };
function toggleTheme() { /* ... as before ... */ }
function loadTheme() { /* ... as before ... */ }

function populateDifficultyOptions() {
    if (difficultySelectMenu) {
        difficultySelectMenu.innerHTML = '';
        const difficultyOrder = [DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD];
        difficultyOrder.forEach(levelKey => {
            const levelDisplayName = DIFFICULTY_SETTINGS[levelKey]?.name || levelKey;
            const option = document.createElement('option');
            option.value = levelKey;
            option.textContent = levelDisplayName;
            difficultySelectMenu.appendChild(option);
        });
        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
            difficultySelectMenu.value = savedDifficulty;
        } else {
            difficultySelectMenu.value = DIFFICULTY_LEVELS.MEDIUM;
        }
    }
}

function populateModeOptions() {
    if (modeSelectMenu) {
        modeSelectMenu.innerHTML = '';
        const modeOrder = [GAME_MODES.CLASSIC, GAME_MODES.SURVIVAL]; 
        modeOrder.forEach(modeValue => {
            const modeDisplayName = modeValue.charAt(0).toUpperCase() + modeValue.slice(1);
            const option = document.createElement('option');
            option.value = modeValue;
            option.textContent = modeDisplayName;
            modeSelectMenu.appendChild(option);
        });
        const savedMode = localStorage.getItem('snakeGameMode');
        if (savedMode && Object.values(GAME_MODES).includes(savedMode)) {
            modeSelectMenu.value = savedMode;
        } else {
            modeSelectMenu.value = GAME_MODES.CLASSIC;
        }
    }
}

function handleDifficultyChange() {
    const selectedDifficultyKey = difficultySelectMenu.value;
    if (gameInstance) gameInstance.setDifficulty(selectedDifficultyKey); // Update game instance in background
    localStorage.setItem('snakeGameDifficulty', selectedDifficultyKey);
}

function handleModeChange() {
    const selectedMode = modeSelectMenu.value;
    if (gameInstance) gameInstance.setGameMode(selectedMode); // Update game instance in background
    localStorage.setItem('snakeGameMode', selectedMode);
}

/**
 * Initializes the entire application, including the main menu and the game instance.
 */
function initApp() {
    loadTheme();
    populateDifficultyOptions();
    populateModeOptions();
    
    // Non-game related UI, like theme toggle in main game UI
    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
    }

    // Menu selectors
    if (difficultySelectMenu) difficultySelectMenu.addEventListener('change', handleDifficultyChange);
    if (modeSelectMenu) modeSelectMenu.addEventListener('change', handleModeChange);

    // Start Game Button
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (mainMenuOverlay) {
                // Fade out the menu
                mainMenuOverlay.classList.add('hide-menu');
                setTimeout(() => {
                    mainMenuOverlay.style.display = 'none';
                }, 500); // Match transition duration in CSS
            }
            if (gamePageWrapper) {
                gamePageWrapper.classList.remove('hidden'); // Show the game UI
            }
            if (gameInstance) {
                gameInstance.start(); // Start the actual game
            }
        });
    }

    // Create the game instance in the background so it's ready
    try {
        const initialDifficultyKey = difficultySelectMenu ? difficultySelectMenu.value : DIFFICULTY_LEVELS.MEDIUM;
        const initialGameMode = modeSelectMenu ? modeSelectMenu.value : GAME_MODES.CLASSIC;
        
        gameInstance = new Game(
            'gameCanvas', 'score', 'highscore',
            'combo-display', null, 
            initialDifficultyKey,
            initialGameMode
        );
        populateLegend(); // Populate legend after game instance is created (if needed)

    } catch (error) {
        console.error("Failed to initialize game instance:", error);
        document.body.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initApp);
