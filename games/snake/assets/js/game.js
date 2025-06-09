// assets/js/game.js

import { Board } from './board.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';
import { PowerUpManager, POWERUP_COLLECTIBLE_TYPES } from './powerups.js';
import { Particle } from './particle.js';
import { AchievementManager } from './achievementManager.js';
import {
    ROWS, COLS, GAME_STATE, FOOD_EFFECTS, GRID_SIZE,
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE,
    SURVIVAL_SPEED_INCREASE_INTERVAL, SURVIVAL_SPEED_INCREASE_AMOUNT_BASE, GAME_MODES,
    PARTICLE_COUNT_FOOD_CONSUMPTION, PARTICLE_LIFESPAN_FOOD, PARTICLE_BASE_SPEED_FOOD, PARTICLE_SIZE_FOOD, PARTICLE_GRAVITY_FOOD,
    SCREEN_SHAKE_MAGNITUDE_GAME_OVER, SCREEN_SHAKE_DURATION_GAME_OVER,
    ACHIEVEMENTS, DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS, LEVELS
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId, levelInfoId, messageOverlayId, initialDifficultyKey, initialGameMode) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        const uiElements = {
            score: document.getElementById(scoreId),
            highScore: document.getElementById(highScoreId),
            comboDisplay: comboDisplayId ? document.getElementById(comboDisplayId) : null,
            levelInfo: levelInfoId ? document.getElementById(levelInfoId) : null,
        };
        this.gameState = GAME_STATE.LOADING;
        this.gameIntervalId = null;
        this.currentGameMode = initialGameMode;
        this.currentDifficultyLevel = initialDifficultyKey;
        this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
        this.lastSurvivalSpeedIncreaseTime = 0;
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
        this.board = new Board(this.canvas, this.context);
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(uiElements, this);
        this.achievementManager = new AchievementManager(this.uiManager);
        this.score = 0; this.scoreMultiplier = 1; this.isShieldActive = false;
        this.comboCount = 0; this.lastFoodEatTime = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        this.particles = []; this.isShaking = false; this.shakeMagnitude = 0; this.shakeDuration = 0; this.shakeStartTime = 0;
        this.foodEatenThisGame = 0; this.maxComboThisGame = 0; this.gameStartTime = 0;
        this.currentLevel = 1; this.unlockedLevel = 1; this.levelObjective = {}; this.progressTowardsObjective = 0;
        this.init();
    }

    setDifficulty(difficultyLevelKey) {
        if (DIFFICULTY_SETTINGS[difficultyLevelKey] && difficultyLevelKey !== this.currentDifficultyLevel) {
            this.currentDifficultyLevel = difficultyLevelKey;
            this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT_BASE * (this.difficultySettings.survivalSpeedFactor || 1);
            this.gameState = GAME_STATE.READY;
            if (this.gameIntervalId) clearInterval(this.gameIntervalId);
            this.resetGame(); 
            this.draw();
        }
    }
    setGameMode(modeKey) {
        if (Object.values(GAME_MODES).includes(modeKey) && modeKey !== this.currentGameMode) {
            this.currentGameMode = modeKey;
            this.gameState = GAME_STATE.READY;
            if (this.gameIntervalId) clearInterval(this.gameIntervalId);
            this.resetGame();
            this.draw();
        }
    }
    init() {
        this.loadCampaignProgress();
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame(); 
        this.gameState = GAME_STATE.READY;
        this.draw();
    }
    resetGame() {
        const startX = Math.floor(COLS / 4); const startY = Math.floor(ROWS / 2);
        this.board.obstacles = [];
        if (this.currentGameMode === GAME_MODES.CAMPAIGN) {
            const levelData = LEVELS[this.currentLevel - 1];
            if (!levelData) { this.campaignFinished(); return; }
            this.levelObjective = levelData.objective;
            this.snake.initialSpeed = levelData.initialSpeed;
            this.board.setupObstacles(levelData.obstacleMap);
            this.progressTowardsObjective = (this.levelObjective.type === 'REACH_LENGTH') ? this.snake.body.length : 0;
            this.uiManager.updateLevelInfo(this.currentLevel, this.levelObjective, this.progressTowardsObjective);
        } else {
            this.uiManager.hideLevelInfo();
            this.board.setupObstacles(this.difficultySettings.obstacleConfig);
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.snake.initialSpeed = this.difficultySettings.survivalStartSpeed || this.difficultySettings.initialSpeed;
                this.lastSurvivalSpeedIncreaseTime = performance.now();
            } else { this.snake.initialSpeed = this.difficultySettings.initialSpeed; }
        }
        this.applySkin(); this.snake.reset(startX, startY);
        this.inputHandler.reset(); this.food.spawnNew(); this.powerUpManager.reset(); 
        this.score = 0; this.uiManager.updateScore(this.score);
        this.scoreMultiplier = 1; this.isShieldActive = false; 
        this.comboCount = 0; this.lastFoodEatTime = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        if (this.uiManager && this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        this.particles = []; this.isShaking = false;
        this.foodEatenThisGame = 0; this.maxComboThisGame = 0; this.gameStartTime = 0;
        this.achievementManager.resetForNewGame();
    }
    applySkin() {
        let selectedSkinId = localStorage.getItem(SNAKE_SKIN_STORAGE_KEY) || 'DEFAULT';
        if (!SNAKE_SKINS[selectedSkinId]) selectedSkinId = 'DEFAULT';
        const skin = SNAKE_SKINS[selectedSkinId];
        const isUnlocked = !skin.unlockAchievementId || this.achievementManager.unlockedAchievements.has(skin.unlockAchievementId);
        if (isUnlocked) { this.snake.setSkin(skin.colors); }
        else { this.snake.setSkin(SNAKE_SKINS.DEFAULT.colors); localStorage.setItem(SNAKE_SKIN_STORAGE_KEY, 'DEFAULT'); }
    }
    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.gameStartTime = performance.now();
            if (this.currentGameMode === GAME_MODES.SURVIVAL) this.lastSurvivalSpeedIncreaseTime = this.gameStartTime;
            this.updateGameInterval();
        } else if (this.gameState === GAME_STATE.PAUSED) { this.resume(); }
    }
    gameLoop() {
        if (this.gameState !== GAME_STATE.PLAYING) { clearInterval(this.gameIntervalId); return; }
        const currentTime = performance.now();
        this.inputHandler.applyQueuedDirection(); this.update(currentTime); this.draw(currentTime);
    }
    updateGameInterval() {
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);
        const intervalTime = 1000 / this.snake.speed;
        this.gameIntervalId = setInterval(() => this.gameLoop(), intervalTime);
    }
    updateGameSpeed() { if (this.gameState === GAME_STATE.PLAYING) this.updateGameInterval(); }
    createParticleBurst(x,y,count,color,baseSpeed,lifeSpan,size,gravity){/*... as before ...*/}
    triggerScreenShake(magnitude, duration, startTime) { /*... as before ...*/}
    update(currentTime) { /*... as before ...*/ }
    checkLevelObjective() { /*... as before ...*/}
    levelComplete() { /*... as before ...*/}
    campaignFinished() { /*... as before ...*/}
    draw(timestamp) { /*... as before ...*/}
    drawReadyMessage() { /*... as before ...*/}
    drawGameOverMessage() { /*... as before ...*/}
    drawPausedMessage() { /*... as before ...*/}
    drawLevelCompleteMessage() { /*... as before ...*/}
    drawCampaignCompleteMessage() { /*... as before ...*/}
    gameOver(currentTime) { /*... as before ...*/}
    togglePause() { /*... as before ...*/}
    resume() { /*... as before ...*/}
    handleEscape() { this.togglePause(); }
    loadCampaignProgress() { /*... as before ...*/ }
    saveCampaignProgress() { /*... as before ...*/ }
}
