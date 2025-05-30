// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        // Initial opacity is 0 due to 'appear' animation's 'from' state.
        // We will explicitly set it to 1 after initial positioning if animation doesn't cover it.
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.tileElement.setAttribute('data-id', this.id);

        this.x = -1; 
        this.y = -1;
        this.value = 0;
        this.mergedFrom = null;
        this.markedForRemoval = false; // Ensure this property exists

        this.setValue(value, true); 
        gridElement.append(this.tileElement);
        // console.log(`Tile ${this.id} (val ${this.value}) appended to DOM.`);

        // The 'appear' animation defined in CSS should handle making the tile visible.
        // If it's not working, explicitly setting opacity after a frame might be a fallback.
        // For now, relying on CSS animation.
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 
        this.adjustFontSize();

        if (!isNewTile && oldValue !== value && oldValue !== 0) {
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

    _updateVisuals(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0;
        const gap = parseFloat(computedStyle.getPropertyValue('gap')) || parseFloat(computedStyle.gap) || 0;

        const availableWidth = gridElement.clientWidth - (2 * gridPadding);
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        if (cellSize <= 0 || isNaN(cellSize)) {
            // console.error(`Tile ${this.id}: Invalid cellSize calculated: ${cellSize}. availableWidth: ${availableWidth}, gridPadding: ${gridPadding}, gap: ${gap}, gridSize: ${gridSize}`);
            this.tileElement.style.width = `50px`; // Fallback size
            this.tileElement.style.height = `50px`; // Fallback size
        } else {
            this.tileElement.style.width = `${cellSize}px`;
            this.tileElement.style.height = `${cellSize}px`;
        }
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);
        // Ensure opacity is set for the 'appear' animation to take effect correctly from its 'from' state.
        // The animation itself should transition opacity to 1.
        // If tiles are not appearing, this is a critical point.
        // Forcing opacity to 1 here bypasses the animation's fade-in.
        // requestAnimationFrame(() => { this.tileElement.style.opacity = '1'; });
        // console.log(`Tile ${this.id} (val ${this.value}) positioned at (${row},${col}). Opacity: ${this.tileElement.style.opacity}`);
    }

    remove() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                // console.log(`Tile ${this.id} already removed or no parent.`);
                resolve();
                return;
            }
            // console.log(`Removing tile ${this.id} (val ${this.value})`);
            this.tileElement.style.opacity = '0';
            this.tileElement.style.transform = (this.tileElement.style.transform || '') + ' scale(0.1)';

            const onRemoveEnd = () => {
                if (this.tileElement.parentElement) {
                    this.tileElement.remove();
                }
                // console.log(`Tile ${this.id} remove animation ended.`);
                resolve();
            };
            this.tileElement.addEventListener('transitionend', onRemoveEnd, { once: true });
            setTimeout(onRemoveEnd, 160); // Fallback, slightly longer than 0.15s opacity transition
        });
    }
    
    waitForMovement() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve(); return;
            }
            const styles = window.getComputedStyle(this.tileElement);
            if (styles.display === 'none' || styles.transitionProperty.indexOf('transform') === -1 || styles.transitionDuration === '0s') {
                resolve(); return; 
            }

            const eventName = 'transitionend';
            const timeoutDuration = 120; 
            
            let resolved = false;
            const resolveOnce = (event) => {
                if (event && event.target !== this.tileElement) return; // Ensure it's this element's transition
                if (event && event.propertyName !== 'transform') return;
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    this.tileElement.removeEventListener(eventName, resolveOnce);
                    // console.log(`Tile ${this.id} (val ${this.value}) movement ended.`);
                    resolve();
                }
            };

            const timeoutId = setTimeout(() => {
                // console.warn(`Tile (${this.id}, val ${this.value}) waitForMovement TIMEOUT`);
                resolveOnce(); 
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, resolveOnce);
        });
    }

    merged() {
        // console.log(`Tile ${this.id} (new val ${this.value}) merged animation triggered.`);
        this.tileElement.classList.add('tile-merged'); 
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }

    async moveTo(row, col, gridSize, gridElement) {
        // console.log(`Tile ${this.id} (val ${this.value}) moving from (${this.x},${this.y}) to (${row},${col})`);
        this.x = row; 
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement); 
        await this.waitForMovement(); 
    }
}
