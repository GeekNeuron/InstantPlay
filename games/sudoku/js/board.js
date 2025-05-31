// js/board.js
/**
 * @module Board
 * @description Manages the rendering and interaction of the Sudoku board.
 */
const Board = (() => {
    const GRID_SIZE = Sudoku.GRID_SIZE; // Assumes Sudoku.GRID_SIZE is available (e.g., 9)
    const BOX_SIZE = 3;                 // Size of the subgrids (e.g., 3x3)
    let boardElement;                   // The main DOM element for the Sudoku board
    let onCellClickCallback;            // Callback function for when a cell is clicked
    let onCellInputCallback;            // Callback function for when input in a cell changes
    let cells = [];                     // 2D array to store references to cell DOM elements

    /**
     * Handles arrow key navigation between cells.
     * @param {KeyboardEvent} event - The keyboard event.
     * @param {number} currentRow - The current row of the focused cell.
     * @param {number} currentCol - The current column of the focused cell.
     */
    function _handleArrowKeys(event, currentRow, currentCol) {
        let nextRow = currentRow;
        let nextCol = currentCol;
        let moved = false;

        switch (event.key) {
            case "ArrowUp":    nextRow = Math.max(0, currentRow - 1); moved = true; break;
            case "ArrowDown":  nextRow = Math.min(GRID_SIZE - 1, currentRow + 1); moved = true; break;
            case "ArrowLeft":  nextCol = Math.max(0, currentCol - 1); moved = true; break;
            case "ArrowRight": nextCol = Math.min(GRID_SIZE - 1, currentCol + 1); moved = true; break;
            case "Tab":
                // Allow default Tab behavior for accessibility.
                // For custom Tab behavior (e.g., wrapping around),
                // event.preventDefault() would be needed here along with logic.
                return; 
            default: return; // Do nothing for other keys
        }
        
        if (moved) {
            event.preventDefault(); // Prevent default arrow key page scroll
            const nextCellElement = getCellElement(nextRow, nextCol);
            if (nextCellElement) {
                const inputField = nextCellElement.querySelector('input');
                if (inputField) {
                    inputField.focus(); // Focus the input in the next editable cell
                    // The 'focus' event on inputField will trigger onCellClickCallback via its own listener
                } else if (onCellClickCallback) {
                    // If it's a readonly cell or cell without direct input, simulate click for selection/highlight
                    onCellClickCallback(nextRow, nextCol, nextCellElement, null);
                }
            }
        }
    }

    /**
     * Creates a single cell DOM element for the Sudoku board.
     * @param {number} r - The row index of the cell.
     * @param {number} c - The column index of the cell.
     * @param {number} value - The initial value of the cell (0 for empty).
     * @param {boolean} isReadonly - True if the cell is part of the initial puzzle (pre-filled).
     * @returns {HTMLElement} The created cell DOM element.
     */
    function _createCell(r, c, value, isReadonly) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        // Storing the current value, useful for highlighting logic if needed
        cell.dataset.currentValue = (value === Sudoku.EMPTY_CELL ? '0' : value.toString());


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
            // Click on readonly cell for highlighting related numbers
            cell.addEventListener('click', () => {
                if (onCellClickCallback) {
                    onCellClickCallback(r, c, cell, null); // No input element for readonly cells
                }
            });
        } else {
            const input = document.createElement('input');
            input.type = 'text'; // Using text to allow easy clearing; validation is manual
            input.maxLength = 1;
            input.value = (value === Sudoku.EMPTY_CELL) ? '' : value.toString();
            input.pattern = "[1-9]"; // Basic pattern for browsers that support it, not a replacement for JS validation

            input.addEventListener('input', (e) => {
                let val = e.target.value;
                // Allow only single digits 1-9 or empty string
                if (val !== '' && !/^[1-9]$/.test(val)) {
                    e.target.value = val.slice(0, -1); // Remove last typed invalid char
                }
                // If user types '0', treat as empty
                if (val === '0') {
                    e.target.value = '';
                }
                // Update internal dataset value on cell
                cell.dataset.currentValue = (e.target.value === '' ? '0' : e.target.value);
                if (onCellInputCallback) {
                    onCellInputCallback(r, c, (e.target.value === '' ? Sudoku.EMPTY_CELL : parseInt(e.target.value)), cell, input);
                }
            });

            input.addEventListener('focus', () => {
                if (onCellClickCallback) {
                    onCellClickCallback(r, c, cell, input); // Pass input for focus management
                }
                input.select(); // Select text on focus for easy overwrite
            });
            input.addEventListener('keydown', (e) => _handleArrowKeys(e, r, c));

            cell.appendChild(input);
            cell.dataset.readonly = "false";
            // Click on the cell (not just input) to focus the input
            cell.addEventListener('click', (e) => {
                if (e.target === cell) { // If user clicks cell padding, not input itself
                     input.focus();
                }
            });
        }
        return cell;
    }

    /**
     * Renders the entire Sudoku board into the provided DOM element.
     * @param {HTMLElement} element - The HTML element to render the board into.
     * @param {number[][]} boardData - The current state of the board (user's entries).
     * @param {number[][]} initialPuzzleData - The initial puzzle with clues (0 for empty).
     * @param {Function} cellClickHandler - Callback for when a cell is clicked.
     * @param {Function} cellInputHandler - Callback for when a cell's input changes.
     */
    function render(element, boardData, initialPuzzleData, cellClickHandler, cellInputHandler) {
        boardElement = element;
        onCellClickCallback = cellClickHandler;
        onCellInputCallback = cellInputHandler;
        boardElement.innerHTML = ''; // Clear previous board
        cells = []; // Reset cell references matrix

        const fragment = document.createDocumentFragment(); // Use fragment for performance
        for (let r = 0; r < GRID_SIZE; r++) {
            cells[r] = []; // Initialize row in the cells matrix
            for (let c = 0; c < GRID_SIZE; c++) {
                const isReadonly = initialPuzzleData[r][c] !== Sudoku.EMPTY_CELL;
                const cellValue = boardData[r][c];
                const cellElement = _createCell(r, c, cellValue, isReadonly);
                cells[r][c] = cellElement; // Store reference
                fragment.appendChild(cellElement);
            }
        }
        boardElement.appendChild(fragment); // Append all cells at once
    }

    /**
     * Updates the display of a specific cell (value and error state).
     * @param {number} r - Row index.
     * @param {number} c - Column index.
     * @param {number} value - The new value for the cell (0 for empty).
     * @param {boolean} [isError=false] - Optional: True if the cell has an error.
     */
    function updateCellDisplay(r, c, value, isError = false) {
        const cell = getCellElement(r,c);
        if (!cell) return;

        cell.classList.remove('error');
        const inputElement = cell.querySelector('input');
        if (inputElement) inputElement.classList.remove('error');


        if (isError) {
            cell.classList.add('error');
            if (inputElement) inputElement.classList.add('error');
        }
        
        cell.dataset.currentValue = (value === Sudoku.EMPTY_CELL ? '0' : value.toString());

        if (cell.dataset.readonly === "true") {
            cell.textContent = (value === Sudoku.EMPTY_CELL) ? '' : value.toString();
        } else {
            if (inputElement) {
                inputElement.value = (value === Sudoku.EMPTY_CELL) ? '' : value.toString();
            }
        }
    }
    
    /**
     * Gets the DOM element for a cell at given coordinates.
     * @param {number} r - Row index.
     * @param {number} c - Column index.
     * @returns {HTMLElement|null} The cell element or null if not found.
     */
    function getCellElement(r, c) {
        return (cells[r] && cells[r][c]) ? cells[r][c] : null;
    }

    /**
     * Clears all visual highlights (selected, error, highlight) from the board.
     */
    function clearAllHighlights() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = getCellElement(r,c);
                if (cell) {
                    cell.classList.remove('selected', 'error', 'highlight');
                    const input = cell.querySelector('input');
                    if (input) {
                        input.classList.remove('error'); // Clear error class from input too
                    }
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

        const selectedCellElement = getCellElement(selRow, selCol);
        if (!selectedCellElement) return;
        
        // Only add 'selected' to the primary selected cell if it's not an error state
        if (!selectedCellElement.classList.contains('error')) {
            selectedCellElement.classList.add('selected');
        }
        
        const selectedValue = parseInt(selectedCellElement.dataset.currentValue, 10) || Sudoku.EMPTY_CELL;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (r === selRow && c === selCol) continue; // Skip the selected cell itself

                const cell = getCellElement(r,c);
                if (!cell) continue;

                // Highlight row, column, and 3x3 box
                const inSameRow = (r === selRow);
                const inSameCol = (c === selCol);
                const boxRowStart = selRow - (selRow % BOX_SIZE);
                const boxColStart = selCol - (selCol % BOX_SIZE);
                const inSameBox = (r >= boxRowStart && r < boxRowStart + BOX_SIZE &&
                                   c >= boxColStart && c < boxColStart + BOX_SIZE);

                if (inSameRow || inSameCol || inSameBox) {
                    if (!cell.classList.contains('error')) { // Don't highlight if it's an error cell
                        cell.classList.add('highlight');
                    }
                }
                
                // Highlight cells with the same number if the selected cell has a number
                const cellCurrentValue = parseInt(cell.dataset.currentValue, 10) || Sudoku.EMPTY_CELL;
                if (selectedValue !== Sudoku.EMPTY_CELL && cellCurrentValue === selectedValue) {
                     if (!cell.classList.contains('error')) {
                        cell.classList.add('highlight'); // General highlight for same number
                        // If it's a readonly cell with the same number, make it more prominent or different style
                        if (cell.classList.contains('readonly')) {
                           cell.classList.add('selected'); // Use selected style for emphasis of same clues
                        }
                     }
                }
            }
        }
    }

    // Public API for the Board module
    return {
        render,
        updateCellDisplay,
        getCellElement,
        clearAllHighlights,
        highlightRelatedCells
    };
})();
