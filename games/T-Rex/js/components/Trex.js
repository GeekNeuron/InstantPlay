// js/components/Trex.js
import { DefaultDimensions, Config } from '../constants.js';
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
        this.msPerFrame = 1000 / 60;
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
    
    // ... تمام متدهای Trex.prototype (init, update, draw, startJump, etc.)
    // به عنوان مثال:
    init() {
        this.groundYPos = DefaultDimensions.HEIGHT - this.config.HEIGHT - Config.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
        this.draw(0, 0);
        this.update(0, Trex.status.WAITING);
    }
    
    update(deltaTime, opt_status) {
        // ... کد متد آپدیت
    }
    
    draw(x, y) {
        // ... کد متد دراو
        // نکته: به جای Runner.imageSprite از this.imageSprite استفاده کنید
    }
    
    // ... بقیه متدها
}
