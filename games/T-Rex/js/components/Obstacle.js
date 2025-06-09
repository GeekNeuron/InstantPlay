// js/components/Obstacle.js
import { IS_MOBILE, IS_HIDPI } from '../constants.js';
import { getRandomNum } from '../utils.js';
import { CollisionBox } from '../collision.js';

export class Obstacle {
    static MAX_GAP_COEFFICIENT = 1.5;
    static MAX_OBSTACLE_LENGTH = 3;

    static types = [
        {
            type: 'CACTUS_SMALL',
            width: 17,
            height: 35,
            yPos: 105,
            multipleSpeed: 4,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 7, 5, 27),
                new CollisionBox(4, 0, 6, 34),
                new CollisionBox(10, 4, 7, 14),
            ],
        },
        {
            type: 'CACTUS_LARGE',
            width: 25,
            height: 50,
            yPos: 90,
            multipleSpeed: 7,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 12, 7, 38),
                new CollisionBox(8, 0, 7, 49),
                new CollisionBox(13, 10, 10, 38),
            ],
        },
        {
            type: 'PTERODACTYL',
            width: 46,
            height: 40,
            yPos: [100, 75, 50],
            yPosMobile: [100, 50],
            multipleSpeed: 999,
            minSpeed: 8.5,
            minGap: 150,
            collisionBoxes: [
                new CollisionBox(15, 15, 16, 5),
                new CollisionBox(18, 21, 24, 6),
                new CollisionBox(2, 14, 4, 3),
                new CollisionBox(6, 10, 4, 7),
                new CollisionBox(10, 8, 6, 9),
            ],
            numFrames: 2,
            frameRate: 1000 / 6,
            speedOffset: 0.8,
        },
    ];

    constructor(
        canvasCtx,
        type,
        spriteImgPos,
        dimensions,
        gapCoefficient,
        speed,
        imageSprite,
        opt_xOffset
    ) {
        this.canvasCtx = canvasCtx;
        this.spritePos = spriteImgPos;
        this.typeConfig = type;
        this.gapCoefficient = gapCoefficient;
        this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
        this.dimensions = dimensions;
        this.imageSprite = imageSprite;
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

    init(speed) {
        this.cloneCollisionBoxes();
        if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
            this.size = 1;
        }
        this.width = this.typeConfig.width * this.size;
        if (Array.isArray(this.typeConfig.yPos)) {
            const yPosConfig = IS_MOBILE
                ? this.typeConfig.yPosMobile
                : this.typeConfig.yPos;
            this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
        } else {
            this.yPos = this.typeConfig.yPos;
        }
        this.draw();
        if (this.size > 1) {
            this.collisionBoxes[1].width =
                this.width -
                this.collisionBoxes[0].width -
                this.collisionBoxes[2].width;
            this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
        }
        if (this.typeConfig.speedOffset) {
            this.speedOffset =
                Math.random() > 0.5
                    ? this.typeConfig.speedOffset
                    : -this.typeConfig.speedOffset;
        }
        this.gap = this.getGap(this.gapCoefficient, speed);
    }

    draw() {
        let sourceWidth = this.typeConfig.width;
        let sourceHeight = this.typeConfig.height;
        if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        let sourceX =
            sourceWidth * this.size * (0.5 * (this.size - 1)) + this.spritePos.x;
        if (this.currentFrame > 0) {
            sourceX += sourceWidth * this.currentFrame;
        }
        this.canvasCtx.drawImage(
            this.imageSprite,
            sourceX,
            this.spritePos.y,
            sourceWidth * this.size,
            sourceHeight,
            this.xPos,
            this.yPos,
            this.typeConfig.width * this.size,
            this.typeConfig.height
        );
    }

    update(deltaTime, speed) {
        if (!this.remove) {
            if (this.typeConfig.speedOffset) {
                speed += this.speedOffset;
            }
            this.xPos -= Math.floor(((speed * 60) / 1000) * deltaTime);
            if (this.typeConfig.numFrames) {
                this.timer += deltaTime;
                if (this.timer >= this.typeConfig.frameRate) {
                    this.currentFrame =
                        this.currentFrame === this.typeConfig.numFrames - 1
                            ? 0
                            : this.currentFrame + 1;
                    this.timer = 0;
                }
            }
            this.draw();
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }

    getGap(gapCoefficient, speed) {
        const minGap = Math.round(
            this.width * speed + this.typeConfig.minGap * gapCoefficient
        );
        const maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
        return getRandomNum(minGap, maxGap);
    }

    isVisible() {
        return this.xPos + this.width > 0;
    }

    cloneCollisionBoxes() {
        const collisionBoxes = this.typeConfig.collisionBoxes;
        for (let i = collisionBoxes.length - 1; i >= 0; i--) {
            this.collisionBoxes[i] = new CollisionBox(
                collisionBoxes[i].x,
                collisionBoxes[i].y,
                collisionBoxes[i].width,
                collisionBoxes[i].height
            );
        }
    }
}
