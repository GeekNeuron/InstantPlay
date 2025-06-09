// js/collision.js
import { DefaultDimensions } from './constants.js';
import { Trex } from './components/Trex.js'; // Note: Used for static properties

/**
 * Collision box object.
 * @param {number} x X position.
 * @param {number} y Y Position.
 * @param {number} w Width.
 * @param {number} h Height.
 */
export class CollisionBox {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
    let crashed = false;
    const tRexBoxX = tRexBox.x;
    const tRexBoxY = tRexBox.y;
    const obstacleBoxX = obstacleBox.x;
    const obstacleBoxY = obstacleBox.y;

    if (
        tRexBox.x < obstacleBoxX + obstacleBox.width &&
        tRexBox.x + tRexBox.width > obstacleBoxX &&
        tRexBox.y < obstacleBox.y + obstacleBox.height &&
        tRexBox.height + tRexBox.y > obstacleBox.y
    ) {
        crashed = true;
    }

    return crashed;
}

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
    return new CollisionBox(
        box.x + adjustment.x,
        box.y + adjustment.y,
        box.width,
        box.height
    );
}

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @return {Array<CollisionBox>|false}
 */
export function checkForCollision(obstacle, tRex) {
    const obstacleBoxXPos = DefaultDimensions.WIDTH + obstacle.xPos;

    const tRexBox = new CollisionBox(
        tRex.xPos + 1,
        tRex.yPos + 1,
        tRex.config.WIDTH - 2,
        tRex.config.HEIGHT - 2
    );

    const obstacleBox = new CollisionBox(
        obstacle.xPos + 1,
        obstacle.yPos + 1,
        obstacle.typeConfig.width * obstacle.size - 2,
        obstacle.typeConfig.height - 2
    );

    if (boxCompare(tRexBox, obstacleBox)) {
        const collisionBoxes = obstacle.collisionBoxes;
        const tRexCollisionBoxes = tRex.ducking
            ? Trex.collisionBoxes.DUCKING
            : Trex.collisionBoxes.RUNNING;

        for (let t = 0; t < tRexCollisionBoxes.length; t++) {
            for (let i = 0; i < collisionBoxes.length; i++) {
                const adjTrexBox = createAdjustedCollisionBox(
                    tRexCollisionBoxes[t],
                    tRexBox
                );
                const adjObstacleBox = createAdjustedCollisionBox(
                    collisionBoxes[i],
                    obstacleBox
                );

                const crashed = boxCompare(adjTrexBox, adjObstacleBox);

                if (crashed) {
                    return [adjTrexBox, adjObstacleBox];
                }
            }
        }
    }
    return false;
}
