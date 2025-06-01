// assets/js/constants.js

/**
 * @fileoverview Defines constants used throughout the Snake game.
 */

/**
 * Size of each grid cell in pixels.
 * @type {number}
 */
export const GRID_SIZE = 15;

/**
 * Number of rows on the game board.
 * @type {number}
 */
export const ROWS = 26;

/**
 * Number of columns on the game board.
 * @type {number}
 */
export const COLS = 26;

/**
 * Initial base speed of the snake (game updates per second).
 * This is the speed when speedFactor is 1.
 * @type {number}
 */
export const INITIAL_SNAKE_SPEED = 5;

/**
 * Default score awarded for eating a standard piece of food.
 * Can be overridden by specific food types.
 * @type {number}
 */
export const DEFAULT_FOOD_SCORE = 10;

/**
 * Identifiers for different food effects.
 * @enum {string}
 */
export const FOOD_EFFECTS = {
    NONE: 'none',
    SPEED_BOOST: 'speedBoost',
    SLOW_DOWN: 'slowDown',
    EXTRA_GROWTH: 'extraGrowth',
};

/**
 * Defines the properties of different food types.
 */
export const FOOD_TYPES = {
    DEFAULT: {
        id: 'DEFAULT',
        color: 'var(--food-color)',
        score: 10,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.60
    },
    GOLDEN_APPLE: {
        id: 'GOLDEN_APPLE',
        color: 'var(--food-color-golden)',
        score: 50,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.10
    },
    SPEED_BERRY: {
        id: 'SPEED_BERRY',
        color: 'var(--food-color-speed)',
        score: 5,
        effect: FOOD_EFFECTS.SPEED_BOOST,
        duration: 5000,
        speedFactor: 1.5,
        probability: 0.10
    },
    SLOW_SLUG: {
        id: 'SLOW_SLUG',
        color: 'var(--food-color-slow)',
        score: 5,
        effect: FOOD_EFFECTS.SLOW_DOWN,
        duration: 5000,
        speedFactor: 0.66,
        probability: 0.10
    },
    GROW_PEAR: {
        id: 'GROW_PEAR',
        color: 'var(--food-color-grow)',
        score: 15,
        effect: FOOD_EFFECTS.EXTRA_GROWTH,
        growAmount: 3,
        probability: 0.10
    }
};

/**
 * Time in milliseconds allowed between food consumptions to maintain a combo.
 * @type {number}
 */
export const COMBO_TIMER_DURATION = 3000; // 3 seconds

/**
 * Minimum number of food items eaten in a combo to activate a score multiplier.
 * @type {number}
 */
export const COMBO_MIN_FOR_MULTIPLIER = 3;

/**
 * The score multiplier applied when a combo is active and meets the minimum count.
 * @type {number}
 */
export const COMBO_SCORE_MULTIPLIER = 1.5; // 1.5x score for food base score

/**
 * Optional: Flat bonus score per item in a combo streak (after the first item).
 * @type {number}
 */
export const COMBO_ITEM_BONUS_SCORE = 2;


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
 * URLs for theme CSS files (used in main.js).
 */
export const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
