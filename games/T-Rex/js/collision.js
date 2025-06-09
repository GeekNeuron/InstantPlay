// js/collision.js

// A simple class for representing a collision box.
export class CollisionBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

function boxCompare(tRexBox, obstacleBox) {
    let crashed = false;
    if (
        tRexBox.x < obstacleBox.x + obstacleBox.width &&
        tRexBox.x + tRexBox.width > obstacleBox.x &&
        tRexBox.y < obstacleBox.y + obstacleBox.height &&
        tRexBox.height + tRexBox.y > obstacleBox.y
    ) {
        crashed = true;
    }
    return crashed;
}

function createAdjustedCollisionBox(box, adjustment) {
    return new CollisionBox(
        box.x + adjustment.x,
        box.y + adjustment.y,
        box.width,
        box.height
    );
}

export function checkForCollision(obstacle, tRex) {
    // Trex outer box
    const tRexBox = new CollisionBox(
        tRex.xPos + 1,
        tRex.yPos + 1,
        tRex.config.WIDTH - 2,
        tRex.config.HEIGHT - 2
    );

    // Obstacle outer box
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

                if (boxCompare(adjTrexBox, adjObstacleBox)) {
                    return [adjTrexBox, adjObstacleBox];
                }
            }
        }
    }
    return false;
}
