const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const newGameButton = document.getElementById('new-game-button');

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

let board = new Board(ctx, nextCtx);
let game = new Game();
let requestId;
let time = { start: 0, elapsed: 0, level: 1000 };
let softDropping = false;

// --- Game Logic ---
function play() {
    if (requestId) {
        cancelAnimationFrame(requestId);
    }
    game.reset();
    board.reset();
    time.level = 1000;
    animate();
}

newGameButton.addEventListener('click', play);

function animate(now = 0) {
    time.elapsed = now - time.start;
    const currentLevelTime = 1000 / game.level;
    const dropInterval = softDropping ? 50 : currentLevelTime;

    if (time.elapsed > dropInterval) {
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
        if (board.piece.y === 0) {
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
    ctx.font = 'bold 32px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2);
}

// --- Controls ---
document.addEventListener('keydown', event => {
    if ([KEY.LEFT, KEY.RIGHT, KEY.DOWN, KEY.UP, KEY.SPACE].includes(event.keyCode)) {
        event.preventDefault();
    }
    let p = { ...board.piece };

    if (event.keyCode === KEY.LEFT) {
        p.x -= 1;
    } else if (event.keyCode === KEY.RIGHT) {
        p.x += 1;
    } else if (event.keyCode === KEY.UP) {
        p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
    }

    if (board.isValid(p)) {
        board.piece.move(p);
    }

    if (event.keyCode === KEY.DOWN) {
        softDropping = true;
    } else if (event.keyCode === KEY.SPACE) {
        while (board.isValid(p)) {
            board.piece.move(p);
            p.y++;
        }
        board.freeze();
        if (board.piece.y > 0) board.getNewPiece();
    }
});

document.addEventListener('keyup', event => {
    if (event.keyCode === KEY.DOWN) {
        softDropping = false;
    }
});

// Start the game
play();
