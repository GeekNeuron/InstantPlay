// assets/js/sfx.js

/**
 * @fileoverview Manages sound effects for the game.
 * This version has sounds completely disabled.
 */

export class SoundEffectsManager {
    constructor() {
        this.soundsEnabled = false;
        // console.log("SoundEffectsManager: Sounds are disabled."); // Log for confirmation
    }

    /**
     * Attempts to resume the AudioContext if it's suspended.
     * Does nothing in this disabled version.
     */
    resumeContext() {
        // Sounds disabled, do nothing.
    }

    /**
     * Plays a sound effect based on its type.
     * Does nothing in this disabled version.
     * @param {string} type - Type of sound.
     */
    play(type) {
        // Sounds disabled, do nothing.
        // Example: console.log(`SFX (disabled): Play attempt for type - ${type}`);
    }

    /**
     * Toggles sound effects on/off.
     * Does nothing useful in this disabled version as sounds are always off.
     */
    toggleSounds() {
        // this.soundsEnabled = !this.soundsEnabled; // This would toggle but play does nothing.
        // console.log(`SFX (disabled): Toggle sounds called. Sounds remain disabled.`);
    }
}
