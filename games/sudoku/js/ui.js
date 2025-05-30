class UI {
    constructor() {
        this.boardElement = document.getElementById('sudokuBoard');
        this.themeSwitcherBtn = document.getElementById('themeSwitcher');
        this.messageArea = document.getElementById('messageArea');
        this.currentBoardState = Array(9).fill(null).map(() => Array(9).fill(0));
    }

    renderBoard(boardData, initialPuzzle) {
        this.boardElement.innerHTML = ''; // Clear previous board
        this.currentBoardState = JSON.parse(JSON.stringify(initialPuzzle)); // Store initial state to identify user inputs

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Add thicker borders for 3x3 subgrids (handled by CSS using data attributes)

                if (boardData[r][c] !== 0) {
                    cell.textContent = boardData[r][c];
                    cell.classList.add('prefilled');
                } else {
                    const input = document.createElement('input');
                    input.type = 'number'; // Allows only numbers, but we'll add more validation
                    input.min = '1';
                    input.max = '9';
                    input.dataset.row = r;
                    input.dataset.col = c;
                    input.addEventListener('input', this.handleInput.bind(this));
                    input.addEventListener('focus', (e) => e.target.select()); // Select text on focus
                    cell.appendChild(input);
                }
                this.boardElement.appendChild(cell);
            }
        }
    }

    handleInput(event) {
        const inputElement = event.target;
        const row = parseInt(inputElement.dataset.row);
        const col = parseInt(inputElement.dataset.col);
        let value = parseInt(inputElement.value);

        // Basic validation: allow only single digits 1-9 or empty
        if (inputElement.value.length > 1) {
            inputElement.value = inputElement.value.slice(0, 1);
        }
        value = parseInt(inputElement.value); // Re-parse after potential slice

        if (isNaN(value) || value < 1 || value > 9) {
            inputElement.value = ''; // Clear invalid input
            this.currentBoardState[row][col] = 0;
        } else {
            this.currentBoardState[row][col] = value;
            // Optional: Live validation (can be performance intensive)
            // if (window.game && !window.game.sudoku.isValid(this.getCurrentBoardState(), row, col, value)) {
            //     inputElement.parentElement.classList.add('conflicting');
            // } else {
            //     inputElement.parentElement.classList.remove('conflicting');
            // }
        }
        this.clearMessage(); // Clear any previous win/error messages on new input
    }

    getCurrentBoardState() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        const cells = this.boardElement.children;
        for (let i = 0; i < cells.length; i++) {
            const cellDiv = cells[i];
            const r = parseInt(cellDiv.dataset.row);
            const c = parseInt(cellDiv.dataset.col);
            const input = cellDiv.querySelector('input');
            if (input) {
                board[r][c] = input.value ? parseInt(input.value) : 0;
            } else {
                board[r][c] = parseInt(cellDiv.textContent);
            }
        }
        return board;
    }

    applyTheme(themeName) {
        document.body.classList.remove('light-theme', 'dark-theme');
        if (themeName === 'dark') {
            document.body.classList.add('dark-theme');
            this.themeSwitcherBtn.style.backgroundColor = '#ffffff'; // Opposite color
        } else {
            document.body.classList.add('light-theme');
            this.themeSwitcherBtn.style.backgroundColor = '#000080'; // Opposite color
        }
    }

    loadThemePreference() {
        const preferredTheme = localStorage.getItem('sudokuTheme') || 'light';
        this.applyTheme(preferredTheme);
        return preferredTheme;
    }

    toggleTheme(currentTheme) {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        localStorage.setItem('sudokuTheme', newTheme);
        return newTheme;
    }

    showMessage(message, type = 'info') { // type can be 'info', 'success', 'error'
        this.messageArea.textContent = message;
        this.messageArea.className = `message-area message-${type}`;
        if (type === 'success') {
            this.messageArea.style.color = 'green';
        } else if (type === 'error') {
            this.messageArea.style.color = 'red';
        } else {
            // Use theme's default text color
            this.messageArea.style.color = document.body.classList.contains('dark-theme') ? '#ffffff' : '#000080';
        }
    }

    clearMessage() {
        this.messageArea.textContent = '';
        this.messageArea.className = 'message-area';
    }

    fillSolvedBoard(solvedGrid) {
        const cells = this.boardElement.children;
        for (let i = 0; i < cells.length; i++) {
            const cellDiv = cells[i];
            const r = parseInt(cellDiv.dataset.row);
            const c = parseInt(cellDiv.dataset.col);
            const input = cellDiv.querySelector('input');
            if (input) {
                input.value = solvedGrid[r][c];
            } else { // prefilled cells
                cellDiv.textContent = solvedGrid[r][c];
            }
        }
    }
}
