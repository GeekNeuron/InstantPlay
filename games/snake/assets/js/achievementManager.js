// assets/js/achievementManager.js

import { ACHIEVEMENTS, ACHIEVEMENT_STORAGE_KEY } from './constants.js';

/**
 * Manages game achievements, including loading, saving, unlocking, and notifications.
 */
export class AchievementManager {
    /**
     * Initializes the AchievementManager.
     * @param {UIManager} uiManager - An instance of UIManager to show unlock notifications.
     */
    constructor(uiManager) {
        this.uiManager = uiManager;
        // Create a deep copy of the ACHIEVEMENTS constant to store runtime state (unlocked status)
        this.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS));
        this.loadAchievements(); // Load previously unlocked achievements
    }

    /**
     * Loads the unlocked status of achievements from localStorage.
     */
    loadAchievements() {
        try {
            const storedAchievements = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
            if (storedAchievements) {
                const unlockedIds = JSON.parse(storedAchievements);
                for (const id in this.achievements) {
                    if (unlockedIds.includes(id)) {
                        this.achievements[id].unlocked = true;
                    }
                }
                // console.log("Achievements loaded from localStorage:", unlockedIds);
            }
        } catch (e) {
            console.error("AchievementManager: Error loading achievements from localStorage", e);
        }
    }

    /**
     * Saves the IDs of all currently unlocked achievements to localStorage.
     */
    saveAchievements() {
        try {
            const unlockedIds = [];
            for (const id in this.achievements) {
                if (this.achievements[id].unlocked) {
                    unlockedIds.push(id);
                }
            }
            localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlockedIds));
            // console.log("Achievements saved to localStorage:", unlockedIds);
        } catch (e) {
            console.error("AchievementManager: Error saving achievements to localStorage", e);
        }
    }

    /**
     * Unlocks a specific achievement if its conditions are met and it's not already unlocked.
     * Shows a notification via UIManager.
     * @param {string} achievementId - The ID of the achievement to unlock (must match a key in ACHIEVEMENTS).
     * @returns {boolean} True if the achievement was newly unlocked, false otherwise.
     */
    unlockAchievement(achievementId) {
        if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            this.saveAchievements();
            console.log(`Achievement Unlocked: ${this.achievements[achievementId].name}`);
            if (this.uiManager && typeof this.uiManager.showAchievementUnlockedNotification === 'function') {
                this.uiManager.showAchievementUnlockedNotification(
                    this.achievements[achievementId].name,
                    this.achievements[achievementId].description,
                    this.achievements[achievementId].icon
                );
            }
            return true; // Indicates a new unlock
        }
        return false; // Already unlocked or invalid ID
    }

    // --- Specific check methods for defined achievements ---

    /**
     * Checks if score-related achievements have been met.
     * @param {number} currentScore - The player's current score in the game.
     */
    checkScoreAchievements(currentScore) {
        if (currentScore >= ACHIEVEMENTS.SCORE_MILESTONE_1.criteria.scoreInGame) {
            this.unlockAchievement(ACHIEVEMENTS.SCORE_MILESTONE_1.id);
        }
        // Add checks for other score milestones here
    }

    /**
     * Checks if food-related achievements have been met.
     * @param {number} foodEatenInGame - Total food eaten in the current game.
     */
    checkFoodEatenAchievements(foodEatenInGame) {
        if (foodEatenInGame >= ACHIEVEMENTS.NOVICE_EATER.criteria.foodEatenInGame) {
            this.unlockAchievement(ACHIEVEMENTS.NOVICE_EATER.id);
        }
        // Add checks for other food-eating achievements here
    }

    /**
     * Checks if combo-related achievements have been met.
     * @param {number} maxComboCountInGame - The maximum combo count achieved in the current game.
     */
    checkComboAchievements(maxComboCountInGame) {
        if (maxComboCountInGame >= ACHIEVEMENTS.COMBO_MASTER_BEGINNER.criteria.maxComboCountInGame) {
            this.unlockAchievement(ACHIEVEMENTS.COMBO_MASTER_BEGINNER.id);
        }
        // Add checks for higher combo achievements here
    }

    /**
     * Checks if survival time related achievements have been met.
     * @param {number} survivalTimeInSeconds - Duration of the current game in seconds.
     */
    checkSurvivalTimeAchievements(survivalTimeInSeconds) {
        if (survivalTimeInSeconds >= ACHIEVEMENTS.SURVIVOR_30_SECONDS.criteria.survivalTimeInSeconds) {
            this.unlockAchievement(ACHIEVEMENTS.SURVIVOR_30_SECONDS.id);
        }
        // Add checks for longer survival times here
    }

    /**
     * Checks achievements related to scoring in a game with obstacles.
     * @param {number} currentScore - The player's current score.
     * @param {boolean} obstaclesWerePresent - True if obstacles were active in the game.
     */
    checkObstacleScoreAchievement(currentScore, obstaclesWerePresent) {
        if (obstaclesWerePresent && currentScore >= ACHIEVEMENTS.OBSTACLE_NAVIGATOR.criteria.scoreWithObstacles) {
            this.unlockAchievement(ACHIEVEMENTS.OBSTACLE_NAVIGATOR.id);
        }
    }

    /**
     * A general method to check all relevant achievements based on current game statistics.
     * This is typically called at significant game events like score changes or game over.
     * @param {object} gameStats - An object containing relevant stats from the game.
     * Expected properties: score, foodEatenThisGame, maxComboThisGame, gameDurationSeconds, obstaclesWerePresent.
     */
    checkAllGameAchievements(gameStats) {
        if (typeof gameStats.score !== 'undefined') {
            this.checkScoreAchievements(gameStats.score);
        }
        if (typeof gameStats.foodEatenThisGame !== 'undefined') {
            this.checkFoodEatenAchievements(gameStats.foodEatenThisGame);
        }
        if (typeof gameStats.maxComboThisGame !== 'undefined') {
            this.checkComboAchievements(gameStats.maxComboThisGame);
        }
        if (typeof gameStats.gameDurationSeconds !== 'undefined') {
            this.checkSurvivalTimeAchievements(gameStats.gameDurationSeconds);
        }
        if (typeof gameStats.score !== 'undefined' && typeof gameStats.obstaclesWerePresent !== 'undefined') {
            this.checkObstacleScoreAchievement(gameStats.score, gameStats.obstaclesWerePresent);
        }
    }

    /**
     * Gets a list of all achievements that have been unlocked.
     * @returns {Array<object>} An array of unlocked achievement objects.
     */
    getUnlockedAchievements() {
        const unlocked = [];
        for (const id in this.achievements) {
            if (this.achievements[id].unlocked) {
                unlocked.push(this.achievements[id]);
            }
        }
        return unlocked;
    }

    /**
     * Gets the status of all defined achievements.
     * @returns {Array<object>} An array of all achievement objects, including their unlocked status.
     */
    getAllAchievementsStatus() {
        return Object.values(this.achievements); // Returns an array of all achievement objects
    }

    /**
     * Resets the unlocked status of all achievements. Useful for testing.
     */
    resetAllAchievements() {
        for (const id in this.achievements) {
            this.achievements[id].unlocked = false;
        }
        this.saveAchievements(); // Save the reset state
        console.log("AchievementManager: All achievements have been reset.");
        // Optionally, clear localStorage directly if saveAchievements doesn't overwrite empty array correctly
        // localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
    }
}
