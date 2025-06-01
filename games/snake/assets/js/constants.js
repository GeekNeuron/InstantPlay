// assets/js/constants.js

/**
 * @fileoverview Defines constants used throughout the Snake game.
 */

export const GRID_SIZE = 15;
export const ROWS = 26;
export const COLS = 26;
export const INITIAL_SNAKE_SPEED = 5; // Base speed for Classic mode
export const DEFAULT_FOOD_SCORE = 10;

export const FOOD_EFFECTS = {
    NONE: 'none',
    SPEED_BOOST: 'speedBoost',
    SLOW_DOWN: 'slowDown',
    EXTRA_GROWTH: 'extraGrowth',
};

export const FOOD_TYPES = {
    DEFAULT: { id: 'DEFAULT', color: 'var(--food-color)', score: 10, effect: FOOD_EFFECTS.NONE, probability: 0.60 },
    GOLDEN_APPLE: { id: 'GOLDEN_APPLE', color: 'var(--food-color-golden)', score: 50, effect: FOOD_EFFECTS.NONE, probability: 0.10 },
    SPEED_BERRY: { id: 'SPEED_BERRY', color: 'var(--food-color-speed)', score: 5, effect: FOOD_EFFECTS.SPEED_BOOST, duration: 5000, speedFactor: 1.5, probability: 0.10 },
    SLOW_SLUG: { id: 'SLOW_SLUG', color: 'var(--food-color-slow)', score: 5, effect: FOOD_EFFECTS.SLOW_DOWN, duration: 5000, speedFactor: 0.66, probability: 0.10 },
    GROW_PEAR: { id: 'GROW_PEAR', color: 'var(--food-color-grow)', score: 15, effect: FOOD_EFFECTS.EXTRA_GROWTH, growAmount: 3, probability: 0.10 }
};

export const COMBO_TIMER_DURATION = 3000; // 3 seconds
export const COMBO_MIN_FOR_MULTIPLIER = 3; // Min items for combo score multiplier
export const COMBO_SCORE_MULTIPLIER = 1.5; // Multiplier for food's base score in a combo
export const COMBO_ITEM_BONUS_SCORE = 2; // Flat bonus per combo item (after first)

export const SURVIVAL_START_SPEED = 4;
export const SURVIVAL_SPEED_INCREASE_INTERVAL = 10000; // Increase speed every 10 seconds
export const SURVIVAL_SPEED_INCREASE_AMOUNT = 0.5; // Increase speed by 0.5 units

export const GAME_MODES = {
    CLASSIC: 'classic',
    SURVIVAL: 'survival'
};

export const PARTICLE_COUNT_FOOD_CONSUMPTION = 12;
export const PARTICLE_LIFESPAN_FOOD = 600; // Conceptual milliseconds
export const PARTICLE_BASE_SPEED_FOOD = 1.2;
export const PARTICLE_SIZE_FOOD = 2.5;
export const PARTICLE_GRAVITY_FOOD = 0.03;

export const SCREEN_SHAKE_MAGNITUDE_GAME_OVER = 4;
export const SCREEN_SHAKE_DURATION_GAME_OVER = 150;

// --- Constants for Obstacle Types and Blinking Behavior ---
export const OBSTACLE_TYPES = {
    STATIC: 'static',
    BLINKING: 'blinking'
};

/**
 * Default duration (in milliseconds) an obstacle is visible when blinking.
 * @type {number}
 */
export const BLINKING_OBSTACLE_ON_DURATION = 3000; // Visible for 3 seconds

/**
 * Default duration (in milliseconds) an obstacle is invisible when blinking.
 * @type {number}
 */
export const BLINKING_OBSTACLE_OFF_DURATION = 2000; // Invisible for 2 seconds


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

export const GAME_STATE = {
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

export const THEME_FILES = {
    light: 'assets/css/light-theme.css',
    dark: 'assets/css/dark-theme.css'
};
