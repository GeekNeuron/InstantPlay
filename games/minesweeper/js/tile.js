// js/tile.js
class Tile {
    constructor(row, col, gameInstance) {
        this.row = row;
        this.col = col;
        this.game = gameInstance; // Reference to the Game instance

        this.isMine = false;
        this.isRevealed = false;
        this.isFlagged = false;
        this.adjacentMines = 0;

        this.element = document.createElement('div');
        this.element.classList.add('tile');

        this._onLeftClickListener = () => this.game.handleTileClick(this, true);
        this._onRightClickListener = (e) => {
            e.preventDefault(); // Prevent default context menu
            this.game.handleTileClick(this, false);
        };
        
        this.element.addEventListener('click', this._onLeftClickListener);
        this.element.addEventListener('contextmenu', this._onRightClickListener);
    }

    reveal() {
        // Internal state update, actual reveal logic happens after this in Grid.revealTile
        if (this.isRevealed || this.isFlagged) return; // Should be checked by Grid before calling

        this.isRevealed = true;
        this.element.classList.add('revealed');
        this.element.removeEventListener('click', this._onLeftClickListener);
        this.element.removeEventListener('contextmenu', this._onRightClickListener);

        if (this.isMine) {
            this.element.innerHTML = '💣'; 
            this.element.classList.add('mine'); // Ensures mine-specific styling on reveal
        } else if (this.adjacentMines > 0) {
            this.element.textContent = this.adjacentMines;
            this.element.dataset.mines = this.adjacentMines; 
        }
        // If adjacentMines is 0, it remains blank (styled by .revealed)
    }
    
    // Called specifically when game ends to show mine states
    revealAsMine(correctlyFlaggedInWin) {
        this.isRevealed = true; // Mark as revealed for consistency, though game is over
        this.element.classList.add('revealed', 'mine'); // Apply base revealed and mine styles
        
        if (correctlyFlaggedInWin) { // Only relevant if the player won
            this.element.innerHTML = '🚩'; 
            this.element.style.backgroundColor = 'var(--safe-color)'; // Green for correctly flagged mine on win
        } else {
            this.element.innerHTML = '💣'; // Default bomb display
        }
        this.element.removeEventListener('click', this._onLeftClickListener);
        this.element.removeEventListener('contextmenu', this._onRightClickListener);
    }

    revealAsWrongFlag() {
        this.isRevealed = true;
        this.element.classList.add('revealed');
        this.element.innerHTML = '❌'; 
        this.element.style.color = 'var(--mine-color)'; // Red X
        // Optional: Add distinct background for wrong flags if desired
        // this.element.style.backgroundColor = 'lightpink'; 
        this.element.removeEventListener('click', this._onLeftClickListener);
        this.element.removeEventListener('contextmenu', this._onRightClickListener);
    }


    flag() {
        if (this.isRevealed) return; // Cannot flag a revealed tile
        this.isFlagged = true;
        this.element.classList.add('flagged');
        this.element.innerHTML = '🚩'; 
    }

    unflag() {
        if (this.isRevealed) return; // Should not happen if logic is correct
        this.isFlagged = false;
        this.element.classList.remove('flagged');
        this.element.innerHTML = '';
    }
    
    destroy() {
        this.element.removeEventListener('click', this._onLeftClickListener);
        this.element.removeEventListener('contextmenu', this._onRightClickListener);
        // The element itself will be removed when boardElement.innerHTML is cleared
    }
}
