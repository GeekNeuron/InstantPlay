document.addEventListener('DOMContentLoaded', () => {
    // All code now runs only after the page is fully loaded.

    const canvas = document.getElementById('tetris-canvas');
    if (!canvas) {
        console.error("Fatal Error: Could not find canvas element!");
        return;
    }
    const ctx = canvas.getContext('2d');
    const newGameButton = document.getElementById('new-game-button');
    const headerTitle = document.querySelector('header h1');
    const holdBox = document.getElementById('hold-box');
    const timerElement = document.getElementById('timer');

    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;

    let board = new Board(ctx);
    let game = new Game();
    let requestId;
    let gameTimer;
    let softDropping = false;
    
    // --- MOVED a few lines up to fix the error ---
    let time = { start: 0, elapsed: 0 };


    // --- THEME SWITCHING LOGIC ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        if (board) {
            board.updateAndDraw(); 
        }
    }
    function toggleTheme() {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('tetrisTheme', newTheme);
        applyTheme(newTheme);
    }
    headerTitle.addEventListener('click', toggleTheme);
    
    // On page load, apply saved theme, then start the game
    const savedTheme = localStorage.getItem('tetrisTheme') || 'dark';
    applyTheme(savedTheme);
    play();

    // --- TIMER LOGIC ---
    function startTimer() { let startTime = Date.now(); timerElement.textContent = '00:00:00'; gameTimer = setInterval(() => { const elapsedTime = Date.now() - startTime; const seconds = Math.floor((elapsedTime / 1000) % 60); const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60); const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24); timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }, 1000); }
    function stopTimer() { clearInterval(gameTimer); }

    // --- GAME LOGIC ---
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
        board.updateAndDraw(); 

        if (board.piece) {
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
        }
        requestId = requestAnimationFrame(gameLoop);
    }

    function drop() {
        if (!board.piece) return true;
        let p = { ...board.piece, y: board.piece.y + 1 };
        if (board.isValid(p)) {
            board.piece.move(p);
        } else {
            board.freeze();
            board.getNewPiece();
            if (!board.isValid(board.piece)) {
                gameOver();
                return false;
            }
        }
        return true;
    }
    
    function gameOver() {
        cancelAnimationFrame(requestId);
        stopTimer();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, ctx.canvas.height / 2 - 30, ctx.canvas.width, 60);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 32px Vazirmatn, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', ctx.canvas.height / 2, ctx.canvas.height / 2);
    }

    function hardDrop() {
        if (!board.piece || board.animations.some(a => a.type === 'hard-drop')) return;
        const animationStarted = board.triggerHardDrop();
        if (animationStarted) {
            setTimeout(() => {
                board.getNewPiece();
                if (!board.isValid(board.piece)) {
                    gameOver();
                }
            }, 150);
        } else {
            drop();
        }
    }

    // --- CONTROLS (Keyboard & Touch) ---
    document.addEventListener('keydown', event => {
        if (board.animations.some(a => a.type === 'hard-drop')) return;
        if ([37, 38, 39, 40, 32, 67].includes(event.keyCode)) event.preventDefault();
        if (!board.piece) return;
        if (event.keyCode === 32) { hardDrop(); return; }
        let p = { ...board.piece };
        if (event.keyCode === 37) p.x -= 1;
        else if (event.keyCode === 39) p.x += 1;
        else if (event.keyCode === 38) p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
        if (board.isValid(p)) board.piece.move(p);
        if (event.keyCode === 40) softDropping = true;
        else if (event.keyCode === 67) board.hold();
    });
    document.addEventListener('keyup', event => { if (event.keyCode === 40) softDropping = false; });

    let touchStartX = 0, touchStartY = 0;
    const swipeThreshold = 30;
    canvas.addEventListener('touchstart', e => { if (board.animations.some(a => a.type === 'hard-drop')) return; e.preventDefault(); touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', e => {
        if (board.animations.some(a => a.type === 'hard-drop')) return;
        e.preventDefault();
        if (!board.piece) return;
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        const deltaY = e.changedTouches[0].screenY - touchStartY;
        let p = { ...board.piece };
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > swipeThreshold) { p.x += (deltaX > 0 ? 1 : -1); if (board.isValid(p)) board.piece.move(p); }
        } else {
            if (deltaY > swipeThreshold) drop();
            else if (deltaY < -swipeThreshold) hardDrop();
            else { p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse()); if (board.isValid(p)) board.piece.move(p); }
        }
    });
    holdBox.addEventListener('touchstart', e => { if (board.animations.some(a => a.type === 'hard-drop')) return; e.preventDefault(); board.hold(); });
});
