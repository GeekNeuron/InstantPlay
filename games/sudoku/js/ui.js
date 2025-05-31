// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const timerDisplayElement = document.getElementById('timerDisplay');
    const gameHistoryDropdownElement = document.getElementById('gameHistoryDropdown');
    const historyListElement = document.getElementById('historyList');

    // Modal Elements
    const gameOverModalElement = document.getElementById('gameOverModal');
    const modalTitleElement = document.getElementById('modalTitle');
    const modalMessageElement = document.getElementById('modalMessage');
    const modalActionsDiv = gameOverModalElement ? gameOverModalElement.querySelector('.modal-actions') : null;

    const THEME_KEY = 'sudokuThemeGeekNeuron_v1';
    let currentTheme = localStorage.getItem(THEME_KEY) || 'light';
    let isHistoryVisible = false;

    function _applyTheme() {
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        if (themeSwitcherBtn) themeSwitcherBtn.style.backgroundColor = '';
    }

    function toggleTheme() {
        currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, currentTheme);
        _applyTheme();
    }

    function showMessage(text, type = 'info', duration = 0) {
        if (!messageArea) return;
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
        if (messageArea) messageArea.textContent = '';
        if (messageArea) messageArea.className = '';
    }
    
    // --- Modal Functions ---
    /**
     * Shows the game over/status modal.
     * @param {string} title - The title for the modal.
     * @param {string} message - The message content for the modal.
     * @param {string} type - 'win' or 'error-continue' to control animation.
     */
    function showModal(title, message, type = 'info') { // autoHideDuration & onHideCallback removed
        if (gameOverModalElement && modalTitleElement && modalMessageElement) {
            modalTitleElement.textContent = title;
            modalMessageElement.textContent = message;

            modalTitleElement.classList.remove('win-animated', 'error-animated'); 

            if (type === 'win') {
                modalTitleElement.classList.add('win-animated');
            } else if (type === 'error-continue') { 
                modalTitleElement.classList.add('error-animated');
            }
            
            if (modalActionsDiv) {
                modalActionsDiv.style.display = 'none'; // Ensure no buttons are shown in modal
            }

            gameOverModalElement.classList.add('show');
            // Modal no longer auto-hides based on a timer here.
            // It's dismissed by overlay click (see init) or by starting a new game/reset.
        }
    }

    function hideModal() {
        if (gameOverModalElement) {
            gameOverModalElement.classList.remove('show');
            if (modalTitleElement) {
                modalTitleElement.classList.remove('win-animated', 'error-animated');
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

    function init(onTimerClickCallback, onModalOverlayCloseCallback) {
        _applyTheme();
        if(themeSwitcherBtn) themeSwitcherBtn.addEventListener('click', toggleTheme);
        hideModal(); // Ensure modal is hidden initially
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
        
        if (gameOverModalElement) {
            gameOverModalElement.addEventListener('click', (event) => {
                if (event.target === gameOverModalElement) { // Clicked on the overlay itself
                    hideModal();
                    if (typeof onModalOverlayCloseCallback === 'function') {
                        onModalOverlayCloseCallback(); // Notify app.js
                    }
                }
            });
        }

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
        return difficultySelect ? difficultySelect.value : 'easy';
    }

    function setSelectedDifficulty(difficultyValue) {
        if (difficultySelect) {
            difficultySelect.value = difficultyValue;
        }
    }
    
    function setBoardDisabled(disabled) {
        const board = document.getElementById('sudokuBoard');
        if (board) {
            const inputs = board.querySelectorAll('input');
            inputs.forEach(input => input.disabled = disabled);
            board.classList.toggle('disabled', disabled);
        }
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
