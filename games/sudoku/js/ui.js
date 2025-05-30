// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const endGameControlsElement = document.getElementById('endGameControls');
    const footerCreditElement = document.querySelector('.footer-credit');
    const timerDisplayElement = document.getElementById('timerDisplay');
    const gameHistoryDropdownElement = document.getElementById('gameHistoryDropdown');
    const historyListElement = document.getElementById('historyList');

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
    
    function showEndGameControls() {
        if (endGameControlsElement) {
            endGameControlsElement.style.display = 'flex';
            if(footerCreditElement) footerCreditElement.style.display = 'none';
        }
    }

    function hideEndGameControls() {
        if (endGameControlsElement) {
            endGameControlsElement.style.display = 'none';
            if(footerCreditElement) footerCreditElement.style.display = 'block';
        }
    }

    function updateTimerDisplay(timeString) {
        if (timerDisplayElement) {
            timerDisplayElement.textContent = timeString;
        }
    }

    function _renderGameHistory(historyData) {
        if (!historyListElement) return;
        historyListElement.innerHTML = ''; // Clear previous items

        if (!historyData || historyData.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'تاریخچه‌ای برای نمایش وجود ندارد.';
            historyListElement.appendChild(li);
            return;
        }

        // Group by difficulty
        const groupedHistory = historyData.reduce((acc, item) => {
            const difficulty = item.difficulty || 'نامشخص';
            if (!acc[difficulty]) {
                acc[difficulty] = [];
            }
            acc[difficulty].push(item);
            return acc;
        }, {});

        // Sort difficulties (e.g., easy, medium, hard, expert) - can be customized
        const difficultyOrder = ['easy', 'medium', 'hard', 'expert', 'نامشخص'];
        
        difficultyOrder.forEach(difficultyKey => {
            if (groupedHistory[difficultyKey]) {
                const groupHeader = document.createElement('div');
                groupHeader.classList.add('difficulty-group-header');
                // Capitalize first letter for display
                groupHeader.textContent = `سطح: ${difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1)}`;
                historyListElement.appendChild(groupHeader);

                // Sort items within group by date (most recent first)
                groupedHistory[difficultyKey].sort((a, b) => new Date(b.date) - new Date(a.date));

                groupedHistory[difficultyKey].forEach(item => {
                    const li = document.createElement('li');
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.classList.add('history-item-time');
                    timeSpan.textContent = `زمان: ${item.time}`;
                    
                    const dateSpan = document.createElement('span');
                    dateSpan.classList.add('history-item-date');
                    dateSpan.textContent = new Date(item.date).toLocaleDateString('fa-IR'); // Persian date

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
    }

    function init(onTimerClickCallback) {
        _applyTheme();
        themeSwitcherBtn.addEventListener('click', toggleTheme);
        hideEndGameControls();
        updateTimerDisplay("00:00:00"); // Initial timer display

        if (timerDisplayElement) {
            timerDisplayElement.addEventListener('click', onTimerClickCallback);
            timerDisplayElement.addEventListener('keydown', (e) => { // Allow keyboard activation
                if (e.key === 'Enter' || e.key === ' ') {
                    onTimerClickCallback();
                }
            });
        }
        // Close history if clicked outside
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

    return {
        init,
        showMessage,
        clearMessage,
        getSelectedDifficulty,
        setSelectedDifficulty,
        setBoardDisabled,
        showEndGameControls,
        hideEndGameControls,
        updateTimerDisplay,
        toggleGameHistory
    };
})();
