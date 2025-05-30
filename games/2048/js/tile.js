
// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        this.tileElement.style.opacity = '0'; // Start invisible for appear animation
        
        this.x = -1; 
        this.y = -1;
        this.value = 0; // Initialize value

        this.setValue(value, true); // Set initial value and adjust font size
        gridElement.append(this.tileElement);

        // Trigger appear animation (CSS @keyframes 'appear')
        // CSS animation 'appear' handles scale and opacity
        // The animation is set on the .tile class directly
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 
        this.adjustFontSize();

        if (!isNewTile && oldValue !== 0 && oldValue !== value) { // Value changed (likely a merge)
            this.merged(); // Trigger merge animation
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

    updateVisualPosition(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0;
        const gap = parseFloat(computedStyle.gap) || 0;
        
        const availableWidth = gridElement.clientWidth - (2 * gridPadding); 
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        this.tileElement.style.width = `${cellSize}px`;
        this.tileElement.style.height = `${cellSize}px`;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        // These CSS variables are used by the keyframe animations
        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        // Direct transform for positioning and CSS transitions
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        if (this.tileElement.style.opacity === '0' && (this.x !== -1 || this.y !== -1)) {
             // If tile was hidden and now has a position, make it appear
            requestAnimationFrame(() => { this.tileElement.style.opacity = '1'; });
        }
        
        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this.updateVisualPosition(row, col, gridSize, gridElement);
    }

    remove() { 
        // Animation for removal (e.g., shrink and fade)
        this.tileElement.style.opacity = '0';
        this.tileElement.style.transform += ' scale(0.1)'; // Shrink dramatically
        
        this.tileElement.addEventListener('transitionend', () => {
            if (this.tileElement.parentElement) { 
                this.tileElement.remove();
            }
        }, { once: true });

        // Fallback removal if transition doesn't fire (e.g., display:none parent)
        setTimeout(() => {
            if (this.tileElement.parentElement) {
                this.tileElement.remove();
            }
        }, 200); // A bit longer than transition
    }

    waitForTransition() {
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve(); // Tile already removed or doesn't exist
                return;
            }
            // Check if the element is actually visible and has transitions
            const styles = window.getComputedStyle(this.tileElement);
            if (styles.display === 'none' || styles.transitionDuration === '0s') {
                resolve(); // No transition to wait for
                return;
            }

            const eventName = 'transitionend';
            const timeoutDuration = 150; // Matches CSS transition for transform (0.1s + buffer)
            
            let resolved = false;
            const resolveOnce = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    this.tileElement.removeEventListener(eventName, resolveOnce);
                    resolve();
                }
            };

            const timeoutId = setTimeout(() => {
                // console.warn("Tile.waitForTransition TIMEOUT for value:", this.value);
                resolveOnce(); 
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, resolveOnce, { once: true });
        });
    }

    merged() {
        this.tileElement.classList.add('tile-merged'); 
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }

    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; 
        this.y = col;
        // updateVisualPosition sets the final transform target
        this.updateVisualPosition(row, col, gridSize, gridElement); 
        // The CSS transition on .tile class will handle the animation
        await this.waitForTransition(); 
    }
}
