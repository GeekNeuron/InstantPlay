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
        this.value = 0; 
        this.markedForRemoval = false;

        this.setValue(value, true);
        gridElement.append(this.tileElement);
    }

    setValue(value, isNewTile = false) {
        const oldValue = this.value;
        this.value = value;
        this.numberDisplay.textContent = value; 
        this.tileElement.dataset.value = value; 
        
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
        this.tileElement.style.fontSize = `${baseSize}em`;
    }

    _updateVisuals(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0;
        const gap = parseFloat(computedStyle.getPropertyValue('gap')) || 0;

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

        this.tileElement.style.left = `${xPos}px`;
        this.tileElement.style.top = `${yPos}px`;

        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement, isNewSpawn = false) {
        this.x = row;
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);

        if (isNewSpawn) {
            setTimeout(() => {
                this.triggerNumberPopAnimation();
            }, 50);
        }
    }

    triggerNumberPopAnimation() {
        this.numberDisplay.classList.add('number-pop-effect'); 
        this.numberDisplay.addEventListener('animationend', () => {
            this.numberDisplay.classList.remove('number-pop-effect');
        }, { once: true });
    }

    remove() { 
        return new Promise(resolve => {
            if (!this.tileElement || !this.tileElement.parentElement) {
                resolve();
                return;
            }
            this.tileElement.style.opacity = '0';
            this.tileElement.remove();
            resolve();
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

        let resolved = false;
        const resolveOnce = (event) => {
            if (event && event.target !== this.tileElement) return; 
            if (event && event.propertyName !== 'transform') return; 
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };

        this.tileElement.addEventListener("transitionend", resolveOnce);
    });
}

    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; 
        this.y = col;
        this._updateVisuals(row, col, gridSize, gridElement);
        await this.waitForMovement();
    }
}
