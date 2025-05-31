// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    // const footerCreditElement = document.querySelector('.footer-credit'); // Not directly manipulated
    const timerDisplayElement = document.getElementById('timerDisplay');
    const gameHistoryDropdownElement = document.getElementById('gameHistoryDropdown');
    const historyListElement = document.getElementById('historyList');

    // Modal Elements
    const gameOverModalElement = document.getElementById('gameOverModal');
    const modalTitleElement = document.getElementById('modalTitle');
    const modalMessageElement = document.getElementById('modalMessage');
    // const modalNewGameBtn = document.getElementById('modalNewGameBtn'); // Button removed from modal
    // const modalCloseBtn = document.getElementById('modalCloseBtn');   // Button removed from modal
    const modalActionsDiv = gameOverModalElement ? gameOverModalElement.querySelector('.modal-actions') : null;


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
     * @param {string} type - 'win' or 'error-continue' to control animation.
     * @param {number} [autoHideDuration=0] - Duration in ms to auto-hide. 0 for no auto-hide.
     * @param {Function} [onHideCallback=null] - Callback after modal auto-hides.
     */
    function showModal(title, message, type = 'info', autoHideDuration = 0, onHideCallback = null) {
        if (gameOverModalElement && modalTitleElement && modalMessageElement) {
            modalTitleElement.textContent = title;
            modalMessageElement.textContent = message;

            modalTitleElement.classList.remove('win-animated', 'error-animated'); 

            if (type === 'win') {
                modalTitleElement.classList.add('win-animated');
            } else if (type === 'error-continue') { 
                modalTitleElement.classList.add('error-animated');
            }
            
            // Hide the actions div as buttons are removed
            if (modalActionsDiv) {
                modalActionsDiv.style.display = 'none';
            }

            gameOverModalElement.classList.add('show');

            if (autoHideDuration > 0) {
                setTimeout(() => {
                    hideModal();
                    if (onHideCallback) {
                        onHideCallback();
                    }
                }, autoHideDuration);
            }
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

    function init(onTimerClickCallback /* Removed modal button callbacks */) {
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
        // Removed event listeners for modal buttons as they are removed from HTML

        document.addEventListener('click', (event) => {
            if (isHistoryVisible && 
                gameHistoryDropdownElement && 
                !gameHistoryDropdownElement.contains(event.target) &&
                timerDisplayElement && 
                !timerDisplayElement.contains(event.target)) {
                toggleGameHistory(false);
            }
             // Logic to close modal on overlay click (optional)
            if (gameOverModalElement && gameOverModalElement.classList.contains('show') && event.target === gameOverModalElement) {
                // Only hide if it's not the "YOU WIN!" modal, or if specific close behavior is desired
                // For "Keep Going!" modal, it auto-hides. For "YOU WIN!", user uses main controls.
                // So, this might not be strictly necessary if auto-hide is sufficient for "Keep Going".
                // If "YOU WIN!" should also close on overlay click:
                // hideModal();
                // if (!gameWon) { // If it was not a win modal that was closed by overlay
                //     boardShouldBeDisabled = false; // This variable is in app.js
                //     UI.setBoardDisabled(false);
                // }
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
