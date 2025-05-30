// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        // Opacity and scale are handled by 'appear' animation in CSS
        // this.tileElement.style.opacity = '0'; // Initial state set by CSS animation from:
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`; // Unique ID for debugging
        this.tileElement.setAttribute('data-id', this.id);

        this.x = -1; // Logical row
        this.y = -1; // Logical col
        this.value = 0;
        this.mergedFrom = null; // To track tiles that merged into this one

        this.setValue(value, true); 
        gridElement.append(this.tileElement);
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 
        this.adjustFontSize();

        if (!isNewTile && oldValue !== value && oldValue !== 0) { // Value changed due to merge
            this.merged(); 
        }
    }

    adjustFontSize() {
        const numStr = this.value.toString();
        let baseSize = 2.8; 
        if (numStr.length > 4) { 
            baseSize = 1.3;
        } else if (numStr.length === 4) { 
            baseSize = 1.8;
        } else if (numStr.length === 3) { 
            baseSize = 2.3;
        }
        this.tileElement.style.fontSize = `${baseSize}em`;
    }

    // Calculates and sets the CSS style for position and size.
    // This is called by setPosition and moveTo.
    _updateVisuals(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0; // Assumes uniform padding
        // Use parseFloat on gap, as it might be '10px' string.
        const gap = parseFloat(computedStyle.getPropertyValue('gap')) || parseFloat(computedStyle.gap) || 0;

        const availableWidth = gridElement.clientWidth - (2 * gridPadding);
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        this.tileElement.style.width = `${cellSize}px`;
        this.tileElement.style.height = `${cellSize}px`;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        // These CSS variables are used by the keyframe animations for initial state
        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        
        // Direct transform for positioning. CSS transition on .tile handles the animation.
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        this.adjustFontSize(); // Re-adjust font size after potential size change
    }
    
    // Sets initial position (no animation, just placement)
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);
        // Ensure tile is visible if it was hidden (for new tiles)
        requestAnimationFrame(() => { this.tileElement.style.opacity = '1'; });
    }

    remove() {
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve();
                return;
            }
            // CSS will handle removal animation if defined, otherwise just remove
            this.tileElement.style.opacity = '0';
            // Add a scale down for removal visual
            this.tileElement.style.transform = (this.tileElement.style.transform || '') + ' scale(0.1)';

            const onRemoveEnd = () => {
                if (this.tileElement.parentElement) {
                    this.tileElement.remove();
                }
                resolve();
            };

            this.tileElement.addEventListener('transitionend', onRemoveEnd, { once: true });
            // Fallback if transition doesn't fire
            setTimeout(onRemoveEnd, 150); // Match transition duration for opacity/transform
        });
    }
    
    waitForMovement() { // Specifically for transform transition
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve(); return;
            }
            const styles = window.getComputedStyle(this.tileElement);
            if (styles.display === 'none' || styles.transitionProperty.indexOf('transform') === -1 || styles.transitionDuration === '0s') {
                resolve(); return; // No transform transition to wait for
            }

            const eventName = 'transitionend';
            const timeoutDuration = 120; // Slightly more than 0.1s transform transition
            
            let resolved = false;
            const resolveOnce = (event) => {
                // Ensure we are resolving for the 'transform' property if multiple transitions exist
                if (event && event.propertyName !== 'transform') return;
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    this.tileElement.removeEventListener(eventName, resolveOnce);
                    resolve();
                }
            };

            const timeoutId = setTimeout(() => {
                // console.warn(`Tile (${this.id}) waitForMovement TIMEOUT`);
                resolveOnce(); 
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, resolveOnce); // Don't use {once:true} if checking propertyName
        });
    }


    merged() {
        this.tileElement.classList.add('tile-merged'); 
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }

    // Animates tile to a new logical and visual position
    async moveTo(row, col, gridSize, gridElement) {
        // Update logical position *before* triggering visual update
        this.x = row; 
        this.y = col;
        
        this._updateVisuals(row, col, gridSize, gridElement); // This sets the new transform target
        await this.waitForMovement(); // Wait for the CSS transform transition to complete
    }
}
