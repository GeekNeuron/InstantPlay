// assets/js/particle.js

import { GRID_SIZE } from './constants.js'; // For potential default sizing or reference
import { getCssVariable } from './utils.js'; // For getting colors

export class Particle {
    /**
     * Creates a new particle.
     * @param {number} x - Initial x position (in pixels).
     * @param {number} y - Initial y position (in pixels).
     * @param {number} size - Size of the particle.
     * @param {string} colorCssVar - CSS variable name for the particle's color (e.g., 'var(--food-color)').
     * @param {{vx: number, vy: number}} velocity - Initial velocity {vx, vy}.
     * @param {number} lifeSpan - How long the particle lives (in milliseconds).
     * @param {number} [gravity=0.05] - Gravitational pull on the particle.
     */
    constructor(x, y, size, colorCssVar, velocity, lifeSpan, gravity = 0.05) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = getCssVariable(colorCssVar, 'white'); // Fetch color, default to white
        this.velocity = velocity;
        this.initialLifeSpan = lifeSpan;
        this.lifeSpan = lifeSpan;
        this.gravity = gravity; // A slight pull downwards
        this.opacity = 1;
    }

    /**
     * Updates the particle's state (position, lifespan, opacity).
     * @param {number} deltaTime - Time elapsed since the last update (not strictly used here, lifespan is time based).
     */
    update(deltaTime) { // deltaTime is not directly used, lifeSpan is reduced by a fixed amount per frame or tied to real time
        this.lifeSpan -= 16; // Roughly assuming 60fps, decrease lifespan each frame. Adjust as needed.

        if (this.lifeSpan <= 0) {
            this.lifeSpan = 0;
            this.opacity = 0;
            return;
        }

        // Update position
        this.x += this.velocity.vx;
        this.y += this.velocity.vy;

        // Apply gravity
        this.velocity.vy += this.gravity;

        // Update opacity based on lifespan (fade out)
        this.opacity = Math.max(0, this.lifeSpan / this.initialLifeSpan);

        // Optional: Add friction to slow down particles
        this.velocity.vx *= 0.98;
        // this.velocity.vy *= 0.98; // Gravity already affects vy
    }

    /**
     * Draws the particle on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
        if (this.opacity <= 0) return;

        context.save();
        context.globalAlpha = this.opacity;
        context.fillStyle = this.color;
        // Draw a small circle or square
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // context.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        context.fill();
        context.restore();
    }

    /**
     * Checks if the particle is still alive.
     * @returns {boolean} True if alive, false otherwise.
     */
    isAlive() {
        return this.lifeSpan > 0;
    }
}
