// assets/js/sfx.js

/**
 * @fileoverview Manages sound effects for the game using Web Audio API for programmatic sounds.
 */

export class SoundEffectsManager {
    constructor() {
        this.audioContext = null;
        this.soundsEnabled = true; // User preference can be added later via UI
        this.isSuspended = true;   // AudioContext starts suspended until user interaction

        // Attempt to initialize AudioContext.
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext) { // Check if context was successfully created
                this.isSuspended = this.audioContext.state === 'suspended';
            } else {
                this.soundsEnabled = false; // Disable sounds if context creation failed
                console.warn("AudioContext could not be created. Sounds will be disabled.");
            }
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser. Sounds will be disabled.", e);
            this.soundsEnabled = false;
        }
    }

    /**
     * Attempts to resume the AudioContext if it's suspended.
     * Should be called after a user interaction (e.g., first click/touch).
     */
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.isSuspended = false;
                console.log("AudioContext resumed successfully.");
            }).catch(e => console.error("Error resuming AudioContext:", e));
        } else if (this.audioContext && this.audioContext.state !== 'closed') {
            this.isSuspended = false; // Already running or not suspended
        }
    }

    /**
     * Plays a sound effect based on its type.
     * @param {string} type - Type of sound ('eat', 'gameOver', 'powerUp', 'foodEffect', 'shieldHit', 'click').
     */
    play(type) {
        if (!this.soundsEnabled || !this.audioContext || this.audioContext.state === 'closed') return;

        // Attempt to resume context on first play if still suspended
        // This is crucial for sounds to work after initial user gesture.
        if (this.isSuspended) {
            this.resumeContext();
            // If still suspended after attempt (e.g., called before any gesture), log it.
            if (this.audioContext.state === 'suspended') {
                 console.warn("AudioContext is still suspended. Sound might not play until a user gesture on the page allows it to resume.");
                 // return; // Optionally, don't try to play if we know it will fail.
            }
        }

        let frequency = 440;
        let duration = 0.1;
        let waveType = 'sine';
        let volume = 0.1;

        switch (type) {
            case 'eat':
                this._playSequence([
                    { freq: 700, dur: 0.04, wav: 'square', vol: 0.08 },
                    { freq: 880, dur: 0.05, wav: 'square', vol: 0.08, delay: 0.03 }
                ]);
                return;
            case 'gameOver':
                this._playSequence([
                    { freq: 200, dur: 0.15, wav: 'sawtooth', vol: 0.12 },
                    { freq: 150, dur: 0.20, wav: 'sawtooth', vol: 0.12, delay: 0.1 },
                    { freq: 100, dur: 0.25, wav: 'sawtooth', vol: 0.12, delay: 0.15 }
                ]);
                return;
            case 'powerUp': // For collecting a distinct power-up item
                 this._playSequence([
                    { freq: 880, dur: 0.06, wav: 'triangle', vol: 0.1 },
                    { freq: 1046, dur: 0.06, wav: 'triangle', vol: 0.1, delay: 0.05 },
                    { freq: 1318, dur: 0.09, wav: 'triangle', vol: 0.1, delay: 0.05 }
                ]);
                return;
            case 'foodEffect': // Generic sound for when a food *effect* (like speed boost) activates
                this._playSequence([
                    { freq: 600, dur: 0.05, wav: 'sine', vol: 0.07 },
                    { freq: 900, dur: 0.08, wav: 'sine', vol: 0.07, delay: 0.04 }
                ]);
                return;
            case 'shieldHit': // Sound when a shield absorbs a hit
                 this._playNoise(0.15, 0.15); // Short, sharp noise
                // Or a metallic ping:
                // this._createAndPlayOscillator(1200, 0.15, 'triangle', 0.1);
                return;
            case 'click': // For UI interaction, pause/resume
                frequency = 1200; duration = 0.05; waveType = 'sine'; volume = 0.06;
                break;
            default:
                // console.warn(`SFX: Unknown sound type requested: ${type}`);
                return;
        }

        this._createAndPlayOscillator(frequency, duration, waveType, volume);
    }

    _createAndPlayOscillator(frequency, duration, waveType, volume = 0.1, delay = 0) {
        if (!this.audioContext || this.audioContext.state === 'closed' || this.audioContext.state === 'suspended') return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const startTime = this.audioContext.currentTime + delay;

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime); // Start silent
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Quick attack
        gainNode.gain.setValueAtTime(volume, startTime + 0.01); // Hold volume
        // Exponential decay for a more natural sound fade
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    _playNoise(duration, volume = 0.1, delay = 0) {
        if (!this.audioContext || this.audioContext.state === 'closed' || this.audioContext.state === 'suspended') return;

        const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
        if (bufferSize <=0) return; // Invalid duration for buffer

        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // Generate white noise
        }

        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const startTime = this.audioContext.currentTime + delay;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.setValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        noiseSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noiseSource.start(startTime);
        noiseSource.stop(startTime + duration); // Ensure noise stops
    }


    _playSequence(notes) {
        if (!this.audioContext || this.audioContext.state === 'closed' || this.audioContext.state === 'suspended') return;

        let timeOffset = 0; // Use a local offset for scheduling within the sequence
        notes.forEach(note => {
            const currentDelay = timeOffset + (note.delay || 0);
            if (note.wav === 'noise') {
                this._playNoise(note.dur, note.vol, currentDelay);
            } else {
                this._createAndPlayOscillator(note.freq, note.dur, note.wav, note.vol, currentDelay);
            }
            timeOffset = currentDelay + note.dur; // Next note starts after this one finishes
        });
    }

    /**
     * Toggles sound effects on/off.
     */
    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        console.log(`Sounds ${this.soundsEnabled ? 'enabled' : 'disabled'}`);
        if (this.soundsEnabled) {
            this.resumeContext(); // Attempt to resume if enabling sounds and context was suspended
        }
    }
}
