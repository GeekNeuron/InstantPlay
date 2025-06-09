// js/components/HorizonLine.js
import { IS_HIDPI } from '../constants.js';

export class HorizonLine {
    static dimensions = {
        WIDTH: 600,
        HEIGHT: 12,
        YPOS: 127,
    };

    constructor(canvas, spritePos, imageSprite) {
        this.spritePos = spritePos;
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.imageSprite = imageSprite;
        this.sourceDimensions = {};
        this.dimensions = HorizonLine.dimensions;
        this.sourceXPos = [
            this.spritePos.x,
            this.spritePos.x + this.dimensions.WIDTH,
        ];
        this.xPos = [];
        this.yPos = 0;
        this.bumpThreshold = 0.5;

        this.setSourceDimensions();
        this.draw();
    }

    setSourceDimensions() {
        for (const dimension in HorizonLine.dimensions) {
            if (IS_HIDPI) {
                if (dimension !== 'YPOS') {
                    this.sourceDimensions[dimension] =
                        HorizonLine.dimensions[dimension] * 2;
                }
            } else {
                this.sourceDimensions[dimension] =
                    HorizonLine.dimensions[dimension];
            }
        }
        this.xPos = [0, HorizonLine.dimensions.WIDTH];
        this.yPos = HorizonLine.dimensions.YPOS;
    }

    getRandomType() {
        return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
    }

    draw() {
        this.canvasCtx.drawImage(
            this.imageSprite,
            this.sourceXPos[0],
            this.spritePos.y,
            this.sourceDimensions.WIDTH,
            this.sourceDimensions.HEIGHT,
            this.xPos[0],
            this.yPos,
            this.dimensions.WIDTH,
            this.dimensions.HEIGHT
        );

        this.canvasCtx.drawImage(
            this.imageSprite,
            this.sourceXPos[1],
            this.spritePos.y,
            this.sourceDimensions.WIDTH,
            this.sourceDimensions.HEIGHT,
            this.xPos[1],
            this.yPos,
            this.dimensions.WIDTH,
            this.dimensions.HEIGHT
        );
    }

    updateXPos(pos, increment) {
        const line1 = pos;
        const line2 = pos === 0 ? 1 : 0;

        this.xPos[line1] -= increment;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;

        if (this.xPos[line1] <= -this.dimensions.WIDTH) {
            this.xPos[line1] += this.dimensions.WIDTH * 2;
            this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
    }

    update(deltaTime, speed) {
        const increment = Math.floor(speed * (60 / 1000) * deltaTime);

        if (this.xPos[0] <= 0) {
            this.updateXPos(0, increment);
        } else {
            this.updateXPos(1, increment);
        }
        this.draw();
    }

    reset() {
        this.xPos[0] = 0;
        this.xPos[1] = HorizonLine.dimensions.WIDTH;
    }
}
