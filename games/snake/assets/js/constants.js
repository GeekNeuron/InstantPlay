// assets/js/constants.js

export const GRID_SIZE = 15;
export const ROWS = 26;
export const COLS = 26;
// INITIAL_SNAKE_SPEED will now be primarily driven by DIFFICULTY_SETTINGS
export const DEFAULT_FOOD_SCORE = 10;

export const FOOD_EFFECTS = { /* ... as before ... */ };
export const FOOD_TYPES = { /* ... as before ... */ };
export const COMBO_TIMER_DURATION = 3000;
export const COMBO_MIN_FOR_MULTIPLIER = 3;
export const COMBO_SCORE_MULTIPLIER = 1.5;
export const COMBO_ITEM_BONUS_SCORE = 2;

// Base survival settings - difficulty can modify these via factors or specific values
export const SURVIVAL_START_SPEED_BASE = 4; // Base start speed for survival before difficulty modification
export const SURVIVAL_SPEED_INCREASE_INTERVAL = 10000;
export const SURVIVAL_SPEED_INCREASE_AMOUNT_BASE = 0.5; // Base increase amount

export const GAME_MODES = {
    CLASSIC: 'classic',
    SURVIVAL: 'survival'
};

export const PARTICLE_COUNT_FOOD_CONSUMPTION = 12; /* ... other particle constants as before ... */
export const PARTICLE_LIFESPAN_FOOD = 600;
export const PARTICLE_BASE_SPEED_FOOD = 1.2;
export const PARTICLE_SIZE_FOOD = 2.5;
export const PARTICLE_GRAVITY_FOOD = 0.03;

export const SCREEN_SHAKE_MAGNITUDE_GAME_OVER = 4; /* ... other screen shake constants as before ... */
export const SCREEN_SHAKE_DURATION_GAME_OVER = 150;

export const OBSTACLE_TYPES = {
    STATIC: 'static',
    BLINKING: 'blinking'
    // MOVING: 'moving' // For future implementation
};
export const BLINKING_OBSTACLE_ON_DURATION = 3000;
export const BLINKING_OBSTACLE_OFF_DURATION = 2000;

export const ACHIEVEMENT_STORAGE_KEY = 'snakeGameAchievements';
export const ACHIEVEMENTS = { /* ... as before ... */ };

// --- Updated Difficulty Settings ---
export const DIFFICULTY_LEVELS = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD'
};

// Define configurations for obstacles and other parameters per difficulty
export const OBSTACLE_CONFIG = {
    NONE: 'NONE', // No obstacles
    STANDARD: 'STANDARD', // Current mix of static and blinking
    CHALLENGING: 'CHALLENGING' // More dense or faster blinking obstacles
};

export const DIFFICULTY_SETTINGS = {
    [DIFFICULTY_LEVELS.EASY]: {
        name: "Easy",
        initialSpeed: 4,
        survivalStartSpeed: 3,
        survivalSpeedFactor: 0.7, // Makes survival speed increase slower
        obstacleConfig: OBSTACLE_CONFIG.NONE, // No obstacles for Easy
        // Potentially: powerUpFrequencyFactor: 1.2 (more power-ups)
    },
    [DIFFICULTY_LEVELS.MEDIUM]: {
        name: "Medium",
        initialSpeed: 6, // Slightly increased base speed for medium
        survivalStartSpeed: 4,
        survivalSpeedFactor: 1.0, // Standard survival speed increase
        obstacleConfig: OBSTACLE_CONFIG.STANDARD, // Standard obstacles
        // powerUpFrequencyFactor: 1.0
    },
    [DIFFICULTY_LEVELS.HARD]: {
        name: "Hard",
        initialSpeed: 8, // Faster start for Hard
        survivalStartSpeed: 5,
        survivalSpeedFactor: 1.3, // Faster survival speed increase
        obstacleConfig: OBSTACLE_CONFIG.CHALLENGING, // More/trickier obstacles
        // powerUpFrequencyFactor: 0.8 (fewer power-ups)
    }
};

export const KEYS = { /* ... as before ... */ };
export const GAME_STATE = { /* ... as before ... */ };
export const THEME_FILES = { /* ... as before ... */ };
