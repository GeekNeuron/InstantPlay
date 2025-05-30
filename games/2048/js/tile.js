// js/tile.js

const TILE_GAP = 10; // Should match the 'gap' in .grid-container CSS
const GRID_CONTAINER_WIDTH = 320; // Should match .grid-container width in CSS

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        // Initial scale for appear animation
        this.tileElement.style.transform = 'scale(0)';
        this.tileElement.style.opacity = '0';

        this.setValue(value);
        gridElement.append(this.tileElement);

        // Trigger appear animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double requestAnimationFrame for better animation start
                this.tileElement.style.transform = 'scale(1)';
                this.tileElement.style.opacity = '1';
            });
        });
    }

    setValue(value) {
        this.value = value;
        this.tileElement.textContent = value;
        this.tileElement.dataset.value = value; // For CSS styling based on value

        // Adjust font size based on tile value (can also be done primarily in CSS)
        let fontSize = "1.8em";
        if (value >= 1024) fontSize = "1.3em";
        else if (value >= 128) fontSize = "1.6em";
        this.tileElement.style.fontSize = fontSize;
    }

    setPosition(row, col, gridSize) {
        this.x = row;
        this.y = col;

        const containerWidth = parseFloat(getComputedStyle(this.tileElement.parentElement).width);
        const gap = parseFloat(getComputedStyle(this.tileElement.parentElement).gap);
        const tileBaseSize = (containerWidth - (gap * (gridSize + 1))) / gridSize;

        this.tileElement.style.width = `${tileBaseSize}px`;
        this.tileElement.style.height = `${tileBaseSize}px`;
        
        const xPos = col * (tileBaseSize + gap) + gap;
        const yPos = row * (tileBaseSize + gap) + gap;

        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px) scale(1)`;
    }

    remove() {
        this.tileElement.remove();
    }

    // Waits for CSS transition or animation to complete
    waitForTransition(isAnimation = false) {
        return new Promise(resolve => {
            const eventName = isAnimation ? 'animationend' : 'transitionend';
            this.tileElement.addEventListener(eventName, resolve, { once: true });
        });
    }

    // Triggers the merge animation
    merged() {
        this.tileElement.classList.add('tile-merged');
        // Remove class after animation to allow re-triggering
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }
}
