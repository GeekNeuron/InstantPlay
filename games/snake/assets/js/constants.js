// assets/js/constants.js

export const GRID_SIZE = 15;
export const ROWS = 26;
export const COLS = 26;
export const DEFAULT_FOOD_SCORE = 10;

export const FOOD_EFFECTS = { NONE: 'none', SPEED_BOOST: 'speedBoost', SLOW_DOWN: 'slowDown', EXTRA_GROWTH: 'extraGrowth' };
export const FOOD_TYPES = {
    DEFAULT: { id: 'DEFAULT', displayName: 'Apple', description: 'Standard food. +10 score.', color: 'var(--food-color)', score: 10, effect: FOOD_EFFECTS.NONE, probability: 0.60 },
    GOLDEN_APPLE: { id: 'GOLDEN_APPLE', displayName: 'Golden Apple', description: 'Rare fruit! +50 score.', color: 'var(--food-color-golden)', score: 50, effect: FOOD_EFFECTS.NONE, probability: 0.10 },
    SPEED_BERRY: { id: 'SPEED_BERRY', displayName: 'Speed Berry', description: 'Temporarily increases snake speed.', color: 'var(--food-color-speed)', score: 5, effect: FOOD_EFFECTS.SPEED_BOOST, duration: 5000, speedFactor: 1.5, probability: 0.10 },
    SLOW_SLUG: { id: 'SLOW_SLUG', displayName: 'Slow Fungus', description: 'Temporarily decreases snake speed.', color: 'var(--food-color-slow)', score: 5, effect: FOOD_EFFECTS.SLOW_DOWN, duration: 5000, speedFactor: 0.66, probability: 0.10 },
    GROW_PEAR: { id: 'GROW_PEAR', displayName: 'Grow Pear', description: 'Grows snake by 3 segments.', color: 'var(--food-color-grow)', score: 15, effect: FOOD_EFFECTS.EXTRA_GROWTH, growAmount: 3, probability: 0.10 }
};

export const COMBO_TIMER_DURATION = 3000;
export const COMBO_MIN_FOR_MULTIPLIER = 3;
export const COMBO_SCORE_MULTIPLIER = 1.5;
export const COMBO_ITEM_BONUS_SCORE = 2;

export const SURVIVAL_SPEED_INCREASE_INTERVAL = 10000;
export const SURVIVAL_SPEED_INCREASE_AMOUNT_BASE = 0.5;

export const GAME_MODES = { CLASSIC: 'classic', SURVIVAL: 'survival', CAMPAIGN: 'campaign' };

export const PARTICLE_COUNT_FOOD_CONSUMPTION = 12;
export const PARTICLE_LIFESPAN_FOOD = 600;
export const PARTICLE_BASE_SPEED_FOOD = 1.2;
export const PARTICLE_SIZE_FOOD = 2.5;
export const PARTICLE_GRAVITY_FOOD = 0.03;

export const SCREEN_SHAKE_MAGNITUDE_GAME_OVER = 4;
export const SCREEN_SHAKE_DURATION_GAME_OVER = 150;

export const OBSTACLE_TYPES = { STATIC: 'static', BLINKING: 'blinking' };
export const BLINKING_OBSTACLE_ON_DURATION = 3000;
export const BLINKING_OBSTACLE_OFF_DURATION = 2000;

export const ACHIEVEMENT_STORAGE_KEY = 'snakeGameAchievements';
export const TUTORIAL_COMPLETED_KEY = 'snakeGameTutorialCompleted_v1';
export const ACHIEVEMENTS = {
    SCORE_500: { id: 'SCORE_500', icon: '⭐', name: 'Score Cadet', description: 'Reach 500 points in a single game.', criteria: { scoreInGame: 500 } },
    EAT_10_FOOD: { id: 'EAT_10_FOOD', icon: '🍎', name: 'Novice Eater', description: 'Eat 10 pieces of food in a single game.', criteria: { foodEatenInGame: 10 } },
    COMBO_3: { id: 'COMBO_3', icon: '💥', name: 'Combo Starter', description: 'Achieve a x3 combo count in a single game.', criteria: { maxComboCountInGame: 3 } },
    SURVIVE_30_SECONDS: { id: 'SURVIVE_30_SECONDS', icon: '⏳', name: 'Quick Survivor', description: 'Survive for 30 seconds in any game mode.', criteria: { survivalTimeInSeconds: 30 } },
    OBSTACLE_SCORE_200: { id: 'OBSTACLE_SCORE_200', icon: '🚧', name: 'Obstacle Navigator', description: 'Score over 200 points in a game with obstacles.', criteria: { scoreWithObstacles: 200 } }
};

export const SNAKE_SKIN_STORAGE_KEY = 'snakeGameSelectedSkin';
export const SNAKE_SKINS = {
    DEFAULT: { id: 'DEFAULT', displayName: 'Classic Green', unlockAchievementId: null, colors: { '--snake-head-color': '#4CAF50', '--snake-body-color': '#8BC34A', '--snake-eye-color': '#FFFFFF', '--snake-body-highlight-rgb': '"255, 255, 255"' } },
    OCEAN: { id: 'OCEAN', displayName: 'Ocean Blue', unlockAchievementId: 'SCORE_500', colors: { '--snake-head-color': '#0077b6', '--snake-body-color': '#00b4d8', '--snake-eye-color': '#FFFFFF', '--snake-body-highlight-rgb': '"202, 240, 248"' } },
    SUNSET: { id: 'SUNSET', displayName: 'Sunset Orange', unlockAchievementId: 'COMBO_3', colors: { '--snake-head-color': '#f77f00', '--snake-body-color': '#fcbf49', '--snake-eye-color': '#000000', '--snake-body-highlight-rgb': '"255, 255, 255"' } },
    ROYAL: { id: 'ROYAL', displayName: 'Royal Purple', unlockAchievementId: 'SURVIVE_30_SECONDS', colors: { '--snake-head-color': '#5a189a', '--snake-body-color': '#9d4edd', '--snake-eye-color': '#f1dcf7', '--snake-body-highlight-rgb': '"224, 179, 255"' } }
};

export const DIFFICULTY_LEVELS = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' };
export const OBSTACLE_CONFIG = { NONE: 'NONE', STANDARD: 'STANDARD', CHALLENGING: 'CHALLENGING' };
export const DIFFICULTY_SETTINGS = {
    [DIFFICULTY_LEVELS.EASY]:   { name: "Easy",   initialSpeed: 4, survivalStartSpeed: 3, survivalSpeedFactor: 0.7, obstacleConfig: OBSTACLE_CONFIG.NONE },
    [DIFFICULTY_LEVELS.MEDIUM]: { name: "Medium", initialSpeed: 6, survivalStartSpeed: 4, survivalSpeedFactor: 1.0, obstacleConfig: OBSTACLE_CONFIG.STANDARD },
    [DIFFICULTY_LEVELS.HARD]:   { name: "Hard",   initialSpeed: 8, survivalStartSpeed: 5, survivalSpeedFactor: 1.3, obstacleConfig: OBSTACLE_CONFIG.CHALLENGING }
};

export const CAMPAIGN_PROGRESS_STORAGE_KEY = 'snakeGameCampaignProgress';
export const LEVELS = [
    { level: 1, displayName: "The Beginning", initialSpeed: 4, objective: { type: 'EAT_FOOD', amount: 5 }, obstacleMap: [] },
    { level: 2, displayName: "First Hurdles", initialSpeed: 5, objective: { type: 'EAT_FOOD', amount: 8 }, obstacleMap: [ {x: 5, y: 13}, {x: 6, y: 13}, {x: 7, y: 13}, {x: COLS - 8, y: 13}, {x: COLS - 7, y: 13}, {x: COLS - 6, y: 13} ] },
    { level: 3, displayName: "Now You See Me", initialSpeed: 5.5, objective: { type: 'REACH_LENGTH', amount: 15 }, obstacleMap: [ { type: OBSTACLE_TYPES.BLINKING, x: Math.floor(COLS/2), y: 8, onDuration: 2500, offDuration: 1500 }, { type: OBSTACLE_TYPES.BLINKING, x: Math.floor(COLS/2), y: 9, onDuration: 2500, offDuration: 1500 }, { type: OBSTACLE_TYPES.BLINKING, x: Math.floor(COLS/2), y: 10, onDuration: 2500, offDuration: 1500 }, { type: OBSTACLE_TYPES.BLINKING, x: Math.floor(COLS/2), y: ROWS - 9, onDuration: 2500, offDuration: 1500 }, { type: OBSTACLE_TYPES.BLINKING, x: Math.floor(COLS/2), y: ROWS - 10, onDuration: 2500, offDuration: 1500 } ] }
];

export const KEYS = { /* ... as before ... */ };
export const GAME_STATE = { LOADING: 'loading', READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'gameOver', LEVEL_COMPLETE: 'levelComplete', CAMPAIGN_COMPLETE: 'campaignComplete' };
export const THEME_FILES = { light: 'assets/css/light-theme.css', dark: 'assets/css/dark-theme.css' };
