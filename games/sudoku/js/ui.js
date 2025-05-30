// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const endGameControlsElement = document.getElementById('endGameControls');
    const footerCreditElement = document.querySelector('.footer-credit');


    const THEME_KEY = 'sudokuThemeGeekNeuron_v1'; // Added versioning in case of structure changes
    let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

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
        messageArea.className = ''; // Clear previous classes
        messageArea.classList.add(`message-${type}`); // Add new type class
        
        if (duration > 0) {
            setTimeout(() => {
                // Only clear if the message hasn't changed
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
            if(footerCreditElement) footerCreditElement.style.display = 'none'; // Hide credit to make space
        }
    }

    function hideEndGameControls() {
        if (endGameControlsElement) {
            endGameControlsElement.style.display = 'none';
            if(footerCreditElement) footerCreditElement.style.display = 'block'; // Show credit again
        }
    }


    function init() {
        _applyTheme();
        themeSwitcherBtn.addEventListener('click', toggleTheme);
        hideEndGameControls(); // Ensure they are hidden initially
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
        hideEndGameControls
    };
})();
