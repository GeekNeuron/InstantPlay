// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        this.tileElement.style.opacity = '0'; 
        
        this.x = -1; 
        this.y = -1;

        this.setValue(value); 
        gridElement.append(this.tileElement);

        requestAnimationFrame(() => {
            this.tileElement.style.opacity = '1';
        });
    }

    setValue(value) {
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 

        const numStr = value.toString();
        let baseSize = 2.8; 
        if (numStr.length > 4) { 
            baseSize = 1.3;
        } else if (numStr.length === 4) { 
            baseSize = 1.8;
        } else if (numStr.length === 3) { 
            baseSize = 2.3;
        }
        // Ensure font size is not too small on mobile, consider a minimum
        const currentTileWidth = this.tileElement.offsetWidth; // Get current width if available
        if (currentTileWidth && currentTileWidth < 50 && baseSize > 1.8) { // Example threshold
             baseSize = Math.max(1.8, baseSize * 0.8); // Reduce if tile is small, but not too much
        }

        this.tileElement.style.fontSize = `${baseSize}em`;
    }

    updateVisualPosition(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft) || 0;
        const gap = parseFloat(computedStyle.gap) || 0;
        
        // Use clientWidth which excludes scrollbars and is better for layout calculations
        const availableWidth = gridElement.clientWidth - (2 * gridPadding); 
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        this.tileElement.style.width = `${cellSize}px`;
        this.tileElement.style.height = `${cellSize}px`;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        // Re-evaluate font size after tile dimensions are set, especially for initial setup
        this.setValue(this.value); 
    }
    
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this.updateVisualPosition(row, col, gridSize, gridElement);
    }

    remove(withAnimation = true) { 
        if (withAnimation) {
            this.tileElement.style.opacity = '0';
            this.tileElement.style.transform += ' scale(0.5)'; 
            this.tileElement.addEventListener('transitionend', () => {
                if (this.tileElement.parentElement) { 
                    this.tileElement.remove();
                }
            }, { once: true });
        } else {
            if (this.tileElement.parentElement) {
                this.tileElement.remove();
            }
        }
    }

    waitForTransition(isAnimation = false) {
        return new Promise(resolve => {
            const eventName = isAnimation ? 'animationend' : 'transitionend';
            const timeoutDuration = isAnimation ? 400 : 300; // Longer for animations
            const timeoutId = setTimeout(() => {
                console.warn("Tile transition/animation timeout for value:", this.value, "at", this.x, ",", this.y);
                resolve(); // Resolve promise even on timeout to prevent game freeze
            }, timeoutDuration); 

            this.tileElement.addEventListener(eventName, () => {
                clearTimeout(timeoutId);
                resolve();
            }, { once: true });
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
        this.updateVisualPosition(row, col, gridSize, gridElement); 
        await this.waitForTransition(); 
    }
}
