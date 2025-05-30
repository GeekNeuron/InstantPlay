// js/ui.js
const UI = (() => {
    const themeSwitcherBtn = document.getElementById('themeSwitcher');
    const messageArea = document.getElementById('messageArea');
    const difficultySelect = document.getElementById('difficultySelect');
    const numberPaletteElement = document.getElementById('numberPalette');

    const THEME_KEY = 'sudokuThemeGeekNeuron'; // Unique key for localStorage
    let currentTheme = localStorage.getItem(THEME_KEY) || 'light'; // Default to light

    /**
     * Applies the current theme to the body.
     */
    function _applyTheme() {
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        // Ensure theme switcher button color is updated
        themeSwitcherBtn.style.backgroundColor = ''; // Reset inline style if any
    }

    /**
     * Toggles the theme between light and dark.
     */
    function toggleTheme() {
        currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, currentTheme);
        _applyTheme();
    }

    /**
     * Displays a message to the user.
     * @param {string} text - The message text.
     * @param {'info'|'success'|'error'} type - The type of message.
     * @param {number} [duration=0] - Duration in ms to show message, 0 for persistent.
     */
    function showMessage(text, type = 'info', duration = 0) {
        messageArea.textContent = text;
        messageArea.className = ''; // Clear previous classes
        if (type) {
            messageArea.classList.add(`message-${type}`);
        }
        
        if (duration > 0) {
            setTimeout(() => {
                clearMessage();
            }, duration);
        }
    }

    /**
     * Clears any message from the message area.
     */
    function clearMessage() {
        messageArea.textContent = '';
        messageArea.className = '';
    }

    /**
     * Initializes the UI elements, like theme switcher and difficulty.
     * @param {Function} onPaletteClick - Callback for number palette clicks.
     */
    function init(onPaletteClick) {
        _applyTheme(); // Apply stored or default theme on load
        themeSwitcherBtn.addEventListener('click', toggleTheme);

        // Populate number palette
        if (numberPaletteElement) {
            numberPaletteElement.innerHTML = ''; // Clear if re-initializing
            for (let i = 1; i <= 9; i++) {
                const btn = document.createElement('button');
                btn.textContent = i.toString();
                btn.dataset.number = i.toString();
                btn.addEventListener('click', () => onPaletteClick(i));
                numberPaletteElement.appendChild(btn);
            }
            // Add a clear/delete button to the palette
            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'X'; // Or use an icon/SVG
            clearBtn.title = "Clear cell";
            clearBtn.classList.add('clear-btn');
            clearBtn.addEventListener('click', () => onPaletteClick(Sudoku.EMPTY_CELL)); // 0 for empty
            numberPaletteElement.appendChild(clearBtn);
        }
    }

    /**
     * Gets the selected difficulty from the dropdown.
     * @returns {string} The selected difficulty value.
     */
    function getSelectedDifficulty() {
        return difficultySelect.value;
    }
    
    /**
     * Disables or enables board interaction.
     * @param {boolean} disabled - True to disable, false to enable.
     */
    function setBoardDisabled(disabled) {
        const inputs = document.querySelectorAll('#sudokuBoard input');
        inputs.forEach(input => input.disabled = disabled);
        document.getElementById('sudokuBoard').classList.toggle('disabled', disabled);
        if (numberPaletteElement) {
            const paletteButtons = numberPaletteElement.querySelectorAll('button');
            paletteButtons.forEach(button => button.disabled = disabled);
        }
    }


    return {
        init,
        showMessage,
        clearMessage,
        getSelectedDifficulty,
        setBoardDisabled
    };
})();
