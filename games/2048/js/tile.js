// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        // Initial opacity for appear animation, transform is handled by keyframes
        this.tileElement.style.opacity = '0'; 
        
        // Store logical position
        this.x = -1; // Initial invalid position
        this.y = -1;

        this.setValue(value); // Sets textContent, data-value, and font size
        gridElement.append(this.tileElement);

        // Trigger appear animation (CSS @keyframes 'appear')
        requestAnimationFrame(() => {
            this.tileElement.style.opacity = '1';
            // CSS animation 'appear' handles scale and opacity
        });
    }

    setValue(value) {
        this.value = value;
        this.tileElement.textContent = value; // Set the number
        this.tileElement.dataset.value = value; // For CSS styling based on value

        // Dynamic font size adjustment based on number of digits
        const numStr = value.toString();
        let baseSize = 2.8; // em, for 1-2 digits
        if (numStr.length > 4) { // e.g., 16384
            baseSize = 1.3;
        } else if (numStr.length === 4) { // e.g., 2048, 4096, 8192
            baseSize = 1.8;
        } else if (numStr.length === 3) { // e.g., 128, 256, 512
            baseSize = 2.3;
        }
        this.tileElement.style.fontSize = `${baseSize}em`;
    }

    // Sets the visual position and size of the tile
    updateVisualPosition(row, col, gridSize, gridElement) {
        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft); // Assumes uniform padding
        const gap = parseFloat(computedStyle.gap) || 0; // Fallback if gap is not defined
        
        const availableWidth = gridElement.clientWidth - 2 * gridPadding;
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        this.tileElement.style.width = `${cellSize}px`;
        this.tileElement.style.height = `${cellSize}px`;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        // For CSS animations that might use translate
        this.tileElement.style.setProperty('--translateX', `${xPos}px`);
        this.tileElement.style.setProperty('--translateY', `${yPos}px`);
        // Apply transform directly for positioning
        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
    
    // Sets initial position and updates logical position
    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;
        this.updateVisualPosition(row, col, gridSize, gridElement);
    }


    remove(withAnimation = true) { // Default to animation for removal
        if (withAnimation) {
            this.tileElement.style.opacity = '0';
            // Add a scale down effect, or let CSS handle it via a class
            this.tileElement.style.transform += ' scale(0.5)'; 
            this.tileElement.addEventListener('transitionend', () => {
                if (this.tileElement.parentElement) { // Check if still in DOM
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
            // Fallback timeout if transition/animation doesn't fire (e.g., element removed)
            const timeoutId = setTimeout(() => {
                console.warn("Tile transition/animation timeout fallback triggered for:", this.value, this.x, this.y);
                resolve();
            }, 300); // Slightly longer than typical animations

            this.tileElement.addEventListener(eventName, () => {
                clearTimeout(timeoutId);
                resolve();
            }, { once: true });
        });
    }

    merged() {
        this.tileElement.classList.add('tile-merged'); // Triggers 'pop' animation
        // Remove class after animation to allow re-triggering
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }

    // Animate movement to a new logical and visual position
    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; // Update logical position
        this.y = col;
        this.updateVisualPosition(row, col, gridSize, gridElement); // This will trigger CSS transition
        await this.waitForTransition(); // Wait for the transform transition to complete
    }
}
