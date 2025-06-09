// js/components/Cloud.js
import { getRandomNum } from '../utils.js';
import { IS_HIDPI } from '../constants.js';

export class Cloud {
    static config = {
        HEIGHT: 14,
        MAX_CLOUD_GAP: 400,
        MAX_SKY_LEVEL: 30,
        MIN_CLOUD_GAP: 100,
        MIN_SKY_LEVEL: 71,
        WIDTH: 46,
    };

    constructor(canvas, spritePos, containerWidth, imageSprite) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.spritePos = spritePos;
        this.containerWidth = containerWidth;
        this.imageSprite = imageSprite;
        this.xPos = containerWidth;
        this.yPos = 0;
        this.remove = false;
        this.cloudGap = getRandomNum(
            Cloud.config.MIN_CLOUD_GAP,
            Cloud.config.MAX_CLOUD_GAP
        );

        this.init();
    }

    init() {
        this.yPos = getRandomNum(
            Cloud.config.MAX_SKY_LEVEL,
            Cloud.config.MIN_SKY_LEVEL
        );
        this.draw();
    }

    draw() {
        this.canvasCtx.save();
        let sourceWidth = Cloud.config.WIDTH;
        let sourceHeight = Cloud.config.HEIGHT;

        if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }

        this.canvasCtx.drawImage(
            this.imageSprite,
            this.spritePos.x,
            this.spritePos.y,
            sourceWidth,
            sourceHeight,
            this.xPos,
            this.yPos,
            Cloud.config.WIDTH,
            Cloud.config.HEIGHT
        );

        this.canvasCtx.restore();
    }

    update(speed) {
        if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();

            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }

    isVisible() {
        return this.xPos + Cloud.config.WIDTH > 0;
    }
}
