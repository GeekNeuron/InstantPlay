// js/input.js

class InputManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.eventListeners = {};
        this.isSwiping = false; // Flag to manage swipe state
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

        const gameArea = document.body; 

        const touchstartHandler = (event) => {
            if (event.target.closest('button, a, input, .top-bar')) return;
            if (this.game.isMoving || this.isSwiping) return; // Don't start new swipe if already processing one or game is moving

            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
            touchstartTime = new Date().getTime();
            this.isSwiping = true; // Indicate a potential swipe has started
        };

        const touchendHandler = (event) => {
            if (!this.isSwiping) return; // Only process if a swipe was initiated
            this.isSwiping = false; // Reset swipe flag

            if (event.target.closest('button, a, input, .top-bar')) return;
            if (this.game.isMoving) return;

            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            const touchendTime = new Date().getTime();
            const timeDiff = touchendTime - touchstartTime;

            handleSwipe(timeDiff);
        };
        
        const touchcancelHandler = () => {
            // Reset swipe state if touch is cancelled (e.g. browser interruption)
            this.isSwiping = false;
            touchstartX = 0;
            touchstartY = 0;
        };


        const handleSwipe = (timeDiff) => {
            const deltaX = touchendX - touchstartX;
            const deltaY = touchendY - touchstartY;
            const swipeThreshold = 25; // Adjusted threshold
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Filter out very short and quick taps that are not swipes
            if (timeDiff < 150 && Math.max(absDeltaX, absDeltaY) < (swipeThreshold + 5)) {
                return; 
            }
            
            // Ensure movement is significant enough
            if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
                return; 
            }

            // Determine predominant direction (more horizontal or more vertical)
            // And ensure it's not too diagonal (e.g., diff between absDeltaX and absDeltaY isn't too small)
            const predominantThreshold = 1.5; // e.g., X movement must be 1.5x Y movement to be horizontal
            let direction = null;

            if (absDeltaX > absDeltaY && absDeltaX > absDeltaY * predominantThreshold) { 
                direction = (deltaX > 0) ? "ArrowRight" : "ArrowLeft";
            } else if (absDeltaY > absDeltaX && absDeltaY > absDeltaX * predominantThreshold) { 
                direction = (deltaY > 0) ? "ArrowDown" : "ArrowUp";
            } else {
                return; // Swipe is too diagonal or not clear
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

            gameArea.addEventListener('touchstart', touchstartHandler, { passive: true });
            gameArea.addEventListener('touchend', touchendHandler, { passive: true });
            gameArea.addEventListener('touchcancel', touchcancelHandler, { passive: true });
        }
    }

    destroy() {
        window.removeEventListener("keydown", this.eventListeners.keydown);
        const gameArea = document.body;
        if (gameArea) {
            if(this.eventListeners.touchstart) gameArea.removeEventListener('touchstart', this.eventListeners.touchstart);
            if(this.eventListeners.touchend) gameArea.removeEventListener('touchend', this.eventListeners.touchend);
            if(this.eventListeners.touchcancel) gameArea.removeEventListener('touchcancel', this.eventListeners.touchcancel);
        }
    }
}
