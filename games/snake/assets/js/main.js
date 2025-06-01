// assets/js/main.js

import { Game } from './game.js';

const themeToggleElement = document.getElementById('page-title-clickable');
const themeLink = document.getElementById('theme-link');

const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
let currentTheme = 'light';

function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
    localStorage.setItem('snakeGameTheme', currentTheme);
    console.log(`Theme changed to ${currentTheme}`);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme && THEME_FILES[savedTheme]) {
        currentTheme = savedTheme;
    }
    themeLink.setAttribute('href', THEME_FILES[currentTheme]);
}

function initGame() {
    console.log("Initializing Snake Game...");
    loadTheme();

    if (themeToggleElement) {
        themeToggleElement.addEventListener('click', toggleTheme);
        themeToggleElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    } else {
        console.error("Theme toggle element not found!");
    }

    try {
        // Saat ini messageOverlayId ارسال نمی‌شود، بنابراین UIManager از آن استفاده نخواهد کرد
        // مگر اینکه یک div با id مربوطه در HTML و شناسه آن در اینجا پاس داده شود.
        const gameInstance = new Game('gameCanvas', 'score', 'highscore');
        // مثال برای استفاده از overlay:
        // 1. در index.html بخش gameMessageOverlay را از کامنت خارج کنید.
        // 2. در اینجا شناسه را پاس دهید:
        // const gameInstance = new Game('gameCanvas', 'score', 'highscore', 'gameMessageOverlay');
        console.log("Game instance should be created now.");
    } catch (error) {
        console.error("Failed to initialize game:", error);
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.innerHTML = `<p style="color: red; text-align: center;">Error initializing game. Please check console. <br>Make sure canvas and score elements exist in HTML.</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', initGame);
