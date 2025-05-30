// js/tile.js

class Tile {
    constructor(gridElement, value = Math.random() < 0.9 ? 2 : 4) {
        this.tileElement = document.createElement('div');
        this.tileElement.classList.add('tile');
        this.tileElement.style.opacity = '0'; // Start invisible for appear animation

        this.setValue(value);
        gridElement.append(this.tileElement);

        // Defer scaling animation to ensure it plays after appended
        requestAnimationFrame(() => {
            this.tileElement.style.opacity = '1';
            // The appear animation is now handled by CSS @keyframes 'appear'
        });
    }

    setValue(value) {
        this.value = value;
        this.tileElement.textContent = value;
        this.tileElement.dataset.value = value; // For CSS styling

        // Font size adjustments based on number length for better fit
        // These are examples; fine-tune based on your chosen font and tile sizes
        let len = value.toString().length;
        if (len > 4) { // e.g., 16384
            this.tileElement.style.fontSize = "1.3em";
        } else if (len > 3) { // e.g., 8192, 4096, 2048
            this.tileElement.style.fontSize = "1.8em";
        } else if (len > 2) { // e.g., 512, 256, 128
            this.tileElement.style.fontSize = "2.3em";
        } else { // e.g., 64, 32, 16, 8, 4, 2
            this.tileElement.style.fontSize = "2.8em";
        }
        // Override specific values if needed (like already in CSS for 128+)
         if (this.value >= 1024) this.tileElement.style.fontSize = "1.8em";
         else if (this.value >= 128) this.tileElement.style.fontSize = "2.3em";

    }

    setPosition(row, col, gridSize, gridElement) {
        this.x = row;
        this.y = col;

        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft); // Assuming padding is uniform
        const gap = parseFloat(computedStyle.gap);
        
        // Calculate total available width/height for cells (grid width/height - paddings)
        const availableWidth = gridElement.clientWidth - 2 * gridPadding;
        // const availableHeight = gridElement.clientHeight - 2 * gridPadding; // Assuming square grid for now

        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;

        this.tileElement.style.width = `${cellSize}px`;
        this.tileElement.style.height = `${cellSize}px`;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    remove(withAnimation = false) {
        if (withAnimation) {
            this.tileElement.style.opacity = '0';
            this.tileElement.style.transform += ' scale(0.5)'; // Shrink and fade
            this.tileElement.addEventListener('transitionend', () => this.tileElement.remove(), { once: true });
        } else {
            this.tileElement.remove();
        }
    }

    waitForTransition(isAnimation = false) {
        return new Promise(resolve => {
            const eventName = isAnimation ? 'animationend' : 'transitionend';
            this.tileElement.addEventListener(eventName, resolve, { once: true });
        });
    }

    merged() {
        this.tileElement.classList.add('tile-merged');
        this.tileElement.addEventListener('animationend', () => {
            this.tileElement.classList.remove('tile-merged');
        }, { once: true });
    }

    // For smooth movement animation (called by grid.js or game.js)
    async moveTo(row, col, gridSize, gridElement) {
        this.x = row; // Update logical position immediately
        this.y = col;

        const computedStyle = getComputedStyle(gridElement);
        const gridPadding = parseFloat(computedStyle.paddingLeft);
        const gap = parseFloat(computedStyle.gap);
        const availableWidth = gridElement.clientWidth - 2 * gridPadding;
        const cellSize = (availableWidth - (gridSize - 1) * gap) / gridSize;
        
        const xPos = col * (cellSize + gap) + gridPadding;
        const yPos = row * (cellSize + gap) + gridPadding;

        this.tileElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        await this.waitForTransition();
    }
}
