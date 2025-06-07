const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

// Set canvas dimensions
ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

let board = new Board(ctx, nextCtx);
let game = new Game();
let requestId;
let time = { start: 0, elapsed: 0, level: 1000 };

function play() {
    game.reset();
    board.reset();
    time.level = 1000 / game.level;
    animate();
}

function animate(now = 0) {
    time.elapsed = now - time.start;
    if (time.elapsed > time.level) {
        time.start = now;
        if (!drop()) {
            gameOver();
            return;
        }
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    board.draw();
    requestId = requestAnimationFrame(animate);
}

function drop() {
    let p = { ...board.piece, y: board.piece.y + 1 };
    if (board.isValid(p)) {
        board.piece.move(p);
    } else {
        board.freeze();
        board.clearLines();
        if (board.piece.y === 0) {
            // Game Over
            return false;
        }
        board.getNewPiece();
    }
    return true;
}

function gameOver() {
    cancelAnimationFrame(requestId);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, ctx.canvas.height / 2 - 30, ctx.canvas.width, 60);
    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.shadowBlur = 0;
}

document.addEventListener('keydown', event => {
    let p = { ...board.piece };
    
    if(event.keyCode === KEY.LEFT) {
        p.x -= 1;
    } else if (event.keyCode === KEY.RIGHT) {
        p.x += 1;
    } else if (event.keyCode === KEY.DOWN) {
        drop();
    } else if (event.keyCode === KEY.UP) {
        p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
    } else if (event.keyCode === KEY.SPACE) {
        while(board.isValid(p)) {
            board.piece.move(p);
            p.y++;
        }
        drop(); // Freeze it in place
        return;
    }

    if (board.isValid(p)) {
        board.piece.move(p);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        board.draw();
    }
});


play();
