// js/components/DistanceMeter.js
import { IS_HIDPI } from '../constants.js';

export class DistanceMeter {
    static dimensions = {
        WIDTH: 10,
        HEIGHT: 13,
        DEST_WIDTH: 11,
    };

    static yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];

    static config = {
        MAX_DISTANCE_UNITS: 5,
        ACHIEVEMENT_DISTANCE: 100,
        COEFFICIENT: 0.025,
        FLASH_DURATION: 1000 / 4,
        FLASH_ITERATIONS: 3,
    };

    constructor(canvas, spritePos, canvasWidth, imageSprite) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.imageSprite = imageSprite;
        this.spritePos = spritePos;
        this.x = 0;
        this.y = 5;
        this.currentDistance = 0;
        this.maxScore = 0;
        this.highScore = '0';
        this.digits = [];
        this.acheivement = false;
        this.defaultString = '';
        this.flashTimer = 0;
        this.flashIterations = 0;
        this.config = DistanceMeter.config;
        this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
        this.init(canvasWidth);
    }

    init(width) {
        let maxDistanceStr = '';
        this.calcXPos(width);
        this.maxScore = this.maxScoreUnits;
        for (let i = 0; i < this.maxScoreUnits; i++) {
            this.draw(i, 0);
            this.defaultString += '0';
            maxDistanceStr += '9';
        }
        this.maxScore = parseInt(maxDistanceStr);
    }

    calcXPos(canvasWidth) {
        this.x =
            canvasWidth -
            DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1);
    }

    draw(digitPos, value, opt_highScore) {
        let sourceWidth = DistanceMeter.dimensions.WIDTH;
        let sourceHeight = DistanceMeter.dimensions.HEIGHT;
        let sourceX = DistanceMeter.dimensions.WIDTH * value;
        let sourceY = 0;

        const targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
        const targetY = this.y;
        const targetWidth = DistanceMeter.dimensions.WIDTH;
        const targetHeight = DistanceMeter.dimensions.HEIGHT;

        if (IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }

        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;

        this.canvasCtx.save();

        if (opt_highScore) {
            const highScoreX =
                this.x -
                this.maxScoreUnits * 2 * DistanceMeter.dimensions.WIDTH;
            this.canvasCtx.translate(highScoreX, this.y);
        } else {
            this.canvasCtx.translate(this.x, this.y);
        }

        this.canvasCtx.drawImage(
            this.imageSprite,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            targetX,
            targetY,
            targetWidth,
            targetHeight
        );

        this.canvasCtx.restore();
    }

    getActualDistance(distance) {
        return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
    }

    update(deltaTime, distance) {
        let paint = true;
        let playSound = false;

        if (!this.acheivement) {
            distance = this.getActualDistance(distance);
            if (
                distance > this.maxScore &&
                this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS
            ) {
                this.maxScoreUnits++;
                this.maxScore = parseInt(this.maxScore + '9');
            }

            if (distance > 0) {
                if (distance % this.config.ACHIEVEMENT_DISTANCE === 0) {
                    this.acheivement = true;
                    this.flashTimer = 0;
                    playSound = true;
                }
                const distanceStr = (this.defaultString + distance).substr(
                    -this.maxScoreUnits
                );
                this.digits = distanceStr.split('');
            } else {
                this.digits = this.defaultString.split('');
            }
        } else {
            if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                this.flashTimer += deltaTime;
                if (this.flashTimer < this.config.FLASH_DURATION) {
                    paint = false;
                } else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
                    this.flashTimer = 0;
                    this.flashIterations++;
                }
            } else {
                this.acheivement = false;
                this.flashIterations = 0;
                this.flashTimer = 0;
            }
        }

        if (paint) {
            for (let i = this.digits.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.digits[i]));
            }
        }

        this.drawHighScore();
        return playSound;
    }

    drawHighScore() {
        this.canvasCtx.save();
        this.canvasCtx.globalAlpha = 0.8;
        for (let i = this.highScore.length - 1; i >= 0; i--) {
            this.draw(i, parseInt(this.highScore[i], 10), true);
        }
        this.canvasCtx.restore();
    }

    setHighScore(distance) {
        distance = this.getActualDistance(distance);
        const highScoreStr = (this.defaultString + distance).substr(
            -this.maxScoreUnits
        );
        this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
    }

    reset() {
        this.update(0, 0);
        this.acheivement = false;
    }
}
