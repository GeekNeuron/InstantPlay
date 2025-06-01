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
    ROWS, COLS, GAME_STATE, FOOD_EFFECTS, INITIAL_SNAKE_SPEED, GRID_SIZE,
    COMBO_TIMER_DURATION, COMBO_MIN_FOR_MULTIPLIER, COMBO_SCORE_MULTIPLIER, COMBO_ITEM_BONUS_SCORE,
    SURVIVAL_START_SPEED, SURVIVAL_SPEED_INCREASE_INTERVAL, SURVIVAL_SPEED_INCREASE_AMOUNT, GAME_MODES,
    PARTICLE_COUNT_FOOD_CONSUMPTION, PARTICLE_LIFESPAN_FOOD, PARTICLE_BASE_SPEED_FOOD, PARTICLE_SIZE_FOOD, PARTICLE_GRAVITY_FOOD,
    SCREEN_SHAKE_MAGNITUDE_GAME_OVER, SCREEN_SHAKE_DURATION_GAME_OVER,
    OBSTACLE_TYPES, ACHIEVEMENTS,
    DIFFICULTY_LEVELS, DIFFICULTY_SETTINGS // Import Difficulty constants
} from './constants.js';
import { arePositionsEqual, getCssVariable } from './utils.js';

export class Game {
    constructor(canvasId, scoreId, highScoreId, comboDisplayId = null, messageOverlayId = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Game.constructor: Canvas with id "${canvasId}" not found.`);
        this.context = this.canvas.getContext('2d');
        if (!this.context) throw new Error(`Game.constructor: Could not get 2D context from canvas "${canvasId}".`);

        const scoreElement = document.getElementById(scoreId);
        const highScoreElement = document.getElementById(highScoreId);
        const comboDisplayElement = comboDisplayId ? document.getElementById(comboDisplayId) : null;
        const resolvedMessageOverlayElement = messageOverlayId ? document.getElementById(messageOverlayId) : null;

        this.gameState = GAME_STATE.LOADING;
        this.lastFrameTime = 0;
        this.gameLoopRequestId = null;

        // --- Game Mode & Difficulty ---
        this.currentGameMode = GAME_MODES.SURVIVAL; // Default to Survival for testing
        // this.currentGameMode = GAME_MODES.CLASSIC;
        this.currentDifficultyLevel = DIFFICULTY_LEVELS.MEDIUM; // Default difficulty
        // To test other difficulties, change the line above, e.g.:
        // this.currentDifficultyLevel = DIFFICULTY_LEVELS.EXTREME;
        this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
        console.log(`Game Mode: ${this.currentGameMode}, Difficulty: ${this.difficultySettings.name}`);


        // --- Survival Mode Specific ---
        this.lastSurvivalSpeedIncreaseTime = 0;
        this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT * (this.difficultySettings.survivalSpeedFactor || 1);


        this.board = new Board(this.canvas, this.context);
        // Pass difficultySettings to board if obstacles depend on it.
        // For now, board.setupDefaultObstacles doesn't use difficulty, but it could.
        // this.board.setDifficulty(this.difficultySettings.obstacleFactor); 
        this.snake = new Snake(Math.floor(COLS / 4), Math.floor(ROWS / 2), this.board, this);
        this.powerUpManager = new PowerUpManager(this.board, this.snake, this);
        this.food = new Food(this.board, this.snake, this.powerUpManager);
        this.inputHandler = new InputHandler(this);
        this.uiManager = new UIManager(scoreElement, highScoreElement, comboDisplayElement, resolvedMessageOverlayElement, this);
        this.achievementManager = new AchievementManager(this.uiManager);

        this.score = 0;
        this.scoreMultiplier = 1;
        this.isShieldActive = false;
        this.effectiveGameSpeed = this.snake.speed;

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

        this.init();
    }

    /**
     * Call this method if the user selects a new difficulty level from a UI.
     * @param {string} difficultyLevelKey - e.g., DIFFICULTY_LEVELS.EASY
     */
    setDifficulty(difficultyLevelKey) {
        if (DIFFICULTY_SETTINGS[difficultyLevelKey]) {
            this.currentDifficultyLevel = difficultyLevelKey;
            this.difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficultyLevel];
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT * (this.difficultySettings.survivalSpeedFactor || 1);
            console.log(`Difficulty changed to: ${this.difficultySettings.name}`);
            // Reset the game for the new difficulty to take effect
            if (this.gameState === GAME_STATE.PLAYING || this.gameState === GAME_STATE.PAUSED || this.gameState === GAME_STATE.GAME_OVER) {
                this.resetGame();
                this.gameState = GAME_STATE.READY; // Go to ready screen to start with new difficulty
                this.draw(performance.now());
            }
        } else {
            console.warn("Attempted to set invalid difficulty level:", difficultyLevelKey);
        }
    }


    init() {
        this.uiManager.resetScore();
        this.uiManager.loadHighScore();
        this.uiManager.updateHighScoreDisplay();
        this.resetGame();
        this.gameState = GAME_STATE.READY;
        if (this.uiManager.updateComboDisplay) {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        this.draw(performance.now());
    }

    resetGame() {
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);

        this.board.obstacles = [];
        // Pass difficulty factor to obstacle setup if it's designed to use it
        // this.board.setupDefaultObstacles(this.difficultySettings.obstacleFactor); 
        this.board.setupDefaultObstacles(); // Current setupDefaultObstacles is not difficulty-aware

        // Set snake's initial speed based on selected difficulty
        this.snake.initialSpeed = this.difficultySettings.initialSpeed;
        if (this.currentGameMode === GAME_MODES.SURVIVAL) {
            this.lastSurvivalSpeedIncreaseTime = performance.now();
            // Ensure the survival specific increase amount is also set based on difficulty
            this.currentSurvivalSpeedIncreaseAmount = SURVIVAL_SPEED_INCREASE_AMOUNT * (this.difficultySettings.survivalSpeedFactor || 1);
        }
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
        if (this.uiManager && typeof this.uiManager.updateComboDisplay === 'function') {
            this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        
        this.particles = []; 
        this.isShaking = false;

        this.foodEatenThisGame = 0;
        this.maxComboThisGame = 0;
        this.gameStartTime = 0;

        this.updateGameSpeed();
    }

    start() {
        if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.resetGame(); 
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            this.gameStartTime = this.lastFrameTime; 

            if (this.currentGameMode === GAME_MODES.SURVIVAL) {
                this.lastSurvivalSpeedIncreaseTime = this.lastFrameTime;
            }
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        }
    }

    gameLoop(timestamp) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            return;
        }
        this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        const deltaTime = timestamp - this.lastFrameTime;
        const interval = 1000 / this.snake.speed; 
        if (deltaTime >= interval) {
            this.lastFrameTime = timestamp - (deltaTime % interval);
            this.inputHandler.applyQueuedDirection();
            this.update(timestamp); 
            this.draw(timestamp);
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
            } catch (e) { /* console.error("Failed to create particle", e); */ }
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

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(16); 
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.isShaking && (currentTime - this.shakeStartTime >= this.shakeDuration)) {
            this.isShaking = false;
        }

        // Survival Mode: Increase speed over time using difficulty-adjusted amount
        if (this.currentGameMode === GAME_MODES.SURVIVAL && this.gameState === GAME_STATE.PLAYING) {
            if (currentTime - this.lastSurvivalSpeedIncreaseTime > SURVIVAL_SPEED_INCREASE_INTERVAL) {
                let speedIncreaseAmount = this.currentSurvivalSpeedIncreaseAmount;

                if (this.snake.speedBeforeFoodEffect !== null) {
                    // If a food speed effect is active, adjust the base speed it will revert to
                    this.snake.speedBeforeFoodEffect += speedIncreaseAmount;
                    // And re-apply the food effect's factor to this new, higher base
                    const factor = this.snake.speed / (this.snake.speedBeforeFoodEffect - speedIncreaseAmount); // Previous factor
                    this.snake.speed = this.snake.speedBeforeFoodEffect * factor;
                } else {
                     this.snake.speed += speedIncreaseAmount;
                }
                if (this.snake.speed < 0.5) this.snake.speed = 0.5; // Clamp min speed

                this.updateGameSpeed();
                this.lastSurvivalSpeedIncreaseTime = currentTime;
            }
        }

        // Combo break check
        if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime > COMBO_TIMER_DURATION)) {
            this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);
            this.comboCount = 0;
            this.activeComboMultiplier = 1;
            this.currentComboBonusScore = 0;
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }

        // Food eating and combo logic
        const foodData = this.food.getData();
        const headPos = this.snake.getHeadPosition();
        if (foodData && arePositionsEqual(headPos, this.food.getPosition())) {
            const eatenFoodPosition = { ...this.food.getPosition() }; 
            const eatenFoodColorVar = foodData.color; 

            this.foodEatenThisGame++;

            if (this.comboCount > 0 && (currentTime - this.lastFoodEatTime) < COMBO_TIMER_DURATION) {
                this.comboCount++;
            } else {
                this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);
                this.comboCount = 1;
            }
            this.lastFoodEatTime = currentTime;
            this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);

            if (this.comboCount >= COMBO_MIN_FOR_MULTIPLIER) this.activeComboMultiplier = COMBO_SCORE_MULTIPLIER;
            else this.activeComboMultiplier = 1;
            this.currentComboBonusScore = (this.comboCount > 1) ? (this.comboCount - 1) * COMBO_ITEM_BONUS_SCORE : 0;
            
            let baseFoodScore = foodData.score;
            let finalScoreForFood = (baseFoodScore + this.currentComboBonusScore) * this.activeComboMultiplier;
            finalScoreForFood *= this.scoreMultiplier; 
            this.score += Math.round(finalScoreForFood);
            
            this.achievementManager.checkAllGameAchievements({
                score: this.score,
                foodEatenThisGame: this.foodEatenThisGame,
                maxComboThisGame: this.maxComboThisGame
            });
            
            this.uiManager.updateScore(this.score);
            if (this.uiManager.updateComboDisplay) this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
            
            switch (foodData.effect) {
                case FOOD_EFFECTS.SPEED_BOOST: this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration); break;
                case FOOD_EFFECTS.SLOW_DOWN: this.snake.setTemporarySpeed(foodData.speedFactor, foodData.duration); break;
                case FOOD_EFFECTS.EXTRA_GROWTH: this.snake.grow(foodData.growAmount); break;
                default: this.snake.grow(1); break;
            }
            this.food.spawnNew(); 
            this.createParticleBurst( /* ... */ );
        }

        // Collision check
        if (this.snake.checkCollision()) {
            let hitAbsorbedByShield = false;
            if (this.isShieldActive) { 
                if (this.powerUpManager.handleHitWithEffect(POWERUP_COLLECTIBLE_TYPES.SHIELD)) {
                    hitAbsorbedByShield = true;
                }
            }
            if (!hitAbsorbedByShield) {
                this.gameOver(currentTime); 
            }
        }
    }

    draw(timestamp) {
        this.context.save(); 
        if (this.isShaking) {
            const elapsedShakeTime = (timestamp || performance.now()) - this.shakeStartTime;
            if (elapsedShakeTime < this.shakeDuration) {
                const remainingRatio = 1 - (elapsedShakeTime / this.shakeDuration);
                const currentMagnitude = this.shakeMagnitude * remainingRatio;
                const shakeX = (Math.random() - 0.5) * 2 * currentMagnitude;
                const shakeY = (Math.random() - 0.5) * 2 * currentMagnitude;
                this.context.translate(shakeX, shakeY);
            } else {
                this.isShaking = false; 
            }
        }
        this.board.draw();
        this.food.draw(this.context);
        this.powerUpManager.draw(this.context);
        this.snake.draw(this.context);
        this.particles.forEach(particle => particle.draw(this.context));
        
        if (this.gameState === GAME_STATE.GAME_OVER && !this.isShaking) {
             this.drawGameOverMessage();
        } else if (this.gameState === GAME_STATE.GAME_OVER && this.isShaking) {
            // Optionally draw nothing or simpler message during shake
        } else if (this.gameState === GAME_STATE.PAUSED) {
             this.drawPausedMessage();
        } else if (this.gameState === GAME_STATE.READY) {
             this.drawReadyMessage();
        }
        
        this.context.restore(); 
    }

    drawReadyMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.context.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(24, GRID_SIZE * 1.5);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.textAlign = 'center';
        this.context.fillText('Snake Game 🌌', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText(`Mode: ${this.currentGameMode} | Difficulty: ${this.difficultySettings.name}`, this.canvas.width / 2, this.canvas.height / 2 + 20); // Show current mode/difficulty
        this.context.fillText('Press Space or Swipe/Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + 40); // Adjust Y
    }

    drawGameOverMessage() {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.context.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 2.5);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.8);
        const scoreFontSize = Math.min(18, GRID_SIZE * 1.2);
        const instructionFontSize = Math.min(16, GRID_SIZE);
        let yPos = this.canvas.height / 2 - 40;
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--food-color', '#FF5252');
        this.context.textAlign = 'center';
        this.context.fillText('Game Over!', this.canvas.width / 2, yPos);
        yPos += titleFontSize * 1.2;
        this.context.font = `${scoreFontSize}px ${mainFont}`;
        this.context.fillStyle = getCssVariable('--text-color-on-overlay', '#FFFFFF');
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.2;
        this.context.fillText(`High Score: ${this.uiManager.highScore}`, this.canvas.width / 2, yPos);
        yPos += scoreFontSize * 1.5;
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillText('Press Space or Tap to Restart', this.canvas.width / 2, yPos);
    }

    drawPausedMessage() {
        const overlayBgColor = getCssVariable('--modal-overlay-bg', 'rgba(0, 0, 0, 0.75)');
        this.context.fillStyle = overlayBgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const boxWidth = Math.min(this.canvas.width * 0.7, 300);
        const boxHeight = GRID_SIZE * 10;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;
        const boxBgColor = getCssVariable('--modal-content-bg', '#333333');
        this.context.fillStyle = boxBgColor;
        this.context.fillRect(boxX, boxY, boxWidth, boxHeight);
        const boxBorderColor = getCssVariable('--border-color', '#444444');
        this.context.strokeStyle = boxBorderColor;
        this.context.lineWidth = 2;
        this.context.strokeRect(boxX, boxY, boxWidth, boxHeight);
        const mainFont = getCssVariable('--font-main', 'Arial');
        const titleColor = getCssVariable('--accent-color', '#FFEB3B');
        const instructionColor = getCssVariable('--modal-text-color', '#FFFFFF');
        const titleFontSize = Math.min(28, GRID_SIZE * 1.7);
        this.context.font = `bold ${titleFontSize}px ${mainFont}`;
        this.context.fillStyle = titleColor;
        this.context.textAlign = 'center';
        let textY = boxY + boxHeight * 0.35;
        this.context.fillText('GAME PAUSED', this.canvas.width / 2, textY);
        const instructionFontSize = Math.min(15, GRID_SIZE * 0.9);
        this.context.font = `${instructionFontSize}px ${mainFont}`;
        this.context.fillStyle = instructionColor;
        textY += titleFontSize * 0.8 + instructionFontSize * 0.5;
        this.context.fillText('Press SPACE / ESC / TAP to Resume', this.canvas.width / 2, textY);
    }

    gameOver(currentTime) {
        const gameDurationSeconds = (this.gameStartTime > 0) ? (currentTime - this.gameStartTime) / 1000 : 0;
        this.maxComboThisGame = Math.max(this.maxComboThisGame, this.comboCount);
        
        this.achievementManager.checkAllGameAchievements({
            score: this.score,
            foodEatenThisGame: this.foodEatenThisGame,
            maxComboThisGame: this.maxComboThisGame,
            gameDurationSeconds: gameDurationSeconds,
            obstaclesWerePresent: this.board.obstacles.length > 0
        });
        
        this.comboCount = 0; this.activeComboMultiplier = 1; this.currentComboBonusScore = 0;
        if (this.uiManager && this.uiManager.updateComboDisplay) {
             this.uiManager.updateComboDisplay(this.comboCount, this.activeComboMultiplier, this.currentComboBonusScore);
        }
        
        if (this.gameState === GAME_STATE.PLAYING) { 
             this.triggerScreenShake(SCREEN_SHAKE_MAGNITUDE_GAME_OVER, SCREEN_SHAKE_DURATION_GAME_OVER, currentTime);
        }
        
        this.gameState = GAME_STATE.GAME_OVER;
        if (this.gameLoopRequestId) { cancelAnimationFrame(this.gameLoopRequestId); this.gameLoopRequestId = null; }
        this.snake.revertSpeed(); 
        this.powerUpManager.reset(); 
        this.uiManager.updateHighScore();
        
        if (!this.isShaking) { this.draw(performance.now()); }
    }

    togglePause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            if (this.gameLoopRequestId) { cancelAnimationFrame(this.gameLoopRequestId); this.gameLoopRequestId = null; }
            this.draw(performance.now()); 
        } else if (this.gameState === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.gameState === GAME_STATE.READY || this.gameState === GAME_STATE.GAME_OVER) {
            this.start();
        }
    }
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            if (this.gameLoopRequestId) cancelAnimationFrame(this.gameLoopRequestId);
            this.gameLoopRequestId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    handleEscape() { this.togglePause(); }
    updateGameSpeed() { this.effectiveGameSpeed = this.snake.speed; }
}
