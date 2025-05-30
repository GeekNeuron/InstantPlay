// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    // const numberPaletteElement = document.getElementById('numberPalette'); // Removed

    const THEME_KEY = 'sudokuThemeGeekNeuron';
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
        messageArea.className = '';
        if (type) {
            messageArea.classList.add(`message-${type}`);
        }
        
        if (duration > 0) {
            setTimeout(() => {
                clearMessage();
            }, duration);
        }
    }

    function clearMessage() {
        messageArea.textContent = '';
        messageArea.className = '';
    }

    /**
     * Initializes the UI elements, like theme switcher and difficulty.
     * REMOVED: onPaletteClick parameter and palette generation.
     */
    function init() {
        _applyTheme();
        themeSwitcherBtn.addEventListener('click', toggleTheme);

        // Removed number palette population
    }

    function getSelectedDifficulty() {
        return difficultySelect.value;
    }
    
    function setBoardDisabled(disabled) {
        const inputs = document.querySelectorAll('#sudokuBoard input');
        inputs.forEach(input => input.disabled = disabled);
        document.getElementById('sudokuBoard').classList.toggle('disabled', disabled);
        // Removed disabling palette buttons
    }

    return {
        init,
        showMessage,
        clearMessage,
        getSelectedDifficulty,
        setBoardDisabled
    };
})();
