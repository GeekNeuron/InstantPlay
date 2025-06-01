// assets/js/constants.js

// ... (GRID_SIZE, ROWS, COLS, INITIAL_SNAKE_SPEED, FOOD_SCORE - FOOD_SCORE can be removed or kept as default)

/**
 * Score awarded for eating a standard piece of food (can be overridden by FOOD_TYPES).
 * @type {number}
 */
export const DEFAULT_FOOD_SCORE = 10; // Kept for reference or if FOOD_TYPES fails

/**
 * Identifiers for different food effects.
 * @enum {string}
 */
export const FOOD_EFFECTS = {
    NONE: 'none',
    SPEED_BOOST: 'speedBoost',
    SLOW_DOWN: 'slowDown',
    EXTRA_GROWTH: 'extraGrowth',
    // Future: SCORE_MULTIPLIER, SHIELD, etc. might be better as collectible PowerUps
};

/**
 * Defines the properties of different food types.
 * - id: Unique identifier for the food type.
 * - color: Display color (can be a CSS variable).
 * - score: Points awarded for eating this food.
 * - effect: The type of effect this food has (from FOOD_EFFECTS).
 * - probability: Chance of this food type spawning (adds up to 1 with other types).
 * - duration: (Optional) Duration of the effect in milliseconds.
 * - speedFactor: (Optional) Multiplier for snake speed changes.
 * - growAmount: (Optional) Number of segments the snake grows by.
 */
export const FOOD_TYPES = {
    DEFAULT: {
        id: 'DEFAULT',
        color: 'var(--food-color)', // Default red
        score: 10,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.60 // 60% chance
    },
    GOLDEN_APPLE: {
        id: 'GOLDEN_APPLE',
        color: 'var(--food-color-golden)', // Gold
        score: 50,
        effect: FOOD_EFFECTS.NONE,
        probability: 0.10 // 10% chance
    },
    SPEED_BERRY: {
        id: 'SPEED_BERRY',
        color: 'var(--food-color-speed)', // e.g., Cyan or a bright blue
        score: 5,
        effect: FOOD_EFFECTS.SPEED_BOOST,
        duration: 5000, // 5 seconds
        speedFactor: 1.5, // 50% faster
        probability: 0.10 // 10% chance
    },
    SLOW_SLUG: {
        id: 'SLOW_SLUG',
        color: 'var(--food-color-slow)', // e.g., Orange or a muted color
        score: 5,
        effect: FOOD_EFFECTS.SLOW_DOWN,
        duration: 5000, // 5 seconds
        speedFactor: 0.66, // 33% slower
        probability: 0.10 // 10% chance
    },
    GROW_PEAR: {
        id: 'GROW_PEAR',
        color: 'var(--food-color-grow)', // e.g., Green or purple
        score: 15,
        effect: FOOD_EFFECTS.EXTRA_GROWTH,
        growAmount: 3, // Grows by 3 segments
        probability: 0.10 // 10% chance
    }
};

// ... (KEYS, GAME_STATE, THEME_FILES remain the same)
