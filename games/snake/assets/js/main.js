// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS, GAME_MODES } from './constants.js';
import { populateLegend } from './legend.js';
import { TutorialManager } from './tutorialManager.js';

// --- UI Element Selectors ---
const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');

// Main Menu Elements
const mainMenuOverlay = document.getElementById('main-menu-overlay');
const startGameBtn = document.getElementById('start-game-btn');
const difficultySelectMenu = document.getElementById('difficulty-select-menu');
const modeSelectMenu = document.getElementById('mode-select-menu');
const achievementsBtn = document.getElementById('achievements-btn');

// Achievements Modal Elements
const achievementsModal = document.getElementById('achievements-modal');
const achievementsListContainer = document.getElementById('achievements-list-container');
const achievementsModalCloseBtn = achievementsModal ? achievementsModal.querySelector('.modal-close-btn') : null;

// Main Game UI Element
const gamePageWrapper = document.getElementById('game-page-wrapper');

// --- Global State ---
let gameInstance = null;
let tutorialManager = null;
let currentTheme = 'light';

const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};

// --- Functions ---

function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('snakeGameTheme') || 'light';
    if (THEME_FILES[savedTheme]) {
        currentTheme = savedTheme;
    }
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
}

function populateDifficultyOptions() {
    if (!difficultySelectMenu) return;
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
        localStorage.setItem('snakeGameDifficulty', DIFFICULTY_LEVELS.MEDIUM);
    }
}

function populateModeOptions() {
    if (!modeSelectMenu) return;
    modeSelectMenu.innerHTML = '';
    const modeOrder = [GAME_MODES.CLASSIC, GAME_MODES.SURVIVAL, GAME_MODES.CAMPAIGN]; 
    
    modeOrder.forEach(modeValue => {
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
        modeSelectElement.value = GAME_MODES.CLASSIC;
        localStorage.setItem('snakeGameMode', GAME_MODES.CLASSIC);
    }
}

function handleDifficultyChange() {
    const selectedDifficultyKey = difficultySelectMenu.value;
    if (gameInstance) gameInstance.setDifficulty(selectedDifficultyKey);
    localStorage.setItem('snakeGameDifficulty', selectedDifficultyKey);
}

function handleModeChange() {
    const selectedMode = modeSelectElement.value;
    if (gameInstance) gameInstance.setGameMode(selectedMode);
    localStorage.setItem('snakeGameMode', selectedMode);
}

function populateAchievementsModal() {
    if (!gameInstance || !achievementsListContainer) return;
    
    const achievements = gameInstance.achievementManager.getAllAchievementsWithStatus();
    achievementsListContainer.innerHTML = ''; 
    
    achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
        item.innerHTML = `
            <div class="achievement-item-icon">${ach.icon}</div>
            <div class="achievement-item-details">
                <h3 class="achievement-item-title">${ach.name}</h3>
                <p class="achievement-item-desc">${ach.description}</p>
            </div>
        `;
        achievementsListContainer.appendChild(item);
    });
}

function initApp() {
    loadTheme();
    populateDifficultyOptions();
    populateModeOptions();
    
    // Event Listeners Setup
    if (themeToggleElement) themeToggleElement.addEventListener('click', toggleTheme);
    if (difficultySelectMenu) difficultySelectMenu.addEventListener('change', handleDifficultyChange);
    if (modeSelectMenu) modeSelectElement.addEventListener('change', handleModeChange);

    // Main Menu Button Listeners
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (mainMenuOverlay) mainMenuOverlay.classList.add('hide-menu');
            if (gamePageWrapper) gamePageWrapper.classList.remove('hidden');
            if (gameInstance) gameInstance.start();
        });
    }

    // Achievements Modal Listeners
    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', () => {
            populateAchievementsModal();
            if (achievementsModal) achievementsModal.classList.add('show');
        });
    }
    if (achievementsModalCloseBtn) {
        achievementsModalCloseBtn.addEventListener('click', () => {
            if (achievementsModal) achievementsModal.classList.remove('show');
        });
    }
    if (achievementsModal) {
        achievementsModal.addEventListener('click', (event) => {
            if (event.target === achievementsModal) {
                achievementsModal.classList.remove('show');
            }
        });
    }
    
    // Game Instance and Feature Initialization
    try {
        const initialDifficultyKey = difficultySelectMenu ? difficultySelectMenu.value : DIFFICULTY_LEVELS.MEDIUM;
        const initialGameMode = modeSelectElement ? modeSelectElement.value : GAME_MODES.CLASSIC;
        
        gameInstance = new Game(
            'gameCanvas', 'score', 'highscore',
            'combo-display', 'level-info-display', null, 
            initialDifficultyKey,
            initialGameMode
        );

        populateLegend(); // Populate legend after game instance is created
        
        tutorialManager = new TutorialManager();
        tutorialManager.start(); // Will only show if not completed before

    } catch (error) {
        console.error("Failed to initialize game instance:", error);
        document.body.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initApp);
