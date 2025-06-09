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
    OBSTACLE_CONFIG, ACHIEVEMENTS,
    DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS, LEVELS, CAMPAIGN_PROGRESS_STORAGE_KEY
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId, levelInfoId, messageOverlayId, initialDifficultyKey, initialGameMode) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Game.constructor: Canvas with id "${canvasId}" not found.`);
        this.context = this.canvas.getContext('2d');
        if (!this.context) throw new Error(`Game.constructor: Could not get 2D context from canvas "${canvasId}".`);

        const uiElements = {
            score: document.getElementById(scoreId),
            highScore: document.getElementById(highScoreId),
            comboDisplay: comboDisplayId ? document.getElementById(comboDisplayId) : null,
            levelInfo: levelInfoId ? document.getElementById(levelInfoId) : null,
            achievementNotification: document.getElementById('achievement-notification'),
            messageOverlay: messageOverlayId ? document.getElementById(messageOverlayId) : null
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

        this.score = 0;
        this.scoreMultiplier = 1;
        this.isShieldActive = false;
        
        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        
        this.particles = [];
        this.isShaking = false;
        this.shakeMagnitude = 0;
        this.shakeDuration = 0;
        this.shakeStartTime = 0;
        
        this.foodEatenThisGame = 0;
        this.maxComboThisGame = 0;
        this.gameStartTime = 0;
        
        this.currentLevel = 1;
        this.unlockedLevel = 1;
        this.levelObjective = {};
        this.progressTowardsObjective = 0;
        
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
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        if (this.currentGameMode === GAME_MODES.CAMPAIGN) {
            this.currentLevel = this.unlockedLevel; // Start from the highest unlocked level
            const levelData = LEVELS[this.currentLevel - 1];
            if (levelData) {
                this.levelObjective = levelData.objective;
                this.snake.initialSpeed = levelData.initialSpeed;
                this.board.setupObstacles(levelData.obstacleMap);
                this.progressTowardsObjective = (this.levelObjective.type === 'REACH_LENGTH') ? this.snake.body.length : 0;
                this.uiManager.updateLevelInfo(this.currentLevel, this.levelObjective, this.progressTowardsObjective);
            } else {
                this.campaignFinished(); // Handle case where all levels are complete
                return;
            }
        } else {
            this.uiManager.hideLevelInfo();
            this.board.setupObstacles(this.difficultySettings.obstacleConfig);
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.snake.initialSpeed = this.difficultySettings.survivalStartSpeed || this.difficultySettings.initialSpeed;
                this.lastSurvivalSpeedIncreaseTime = performance.now();
            } else {
                this.snake.initialSpeed = this.difficultySettings.initialSpeed;
            }
        }
        
        this.applySkin();
        this.snake.reset(startX, startY); 
        this.inputHandler.reset();
        this.food.spawnNew(); 
        this.powerUpManager.reset(); 
        
        this.score = 0;
        this.uiManager.updateScore(this.score);
        
        this.scoreMultiplier = 1; 
        this.isShieldActive = false; 

        this.comboCount = 0;
        this.lastFoodEatTime = 0;
        this.activeComboMultiplier = 1;
        this.currentComboBonusScore = 0;
        if (this.uiManager && this.uiManager.updateComboDisplay) {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        
        this.particles = []; 
        this.isShaking = false;

        this.foodEatenThisGame = 0;
        this.maxComboThisGame = 0;
        this.gameStartTime = 0;
        this.achievementManager.resetForNewGame();
    }

    applySkin() {
        let selectedSkinId = localStorage.getItem(SNAKE_SKIN_STORAGE_KEY) || 'DEFAULT';
        if (!SNAKE_SKINS[selectedSkinId]) selectedSkinId = 'DEFAULT';
        const skin = SNAKE_SKINS[selectedSkinId];
        const isUnlocked = !skin.unlockAchievementId || this.achievementManager.unlockedAchievements.has(skin.unlockAchievementId);
        if (isUnlocked) {
            this.snake.setSkin(skin.colors);
        } else {
            this.snake.setSkin(SNAKE_SKINS.DEFAULT.colors);
            localStorage.setItem(SNAKE_SKIN_STORAGE_KEY, 'DEFAULT');
        }
    }

    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.gameStartTime = performance.now();
            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.lastSurvivalSpeedIncreaseTime = this.gameStartTime;
            }
            this.updateGameInterval();
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    gameLoop() {
        if (this.gameState !== GAME_STATE.PLAYING) {
            clearInterval(this.gameIntervalId);
            return;
        }
        const currentTime = performance.now();
        this.inputHandler.applyQueuedDirection();
        this.update(currentTime); 
        this.draw(currentTime);
    }
    
    updateGameInterval() {
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);
        const intervalTime = 1000 / this.snake.speed;
        this.gameIntervalId = setInterval(() => this.gameLoop(), intervalTime);
    }

    updateGameSpeed() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.updateGameInterval();
        }
    }

    createParticleBurst(x, y, count, colorCssVar, baseSpeed, lifeSpan, particleSize, gravity) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = baseSpeed * (0.5 + Math.random() * 0.8);
            const velocity = {
                vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
                vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5
            };
            try {
                this.particles.push(new Particle(x, y, particleSize, colorCssVar, velocity, lifeSpan, gravity));
            } catch(e) { /* Fail silently if Particle class isn't loaded */ }
        }
    }

    triggerScreenShake(magnitude, duration, startTime) {
        this.isShaking = true;
        this.shakeMagnitude = magnitude;
        this.shakeDuration = duration;
        this.shakeStartTime = startTime || performance.now();
    }

    update(currentTime) {
        this.board.updateObstacles(currentTime);
        this.snake.move();
        this.powerUpManager.update(currentTime);
        this.particles.forEach((p, i) => { if (!p.isAlive()) this.particles.splice(i, 1); else p.update(16); });
        if (this.isShaking && (currentTime - this.shakeStartTime >= this.shakeDuration)) this.isShaking = false;

        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) {
            if (currentTime - this.lastSurvivalSpeedIncreaseTime > SURVIVAL_SPEED_INCREASE_INTERVAL) {
                let speedIncrease = this.currentSurvivalSpeedIncreaseAmount;
                if (this.snake.speedBeforeFoodEffect !== null) {
                    this.snake.speedBeforeFoodEffect += speedIncrease;
                } else {
                     this.snake.speed += speedIncrease;
                }
                if (this.snake.speed < 0.5) this.snake.speed = 0.5;
                this.updateGameInterval();
                this.lastSurvivalSpeedIncreaseTime = currentTime;
            }
        }

        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) {
            this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);
            this.comboCount = 0;
            this.activeComboMultiplier = 1;
            this.currentComboBonusScore = 0;
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        const foodData = this.food.getData();
        const headPos = this.snake.getHeadPosition();
        if (foodData && arePositionsEqual(headPos, this.food.getPosition())) {
            const eatenFoodPosition = { ...this.food.getPosition() }; 
            const eatenFoodColorVar = foodData.color; 
            this.foodEatenThisGame++;
            this.achievementManager.trackFoodEaten(foodData.id);

            if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime) < COMBO_TIMER_DURATION) { this.comboCount++; }
            else { this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount); this.comboCount = 1; }
            this.lastFoodEatTime = currentTime;
            this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);

            if (this.comboCount >= COMBO_MIN_FOR_MULTIPLIER) this.activeComboMultiplier = COMBO_SCORE_MULTIPLIER;
            else this.activeComboMultiplier = 1;
            this.currentComboBonusScore = (this.comboCount > 1) ? (this.comboCount - 1) * COMBO_ITEM_BONUS_SCORE : 0;
            
            let baseFoodScore = foodData.score;
            let finalScoreForFood = (baseFoodScore + this.currentComboBonusScore) * this.activeComboMultiplier;
            finalScoreForFood *= this.scoreMultiplier; 
            this.score += Math.round(finalScoreForFood);
            
            this.achievementManager.checkAllGameAchievements({ score: this.score, foodEatenThisGame: this.foodEatenThisGame, maxComboThisGame: this.maxComboThisGame, foodTypesEaten: this.achievementManager.foodTypesEatenInGame.size, snakeLength: this.snake.body.length });
            
            this.uiManager.updateScore(this.score);
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
            
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST: this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration); break;
                case FOOD_EFFECTS.SLOW_DOWN: this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration); break;
                case FOOD_EFFECTS.EXTRA_GROWTH: this.snake.grow(foodData.growAmount); break;
                default: this.snake.grow(1); break;
            }
            this.food.spawnNew(); 
            this.createParticleBurst(eatenFoodPosition.x * GRID_SIZE + GRID_SIZE / 2, eatenFoodPosition.y * GRID_SIZE + GRID_SIZE / 2, PARTICLE_COUNT_FOOD_CONSUMPTION, eatenFoodColorVar, PARTICLE_BASE_SPEED_FOOD, PARTICLE_LIFESPAN_FOOD, PARTICLE_SIZE_FOOD, PARTICLE_GRAVITY_FOOD);
        }

        if (this.snake.checkCollision()) {
            let hitAbsorbedByShield = false;
            if (this.isShieldActive) { if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) { hitAbsorbedByShield = true; } }
            if (!hitAbsorbedByShield) { this.gameOver(currentTime); }
        }

        if (this.currentGameMode === GAME_MODES.CAMPAIGN) {
            if (this.levelObjective.type === 'REACH_LENGTH') {
                this.progressTowardsObjective = this.snake.body.length;
            }
            this.uiManager.updateLevelInfo(this.currentLevel, this.levelObjective, this.progressTowardsObjective);
            this.checkLevelObjective();
        }
    }

    checkLevelObjective() {
        if (this.gameState !== GAME_STATE.PLAYING || this.currentGameMode !== GAME_MODES.CAMPAIGN) return;
        let objectiveMet = false;
        switch(this.levelObjective.type) {
            case 'EAT_FOOD': if (this.progressTowardsObjective >= this.levelObjective.amount) objectiveMet = true; break;
            case 'REACH_LENGTH': if (this.progressTowardsObjective >= this.levelObjective.amount) objectiveMet = true; break;
        }
        if (objectiveMet) this.levelComplete();
    }

    levelComplete() {
        this.gameState = GAME_STATE.LEVEL_COMPLETE;
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);
        if (this.currentLevel === this.unlockedLevel && this.unlockedLevel < LEVELS.length) {
            this.unlockedLevel++;
            this.saveCampaignProgress();
        }
        this.draw();
        setTimeout(() => {
            if (this.currentLevel < LEVELS.length) {
                this.currentLevel++;
                this.start();
            } else { this.campaignFinished(); }
        }, 2500);
    }
    
    campaignFinished() {
        this.gameState = GAME_STATE.CAMPAIGN_COMPLETE;
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);
        this.draw();
    }

    draw(timestamp) {
        if(!this.context) return;
        this.context.save(); 
        if (this.isShaking) {
            const elapsedShakeTime = (timestamp || performance.now()) - this.shakeStartTime;
            if (elapsedShakeTime < this.shakeDuration) {
                const remainingRatio = 1 - (elapsedShakeTime / this.shakeDuration);
                const currentMagnitude = this.shakeMagnitude * remainingRatio;
                const shakeX = (Math.random() - 0.5) * 2 * currentMagnitude;
                const shakeY = (Math.random() - 0.5) * 2 * currentMagnitude;
                this.context.translate(shakeX, shakeY);
            } else { this.isShaking = false; }
        }
        this.board.draw(); this.food.draw(this.context);
        this.powerUpManager.draw(this.context); this.snake.draw(this.context);
        this.particles.forEach(particle => particle.draw(this.context));
        
        if (this.gameState === GAME_STATE.LEVEL_COMPLETE) this.drawLevelCompleteMessage();
        else if (this.gameState === GAME_STATE.CAMPAIGN_COMPLETE) this.drawCampaignCompleteMessage();
        else if (this.gameState === GAME_STATE.GAME_OVER && !this.isShaking) this.drawGameOverMessage();
        else if (this.gameState === GAME_STATE.PAUSED) this.drawPausedMessage();
        else if (this.gameState === GAME_STATE.READY) this.drawReadyMessage();
        
        this.context.restore(); 
    }

    drawReadyMessage() { /* ... as before ... */ }
    drawGameOverMessage() { /* ... as before ... */ }
    drawPausedMessage() { /* ... as before ... */ }
    
    drawLevelCompleteMessage() {
        this.context.fillStyle = 'rgba(20, 150, 20, 0.8)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 3);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.8);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.textAlign = 'center';
        this.context.fillText(`Level ${this.currentLevel} Complete!`, this.canvas.width / 2, this.canvas.height / 2 - 10);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        if (this.currentLevel < LEVELS.length) {
            this.context.fillText(`Loading Level ${this.currentLevel + 1}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    drawCampaignCompleteMessage() {
        this.context.fillStyle = 'rgba(212, 175, 55, 0.85)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 3);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.8);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = '#FFFFFF';
        this.context.textAlign = 'center';
        this.context.fillText('Campaign Complete!', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.context.font = `${Math.min(16, GRID_SIZE)}px ${mainFont}`;
        this.context.fillText('Congratulations!', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }


    gameOver(currentTime) {
        this.achievementManager.updateGamesPlayed();
        const gameDurationSeconds = (this.gameStartTime > 0) ? (currentTime - this.gameStartTime) / 1000 : 0;
        this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);
        this.achievementManager.checkAllGameAchievements({
            score: this.score, foodEatenThisGame: this.foodEatenThisGame,
            maxComboThisGame: this.maxComboThisGame, gameDurationSeconds: gameDurationSeconds,
            obstaclesWerePresent: this.board.obstacles.length > 0
        });
        if (this.gameState === GAME_STATE.PLAYING) { 
             this.triggerScreenShake(SCREEN_SHAKE_MAGNITUDE_GAME_OVER, SCREEN_SHAKE_DURATION_GAME_OVER, currentTime);
        }
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameIntervalId) { clearInterval(this.gameIntervalId); this.gameIntervalId = null; }
        this.snake.revertSpeed(); this.powerUpManager.reset(); this.uiManager.updateHighScore();
        if (!this.isShaking) this.draw(performance.now());
    }

    togglePause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameIntervalId) { clearInterval(this.gameIntervalId); this.gameIntervalId = null; }
            this.draw(performance.now()); 
        } else if (this.gameState === GAME_STATE.PAUSED) { this.resume(); } 
        else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) { this.start(); }
    }
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.updateGameInterval();
        }
    }
    handleEscape() { this.togglePause(); }
    loadCampaignProgress() {
        const saved = localStorage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY);
        if (saved) {
            this.unlockedLevel = Math.min(parseInt(saved, 10), LEVELS.length + 1);
        }
    }
    saveCampaignProgress() {
        localStorage.setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, this.unlockedLevel.toString());
    }
}
