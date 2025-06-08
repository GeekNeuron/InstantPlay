const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const newGameButton = document.getElementById('new-game-button');
const header = document.querySelector('header');
const themeSwitcher = document.getElementById('theme-switcher');
const holdBox = document.getElementById('hold-box');

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

let board = new Board(ctx);
let game = new Game();
let requestId;
let time = { start: 0, elapsed: 0, level: 1000 };
let softDropping = false;

// --- THEME SWITCHING LOGIC ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeSwitcher.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        themeSwitcher.textContent = '🌙';
    }
    if (board) board.draw();
}
function toggleTheme() {
    const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('tetrisTheme', newTheme);
    applyTheme(newTheme);
}
header.addEventListener('click', toggleTheme);
themeSwitcher.addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('tetrisTheme') || 'dark';
    applyTheme(savedTheme);
    play();
});

// --- GAME LOGIC ---
function play() {
    if (requestId) cancelAnimationFrame(requestId);
    game.reset(); board.reset(); time.level = 1000;
    animate();
}
newGameButton.addEventListener('click', play);
function animate(now = 0) {
    time.elapsed = now - time.start;
    const currentLevelTime = 1000 / game.level;
    const dropInterval = softDropping ? 50 : currentLevelTime;
    if (time.elapsed > dropInterval) {
        time.start = now;
        if (!drop()) { gameOver(); return; }
    }
    board.draw();
    requestId = requestAnimationFrame(animate);
}
function drop() {
    let p = { ...board.piece, y: board.piece.y + 1 };
    if (board.isValid(p)) { board.piece.move(p); } 
    else { board.freeze(); if (board.piece.y === 0) return false; board.getNewPiece(); }
    return true;
}
function gameOver() {
    cancelAnimationFrame(requestId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, ctx.canvas.height/2 - 30, ctx.canvas.width, 60);
    ctx.fillStyle = 'red'; ctx.font = 'bold 32px Vazirmatn, Arial'; ctx.textAlign = 'center';
    ctx.fillText('Game Over', ctx.canvas.width/2, ctx.canvas.height/2);
}

// --- KEYBOARD CONTROLS ---
document.addEventListener('keydown', event => {
    if ([KEY.LEFT, KEY.RIGHT, KEY.DOWN, KEY.UP, KEY.SPACE, KEY.C].includes(event.keyCode)) event.preventDefault();
    let p = { ...board.piece };
    if (event.keyCode === KEY.LEFT) p.x -= 1;
    else if (event.keyCode === KEY.RIGHT) p.x += 1;
    else if (event.keyCode === KEY.UP) p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
    if (board.isValid(p)) board.piece.move(p);
    if (event.keyCode === KEY.DOWN) softDropping = true;
    else if (event.keyCode === KEY.SPACE) { while (board.isValid(p)) { board.piece.move(p); p.y++; } board.freeze(); if (board.piece.y > 0) board.getNewPiece(); }
    else if (event.keyCode === KEY.C) board.hold();
});
document.addEventListener('keyup', event => { if (event.keyCode === KEY.DOWN) softDropping = false; });


// --- NEW: SWIPE AND TAP CONTROLS ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 30; // Minimum distance for a swipe

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    let p = { ...board.piece };

    if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) { // Right
                p.x += 1;
            } else { // Left
                p.x -= 1;
            }
            if (board.isValid(p)) board.piece.move(p);
        }
    } else { // Vertical swipe or tap
        if (deltaY > swipeThreshold) { // Down
            drop();
        } else if (deltaY < -swipeThreshold) { // Up (Hard Drop)
            while (board.isValid(p)) { board.piece.move(p); p.y++; }
            board.freeze(); if (board.piece.y > 0) board.getNewPiece();
        } else { // Tap (Rotate)
            p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
            if (board.isValid(p)) board.piece.move(p);
        }
    }
}

// Tap on the Hold box to trigger hold
holdBox.addEventListener('touchstart', (e) => {
    e.preventDefault();
    board.hold();
});
