// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.tileElement.setAttribute('data-id', this.id);

        this.numberDisplay = document.createElement('span');
        this.numberDisplay.classList.add('tile-number-display');
        this.tileElement.appendChild(this.numberDisplay);

        this.x = -1; 
        this.y = -1;
        this.value = 0; // Initialize value before setting
        this.markedForRemoval = false;

        // Set initial value and font size. For new tiles, pop will be triggered after positioning.
        this.setValue(value, true); 
        gridElement.append(this.tileElement);
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.numberDisplay.textContent = value; 
        this.tileElement.dataset.value = value; 
        
        // Adjust font size after value is set.
        // For new tiles, this might be called again in _updateVisuals after dimensions are known.
        this.adjustFontSize(); 

        if (!isNewTile && oldValue !== value && oldValue !== 0) { 
            this.triggerNumberPopAnimation(); 
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
        // Apply to the tile element, span will inherit or can be styled independently if needed
        this.tileElement.style.fontSize = `${baseSize}em`;
    }

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

        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        // This is the most reliable place to adjust font size as tile dimensions are now known.
        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement, isNewSpawn = false) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);

        // Trigger number pop for newly spawned tiles after they are positioned
        if (isNewSpawn) {
            // A short delay might make the combined appear + numberPop look better
            setTimeout(() => {
                this.triggerNumberPopAnimation();
            }, 50); // Small delay after tile 'appear' animation starts
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
            // Only add scale if not already present to avoid compounding scale(0.1)scale(0.1)
            if (!currentTransform.includes('scale(')) { 
                 this.tileElement.style.transform = currentTransform + ' scale(0.1)';
            } else if (!currentTransform.includes('scale(0.1)')) { // If scaled but not to 0.1
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
            }, 160); 
        });
    }
    
    waitForMovement() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve(); return;
            }
            const styles = window.getComputedStyle(this.tileElement);
            if (styles.display === 'none' || !styles.transitionProperty.includes('transform') || styles.transitionDuration === '0s') {
                resolve(); return; 
            }

            const eventName = 'transitionend';
            const timeoutDuration = 120; 
            
            let resolved = false;
            const resolveOnce = (event) => {
                if (event && event.target !== this.tileElement) return; 
                if (event && event.propertyName !== 'transform') return; // Only care about transform
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    this.tileElement.removeEventListener(eventName, resolveOnce);
                    resolve();
                }
            };

            const timeoutId = setTimeout(() => {
                if(!resolved) { // Check if not already resolved by event
                    // console.warn(`Tile (${this.id}, val ${this.value}) waitForMovement TIMEOUT`);
                    this.tileElement.removeEventListener(eventName, resolveOnce); // Clean up listener
                    resolve(); // Resolve to prevent game hanging
                }
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, resolveOnce);
        });
    }

    // Renamed for clarity, used for both merge and new tile number pop
    triggerNumberPopAnimation() {
        this.numberDisplay.classList.add('number-pop-effect'); 
        this.numberDisplay.addEventListener('animationend', () => {
            this.numberDisplay.classList.remove('number-pop-effect');
        }, { once: true });
    }

    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; 
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement); 
        await this.waitForMovement(); 
    }
}
