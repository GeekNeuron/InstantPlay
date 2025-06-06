class Tile {
    constructor(gridContainerElement) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = -1;
        this.y = -1;
        this.value = 0;
        this.markedForRemoval = false;
        this.futureValue = null;
        
        this.tileElement = document.createElement("div");
        this.tileElement.classList.add("tile", "new-tile");
        gridContainerElement.appendChild(this.tileElement);
        
        this.numberDisplay = document.createElement("div");
        this.numberDisplay.classList.add("tile-inner");
        this.tileElement.appendChild(this.numberDisplay);
    }

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        // Opacity is handled by 'appear' animation in CSS
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.tileElement.setAttribute('data-id', this.id);

        this.numberDisplay = document.createElement('span');
        this.numberDisplay.classList.add('tile-number-display');
        this.tileElement.appendChild(this.numberDisplay);

        this.x = -1; 
        this.y = -1;
        this.value = 0; 
        this.markedForRemoval = false;

        this.setValue(value, true); // isNewTile = true
        gridElement.append(this.tileElement);
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.numberDisplay.textContent = value; 
        this.tileElement.dataset.value = value; 
        
        // Adjust font size after value is set.
        // This might be called again in _updateVisuals after dimensions are known, which is fine.
        this.adjustFontSize(); 

        if (!isNewTile && oldValue !== value && oldValue !== 0) { // Value changed due to merge
            this.triggerNumberPopAnimation(); 
        }
    }

    adjustFontSize() {
        const numStr = this.value.toString();
        let baseSize = 2.8; // em
        if (numStr.length > 4) { 
            baseSize = 1.3;
        } else if (numStr.length === 4) { 
            baseSize = 1.8;
        } else if (numStr.length === 3) { 
            baseSize = 2.3;
        }
        // Apply to the tile element, span will inherit.
        this.tileElement.style.fontSize = `${baseSize}em`;
    }

    // Calculates and sets the CSS style for position and size.
    _updateVisuals(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0;
        const gap = parseFloat(computedStyle.getPropertyValue('gap')) || parseFloat(computedStyle.gap) || 0;

        const availableWidth = gridElement.clientWidth - (2 * gridPadding);
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        if (cellSize <= 0 || isNaN(cellSize)) {
            this.tileElement.style.width = `50px`; 
            this.tileElement.style.height = `50px`;
        } else {
            this.tileElement.style.width = `${cellSize}px`;
            this.tileElement.style.height = `${cellSize}px`;
        }
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        // These CSS variables are set for the keyframe animations to use as the 'to' state.
        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        
        // Direct transform for positioning. CSS transition on .tile handles the animation.
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        // This is a critical place to adjust font size as tile dimensions are now definitively set.
        this.adjustFontSize(); 
    }
    
    // Sets initial position (no animation from here, CSS 'appear' handles it)
    // and triggers number pop for new tiles.
    setPosition(row, col, gridSize, gridElement, isNewSpawn = false) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement); // Sets size and target transform

        // The 'appear' animation in CSS handles initial visibility (opacity and scale).
        // For new tiles, trigger the number pop after a slight delay to sync with 'appear'.
        if (isNewSpawn) {
            setTimeout(() => {
                this.triggerNumberPopAnimation();
            }, 50); // Small delay, adjust if needed
        }
    }

    remove() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve();
                return;
            }
            this.tileElement.style.opacity = '0';
            let currentTransform = this.tileElement.style.transform || '';
            if (!currentTransform.includes('scale(')) { 
                 this.tileElement.style.transform = currentTransform + ' scale(0.1)';
            } else if (!currentTransform.includes('scale(0.1)')) { 
                 this.tileElement.style.transform = currentTransform.replace(/scale\([0-9.]+\)/, 'scale(0.1)');
            }

            const onRemoveEnd = () => {
                if (this.tileElement.parentElement) {
                    this.tileElement.remove();
                }
                resolve();
            };
            
            let transitionEnded = false;
            const transitionEndListener = (event) => {
                // Listen for opacity or transform transition to end
                if (event.propertyName === 'opacity' || event.propertyName === 'transform') {
                    if (!transitionEnded) {
                        transitionEnded = true;
                        this.tileElement.removeEventListener('transitionend', transitionEndListener);
                        clearTimeout(fallbackTimeout);
                        onRemoveEnd();
                    }
                }
            };
            this.tileElement.addEventListener('transitionend', transitionEndListener);
            
            const fallbackTimeout = setTimeout(() => {
                if (!transitionEnded) {
                    this.tileElement.removeEventListener('transitionend', transitionEndListener);
                    onRemoveEnd();
                }
            }, 160); // Slightly longer than opacity/transform transition (0.1s)
        });
    }
    
    waitForMovement() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve(); return;
            }
            const styles = window.getComputedStyle(this.tileElement);
            // Check if there's a transform transition to wait for
            if (styles.display === 'none' || !styles.transitionProperty.includes('transform') || styles.transitionDuration === '0s') {
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

            const timeoutId = setTimeout(() => {
                if(!resolved) {
                    this.tileElement.removeEventListener(eventName, resolveOnce); 
                    resolve(); 
                }
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, resolveOnce);
        });
    }

    triggerNumberPopAnimation() {
        this.numberDisplay.classList.add('number-pop-effect'); 
        this.numberDisplay.addEventListener('animationend', () => {
            this.numberDisplay.classList.remove('number-pop-effect');
        }, { once: true });
    }

    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; 
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement); // Sets new transform target
        await this.waitForMovement(); // Waits for CSS transition on transform
    }
}

    triggerNumberPopAnimation() {
        if (!this.numberDisplay) return;
        this.numberDisplay.classList.add('number-pop-effect');
        this.numberDisplay.addEventListener('animationend', () => {
            this.numberDisplay.classList.remove('number-pop-effect');
        }, { once: true });
    }
}
