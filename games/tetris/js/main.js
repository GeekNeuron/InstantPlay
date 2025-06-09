document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Element Selectors ---
    const canvas = document.getElementById('tetris-canvas');
    if (!canvas) {
        console.error("Fatal Error: Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');
    const newGameButton = document.getElementById('new-game-button');
    const pauseButton = document.getElementById('pause-button');
    const headerTitle = document.querySelector('header h1');
    const holdBox = document.getElementById('hold-box');
    const timerElement = document.getElementById('timer');
    const timerBox = document.getElementById('timer-box');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const levelElement = document.getElementById('level-display');
    const linesElement = document.getElementById('lines-display');
    const historyContainer = document.getElementById('history-container');
    const historyList = document.getElementById('history-list');
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalButton = document.getElementById('modal-button');

    // --- 2. Canvas and Game State Variables ---
    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;

    let board = new Board(ctx);
    let game = new Game();
    let requestId;
    let gameTimer;
    let softDropping = false;
    let isPaused = false;
    let finalTime = '00:00:00';
    let time = { start: 0, elapsed: 0 };

    // --- 3. Helper and UI Functions ---
    function updateDisplays() {
        scoreElement.textContent = game.score;
        highScoreElement.textContent = game.highScore;
        levelElement.textContent = `Level: ${game.level}`;
        linesElement.textContent = `Lines: ${game.lines}`;
    }

    function showModal(title, text, buttonText) {
        modalTitle.textContent = title;
        modalText.innerHTML = text;
        modalButton.textContent = buttonText;
        modal.classList.remove('hidden');
    }

    function hideModal() {
        modal.classList.add('hidden');
    }

    function togglePause() {
        if (modalTitle.textContent === 'Game Over') return;
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(requestId);
            stopTimer();
            pauseButton.textContent = 'Resume';
            showModal('Game Paused', `Your current score is ${game.score}`, 'Resume');
        } else {
            hideModal();
            pauseButton.textContent = 'Pause';
            time.start = performance.now() - time.elapsed;
            startTimer();
            gameLoop();
        }
    }

    function toggleHistory(event) {
        event.stopPropagation();
        if (historyContainer.classList.contains('hidden')) {
            const history = JSON.parse(localStorage.getItem('tetrisHistory')) || [];
            historyList.innerHTML = '';
            if (history.length === 0) {
                historyList.innerHTML = '<li>No history yet.</li>';
            } else {
                history.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>S${item.score} | L${item.level} | ${item.time}</span><span>${item.date}</span>`;
                    historyList.appendChild(li);
                });
            }
            const timerRect = timerBox.getBoundingClientRect();
            historyContainer.style.top = `${timerRect.bottom + 5}px`;
            historyContainer.style.left = `${timerRect.left}px`;
            historyContainer.classList.remove('hidden');
        } else {
            historyContainer.classList.add('hidden');
        }
    }
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        if (board) {
            board.draw();
        }
    }

    function toggleTheme() {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('tetrisTheme', newTheme);
        applyTheme(newTheme);
    }
    
    function startTimer() {
        let startTime = Date.now();
        timerElement.textContent = '00:00:00';
        gameTimer = setInterval(() => {
            if (isPaused) return; 
            const elapsedTime = Date.now() - startTime;
            const seconds = Math.floor((elapsedTime / 1000) % 60);
            const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
            const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
            timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(gameTimer);
    }

    // --- 4. Core Game Flow ---
    function play() {
        hideModal();
        historyContainer.classList.add('hidden');
        if (requestId) cancelAnimationFrame(requestId);
        stopTimer();
        startTimer();
        isPaused = false;
        pauseButton.textContent = 'Pause';
        game.reset();
        game.highScore = localStorage.getItem('tetrisHighScore') || 0;
        board.initNextQueue();
        board.reset();
        updateDisplays();
        time.start = performance.now();
        gameLoop();
    }

    function gameLoop(now = 0) {
        if (isPaused) {
            requestId = requestAnimationFrame(gameLoop);
            return;
        }
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

    function gameOver() {
        cancelAnimationFrame(requestId);
        stopTimer();
        finalTime = timerElement.textContent;
        if (game.score > game.highScore) {
            game.highScore = game.score;
            localStorage.setItem('tetrisHighScore', game.highScore);
        }
        const history = JSON.parse(localStorage.getItem('tetrisHistory')) || [];
        const gameData = {
            score: game.score,
            level: game.level,
            time: finalTime,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' })
        };
        history.unshift(gameData);
        if (history.length > 20) history.pop();
        localStorage.setItem('tetrisHistory', JSON.stringify(history));
        updateDisplays();
        const gameOverText = `High Score: <strong>${game.highScore}</strong>`;
        showModal(`Your Score: ${game.score}`, gameOverText, 'Play Again');
    }

    // --- 5. Event Listeners ---
    headerTitle.addEventListener('click', toggleTheme);
    newGameButton.addEventListener('click', play);
    pauseButton.addEventListener('click', togglePause);
    timerBox.addEventListener('click', toggleHistory);
    modalButton.addEventListener('click', () => {
        if (isPaused) {
            togglePause();
        } else {
            play();
        }
    });
    document.addEventListener('click', (e) => {
        if (!historyContainer.classList.contains('hidden') && !historyContainer.contains(e.target) && !timerBox.contains(e.target)) {
            historyContainer.classList.add('hidden');
        }
    });
    
    // --- CONTROLS (Keyboard & Touch) ---
    document.addEventListener('keydown', event => {
        if (event.keyCode === KEY.P) { togglePause(); return; }
        if (isPaused) return;
        if ([37, 38, 39, 40, 32, 67].includes(event.keyCode)) event.preventDefault();
        if (!board.piece) return;
        let p = { ...board.piece };
        if (event.keyCode === 37) p.x -= 1;
        else if (event.keyCode === 39) p.x += 1;
        else if (event.keyCode === 38) p.shape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
        if (board.isValid(p)) board.piece.move(p);
        if (event.keyCode === 40) {
            softDropping = true;
        } else if (event.keyCode === 32) {
            while (board.isValid(p)) { board.piece.move(p); p.y++; }
            drop();
        } else if (event.keyCode === 67) {
            board.hold();
        }
    });
    document.addEventListener('keyup', event => {
        if (event.keyCode === 40) softDropping = false;
    });
    let touchStartX = 0, touchStartY = 0;
    const swipeThreshold = 30;
    canvas.addEventListener('touchstart', e => { if (isPaused) return; e.preventDefault(); touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', e => {
        if (isPaused) return;
        e.preventDefault();
        if (!board.piece) return;
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        const deltaY = e.changedTouches[0].screenY - touchStartY;
        let p = { ...board.piece };
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > swipeThreshold) { p.x += (deltaX > 0 ? 1 : -
