// js/components/Horizon.js
import { Cloud } from './Cloud.js';
import { HorizonLine } from './HorizonLine.js';
import { NightMode } from './NightMode.js';
import { Obstacle } from './Obstacle.js';
import { getRandomNum } from '../utils.js';
import { Config } from '../constants.js';

export class Horizon {
    static config = {
        BG_CLOUD_SPEED: 0.2,
        BUMPY_THRESHOLD: 0.3,
        CLOUD_FREQUENCY: 0.5,
        HORIZON_HEIGHT: 16,
        MAX_CLOUDS: 6,
    };

    constructor(canvas, spritePos, dimensions, gapCoefficient, imageSprite) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.config = Horizon.config;
        this.dimensions = dimensions;
        this.gapCoefficient = gapCoefficient;
        this.imageSprite = imageSprite;
        this.obstacles = [];
        this.obstacleHistory = [];
        this.horizonOffsets = [0, 0];
        this.cloudFrequency = this.config.CLOUD_FREQUENCY;
        this.spritePos = spritePos;
        this.nightMode = null;
        this.clouds = [];
        this.cloudSpeed = this.config.BG_CLOUD_SPEED;
        this.horizonLine = null;
        this.init();
    }

    init() {
        this.addCloud();
        this.horizonLine = new HorizonLine(
            this.canvas,
            this.spritePos.HORIZON,
            this.imageSprite
        );
        this.nightMode = new NightMode(
            this.canvas,
            this.spritePos.MOON,
            this.dimensions.WIDTH,
            this.imageSprite
        );
    }

    update(deltaTime, currentSpeed, updateObstacles, showNightMode) {
        this.horizonLine.update(deltaTime, currentSpeed);
        this.nightMode.update(showNightMode);
        this.updateClouds(deltaTime, currentSpeed);
        if (updateObstacles) {
            this.updateObstacles(deltaTime, currentSpeed);
        }
    }

    updateClouds(deltaTime, speed) {
        const cloudSpeed = (this.cloudSpeed / 1000) * deltaTime * speed;
        const numClouds = this.clouds.length;
        if (numClouds) {
            for (let i = numClouds - 1; i >= 0; i--) {
                this.clouds[i].update(cloudSpeed);
            }
            const lastCloud = this.clouds[numClouds - 1];
            if (
                numClouds < this.config.MAX_CLOUDS &&
                this.dimensions.WIDTH - lastCloud.xPos > lastCloud.cloudGap &&
                this.cloudFrequency > Math.random()
            ) {
                this.addCloud();
            }
            this.clouds = this.clouds.filter((obj) => !obj.remove);
        } else {
            this.addCloud();
        }
    }

    updateObstacles(deltaTime, currentSpeed) {
        const updatedObstacles = this.obstacles.slice(0);
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, currentSpeed);
            if (obstacle.remove) {
                updatedObstacles.shift();
            }
        }
        this.obstacles = updatedObstacles;
        if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (
                lastObstacle &&
                !lastObstacle.followingObstacleCreated &&
                lastObstacle.isVisible() &&
                lastObstacle.xPos + lastObstacle.width + lastObstacle.gap <
                    this.dimensions.WIDTH
            ) {
                this.addNewObstacle(currentSpeed);
                lastObstacle.followingObstacleCreated = true;
            }
        } else {
            this.addNewObstacle(currentSpeed);
        }
    }

    addNewObstacle(currentSpeed) {
        const obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
        const obstacleType = Obstacle.types[obstacleTypeIndex];

        if (
            this.duplicateObstacleCheck(obstacleType.type) ||
            currentSpeed < obstacleType.minSpeed
        ) {
            this.addNewObstacle(currentSpeed);
        } else {
            const obstacleSpritePos = this.spritePos[obstacleType.type];
            this.obstacles.push(
                new Obstacle(
                    this.canvasCtx,
                    obstacleType,
                    obstacleSpritePos,
                    this.dimensions,
                    this.gapCoefficient,
                    currentSpeed,
                    this.imageSprite,
                    obstacleType.width
                )
            );
            this.obstacleHistory.unshift(obstacleType.type);
            if (this.obstacleHistory.length > 1) {
                this.obstacleHistory.splice(Config.MAX_OBSTACLE_DUPLICATION);
            }
        }
    }

    duplicateObstacleCheck(nextObstacleType) {
        let duplicateCount = 0;
        for (let i = 0; i < this.obstacleHistory.length; i++) {
            duplicateCount =
                this.obstacleHistory[i] === nextObstacleType
                    ? duplicateCount + 1
                    : 0;
        }
        return duplicateCount >= Config.MAX_OBSTACLE_DUPLICATION;
    }

    reset() {
        this.obstacles = [];
        this.horizonLine.reset();
        this.nightMode.reset();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addCloud() {
        this.clouds.push(
            new Cloud(
                this.canvas,
                this.spritePos.CLOUD,
                this.dimensions.WIDTH,
                this.imageSprite
            )
        );
    }
}
