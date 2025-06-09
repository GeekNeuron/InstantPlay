// assets/js/achievementManager.js

import { ACHIEVEMENTS, ACHIEVEMENT_STORAGE_KEY, FOOD_TYPES } from './constants.js';

export class AchievementManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.unlockedAchievements = new Set();
        this.foodTypesEatenInGame = new Set();
        this.loadAchievements();
    }

    loadAchievements() {
        try {
            const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
            if (saved) this.unlockedAchievements = new Set(JSON.parse(saved));
        } catch (e) { console.error("Failed to load achievements", e); }
    }

    saveAchievements() {
        try {
            localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...this.unlockedAchievements]));
        } catch (e) { console.error("Failed to save achievements", e); }
    }

    unlock(achievementId) {
        if (ACHIEVEMENTS[achievementId] && !this.unlockedAchievements.has(achievementId)) {
            this.unlockedAchievements.add(achievementId);
            this.saveAchievements();
            if (this.uiManager) this.uiManager.showAchievementNotification(ACHIEVEMENTS[achievementId]);
        }
    }

    resetForNewGame() {
        this.foodTypesEatenInGame.clear();
    }

    trackFoodEaten(foodTypeId) {
        this.foodTypesEatenInGame.add(foodTypeId);
    }
    
    checkAllGameAchievements(stats) {
        if (stats.score >= ACHIEVEMENTS.SCORE_500.criteria.scoreInGame) this.unlock(ACHIEVEMENTS.SCORE_500.id);
        if (stats.foodEatenThisGame >= ACHIEVEMENTS.EAT_10_FOOD.criteria.foodEatenInGame) this.unlock(ACHIEVEMENTS.EAT_10_FOOD.id);
        if (stats.maxComboThisGame >= ACHIEVEMENTS.COMBO_3.criteria.maxComboThisGame) this.unlock(ACHIEVEMENTS.COMBO_3.id);
        if (stats.gameDurationSeconds >= ACHIEVEMENTS.SURVIVOR_30_SECONDS.criteria.survivalTimeInSeconds) this.unlock(ACHIEVEMENTS.SURVIVOR_30_SECONDS.id);
        if (stats.obstaclesWerePresent && stats.score >= ACHIEVEMENTS.OBSTACLE_SCORE_200.criteria.scoreWithObstacles) {
            this.unlock(ACHIEVEMENTS.OBSTACLE_SCORE_200.id);
        }
    }

    getAllAchievementsWithStatus() {
        return Object.entries(ACHIEVEMENTS).map(([id, data]) => ({
            id, ...data,
            unlocked: this.unlockedAchievements.has(id)
        }));
    }

    resetAllAchievements() {
        this.unlockedAchievements.clear();
        this.saveAchievements();
        console.log("All achievements have been reset.");
    }
}
