// js/input.js

class InputManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.eventListeners = {};
        this.listen();
    }

    listen() {
        const keydownHandler = (event) => {
            if (this.game.isMoving) return; // Prevent input during animation

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
                event.preventDefault();
                this.game.move(direction);
            }
        };
        this.eventListeners.keydown = keydownHandler;
        window.addEventListener("keydown", keydownHandler);

        let touchstartX = 0;
        let touchstartY = 0;
        let touchendX = 0;
        let touchendY = 0;
        let touchstartTime = 0;

        const gameArea = document.body; // Listen on body for wider swipe area

        const touchstartHandler = (event) => {
            if (event.target.closest('button, a, input, .top-bar')) return; // Ignore swipes on interactive elements
            if (this.game.isMoving) return;

            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
            touchstartTime = new Date().getTime();
        };

        const touchendHandler = (event) => {
            if (event.target.closest('button, a, input, .top-bar')) return;
            if (this.game.isMoving) return;

            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            const touchendTime = new Date().getTime();

            // Prevent click events from firing after a swipe
            if (touchendTime - touchstartTime > 100 && (Math.abs(touchendX - touchstartX) > 10 || Math.abs(touchendY - touchstartY) > 10)) {
                 // If it looks like a swipe, prevent default to stop potential click on game elements
                 // This might be needed if passive: false is used. For passive: true, this won't work.
                 // event.preventDefault(); // Only if passive: false
            }
            handleSwipe();
        };

        const handleSwipe = () => {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;
            const swipeThreshold = 20; // Slightly more sensitive swipe
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
                return; 
            }

            let direction = null;
            if (absDeltaX > absDeltaY) { 
                direction = (deltaX > 0) ? "ArrowRight" : "ArrowLeft";
            } else { 
                direction = (deltaY > 0) ? "ArrowDown" : "ArrowUp";
            }
            
            if (direction) {
                if (this.game.gameOverModal.classList.contains('show')) {
                    return; 
                }
                this.game.move(direction);
            }
        };

        if (gameArea) {
            this.eventListeners.touchstart = touchstartHandler;
            this.eventListeners.touchend = touchendHandler;
            // Using passive: true for better scroll performance, swipe logic should handle it.
            // If accidental scrolling during swipe is an issue, might need to investigate passive: false
            // and careful preventDefault() usage.
            gameArea.addEventListener('touchstart', touchstartHandler, { passive: true });
            gameArea.addEventListener('touchend', touchendHandler, { passive: true });
        }
    }

    destroy() {
        window.removeEventListener("keydown", this.eventListeners.keydown);
        const gameArea = document.body;
        if (gameArea && this.eventListeners.touchstart && this.eventListeners.touchend) {
            gameArea.removeEventListener('touchstart', this.eventListeners.touchstart);
            gameArea.removeEventListener('touchend', this.eventListeners.touchend);
        }
    }
}
