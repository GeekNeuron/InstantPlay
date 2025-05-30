// js/input.js

class InputManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.eventListeners = {}; // To manage removing listeners if needed
        this.listen();
    }

    listen() {
        const keydownHandler = (event) => {
            if (this.game.gameOver && event.key !== "Enter" && event.key !== " ") return; // Allow restart via Enter/Space on game over

            // Allow restart if modal is visible
            if (this.game.gameOverModal.style.display === 'flex') {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.game.startNewGame();
                }
                return;
            }


            let direction = null;
            switch (event.key) {
                case "ArrowUp": case "w": case "W":
                    direction = "ArrowUp"; break;
                case "ArrowDown": case "s": case "S":
                    direction = "ArrowDown"; break;
                case "ArrowLeft": case "a": case "A":
                    direction = "ArrowLeft"; break;
                case "ArrowRight": case "d": case "D":
                    direction = "ArrowRight"; break;
            }

            if (direction) {
                event.preventDefault(); // Prevent page scrolling
                this.game.move(direction);
            }
        };
        this.eventListeners.keydown = keydownHandler;
        window.addEventListener("keydown", keydownHandler);

        // --- Touch Input Management ---
        let touchstartX = 0;
        let touchstartY = 0;
        let touchendX = 0;
        let touchendY = 0;

        const gameArea = document.querySelector('.grid-container'); // Or a broader container

        const touchstartHandler = (event) => {
            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
        };

        const touchendHandler = (event) => {
            if (this.game.gameOver) return;
            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            handleSwipe();
        };

        const handleSwipe = () => {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;
            const swipeThreshold = 50; // Minimum distance for a swipe

            if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
                if (Math.abs(deltaX) > swipeThreshold) {
                    if (deltaX > 0) this.game.move("ArrowRight");
                    else this.game.move("ArrowLeft");
                }
            } else { // Vertical swipe
                if (Math.abs(deltaY) > swipeThreshold) {
                    if (deltaY > 0) this.game.move("ArrowDown");
                    else this.game.move("ArrowUp");
                }
            }
        };

        if (gameArea) {
            this.eventListeners.touchstart = touchstartHandler;
            this.eventListeners.touchend = touchendHandler;
            // Use { passive: false } if you need to preventDefault() within touch handlers,
            // but be cautious as it can affect scrolling performance.
            // For swipe detection, often passive: true is fine.
            gameArea.addEventListener('touchstart', touchstartHandler, { passive: true });
            gameArea.addEventListener('touchend', touchendHandler, { passive: true });
        }
    }

    // Call this if you need to remove event listeners, e.g., when tearing down the game instance
    destroy() {
        window.removeEventListener("keydown", this.eventListeners.keydown);
        const gameArea = document.querySelector('.grid-container');
        if (gameArea && this.eventListeners.touchstart && this.eventListeners.touchend) {
            gameArea.removeEventListener('touchstart', this.eventListeners.touchstart);
            gameArea.removeEventListener('touchend', this.eventListeners.touchend);
        }
    }
}
