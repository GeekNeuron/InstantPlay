// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const footerCreditElement = document.querySelector('.footer-credit');
    const timerDisplayElement = document.getElementById('timerDisplay');
    const gameHistoryDropdownElement = document.getElementById('gameHistoryDropdown');
    const historyListElement = document.getElementById('historyList');

    // Modal Elements
    const gameOverModalElement = document.getElementById('gameOverModal');
    const modalTitleElement = document.getElementById('modalTitle');
    const modalMessageElement = document.getElementById('modalMessage');
    const modalNewGameBtn = document.getElementById('modalNewGameBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');


    const THEME_KEY = 'sudokuThemeGeekNeuron_v1';
    let currentTheme = localStorage.getItem(THEME_KEY) || 'light';
    let isHistoryVisible = false;

    function _applyTheme() {
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        themeSwitcherBtn.style.backgroundColor = '';
    }

    function toggleTheme() {
        currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, currentTheme);
        _applyTheme();
    }

    function showMessage(text, type = 'info', duration = 0) {
        messageArea.textContent = text;
        messageArea.className = '';
        messageArea.classList.add(`message-${type}`);
        
        if (duration > 0) {
            setTimeout(() => {
                if (messageArea.textContent === text) {
                    clearMessage();
                }
            }, duration);
        }
    }

    function clearMessage() {
        messageArea.textContent = '';
        messageArea.className = '';
    }
    
    // --- Modal Functions ---
    /**
     * Shows the game over/status modal.
     * @param {string} title - The title for the modal.
     * @param {string} message - The message content for the modal.
     * @param {boolean} isWin - Whether this is a win modal (for animation).
     * @param {boolean} showNewGame - Whether to show the "New Game" button.
     * @param {boolean} showClose - Whether to show the "Close" button.
     */
    function showModal(title, message, isWin = false, showNewGame = true, showClose = true) {
        if (gameOverModalElement && modalTitleElement && modalMessageElement && modalNewGameBtn && modalCloseBtn) {
            modalTitleElement.textContent = title;
            modalMessageElement.textContent = message;

            modalTitleElement.classList.remove('win-animated'); // Remove first
            if (isWin) {
                modalTitleElement.classList.add('win-animated');
            }

            modalNewGameBtn.style.display = showNewGame ? 'inline-block' : 'none';
            modalCloseBtn.style.display = showClose ? 'inline-block' : 'none';
            
            const modalActionsDiv = gameOverModalElement.querySelector('.modal-actions');
            if (modalActionsDiv) {
                modalActionsDiv.style.display = (showNewGame || showClose) ? 'flex' : 'none';
            }

            gameOverModalElement.classList.add('show');
        }
    }

    function hideModal() {
        if (gameOverModalElement) {
            gameOverModalElement.classList.remove('show');
            if (modalTitleElement) {
                modalTitleElement.classList.remove('win-animated'); // Clean up animation class
            }
        }
    }
    // --- End Modal Functions ---


    function updateTimerDisplay(timeString) {
        if (timerDisplayElement) {
            timerDisplayElement.textContent = timeString;
        }
    }

    function _renderGameHistory(historyData) {
        if (!historyListElement) return;
        historyListElement.innerHTML = ''; 

        const mainHistoryHeader = gameHistoryDropdownElement ? gameHistoryDropdownElement.querySelector('.history-header') : null;
        if (mainHistoryHeader) {
            mainHistoryHeader.textContent = 'Game History';
            mainHistoryHeader.style.display = 'block';
        }


        if (!historyData || historyData.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No game history to display.';
            li.style.textAlign = 'center';
            historyListElement.appendChild(li);
            return;
        }

        const groupedHistory = historyData.reduce((acc, item) => {
            const difficulty = item.difficulty || 'Unknown';
            if (!acc[difficulty]) {
                acc[difficulty] = [];
            }
            acc[difficulty].push(item);
            return acc;
        }, {});

        const difficultyOrder = ['easy', 'medium', 'hard', 'expert', 'Unknown']; 
        let firstGroupRendered = false;
        
        difficultyOrder.forEach(difficultyKey => {
            if (groupedHistory[difficultyKey]) {
                if (firstGroupRendered) {
                    const separator = document.createElement('div');
                    separator.classList.add('difficulty-group-separator');
                    historyListElement.appendChild(separator);
                }
                firstGroupRendered = true;

                groupedHistory[difficultyKey].sort((a, b) => new Date(b.date) - new Date(a.date));

                groupedHistory[difficultyKey].forEach(item => {
                    const li = document.createElement('li');
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.classList.add('history-item-time');
                    timeSpan.textContent = `Time: ${item.time}`;
                    
                    const dateSpan = document.createElement('span');
                    dateSpan.classList.add('history-item-date');
                    dateSpan.textContent = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); 

                    li.appendChild(timeSpan);
                    li.appendChild(dateSpan);
                    historyListElement.appendChild(li);
                });
            }
        });
    }

    function toggleGameHistory(show, historyData = []) {
        if (!gameHistoryDropdownElement) return;
        isHistoryVisible = typeof show === 'boolean' ? show : !isHistoryVisible;
        
        if (isHistoryVisible) {
            _renderGameHistory(historyData);
            gameHistoryDropdownElement.style.display = 'block';
        } else {
            gameHistoryDropdownElement.style.display = 'none';
        }
        return isHistoryVisible;
    }

    function init(onTimerClickCallback, onModalNewGameCallback, onModalCloseCallback) {
        _applyTheme();
        themeSwitcherBtn.addEventListener('click', toggleTheme);
        hideModal();
        updateTimerDisplay("00:00:00");

        if (timerDisplayElement) {
            timerDisplayElement.addEventListener('click', onTimerClickCallback);
            timerDisplayElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTimerClickCallback();
                }
            });
        }
        if (modalNewGameBtn) modalNewGameBtn.addEventListener('click', onModalNewGameCallback);
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', onModalCloseCallback);

        document.addEventListener('click', (event) => {
            if (isHistoryVisible && 
                gameHistoryDropdownElement && 
                !gameHistoryDropdownElement.contains(event.target) &&
                timerDisplayElement && 
                !timerDisplayElement.contains(event.target)) {
                toggleGameHistory(false);
            }
        });
    }

    function getSelectedDifficulty() {
        return difficultySelect.value;
    }

    function setSelectedDifficulty(difficultyValue) {
        if (difficultySelect) {
            difficultySelect.value = difficultyValue;
        }
    }
    
    function setBoardDisabled(disabled) {
        const inputs = document.querySelectorAll('#sudokuBoard input');
        inputs.forEach(input => input.disabled = disabled);
        document.getElementById('sudokuBoard').classList.toggle('disabled', disabled);
    }

    function getIsHistoryVisible() {
        return isHistoryVisible;
    }

    return {
        init,
        showMessage,
        clearMessage,
        getSelectedDifficulty,
        setSelectedDifficulty,
        setBoardDisabled,
        showModal,
        hideModal,
        updateTimerDisplay,
        toggleGameHistory,
        getIsHistoryVisible 
    };
})();
