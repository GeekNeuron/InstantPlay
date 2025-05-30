// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        
        this.id = `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.tileElement.setAttribute('data-id', this.id);

        // Create a span for the number to animate it independently
        this.numberDisplay = document.createElement('span');
        this.numberDisplay.classList.add('tile-number-display');
        this.tileElement.appendChild(this.numberDisplay);

        this.x = -1; 
        this.y = -1;
        this.value = 0;
        this.mergedFrom = null;
        this.markedForRemoval = false;

        this.setValue(value, true); 
        gridElement.append(this.tileElement);
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.numberDisplay.textContent = value; // Set text content of the span
        this.tileElement.dataset.value = value; 
        this.adjustFontSize(); // Adjust font size of the main tile element (span will inherit or can be styled)

        if (!isNewTile && oldValue !== value && oldValue !== 0) { // Value changed due to merge
            this.triggerMergeAnimation(); 
        }
    }

    adjustFontSize() {
        // This adjusts font size for the .tile element. 
        // The .tile-number-display span will inherit this, or can have its own relative size.
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
        
        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);
        requestAnimationFrame(() => { 
            if (this.tileElement.style.opacity !== '1') {
                 // Let 'appear' animation handle initial opacity
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
            let currentTransform = this.tileElement.style.transform || '';
            if (!currentTransform.includes('scale(')) {
                 this.tileElement.style.transform = currentTransform + ' scale(0.1)';
            }

            const onRemoveEnd = () => {
                if (this.tileElement.parentElement) {
                    this.tileElement.remove();
                }
                resolve();
            };
            this.tileElement.addEventListener('transitionend', function TEnd(event) {
                if (event.propertyName === 'opacity') {
                    this.removeEventListener('transitionend', TEnd);
                    onRemoveEnd();
                }
            });
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
            const timeoutDuration = 120; 
            
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

    // This method adds a class to trigger the number pop animation
    triggerMergeAnimation() {
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
