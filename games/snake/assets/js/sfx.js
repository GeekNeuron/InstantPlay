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
            this.isSuspended = this.audioContext.state === 'suspended';
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser. Sounds will be disabled.");
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
                console.log("AudioContext resumed.");
            }).catch(e => console.error("Error resuming AudioContext:", e));
        } else if (this.audioContext) {
            this.isSuspended = false; // Already running
        }
    }

    /**
     * Plays a sound effect based on its type.
     * @param {string} type - Type of sound ('eat', 'gameOver', 'powerUp', 'click', 'shieldHit').
     */
    play(type) {
        if (!this.soundsEnabled || !this.audioContext) return;

        // Attempt to resume context on first play if still suspended
        if (this.isSuspended) {
            this.resumeContext();
            // Sound might not play on this very first call if resume is async, but will for subsequent calls.
            if (this.audioContext.state === 'suspended') { // Check again after trying to resume
                 console.warn("AudioContext still suspended, sound may not play yet.");
                 // return; // Optionally skip playing this first sound if context isn't ready
            }
        }


        let frequency = 440; // A4 note
        let duration = 0.1;  // seconds
        let waveType = 'sine'; // 'sine', 'square', 'sawtooth', 'triangle'
        let volume = 0.1;    // Default volume

        switch (type) {
            case 'eat':
                this._playSequence([
                    { freq: 660, dur: 0.04, wav: 'square', vol: 0.08 },
                    { freq: 770, dur: 0.05, wav: 'square', vol: 0.08, delay: 0.03 }
                ]);
                return;
            case 'gameOver':
                this._playSequence([
                    { freq: 200, dur: 0.15, wav: 'sawtooth', vol: 0.1 },
                    { freq: 150, dur: 0.20, wav: 'sawtooth', vol: 0.1, delay: 0.1 },
                    { freq: 100, dur: 0.25, wav: 'sawtooth', vol: 0.1, delay: 0.15 }
                ]);
                return;
            case 'powerUp': // For collecting a power-up item (distinct from food effects)
                 this._playSequence([
                    { freq: 880, dur: 0.05, wav: 'triangle', vol: 0.1 },
                    { freq: 1046, dur: 0.05, wav: 'triangle', vol: 0.1, delay: 0.05 },
                    { freq: 1318, dur: 0.08, wav: 'triangle', vol: 0.1, delay: 0.05 }
                ]);
                return;
            case 'foodEffect': // Generic sound for when a food *effect* activates
                frequency = 700; duration = 0.1; waveType = 'triangle'; volume = 0.08;
                break;
            case 'shieldHit':
                frequency = 300; duration = 0.2; waveType = 'noise'; volume = 0.15; // 'noise' type needs specific handling
                 if (waveType === 'noise') this._playNoise(duration, volume); else this._createAndPlayOscillator(frequency, duration, waveType, volume);
                return;
            case 'click': // For UI interaction
                frequency = 1200; duration = 0.05; waveType = 'sine'; volume = 0.05;
                break;
            default:
                // console.warn(`Unknown sound type: ${type}`);
                return;
        }

        this._createAndPlayOscillator(frequency, duration, waveType, volume);
    }

    _createAndPlayOscillator(frequency, duration, waveType, volume = 0.1, delay = 0) {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const startTime = this.audioContext.currentTime + delay;

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime); // Start silent
        gainNode.gain.linearRampToValueAtTime(volume, startTime + duration * 0.1); // Quick attack
        gainNode.gain.setValueAtTime(volume, startTime + duration * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration); // Decay

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    _playNoise(duration, volume = 0.1, delay = 0) {
        if (!this.audioContext) return;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // White noise
        }

        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const startTime = this.audioContext.currentTime + delay;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + duration * 0.1);
        gainNode.gain.setValueAtTime(volume, startTime + duration * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        noiseSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        noiseSource.start(startTime);
        noiseSource.stop(startTime + duration);
    }


    _playSequence(notes) {
        if (!this.audioContext) return;
        let accumulatedDelay = 0;
        notes.forEach(note => {
            accumulatedDelay += (note.delay || 0);
            if (note.wav === 'noise') {
                this._playNoise(note.dur, note.vol, accumulatedDelay);
            } else {
                this._createAndPlayOscillator(note.freq, note.dur, note.wav, note.vol, accumulatedDelay);
            }
            accumulatedDelay += note.dur;
        });
    }

    /**
     * Toggles sound effects on/off.
     */
    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        console.log(`Sounds ${this.soundsEnabled ? 'enabled' : 'disabled'}`);
        if (this.soundsEnabled) {
            this.resumeContext(); // Attempt to resume if enabling sounds
        }
    }
}
