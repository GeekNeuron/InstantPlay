// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        this.tileElement.style.opacity = '0'; 
        
        this.x = -1; 
        this.y = -1;

        // Set value and initial font size
        this.setValue(value); 
        gridElement.append(this.tileElement);

        // Trigger appear animation
        requestAnimationFrame(() => {
            this.tileElement.style.opacity = '1';
        });
    }

    setValue(value) {
        this.value = value;
        this.tileElement.textContent = value; 
        this.tileElement.dataset.value = value; 
        this.adjustFontSize(); // Adjust font size based on new value
    }

    adjustFontSize() {
        const numStr = this.value.toString();
        let baseSize = 2.8; // em, default for 1-2 digits
        if (numStr.length > 4) { 
            baseSize = 1.3;
        } else if (numStr.length === 4) { 
            baseSize = 1.8;
        } else if (numStr.length === 3) { 
            baseSize = 2.3;
        }
        
        // Consider tile's actual width for very small screens if needed
        // This part can be tricky as offsetWidth might not be fully computed yet
        // For now, relying on em units and media queries for base font size is often sufficient.
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

        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        
        // After tile dimensions are set/updated, re-adjust font size
        this.adjustFontSize(); 
    }
    
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this.updateVisualPosition(row, col, gridSize, gridElement);
    }

    remove(withAnimation = true) { 
        if (this.tileElement.parentElement) { // Only proceed if tile is in DOM
            if (withAnimation) {
                this.tileElement.style.opacity = '0';
                this.tileElement.style.transform += ' scale(0.5)'; 
                this.tileElement.addEventListener('transitionend', () => {
                    if (this.tileElement.parentElement) { 
                        this.tileElement.remove();
                    }
                }, { once: true });
            } else {
                this.tileElement.remove();
            }
        }
    }

    waitForTransition(isAnimation = false) {
        return new Promise(resolve => {
            if (!this.tileElement.parentElement) { // If tile was removed prematurely
                resolve();
                return;
            }
            const eventName = isAnimation ? 'animationend' : 'transitionend';
            const timeoutDuration = isAnimation ? 400 : 200; // Adjusted timeout
            
            let resolved = false;
            const resolveOnce = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve();
                }
            };

            const timeoutId = setTimeout(() => {
                // console.warn("Tile transition/animation timeout for value:", this.value, "at", this.x, ",", this.y);
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
        this.updateVisualPosition(row, col, gridSize, gridElement); 
        await this.waitForTransition(); 
    }
}
