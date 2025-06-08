const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const newGameButton = document.getElementById('new-game-button');
const headerTitle = document.querySelector('header h1'); // MODIFIED
const holdBox = document.getElementById('hold-box');
const timerElement = document.getElementById('timer');

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

let board = new Board(ctx);
let game = new Game();
let requestId;
let gameTimer;
let softDropping = false;

// --- THEME SWITCHING LOGIC ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    if (board && board.piece) {
        board.piece.updateColor();
        if(board.nextPiece) board.nextPiece.updateColor();
        if(board.heldPiece) board.heldPiece.updateColor();
        board.draw();
    }
}
function toggleTheme() {
    const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('tetrisTheme', newTheme);
    applyTheme(newTheme);
}
headerTitle.addEventListener('click', toggleTheme); // MODIFIED

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('tetrisTheme') || 'dark';
    applyTheme(savedTheme);
    play();
});

// --- TIMER LOGIC ---
function startTimer() {
    let startTime = Date.now();
    timerElement.textContent = '00:00:00';
    gameTimer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor((elapsedTime / 1000) % 60);
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
        timerElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}
function stopTimer() { clearInterval(gameTimer); }

// --- GAME LOGIC ---
let time = { start: 0, elapsed: 0 };
function play() {
    if (requestId) cancelAnimationFrame(requestId);
    stopTimer();
    startTimer();
    game.reset();
    board.reset();
    time.start = performance.now();
    gameLoop();
}
newGameButton.addEventListener('click', play);

function gameLoop(now = 0) {
    time.elapsed = now - time.start;
    const currentLevelTime = 1000 / game.level;
    const dropInterval = softDropping ? 50 : currentLevelTime;
    if (time.elapsed > dropInterval) {
        time.start = now;
        if (!drop()) { gameOver(); return; }
    }
    board.draw();
    requestId = requestAnimationFrame(gameLoop);
}

function drop() {
    let p = { ...board.piece, y: board.piece.y + 1 };
    if (board.isValid(p)) { board.piece.move(p); }
    else { board.freeze(); if (board.piece.y === 0) return false; board.getNewPiece(); }
    return true;
}

function gameOver() {
    cancelAnimationFrame(requestId);
    stopTimer();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, ctx.canvas.height/2 - 30, ctx.canvas.width, 60);
    ctx.fillStyle = 'red';
    ctx.font = 'bold 32px Vazirmatn, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', ctx.canvas.width/2, ctx.canvas.height/2);
}

// --- CONTROLS (Keyboard & Touch) ---
document.addEventListener('keydown', event => {
    if ([37, 38, 39, 40, 32, 67].includes(event.keyCode)) event.preventDefault();
    let p = { ...board.piece };
    if (event.keyCode === 37) p.x -= 1;
    else if (event.keyCode === 39) p.x += 1;
    else if (event.keyCode === 38) p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
    if (board.isValid(p)) board.piece.move(p);
    if (event.keyCode === 40) softDropping = true;
    else if (event.keyCode === 32) { while (board.isValid(p)) { board.piece.move(p); p.y++; } board.freeze(); if (board.piece.y > 0) board.getNewPiece(); }
    else if (event.keyCode === 67) board.hold();
});
document.addEventListener('keyup', event => { if (event.keyCode === 40) softDropping = false; });

let touchStartX = 0, touchStartY = 0;
const swipeThreshold = 30;
canvas.addEventListener('touchstart', e => { e.preventDefault(); touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const deltaX = e.changedTouches[0].screenX - touchStartX;
    const deltaY = e.changedTouches[0].screenY - touchStartY;
    let p = { ...board.piece };
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > swipeThreshold) {
            p.x += (deltaX > 0 ? 1 : -1);
            if (board.isValid(p)) board.piece.move(p);
        }
    } else {
        if (deltaY > swipeThreshold) drop();
        else if (deltaY < -swipeThreshold) { while (board.isValid(p)) { board.piece.move(p); p.y++; } board.freeze(); if (board.piece.y > 0) board.getNewPiece(); }
        else { p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse()); if (board.isValid(p)) board.piece.move(p); }
    }
});
holdBox.addEventListener('touchstart', e => { e.preventDefault(); board.hold(); });
