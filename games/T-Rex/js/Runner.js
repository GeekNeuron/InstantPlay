// js/Runner.js
import { Config, DefaultDimensions, Classes, Events, Keycodes, Sounds, SpriteDefinition, IS_HIDPI, IS_MOBILE, IS_IOS, FPS, DEFAULT_WIDTH } from './constants.js';
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
        this.containerEl = null;
        this.snackbarEl = null;
        this.detailsButton = this.outerContainerEl.querySelector('#details-button');
        this.config = opt_config || Config;
        this.dimensions = DefaultDimensions;
        this.canvas = null;
        this.canvasCtx = null;
        this.tRex = null;
        this.distanceMeter = null;
        this.distanceRan = 0;
        this.highestScore = 0;
        this.time = 0;
        this.runningTime = 0;
        this.msPerFrame = 1000 / FPS;
        this.currentSpeed = this.config.SPEED;
        this.obstacles = [];
        this.activated = false;
        this.playing = false;
        this.crashed = false;
        this.paused = false;
        this.inverted = false;
        this.invertTimer = 0;
        this.resizeTimerId_ = null;
        this.playCount = 0;
        this.audioBuffer = null;
        this.soundFx = {};
        this.audioContext = null;
        this.images = {};
        this.imagesLoaded = 0;
        this.imageSprite = null;
        this.spriteDef = null;

        this.loadImages();
    }

    isDisabled() {
        return false;
    }
    
    updateConfigSetting(setting, value) {
        if (setting in this.config && value !== undefined) {
            this.config[setting] = value;
            switch (setting) {
                case 'GRAVITY':
                case 'MIN_JUMP_HEIGHT':
                case 'SPEED_DROP_COEFFICIENT':
                    this.tRex.config[setting] = value;
                    break;
                case 'INITIAL_JUMP_VELOCITY':
                    this.tRex.setJumpVelocity(value);
                    break;
                case 'SPEED':
                    this.setSpeed(value);
                    break;
            }
        }
    }

    loadImages() {
        // Since you are not using the inline data-uri, we'll assume the images are found by ID.
        // The HTML needs to contain <img id="offline-resources-1x" src="images/offline-resources-1x.png">
        const imageId = IS_HIDPI ? 'offline-resources-2x' : 'offline-resources-1x';
        this.imageSprite = document.getElementById(imageId);
        
        if (this.imageSprite) {
            this.spriteDef = IS_HIDPI ? SpriteDefinition.HDPI : SpriteDefinition.LDPI;
            if (this.imageSprite.complete) {
                this.init();
            } else {
                this.imageSprite.addEventListener(Events.LOAD, this.init.bind(this));
            }
        } else {
            console.error('Image sprite not found. Make sure an <img> with id="' + imageId + '" exists.');
        }
    }

    loadSounds() {
        // Since you don't have audio files, we will skip this to avoid errors.
        if (!IS_IOS && window.AudioContext && this.config.RESOURCE_TEMPLATE_ID) {
            const resourceEl = document.getElementById(this.config.RESOURCE_TEMPLATE_ID);
            if (resourceEl) {
                this.audioContext = new AudioContext();
                const resourceTemplate = resourceEl.content;
                for (const sound in Sounds) {
                    const soundEl = resourceTemplate.getElementById(Sounds[sound]);
                    if (soundEl) {
                        let soundSrc = soundEl.src;
                        soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
                        const buffer = decodeBase64ToArrayBuffer(soundSrc);
                        this.audioContext.decodeAudioData(
                            buffer,
                            (audioData) => {
                                this.soundFx[sound] = audioData;
                            }
                        );
                    }
                }
            }
        }
    }

    setSpeed(opt_speed) {
        const speed = opt_speed || this.currentSpeed;
        if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
            const mobileSpeed =
                (speed * this.dimensions.WIDTH / DEFAULT_WIDTH) *
                this.config.MOBILE_SPEED_COEFFICIENT;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        } else if (opt_speed) {
            this.currentSpeed = opt_speed;
        }
    }

    init() {
        document.querySelector('.' + Classes.ICON).style.visibility = 'hidden';
        this.adjustDimensions();
        this.setSpeed();

        this.containerEl = document.createElement('div');
        this.containerEl.className = Classes.CONTAINER;

        this.canvas = createCanvas(
            this.containerEl,
            this.dimensions.WIDTH,
            this.dimensions.HEIGHT
        );
        this.canvasCtx = this.canvas.getContext('2d');
        this.canvasCtx.fillStyle = '#f7f7f7';
        this.canvasCtx.fill();
        updateCanvasScaling(this.canvas);

        this.horizon = new Horizon(
            this.canvas,
            this.spriteDef,
            this.dimensions,
            this.config.GAP_COEFFICIENT,
            this.imageSprite
        );

        this.distanceMeter = new DistanceMeter(
            this.canvas,
            this.spriteDef.TEXT_SPRITE,
            this.dimensions.WIDTH,
            this.imageSprite
        );

        this.tRex = new Trex(this.canvas, this.spriteDef.TREX, this.imageSprite);
        
        this.gameOverPanel = new GameOverPanel(
            this.canvas,
            this.spriteDef.TEXT_SPRITE,
            this.spriteDef.RESTART,
            this.dimensions,
            this.imageSprite
        );

        this.outerContainerEl.appendChild(this.containerEl);

        if (IS_MOBILE) {
            this.createTouchController();
        }

        this.startListening();
        this.update();

        window.addEventListener(Events.RESIZE, this.debounceResize.bind(this));
    }

    createTouchController() {
        this.touchController = document.createElement('div');
        this.touchController.className = Classes.TOUCH_CONTROLLER;
        this.outerContainerEl.appendChild(this.touchController);
    }

    debounceResize() {
        if (!this.resizeTimerId_) {
            this.resizeTimerId_ = setInterval(this.adjustDimensions.bind(this), 250);
        }
    }

    adjustDimensions() {
        clearInterval(this.resizeTimerId_);
        this.resizeTimerId_ = null;
        const boxStyles = window.getComputedStyle(this.outerContainerEl);
        const padding = Number(boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2));

        this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
        this.dimensions.WIDTH = Math.min(DEFAULT_WIDTH, this.dimensions.WIDTH);

        if (this.activated) {
            this.setArcadeModeContainerScale();
        }

        if (this.canvas) {
            this.canvas.width = this.dimensions.WIDTH;
            this.canvas.height = this.dimensions.HEIGHT;
            updateCanvasScaling(this.canvas);
            this.distanceMeter.calcXPos(this.dimensions.WIDTH);
            this.clearCanvas();
            this.horizon.update(0, 0, true);
            this.tRex.update(0);

            if (this.playing || this.crashed || this.paused) {
                this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                this.stop();
            } else {
                this.tRex.draw(0, 0);
            }

            if (this.crashed && this.gameOverPanel) {
                this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
                this.gameOverPanel.draw();
            }
        }
    }

    playIntro() {
        if (!this.activated && !this.crashed) {
            this.playingIntro = true;
            this.tRex.playingIntro = true;
            const keyframes = `
                @-webkit-keyframes intro {
                    from { width: ${Trex.config.WIDTH}px }
                    to { width: ${this.dimensions.WIDTH}px }
                }`;
            const sheet = document.createElement('style');
            sheet.innerHTML = keyframes;
            document.head.appendChild(sheet);

            this.containerEl.addEventListener(Events.ANIM_END, this.startGame.bind(this));
            this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
            this.containerEl.style.width = this.dimensions.WIDTH + 'px';
            this.playing = true;
            this.activated = true;
        } else if (this.crashed) {
            this.restart();
        }
    }

    startGame() {
        this.setArcadeMode();
        this.runningTime = 0;
        this.playingIntro = false;
        this.tRex.playingIntro = false;
        this.containerEl.style.webkitAnimation = '';
        this.playCount++;
        document.addEventListener(Events.VISIBILITY, this.onVisibilityChange.bind(this));
        window.addEventListener(Events.BLUR, this.onVisibilityChange.bind(this));
        window.addEventListener(Events.FOCUS, this.onVisibilityChange.bind(this));
    }

    clearCanvas() {
        this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
    }

    update() {
        this.updatePending = false;
        const now = getTimeStamp();
        let deltaTime = now - (this.time || now);
        this.time = now;

        if (this.playing) {
            this.clearCanvas();
            if (this.tRex.jumping) {
                this.tRex.updateJump(deltaTime);
            }

            this.runningTime += deltaTime;
            const hasObstacles = this.runningTime > this.config.CLEAR_TIME;

            if (this.tRex.jumpCount === 1 && !this.playingIntro) {
                this.playIntro();
            }

            if (this.playingIntro) {
                this.horizon.update(0, this.currentSpeed, hasObstacles);
            } else {
                deltaTime = !this.activated ? 0 : deltaTime;
                this.horizon.update(deltaTime, this.currentSpeed, hasObstacles, this.inverted);
            }

            const collision = hasObstacles && this.horizon.obstacles.length > 0 &&
                checkForCollision(this.horizon.obstacles[0], this.tRex);

            if (!collision) {
                this.distanceRan += (this.currentSpeed * deltaTime) / this.msPerFrame;
                if (this.currentSpeed < this.config.MAX_SPEED) {
                    this.currentSpeed += this.config.ACCELERATION;
                }
            } else {
                this.gameOver();
            }

            const playAchievementSound = this.distanceMeter.update(deltaTime, Math.ceil(this.distanceRan));
            if (playAchievementSound) {
                this.playSound(this.soundFx.SCORE);
            }

            if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
                this.invertTimer = 0;
                this.invertTrigger = false;
                this.invert();
            } else if (this.invertTimer) {
                this.invertTimer += deltaTime;
            } else {
                const actualDistance = this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));
                if (actualDistance > 0) {
                    this.invertTrigger = !(actualDistance % this.config.INVERT_DISTANCE);
                    if (this.invertTrigger && this.invertTimer === 0) {
                        this.invertTimer += deltaTime;
                        this.invert();
                    }
                }
            }
        }

        if (this.playing || (!this.activated && this.tRex.blinkCount < Config.MAX_BLINK_COUNT)) {
            this.tRex.update(deltaTime);
            this.scheduleNextUpdate();
        }
    }

    handleEvent(e) {
        return ((evtType, events) => {
            switch (evtType) {
                case events.KEYDOWN:
                case events.TOUCHSTART:
                case events.MOUSEDOWN:
                    this.onKeyDown(e);
                    break;
                case events.KEYUP:
                case events.TOUCHEND:
                case events.MOUSEUP:
                    this.onKeyUp(e);
                    break;
            }
        })(e.type, Events);
    }

    startListening() {
        document.addEventListener(Events.KEYDOWN, this);
        document.addEventListener(Events.KEYUP, this);
        if (IS_MOBILE) {
            this.touchController.addEventListener(Events.TOUCHSTART, this);
            this.touchController.addEventListener(Events.TOUCHEND, this);
            this.containerEl.addEventListener(Events.TOUCHSTART, this);
        } else {
            document.addEventListener(Events.MOUSEDOWN, this);
            document.addEventListener(Events.MOUSEUP, this);
        }
    }

    stopListening() {
        document.removeEventListener(Events.KEYDOWN, this);
        document.removeEventListener(Events.KEYUP, this);
        if (IS_MOBILE) {
            this.touchController.removeEventListener(Events.TOUCHSTART, this);
            this.touchController.removeEventListener(Events.TOUCHEND, this);
            this.containerEl.removeEventListener(Events.TOUCHSTART, this);
        } else {
            document.removeEventListener(Events.MOUSEDOWN, this);
            document.removeEventListener(Events.MOUSEUP, this);
        }
    }

    onKeyDown(e) {
        if (IS_MOBILE && this.playing) {
            e.preventDefault();
        }
        if (e.target !== this.detailsButton) {
            if (!this.crashed && (Keycodes.JUMP[e.keyCode] || e.type === Events.TOUCHSTART)) {
                if (!this.playing) {
                    this.loadSounds();
                    this.playing = true;
                    this.update();
                }
                if (!this.tRex.jumping && !this.tRex.ducking) {
                    this.playSound(this.soundFx.BUTTON_PRESS);
                    this.tRex.startJump(this.currentSpeed);
                }
            }
            if (this.crashed && e.type === Events.TOUCHSTART && e.currentTarget === this.containerEl) {
                this.restart();
            }
        }
        if (this.playing && !this.crashed && Keycodes.DUCK[e.keyCode]) {
            e.preventDefault();
            if (this.tRex.jumping) {
                this.tRex.setSpeedDrop();
            } else if (!this.tRex.jumping && !this.tRex.ducking) {
                this.tRex.setDuck(true);
            }
        }
    }

    onKeyUp(e) {
        const keyCode = String(e.keyCode);
        const isjumpKey = Keycodes.JUMP[keyCode] || e.type === Events.TOUCHEND || e.type === Events.MOUSEDOWN;

        if (this.isRunning() && isjumpKey) {
            this.tRex.endJump();
        } else if (Keycodes.DUCK[keyCode]) {
            this.tRex.speedDrop = false;
            this.tRex.setDuck(false);
        } else if (this.crashed) {
            const deltaTime = getTimeStamp() - this.time;
            if (Keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) || (deltaTime >= this.config.GAMEOVER_CLEAR_TIME && Keycodes.JUMP[keyCode])) {
                this.restart();
            }
        } else if (this.paused && isjumpKey) {
            this.tRex.reset();
            this.play();
        }
    }

    isLeftClickOnCanvas(e) {
        return e.button != null && e.button < 2 && e.type === Events.MOUSEUP && e.target === this.canvas;
    }

    scheduleNextUpdate() {
        if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
    }

    isRunning() {
        return !!this.raqId;
    }

    gameOver() {
        this.playSound(this.soundFx.HIT);
        vibrate(200);
        this.stop();
        this.crashed = true;
        this.distanceMeter.acheivement = false;
        this.tRex.update(100, Trex.status.CRASHED);

        if (this.gameOverPanel) {
            this.gameOverPanel.draw();
        }

        if (this.distanceRan > this.highestScore) {
            this.highestScore = Math.ceil(this.distanceRan);
            this.distanceMeter.setHighScore(this.highestScore);
        }
        this.time = getTimeStamp();
    }

    stop() {
        this.playing = false;
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    }

    play() {
        if (!this.crashed) {
            this.playing = true;
            this.paused = false;
            this.tRex.update(0, Trex.status.RUNNING);
            this.time = getTimeStamp();
            this.update();
        }
    }

    restart() {
        if (!this.raqId) {
            this.playCount++;
            this.runningTime = 0;
            this.playing = true;
            this.crashed = false;
            this.distanceRan = 0;
            this.setSpeed(this.config.SPEED);
            this.time = getTimeStamp();
            this.containerEl.classList.remove(Classes.CRASHED);
            this.clearCanvas();
            this.distanceMeter.reset(this.highestScore);
            this.horizon.reset();
            this.tRex.reset();
            this.playSound(this.soundFx.BUTTON_PRESS);
            this.invert(true);
            this.update();
        }
    }

    setArcadeMode() {
        document.body.classList.add(Classes.ARCADE_MODE);
        this.setArcadeModeContainerScale();
    }

    setArcadeModeContainerScale() {
        const windowHeight = window.innerHeight;
        const scaleHeight = windowHeight / this.dimensions.HEIGHT;
        const scaleWidth = window.innerWidth / this.dimensions.WIDTH;
        const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
        const scaledCanvasHeight = this.dimensions.HEIGHT * scale;
        const translateY = Math.ceil(
            Math.max(0, (windowHeight - scaledCanvasHeight - Config.ARCADE_MODE_INITIAL_TOP_POSITION) * Config.ARCADE_MODE_TOP_POSITION_PERCENT)
        ) * window.devicePixelRatio;

        this.containerEl.style.transform = `scale(${scale}) translateY(${translateY}px)`;
    }

    onVisibilityChange(e) {
        if (document.hidden || document.webkitHidden || e.type === 'blur' || document.visibilityState !== 'visible') {
            this.stop();
        } else if (!this.crashed) {
            this.tRex.reset();
            this.play();
        }
    }

    playSound(soundBuffer) {
        if (soundBuffer && this.audioContext) {
            const sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = soundBuffer;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(0);
        }
    }

    invert(reset) {
        if (reset) {
            document.body.classList.toggle(Classes.INVERTED, false);
            this.invertTimer = 0;
            this.inverted = false;
        } else {
            this.inverted = document.body.classList.toggle(Classes.INVERTED, this.invertTrigger);
        }
    }
}
