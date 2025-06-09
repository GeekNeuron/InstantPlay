class Game {
    constructor() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.highScore = 0;
    }

    updateScore(linesCleared) {
        const linePoints = [0, POINTS.SINGLE, POINTS.DOUBLE, POINTS.TRIPLE, POINTS.TETRIS];
        this.score += linePoints[linesCleared] * this.level;
        this.lines += linesCleared;

        if (this.lines >= this.level * 10) {
            this.level++;
        }
    }

    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
    }
}
