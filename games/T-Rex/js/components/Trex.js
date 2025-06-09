// js/components/Trex.js
import { DefaultDimensions, Config, IS_HIDPI, FPS } from '../constants.js';
import { getTimeStamp } from '../utils.js';
import { CollisionBox } from '../collision.js';

export class Trex {
    static config = {
        DROP_VELOCITY: -5,
        GRAVITY: 0.6,
        HEIGHT: 47,
        HEIGHT_DUCK: 25,
        INIITAL_JUMP_VELOCITY: -10,
        INTRO_DURATION: 1500,
        MAX_JUMP_HEIGHT: 30,
        MIN_JUMP_HEIGHT: 30,
        SPEED_DROP_COEFFICIENT: 3,
        SPRITE_WIDTH: 262,
        START_X_POS: 50,
        WIDTH: 44,
        WIDTH_DUCK: 59,
    };

    static collisionBoxes = {
        DUCKING: [new CollisionBox(1, 18, 55, 25)],
        RUNNING: [
            new CollisionBox(22, 0, 17, 16),
            new CollisionBox(1, 18, 30, 9),
            new CollisionBox(10, 35, 14, 8),
            new CollisionBox(1, 24, 29, 5),
            new CollisionBox(5, 30, 21, 4),
            new CollisionBox(9, 34, 15, 4),
        ],
    };

    static status = {
        CRASHED: 'CRASHED',
        DUCKING: 'DUCKING',
        JUMPING: 'JUMPING',
        RUNNING: 'RUNNING',
        WAITING: 'WAITING',
    };

    static BLINK_TIMING = 7000;

    static animFrames = {
        WAITING: { frames: [44, 0], msPerFrame: 1000 / 3 },
        RUNNING: { frames: [88, 132], msPerFrame: 1000 / 12 },
        CRASHED: { frames: [220], msPerFrame: 1000 / 60 },
        JUMPING: { frames: [0], msPerFrame: 1000 / 60 },
        DUCKING: { frames: [264, 323], msPerFrame: 1000 / 8 },
    };

    constructor(canvas, spritePos, imageSprite) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.imageSprite = imageSprite;
        this.xPos = 0;
        this.yPos = 0;
        this.groundYPos = 0;
        this.currentFrame = 0;
        this.currentAnimFrames = [];
        this.blinkDelay = 0;
        this.blinkCount = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.msPerFrame = 1000 / FPS;
        this.config = Trex.config;
        this.status = Trex.status.WAITING;

        this.jumping = false;
        this.ducking = false;
        this.jumpVelocity = 0;
        this.reachedMinHeight = false;
        this.speedDrop = false;
        this.jumpCount = 0;
        this.jumpspotX = 0;

        this.init();
    }

    init() {
        this.groundYPos =
            DefaultDimensions.HEIGHT - this.config.HEIGHT - Config.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

        this.draw(0, 0);
        this.update(0, Trex.status.WAITING);
    }

    setJumpVelocity(setting) {
        this.config.INIITAL_JUMP_VELOCITY = -setting;
        this.config.DROP_VELOCITY = -setting / 2;
    }

    update(deltaTime, opt_status) {
        this.timer += deltaTime;

        if (opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;

            if (opt_status === Trex.status.WAITING) {
                this.animStartTime = getTimeStamp();
                this.setBlinkDelay();
            }
        }

        if (this.playingIntro && this.xPos < this.config.START_X_POS) {
            this.xPos += Math.round(
                (this.config.START_X_POS / this.config.INTRO_DURATION) * deltaTime
            );
        }

        if (this.status === Trex.status.WAITING) {
            this.blink(getTimeStamp());
        } else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }

        if (this.timer >= this.msPerFrame) {
            this.currentFrame =
                this.currentFrame === this.currentAnimFrames.length - 1
                    ? 0
                    : this.currentFrame + 1;
            this.timer = 0;
        }

        if (this.speedDrop && this.yPos === this.groundYPos) {
            this.speedDrop = false;
            this.setDuck(true);
        }
    }

    draw(x, y) {
        let sourceX = x;
        let sourceY = y;
        let sourceWidth =
            this.ducking && this.status !== Trex.status.CRASHED
                ? this.config.WIDTH_DUCK
                : this.config.WIDTH;
        let sourceHeight = this.config.HEIGHT;

        if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
        }

        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;

        if (this.ducking && this.status !== Trex.status.CRASHED) {
            this.canvasCtx.drawImage(
                this.imageSprite,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                this.xPos,
                this.yPos,
                this.config.WIDTH_DUCK,
                this.config.HEIGHT
            );
        } else {
            if (this.ducking && this.status === Trex.status.CRASHED) {
                this.xPos++;
            }
            this.canvasCtx.drawImage(
                this.imageSprite,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                this.xPos,
                this.yPos,
                this.config.WIDTH,
                this.config.HEIGHT
            );
        }
    }

    setBlinkDelay() {
        this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
    }

    blink(time) {
        const deltaTime = time - this.animStartTime;
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame === 1) {
                this.setBlinkDelay();
                this.animStartTime = time;
                this.blinkCount++;
            }
        }
    }

    startJump(speed) {
        if (!this.jumping) {
            this.update(0, Trex.status.JUMPING);
            this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - speed / 10;
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
        }
    }

    endJump() {
        if (
            this.reachedMinHeight &&
            this.jumpVelocity < this.config.DROP_VELOCITY
        ) {
            this.jumpVelocity = this.config.DROP_VELOCITY;
        }
    }

    updateJump(deltaTime) {
        const msPerFrame = Trex.animFrames[this.status].msPerFrame;
        const framesElapsed = deltaTime / msPerFrame;

        if (this.speedDrop) {
            this.yPos += Math.round(
                this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed
            );
        } else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }

        this.jumpVelocity += this.config.GRAVITY * framesElapsed;

        if (this.yPos < this.minJumpHeight || this.speedDrop) {
            this.reachedMinHeight = true;
        }
        if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
            this.endJump();
        }
        if (this.yPos > this.groundYPos) {
            this.reset();
            this.jumpCount++;
        }
        this.update(deltaTime);
    }

    setSpeedDrop() {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    }

    setDuck(isDucking) {
        if (isDucking && this.status !== Trex.status.DUCKING) {
            this.update(0, Trex.status.DUCKING);
            this.ducking = true;
        } else if (this.status === Trex.status.DUCKING) {
            this.update(0, Trex.status.RUNNING);
            this.ducking = false;
        }
    }

    reset() {
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Trex.status.RUNNING);
        this.midair = false;
        this.speedDrop = false;
        this.jumpCount = 0;
    }
}
