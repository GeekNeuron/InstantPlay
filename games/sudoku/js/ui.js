// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const endGameControlsElement = document.getElementById('endGameControls');
    const footerCreditElement = document.querySelector('.footer-credit');
    const timerDisplayElement = document.getElementById('timerDisplay');
    const gameHistoryDropdownElement = document.getElementById('gameHistoryDropdown');
    // const historyHeaderElement = gameHistoryDropdownElement ? gameHistoryDropdownElement.querySelector('.history-header') : null; // No longer needed for text
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
        historyListElement.innerHTML = ''; 

        // Remove the main history header text content if it exists
        const mainHistoryHeader = gameHistoryDropdownElement ? gameHistoryDropdownElement.querySelector('.history-header') : null;
        if (mainHistoryHeader) {
            // mainHistoryHeader.textContent = ''; // Remove text, keep element for styling if needed
            // Or hide it completely if it's just for text
            mainHistoryHeader.style.display = 'none'; 
        }


        if (!historyData || historyData.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No game history to display.'; // Keep this message
            li.style.textAlign = 'center'; // Center if it's the only item
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
        let firstGroup = true;
        
        difficultyOrder.forEach(difficultyKey => {
            if (groupedHistory[difficultyKey]) {
                if (!firstGroup) { // Add a separator before the next group, but not before the first
                    const separator = document.createElement('div');
                    separator.classList.add('difficulty-group-separator'); // New class for styling
                    historyListElement.appendChild(separator);
                }
                firstGroup = false;

                // Removed: Group header text
                // const groupHeader = document.createElement('div');
                // groupHeader.classList.add('difficulty-group-header');
                // groupHeader.textContent = `Level: ${difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1)}`;
                // historyListElement.appendChild(groupHeader);

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

    function init(onTimerClickCallback) {
        _applyTheme();
        themeSwitcherBtn.addEventListener('click', toggleTheme);
        hideEndGameControls();
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
        showEndGameControls,
        hideEndGameControls,
        updateTimerDisplay,
        toggleGameHistory,
        getIsHistoryVisible 
    };
})();
