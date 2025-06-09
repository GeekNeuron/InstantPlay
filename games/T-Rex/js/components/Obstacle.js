// js/components/Obstacle.js
import { IS_MOBILE } from '../constants.js';
import { getRandomNum } from '../utils.js';
import { CollisionBox } from '../collision.js';

export class Obstacle {
    static MAX_GAP_COEFFICIENT = 1.5;
    static MAX_OBSTACLE_LENGTH = 3;

    static types = [
        // ... آرایه کامل Obstacle.types از کد اصلی
    ];
    
    constructor(canvasCtx, type, spriteImgPos, dimensions, gapCoefficient, speed, imageSprite, opt_xOffset) {
        this.canvasCtx = canvasCtx;
        this.spritePos = spriteImgPos;
        this.typeConfig = type;
        this.gapCoefficient = gapCoefficient;
        this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
        this.dimensions = dimensions;
        this.imageSprite = imageSprite; // تصویر اصلی
        this.remove = false;
        this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
        this.yPos = 0;
        this.width = 0;
        this.collisionBoxes = [];
        this.gap = 0;
        this.speedOffset = 0;
        this.currentFrame = 0;
        this.timer = 0;
        this.init(speed);
    }

    // ... تمام متدهای Obstacle.prototype (init, draw, update, etc.)
    init(speed) {
        // ...
    }
    
    draw() {
        // ...
        // نکته: به جای Runner.imageSprite از this.imageSprite استفاده کنید
    }
    
    // ... بقیه متدها
}
