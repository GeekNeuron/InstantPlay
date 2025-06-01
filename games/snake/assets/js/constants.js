// assets/js/constants.js

/**
 * @fileoverview Defines constants used throughout the Snake game.
 */

/**
 * Size of each grid cell in pixels.
 * @type {number}
 */
export const GRID_SIZE = 15; // For smaller cells

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
 * - id: Unique identifier for the food type.
 * - color: Display color (should be a CSS variable name like 'var(--food-color-example)').
 * - score: Points awarded for eating this food.
 * - effect: The type of effect this food has (from FOOD_EFFECTS).
 * - probability: Chance of this food type spawning. Sum of probabilities should ideally be 1.
 * - duration: (Optional) Duration of the effect in milliseconds.
 * - speedFactor: (Optional) Multiplier for snake speed changes.
 * - growAmount: (Optional) Number of segments the snake grows by.
 */
export const FOOD_TYPES = {
    DEFAULT: {
        id: 'DEFAULT',
        color: 'var(--food-color)',         // Reference to CSS variable
        score: 10,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.60
    },
    GOLDEN_APPLE: {
        id: 'GOLDEN_APPLE',
        color: 'var(--food-color-golden)',  // Reference to CSS variable
        score: 50,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.10
    },
    SPEED_BERRY: {
        id: 'SPEED_BERRY',
        color: 'var(--food-color-speed)',   // Reference to CSS variable
        score: 5,
        effect: FOOD_EFFECTS.SPEED_BOOST,
        duration: 5000, // 5 seconds
        speedFactor: 1.5, // 50% faster
        probability: 0.10
    },
    SLOW_SLUG: {
        id: 'SLOW_SLUG',
        color: 'var(--food-color-slow)',    // Reference to CSS variable
        score: 5,
        effect: FOOD_EFFECTS.SLOW_DOWN,
        duration: 5000, // 5 seconds
        speedFactor: 0.66, // ~33% slower
        probability: 0.10
    },
    GROW_PEAR: {
        id: 'GROW_PEAR',
        color: 'var(--food-color-grow)',    // Reference to CSS variable
        score: 15,
        effect: FOOD_EFFECTS.EXTRA_GROWTH,
        growAmount: 3, // Grows by 3 segments
        probability: 0.10
    }
};


/**
 * Key codes for input handling.
 * @enum {string}
 */
export const KEYS = {
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    W: 'w', // Alternative for Up
    A: 'a', // Alternative for Left
    S: 's', // Alternative for Down
    D: 'd', // Alternative for Right
    SPACE: ' ', // For pause/resume or start
    ESCAPE: 'Escape' // For pause or menu
};

/**
 * Game states.
 * @enum {string}
 */
export const GAME_STATE = {
    LOADING: 'loading',     // Initial load, assets, etc.
    READY: 'ready',         // Game is ready to start (e.g., title screen, instructions)
    PLAYING: 'playing',     // Game is active
    PAUSED: 'paused',       // Game is paused
    GAME_OVER: 'gameOver'   // Game has ended
};

/**
 * URLs for theme CSS files (used in main.js).
 */
export const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
