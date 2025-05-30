// js/input.js

class InputManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.eventListeners = {};
        this.isSwiping = false; 
        this.listen();
    }

    listen() {
        const keydownHandler = (event) => {
            if (this.game.isMoving) return;

            if (this.game.gameOverModal.classList.contains('show')) {
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
                event.preventDefault(); // Still good to prevent default for keyboard, e.g. arrow key scrolling
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

        // Touch events will be on grid-container itself due to touch-action: none
        const gameArea = document.querySelector('.grid-container'); 

        const touchstartHandler = (event) => {
            // event.target.closest check is less critical if listener is on grid-container
            // but good for robustness if listener was on body.
            if (this.game.isMoving || this.isSwiping) return;

            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
            touchstartTime = new Date().getTime();
            this.isSwiping = true; 
        };

        const touchendHandler = (event) => {
            if (!this.isSwiping) return; 
            this.isSwiping = false; 

            if (this.game.isMoving) return;

            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            // const touchendTime = new Date().getTime(); // Not used in this version
            // const timeDiff = touchendTime - touchstartTime; // Not used in this version

            handleSwipe();
        };
        
        const touchcancelHandler = () => {
            this.isSwiping = false;
            touchstartX = 0;
            touchstartY = 0;
        };

        const handleSwipe = () => {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;
            const swipeThreshold = 20; // Min distance for a swipe
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
                return; // Not a swipe or too short
            }
            
            let direction = null;
            // Prioritize the direction with greater movement
            if (absDeltaX > absDeltaY) {
                // More horizontal movement
                if (absDeltaX > swipeThreshold) { // Check threshold for the dominant axis
                    direction = (deltaX > 0) ? "ArrowRight" : "ArrowLeft";
                }
            } else {
                // More vertical movement
                if (absDeltaY > swipeThreshold) { // Check threshold for the dominant axis
                    direction = (deltaY > 0) ? "ArrowDown" : "ArrowUp";
                }
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
            this.eventListeners.touchcancel = touchcancelHandler;

            // passive: true is fine here because touch-action: none on the element
            // will handle the scroll prevention.
            gameArea.addEventListener('touchstart', touchstartHandler, { passive: true });
            gameArea.addEventListener('touchend', touchendHandler, { passive: true });
            gameArea.addEventListener('touchcancel', touchcancelHandler, { passive: true });
        } else {
            console.error("Game area for touch input not found!");
        }
    }

    destroy() {
        window.removeEventListener("keydown", this.eventListeners.keydown);
        const gameArea = document.querySelector('.grid-container');
        if (gameArea) {
            if(this.eventListeners.touchstart) gameArea.removeEventListener('touchstart', this.eventListeners.touchstart);
            if(this.eventListeners.touchend) gameArea.removeEventListener('touchend', this.eventListeners.touchend);
            if(this.eventListeners.touchcancel) gameArea.removeEventListener('touchcancel', this.eventListeners.touchcancel);
        }
    }
}
