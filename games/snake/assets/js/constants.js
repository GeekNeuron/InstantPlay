// assets/js/constants.js

/**
 * @fileoverview Defines constants used throughout the Snake game.
 */

/**
 * Size of each grid cell in pixels.
 * @type {number}
 */
export const GRID_SIZE = 15; // Changed from 20 for smaller cells

/**
 * Number of rows on the game board.
 * @type {number}
 */
export const ROWS = 26; // Adjusted for new GRID_SIZE (26 * 15 = 390px height)

/**
 * Number of columns on the game board.
 * @type {number}
 */
export const COLS = 26; // Adjusted for new GRID_SIZE (26 * 15 = 390px width)

/**
 * Initial speed of the snake (game updates per second).
 * Higher value means faster game.
 * @type {number}
 */
export const INITIAL_SNAKE_SPEED = 5;

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
    SPACE: ' ',
    ESCAPE: 'Escape'
};

/**
 * Game states.
 * @enum {string}
 */
export const GAME_STATE = {
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

/**
 * URLs for theme CSS files.
 */
export const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};

// Example for direct color usage if needed, though CSS variables are preferred for theming.
// export const COLORS = {
//     SNAKE_HEAD: 'var(--snake-head-color)',
//     SNAKE_BODY: 'var(--snake-body-color)',
//     FOOD_DEFAULT: 'var(--food-color)',
//     BOARD_BACKGROUND: 'var(--canvas-bg-color)',
//     OBSTACLE: '#555555',
//     GRID_LINE_COLOR: 'rgba(0, 0, 0, 0.1)' // Example grid line color
// };
