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
        
        const gameArea = document.querySelector('.grid-container'); 

        const touchstartHandler = (event) => {
            if (this.game.isMoving || this.isSwiping) return;

            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
            this.isSwiping = true; 
        };

        const touchendHandler = (event) => {
            if (!this.isSwiping) return; 
            this.isSwiping = false; 

            if (this.game.isMoving) return;

            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            
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
            const swipeThreshold = 20; 
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
                return; 
            }
            
            let direction = null;
            if (absDeltaX > absDeltaY) {
                // Horizontal swipe
                if (absDeltaX > swipeThreshold) { 
                    direction = (deltaX > 0) ? "ArrowRight" : "ArrowLeft";
                }
            } else {
                // Vertical swipe
                if (absDeltaY > swipeThreshold) { 
                    // *** FIX: Invert vertical swipe mapping ***
                    // If physical swipe down (deltaY > 0) makes tiles go UP visually,
                    // we need to send the command that makes tiles go DOWN visually.
                    // Assuming game.move("ArrowUp") makes tiles go DOWN visually, and
                    // game.move("ArrowDown") makes tiles go UP visually, based on user report.
                    direction = (deltaY > 0) ? "ArrowUp" : "ArrowDown"; 
                }
            }
            
            if (direction) {
                // console.log(`Swipe detected. Physical deltaY: ${deltaY}, Sending game direction: ${direction}`);
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
        } else {
            console.error("Grid container for touch input not found!");
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
