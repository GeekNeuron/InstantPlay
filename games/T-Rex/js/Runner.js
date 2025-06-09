// js/Runner.js
import { Config, DefaultDimensions, Classes, Events, Keycodes, Sounds, SpriteDefinition, IS_HIDPI, IS_MOBILE } from './constants.js';
import { getTimeStamp, createCanvas, updateCanvasScaling, vibrate, decodeBase64ToArrayBuffer } from './utils.js';
import { checkForCollision } from './collision.js';
import { Trex } from './components/Trex.js';
import { Horizon } from './components/Horizon.js';
import { DistanceMeter } from './components/DistanceMeter.js';
import { GameOverPanel } from './components/GameOverPanel.js';

export class Runner {
    static instance_ = null;

    constructor(outerContainerId, opt_config) {
        if (Runner.instance_) {
            return Runner.instance_;
        }
        Runner.instance_ = this;

        this.outerContainerEl = document.querySelector(outerContainerId);
        this.config = opt_config || Config;
        this.dimensions = DefaultDimensions;
        
        // ... بقیه خصوصیات Runner
        
        this.imageSprite = null; // این توسط loadImages پر می‌شود
        this.spriteDef = null;

        if (this.isDisabled()) {
            this.setupDisabledRunner();
        } else {
            this.loadImages();
        }
    }

    // ... تمام متدهای Runner.prototype (init, update, gameOver, restart, etc.)
    loadImages() {
        const imageId = IS_HIDPI ? 'offline-resources-2x' : 'offline-resources-1x';
        this.imageSprite = document.getElementById(imageId);
        this.spriteDef = IS_HIDPI ? SpriteDefinition.HDPI : SpriteDefinition.LDPI;

        if (this.imageSprite.complete) {
            this.init();
        } else {
            this.imageSprite.addEventListener(Events.LOAD, this.init.bind(this));
        }
    }

    init() {
        // ...
        this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions, this.config.GAP_COEFFICIENT, this.imageSprite);
        this.distanceMeter = new DistanceMeter(this.canvas, this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH, this.imageSprite);
        this.tRex = new Trex(this.canvas, this.spriteDef.TREX, this.imageSprite);
        this.gameOverPanel = new GameOverPanel(this.canvas, this.spriteDef.TEXT_SPRITE, this.spriteDef.RESTART, this.dimensions, this.imageSprite);
        // ...
    }

    update() {
        // ...
        const collision = checkForCollision(this.horizon.obstacles[0], this.tRex);
        // ...
    }
    
    // ... بقیه متدها
}
