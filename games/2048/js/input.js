// js/input.js

class InputManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.eventListeners = {}; // To manage removing listeners if needed
        this.listen();
    }

    listen() {
        const keydownHandler = (event) => {
            if (this.game.gameOver && event.key !== "Enter" && event.key !== " ") {
                // If game over modal is shown, allow Enter/Space to restart
                if (this.game.gameOverModal.classList.contains('show') && (event.key === "Enter" || event.key === " ")) {
                     event.preventDefault();
                     this.game.startNewGame();
                }
                return;
            }
            // If modal is active for game over, only allow restart keys
            if (this.game.gameOverModal.classList.contains('show')) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.game.startNewGame();
                }
                return; // Block other game moves if modal is up
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

        // Listen on a broader area if grid-container is too small or for better UX
        const gameArea = document.body; // Or document.querySelector('.container');

        const touchstartHandler = (event) => {
            // Prevent handling if it's inside a button or interactive element within gameArea
            if (event.target.closest('button, a, input')) return;
            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
        };

        const touchendHandler = (event) => {
            if (event.target.closest('button, a, input')) return;
            if (this.game.gameOver && !this.game.gameOverModal.classList.contains('show')) return; // No swipes if game over and modal not up
            if (this.game.isMoving) return; // Don't process swipe if already moving

            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            handleSwipe();
        };

        const handleSwipe = () => {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;
            const swipeThreshold = 30; // Minimum distance for a swipe (px)
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
                return; // Not a swipe, too short
            }

            let direction = null;
            if (absDeltaX > absDeltaY) { // Horizontal swipe
                direction = (deltaX > 0) ? "ArrowRight" : "ArrowLeft";
            } else { // Vertical swipe
                direction = (deltaY > 0) ? "ArrowDown" : "ArrowUp";
            }
            
            if (direction) {
                 // If game over modal is shown, a swipe could dismiss it or restart (optional UX)
                if (this.game.gameOverModal.classList.contains('show')) {
                    // Example: this.game.startNewGame();
                    return; 
                }
                this.game.move(direction);
            }
        };

        if (gameArea) {
            this.eventListeners.touchstart = touchstartHandler;
            this.eventListeners.touchend = touchendHandler;
            // Use passive: false if you need to preventDefault() for scroll, but usually not needed for swipe logic
            gameArea.addEventListener('touchstart', touchstartHandler, { passive: true });
            gameArea.addEventListener('touchend', touchendHandler, { passive: true });
        }
    }

    destroy() {
        window.removeEventListener("keydown", this.eventListeners.keydown);
        const gameArea = document.body; // Or document.querySelector('.container');
        if (gameArea && this.eventListeners.touchstart && this.eventListeners.touchend) {
            gameArea.removeEventListener('touchstart', this.eventListeners.touchstart);
            gameArea.removeEventListener('touchend', this.eventListeners.touchend);
        }
    }
}
