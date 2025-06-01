// assets/js/constants.js

/**
 * @fileoverview Defines constants used throughout the Snake game.
 */

/**
 * Size of each grid cell in pixels.
 * @type {number}
 */
export const GRID_SIZE = 20; // e.g., each square is 20x20 pixels

/**
 * Number of rows on the game board.
 * @type {number}
 */
export const ROWS = 20; // Results in a 20x20 grid

/**
 * Number of columns on the game board.
 * @type {number}
 */
export const COLS = 20; // Results in a 20x20 grid

/**
 * Initial speed of the snake (game updates per second).
 * Higher value means faster game.
 * @type {number}
 */
export const INITIAL_SNAKE_SPEED = 5; // e.g., 5 updates per second

/**
 * Score awarded for eating a standard piece of food.
 * @type {number}
 */
export const FOOD_SCORE = 10;

/**
 * Key codes for input handling.
 * @enum {string}
 */
export const KEYS = {
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    W: 'w',
    A: 'a',
    S: 's',
    D: 'd',
    SPACE: ' ', // For pause or start
    ESCAPE: 'Escape' // For pause or menu
};

/**
 * Game states.
 * @enum {string}
 */
export const GAME_STATE = {
    LOADING: 'loading',
    READY: 'ready', // Ready to start (e.g., on main screen)
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

/**
 * URLs for theme CSS files.
 * Defined here for potential use in other modules if needed, though primarily used in main.js.
 */
export const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};

// Add more constants as needed (e.g., colors, power-up types, messages)
// Example:
// export const COLORS = {
//     SNAKE_HEAD: 'var(--snake-head-color)', // Using CSS variables
//     SNAKE_BODY: 'var(--snake-body-color)',
//     FOOD_DEFAULT: 'var(--food-color)',
//     BOARD_BACKGROUND: 'var(--canvas-bg-color)',
//     OBSTACLE: '#555555'
// };
