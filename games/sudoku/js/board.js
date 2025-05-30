// js/board.js
const Board = (() => {
    const GRID_SIZE = Sudoku.GRID_SIZE; // Use from Sudoku module
    const BOX_SIZE = 3;
    let boardElement;
    let onCellClickCallback;
    let onCellInputCallback;
    let cells = []; // To store references to cell DOM elements

    /**
     * Creates a single cell element (div with an input inside or just text).
     * @param {number} r - Row index.
     * @param {number} c - Column index.
     * @param {number} value - The initial value of the cell (0 for empty).
     * @param {boolean} isReadonly - True if the cell is part of the initial puzzle.
     * @returns {HTMLElement} The created cell element.
     */
    function _createCell(r, c, value, isReadonly) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.value = value; // Store original value if readonly, or current if not

        // Add classes for strong borders to visually separate 3x3 boxes
        if ((c + 1) % BOX_SIZE === 0 && c < GRID_SIZE - 1) {
            cell.classList.add('border-right-strong');
        }
        if ((r + 1) % BOX_SIZE === 0 && r < GRID_SIZE - 1) {
            cell.classList.add('border-bottom-strong');
        }

        if (isReadonly) {
            cell.textContent = value;
            cell.classList.add('readonly');
            cell.dataset.readonly = "true";
        } else {
            const input = document.createElement('input');
            input.type = 'text'; // Using text to allow easy clearing, validation is manual
            input.maxLength = 1;
            input.value = value === Sudoku.EMPTY_CELL ? '' : value.toString();
            input.pattern = "[1-9]"; // Basic pattern for browsers that support it

            input.addEventListener('input', (e) => {
                let val = e.target.value;
                // Allow only single digits 1-9 or empty string
                if (val !== '' && !/^[1-9]$/.test(val)) {
                    e.target.value = val.slice(0, -1); // Remove last typed invalid char
                }
                // If user types '0', treat as empty
                if (val === '0') {
                    e.target.value = '';
                    val = '';
                }
                onCellInputCallback(r, c, val === '' ? Sudoku.EMPTY_CELL : parseInt(val), cell, e.target);
            });

            input.addEventListener('focus', () => {
                onCellClickCallback(r, c, cell, input); // Pass input for focus management
                input.select(); // Select text on focus for easy overwrite
            });
            input.addEventListener('keydown', (e) => handleArrowKeys(e, r, c));

            cell.appendChild(input);
            cell.dataset.readonly = "false";
        }
        
        // General click on cell (even readonly) for highlighting related numbers
        cell.addEventListener('click', (e) => {
            if (e.target === cell && !isReadonly) { // If user clicks cell itself, not input
                 const inputField = cell.querySelector('input');
                 if (inputField) inputField.focus();
            } else {
                 onCellClickCallback(r, c, cell, cell.querySelector('input'));
            }
        });
        return cell;
    }
    
    function handleArrowKeys(event, currentRow, currentCol) {
        let nextRow = currentRow;
        let nextCol = currentCol;
        let moved = false;

        switch (event.key) {
            case "ArrowUp":    nextRow = Math.max(0, currentRow - 1); moved = true; break;
            case "ArrowDown":  nextRow = Math.min(GRID_SIZE - 1, currentRow + 1); moved = true; break;
            case "ArrowLeft":  nextCol = Math.max(0, currentCol - 1); moved = true; break;
            case "ArrowRight": nextCol = Math.min(GRID_SIZE - 1, currentCol + 1); moved = true; break;
            case "Tab": // Allow default Tab behavior for accessibility, but also handle focus
                // For Tab, let browser handle focus, but if we want custom wrap-around:
                // event.preventDefault();
                // if (event.shiftKey) { /* move backward */ } else { /* move forward */ }
                return; // Don't prevent default for Tab for now
            default: return; // Do nothing for other keys
        }
        
        if (moved) {
            event.preventDefault(); // Prevent default arrow key scroll
            const nextCell = getCellElement(nextRow, nextCol);
            if (nextCell) {
                const input = nextCell.querySelector('input');
                if (input) {
                    input.focus();
                } else {
                    // If it's a readonly cell, we might just want to "select" it visually
                    onCellClickCallback(nextRow, nextCol, nextCell, null);
                }
            }
        }
    }


    /**
     * Renders the entire Sudoku board.
     * @param {HTMLElement} element - The HTML element to render the board into.
     * @param {number[][]} boardData - The current state of the board (user's entries).
     * @param {number[][]} initialPuzzle - The initial puzzle with clues (0 for empty).
     * @param {Function} onCellClick - Callback for when a cell is clicked.
     * @param {Function} onCellInput - Callback for when a cell's input changes.
     */
    function render(element, boardData, initialPuzzle, onCellClick, onCellInput) {
        boardElement = element;
        onCellClickCallback = onCellClick;
        onCellInputCallback = onCellInput;
        boardElement.innerHTML = ''; // Clear previous board
        cells = []; // Reset cell references

        const fragment = document.createDocumentFragment();
        for (let r = 0; r < GRID_SIZE; r++) {
            cells[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const isReadonly = initialPuzzle[r][c] !== Sudoku.EMPTY_CELL;
                const cellValue = boardData[r][c];
                const cellElement = _createCell(r, c, cellValue, isReadonly);
                cells[r][c] = cellElement;
                fragment.appendChild(cellElement);
            }
        }
        boardElement.appendChild(fragment);
    }

    /**
     * Updates the display of a specific cell.
     * @param {number} r - Row index.
     * @param {number} c - Column index.
     * @param {number} value - The new value for the cell (0 for empty).
     * @param {boolean} [isError=false] - Optional: True if the cell has an error.
     */
    function updateCellDisplay(r, c, value, isError = false) {
        const cell = cells[r]?.[c];
        if (!cell) return;

        cell.classList.remove('error', 'highlight'); // Clear previous states
        if (isError) {
            cell.classList.add('error');
        }

        if (cell.dataset.readonly === "true") {
            cell.textContent = value === Sudoku.EMPTY_CELL ? '' : value.toString();
        } else {
            const input = cell.querySelector('input');
            if (input) {
                input.value = value === Sudoku.EMPTY_CELL ? '' : value.toString();
            }
        }
        cell.dataset.value = value;
    }
    
    /**
     * Gets the DOM element for a cell at given coordinates.
     * @param {number} r - Row index.
     * @param {number} c - Column index.
     * @returns {HTMLElement|null} The cell element or null if not found.
     */
    function getCellElement(r, c) {
        return cells[r]?.[c] || null;
    }

    /**
     * Clears all visual highlights (selected, error, highlight) from the board.
     */
    function clearAllHighlights() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = cells[r]?.[c];
                if (cell) {
                    cell.classList.remove('selected', 'error', 'highlight');
                }
            }
        }
    }
    
    /**
     * Highlights cells that are related to the selected cell (same row, col, box, or same number).
     * @param {number} selRow - Selected row index.
     * @param {number} selCol - Selected column index.
     * @param {number[][]} currentBoardData - The current data of the board.
     */
    function highlightRelatedCells(selRow, selCol, currentBoardData) {
        clearAllHighlights(); // Clear previous highlights first

        const selectedCell = cells[selRow]?.[selCol];
        if (!selectedCell) return;
        
        selectedCell.classList.add('selected');
        const selectedValue = currentBoardData[selRow][selCol];

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (r === selRow && c === selCol) continue; // Skip the selected cell itself

                const cell = cells[r][c];
                if (!cell) continue;

                // Highlight row and column
                if (r === selRow || c === selCol) {
                    cell.classList.add('highlight');
                }

                // Highlight 3x3 box
                const boxRowStart = selRow - (selRow % BOX_SIZE);
                const boxColStart = selCol - (selCol % BOX_SIZE);
                if (r >= boxRowStart && r < boxRowStart + BOX_SIZE &&
                    c >= boxColStart && c < boxColStart + BOX_SIZE) {
                    cell.classList.add('highlight');
                }
                
                // Highlight cells with the same number if the selected cell has a number
                if (selectedValue !== Sudoku.EMPTY_CELL && currentBoardData[r][c] === selectedValue) {
                     cell.classList.add('highlight'); // Could be a different class for "same number"
                     // If it's a readonly cell with the same number, make it more prominent
                     if (cell.classList.contains('readonly')) {
                        cell.classList.add('selected'); // Use selected style for emphasis
                     }
                }
            }
        }
    }


    return {
        render,
        updateCellDisplay,
        getCellElement,
        clearAllHighlights,
        highlightRelatedCells
    };
})();
