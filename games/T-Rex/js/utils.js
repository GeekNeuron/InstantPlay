// js/utils.js
import { IS_IOS, IS_MOBILE } from './constants.js';
import { Classes } from './constants.js';

export function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function vibrate(duration) {
    if (IS_MOBILE && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}

export function createCanvas(container, width, height, opt_classname) {
    const canvas = document.createElement('canvas');
    canvas.className = opt_classname
        ? `${Classes.CANVAS} ${opt_classname}`
        : Classes.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    return canvas;
}

export function decodeBase64ToArrayBuffer(base64String) {
    const len = (base64String.length / 4) * 3;
    const str = atob(base64String);
    const arrayBuffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(arrayBuffer);

    for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
}

export function getTimeStamp() {
    return IS_IOS ? new Date().getTime() : performance.now();
}

export function updateCanvasScaling(canvas, opt_width, opt_height) {
    const context = canvas.getContext('2d');
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    const backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
    const ratio = devicePixelRatio / backingStoreRatio;

    if (devicePixelRatio !== backingStoreRatio) {
        const oldWidth = opt_width || canvas.width;
        const oldHeight = opt_height || canvas.height;

        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;
        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';

        context.scale(ratio, ratio);
        return true;
    } else if (devicePixelRatio === 1) {
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
    }
    return false;
}
