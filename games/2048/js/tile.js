// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.tileElement.setAttribute('data-id', this.id);

        this.x = -1; 
        this.y = -1;
        this.value = 0;
        this.mergedFrom = null; // Not actively used in current logic, but can be for advanced animations
        this.markedForRemoval = false;

        this.setValue(value, true); // isNewTile = true
        gridElement.append(this.tileElement);
        
        // The 'appear' animation is handled by CSS on .tile class
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 
        this.adjustFontSize();

        // No longer calling this.merged() here, as per user request
        // if (!isNewTile && oldValue !== value && oldValue !== 0) {
        //     // this.merged(); // User wants no specific merge animation on the kept tile
        // }
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
            this.tileElement.style.width = `50px`; // Fallback
            this.tileElement.style.height = `50px`; // Fallback
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
        // Ensure initial visibility for new tiles (appear animation handles fade-in and scale-in)
        // Opacity is initially 0 via 'appear' animation 'from' state
        requestAnimationFrame(() => { 
            if (this.tileElement.style.opacity !== '1') { // Only if not already made visible
                 // this.tileElement.style.opacity = '1'; // Let animation handle this
            }
        });
    }

    remove() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve();
                return;
            }
            this.tileElement.style.opacity = '0';
            // Apply a scale down effect for removal
            let currentTransform = this.tileElement.style.transform || '';
            // Ensure we are not adding scale if it's already part of a complex transform from movement
            if (!currentTransform.includes('scale(')) {
                 this.tileElement.style.transform = currentTransform + ' scale(0.1)';
            } else {
                 // If transform is complex, just rely on opacity for removal feedback
                 // Or parse and rebuild transform, which is more complex.
                 // For simplicity, if already transformed, just fade.
            }


            const onRemoveEnd = () => {
                if (this.tileElement.parentElement) {
                    this.tileElement.remove();
                }
                resolve();
            };
            // Listen to transition end for opacity (which is 0.1s)
            this.tileElement.addEventListener('transitionend', function TEnd(event) {
                if (event.propertyName === 'opacity') {
                    this.removeEventListener('transitionend', TEnd);
                    onRemoveEnd();
                }
            });
            // Fallback if transition doesn't fire reliably
            setTimeout(onRemoveEnd, 160); 
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
            const timeoutDuration = 120; // Slightly more than 0.1s transform transition
            
            let resolved = false;
            const resolveOnce = (event) => {
                if (event && event.target !== this.tileElement) return; 
                if (event && event.propertyName !== 'transform') return;
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    this.tileElement.removeEventListener(eventName, resolveOnce);
                    resolve();
                }
            };

            const timeoutId = setTimeout(resolveOnce, timeoutDuration); 
            this.tileElement.addEventListener(eventName, resolveOnce);
        });
    }

    // merged() method is no longer needed for a specific merge animation on the kept tile
    // merged() {
    //     this.tileElement.classList.add('tile-merged'); 
    //     this.tileElement.addEventListener('animationend', () => {
    //         this.tileElement.classList.remove('tile-merged');
    //     }, { once: true });
    // }

    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; 
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement); 
        await this.waitForMovement(); 
    }
}
