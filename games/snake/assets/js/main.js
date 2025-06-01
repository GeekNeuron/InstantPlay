// assets/js/main.js

import { Game } from './game.js';
import { DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS } from './constants.js';
import { populateLegend } from './legend.js';

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');
const difficultySelectElement = document.getElementById('difficulty-select');

let gameInstance = null;

const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
let currentTheme = 'light'; // Default theme

function toggleTheme() {
    console.log('toggleTheme function called. Current theme before change:', currentTheme); // LOG
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme);
    console.log(`Theme changed to ${currentTheme}. Link href: ${themeLink.getAttribute('href')}`); // LOG
}

function loadTheme() {
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme && THEME_FILES[savedTheme]) {
        currentTheme = savedTheme;
    }
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    // console.log(`Theme loaded: ${currentTheme}`); // Optional log
}

function populateDifficultyOptions() {
    if (difficultySelectElement) {
        difficultySelectElement.innerHTML = '';
        // Only Easy, Medium, Hard as per last request
        const difficultyOrder = [DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD];
        
        difficultyOrder.forEach(levelKey => {
            const levelValue = levelKey; // DIFFICULTY_LEVELS already provides the key as string
            const levelDisplayName = DIFFICULTY_SETTINGS[levelValue]?.name || levelValue;
            const option = document.createElement('option');
            option.value = levelValue;
            option.textContent = levelDisplayName;
            difficultySelectElement.appendChild(option);
        });

        const savedDifficulty = localStorage.getItem('snakeGameDifficulty');
        if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
            difficultySelectElement.value = savedDifficulty;
        } else {
            difficultySelectElement.value = DIFFICULTY_LEVELS.MEDIUM;
            localStorage.setItem('snakeGameDifficulty', DIFFICULTY_LEVELS.MEDIUM);
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

function initGame() {
    loadTheme();
    populateDifficultyOptions();
    populateLegend();

    if (themeToggleElement) {
        console.log("Attaching listeners to theme toggle element:", themeToggleElement); // LOG
        themeToggleElement.addEventListener('click', () => {
            console.log("Title CLICKED"); // LOG
            toggleTheme();
        });
        themeToggleElement.addEventListener('touchend', (e) => {
            console.log("Title TOUCHED (touchend)"); // LOG
            e.preventDefault();
            toggleTheme();
            // It's possible both touchend and click fire.
            // Consider a flag or more sophisticated handling if double toggling occurs.
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
        const initialDifficultyKey = difficultySelectElement ? difficultySelectElement.value : DIFFICULTY_LEVELS.MEDIUM;
        gameInstance = new Game(
            'gameCanvas',
            'score',
            'highscore',
            'combo-display',
            null, 
            initialDifficultyKey
        );
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const pageWrapper = document.querySelector('.page-wrapper') || document.body;
        pageWrapper.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initGame);
