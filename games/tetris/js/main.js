document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors ---
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const newGameButton = document.getElementById('new-game-button');
    const pauseButton = document.getElementById('pause-button');
    const headerTitle = document.querySelector('header h1');
    const holdBox = document.getElementById('hold-box');
    const timerElement = document.getElementById('timer');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines-display');
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalButton = document.getElementById('modal-button');

    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;

    let board = new Board(ctx);
    let game = new Game();
    let requestId;
    let gameTimer;
    let softDropping = false;
    let isPaused = false;
    let time = { start: 0, elapsed: 0, rate: 1000 };

    // --- Core Game Flow ---
    function play() {
        if (requestId) cancelAnimationFrame(requestId);
        stopTimer();
        startTimer();
        isPaused = false;
        pauseButton.textContent = 'Pause';
        modal.classList.add('hidden');
        
        game.reset();
        game.highScore = localStorage.getItem('tetrisHighScore') || 0;
        
        board.initNextQueue();
        board.reset();
        
        updateDisplays();
        time.start = performance.now();
        gameLoop();
    }

    function gameLoop(now = 0) {
        if (isPaused) return;

        time.elapsed = now - time.start;
        const currentLevelTime = time.rate / game.level;
        const dropInterval = softDropping ? 50 : currentLevelTime;

        if (time.elapsed > dropInterval) {
            time.start = now;
            if (!drop()) {
                gameOver();
                return;
            }
        }
        
        board.draw();
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
        updateDisplays();
        return true;
    }
    
    // --- UI and State Management ---
    function updateDisplays() {
        scoreElement.textContent = game.score;
        highScoreElement.textContent = game.highScore;
        levelElement.textContent = game.level;
        linesElement.textContent = `Lines: ${game.lines}`;
    }

    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(requestId);
            stopTimer();
            pauseButton.textContent = 'Resume';
            showModal('Game Paused', '', 'Resume');
        } else {
            pauseButton.textContent = 'Pause';
            modal.classList.add('hidden');
            time.start = performance.now(); // Recalibrate time
            startTimer();
            gameLoop();
        }
    }

    function gameOver() {
        cancelAnimationFrame(requestId);
        stopTimer();
        if (game.score > game.highScore) {
            game.highScore = game.score;
            localStorage.setItem('tetrisHighScore', game.highScore);
        }
        updateDisplays();
        const gameOverText = `Your Score: <strong>${game.score}</strong><br>Time: ${timerElement.textContent}`;
        showModal('Game Over', gameOverText, 'Play Again');
    }

    function showModal(title, text, buttonText) {
        modalTitle.textContent = title;
        modalText.innerHTML = text;
        modalButton.textContent = buttonText;
        modal.classList.remove('hidden');
    }
    
    // --- Event Listeners ---
    newGameButton.addEventListener('click', play);
    pauseButton.addEventListener('click', togglePause);
    modalButton.addEventListener('click', () => {
        const isGameOver = modalTitle.textContent === 'Game Over';
        if (isGameOver || isPaused) {
            modal.classList.add('hidden');
            if(isGameOver) play();
            else togglePause();
        }
    });
    
    // ... Theme, Timer, Keyboard, and Touch controls listeners ...
    function toggleTheme() { /* ... */ }
    headerTitle.addEventListener('click', toggleTheme);
    document.addEventListener('DOMContentLoaded', () => { const savedTheme = localStorage.getItem('tetrisTheme') || 'dark'; applyTheme(savedTheme); play(); });
    function startTimer() { /* ... */ }
    function stopTimer() { clearInterval(gameTimer); }
    document.addEventListener('keydown', event => { /* ... */ });
    document.addEventListener('keyup', event => { /* ... */ });
    canvas.addEventListener('touchstart', e => { /* ... */ });
    canvas.addEventListener('touchmove', e => { /* ... */ });
    canvas.addEventListener('touchend', e => { /* ... */ });
    holdBox.addEventListener('touchstart', e => { /* ... */ });
});
