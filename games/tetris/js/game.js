class Game {
    constructor() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
    }
    
    updateScore(linesCleared) {
        const linePoints = [0, POINTS.SINGLE, POINTS.DOUBLE, POINTS.TRIPLE, POINTS.TETRIS];
        this.score += linePoints[linesCleared] * this.level;
        this.lines += linesCleared;
        
        if (this.lines >= this.level * 10) {
            this.level++;
        }
        
        this.updateDOM();
    }
    
    updateDOM() {
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
        this.levelElement.textContent = this.level;
        this.highScoreElement = document.getElementById('high-score');
this.highScore = 0;
        this.highScoreElement.textContent = this.highScore;
    }
    
    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.updateDOM();
        // We don't reset highScore here, it persists across games.
    }
}
