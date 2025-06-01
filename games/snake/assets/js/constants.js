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
export const PARTICLE_LIFESPAN_FOOD = 600; 
export const PARTICLE_BASE_SPEED_FOOD = 1.2;
export const PARTICLE_SIZE_FOOD = 2.5;
export const PARTICLE_GRAVITY_FOOD = 0.03;

export const SCREEN_SHAKE_MAGNITUDE_GAME_OVER = 4;
export const SCREEN_SHAKE_DURATION_GAME_OVER = 150;

export const OBSTACLE_TYPES = {
    STATIC: 'static',
    BLINKING: 'blinking'
};
export const BLINKING_OBSTACLE_ON_DURATION = 3000;
export const BLINKING_OBSTACLE_OFF_DURATION = 2000;

// --- Constants for Achievements ---
export const ACHIEVEMENT_STORAGE_KEY = 'snakeGameAchievements';

export const ACHIEVEMENTS = {
    NOVICE_EATER: {
        id: 'NOVICE_EATER',
        name: 'Novice Eater',
        description: 'Eat 10 pieces of food in a single game.',
        icon: '🍎',
        criteria: { foodEatenInGame: 10 }, // Condition: game.foodEatenThisGame >= 10
        unlocked: false // Default state, will be loaded from localStorage
    },
    SCORE_MILESTONE_1: {
        id: 'SCORE_MILESTONE_1',
        name: 'Score Cadet',
        description: 'Reach 500 points in a single game.',
        icon: '⭐',
        criteria: { scoreInGame: 500 }, // Condition: game.score >= 500
        unlocked: false
    },
    COMBO_MASTER_BEGINNER: {
        id: 'COMBO_MASTER_BEGINNER',
        name: 'Combo Starter',
        description: 'Achieve a x3 combo count in a single game.',
        icon: '💥',
        criteria: { maxComboCountInGame: 3 }, // Condition: game.maxComboThisGame >= 3
        unlocked: false
    },
    SURVIVOR_30_SECONDS: {
        id: 'SURVIVOR_30_SECONDS',
        name: 'Quick Survivor',
        description: 'Survive for 30 seconds in a single game.',
        icon: '⏳',
        criteria: { survivalTimeInSeconds: 30 }, // Condition: gameDurationSeconds >= 30
        unlocked: false
    },
    OBSTACLE_NAVIGATOR: {
        id: 'OBSTACLE_NAVIGATOR',
        name: 'Obstacle Navigator',
        description: 'Score over 200 points in a game with obstacles.',
        icon: '🚧',
        criteria: { scoreWithObstacles: 200 }, // Condition: game.score >= 200 && obstaclesWerePresent
        unlocked: false
    }
    // Add more achievements here later:
    // Example: LONG_SNAKE: { id: 'LONG_SNAKE', name: 'Great Serpent', description: 'Grow your snake to 30 segments.', icon: '🐍', criteria: { snakeLength: 30 }, unlocked: false },
    // Example: GOLD_HOARDER: { id: 'GOLD_HOARDER', name: 'Gold Hoarder', description: 'Collect 5 golden apples in one game.', icon: '💰', criteria: { goldenApplesCollected: 5 }, unlocked: false },
};


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
