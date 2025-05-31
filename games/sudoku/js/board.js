// js/board.js
/**
 * @module Board
 * @description Manages the rendering and interaction of the Sudoku board.
 */
const Board = (() => {
    const GRID_SIZE = Sudoku.GRID_SIZE; 
    const BOX_SIZE = 3;                 
    let boardElement;                   
    let onCellClickCallback;            
    let onCellInputCallback;            
    let cells = [];                     

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
                return; 
            default: return; 
        }
        
        if (moved) {
            event.preventDefault(); 
            const nextCellElement = getCellElement(nextRow, nextCol);
            if (nextCellElement) {
                const inputField = nextCellElement.querySelector('input');
                if (inputField) {
                    inputField.focus(); 
                } else if (onCellClickCallback) {
                    onCellClickCallback(nextRow, nextCol, nextCellElement, null);
                }
            }
        }
    }

    function _createCell(r, c, value, isReadonly) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.currentValue = (value === Sudoku.EMPTY_CELL ? '0' : value.toString());

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
            cell.addEventListener('click', () => {
                if (onCellClickCallback) {
                    onCellClickCallback(r, c, cell, null);
                }
            });
        } else {
            const input = document.createElement('input');
            input.type = 'text'; 
            input.maxLength = 1; // Crucial for single digit input
            input.value = (value === Sudoku.EMPTY_CELL) ? '' : value.toString();
            input.pattern = "[1-9]";

            input.addEventListener('input', (e) => {
                let rawValue = e.target.value; // This will be a single char or empty due to maxLength=1
                let convertedValue = Utils.convertNumeralsToEnglish(rawValue);
                
                let finalValue = convertedValue;

                // Validate: Ensure it's a digit from 1-9 (English) or empty
                if (finalValue !== '' && !/^[1-9]$/.test(finalValue)) {
                    finalValue = ''; // Clear if not a valid Sudoku number (1-9)
                }
                
                // Update the input field if conversion or validation changed the value
                // This ensures the user sees the English numeral or an empty field if invalid
                if (e.target.value !== finalValue) {
                    e.target.value = finalValue;
                }

                cell.dataset.currentValue = (finalValue === '' ? '0' : finalValue);
                if (onCellInputCallback) {
                    onCellInputCallback(r, c, (finalValue === '' ? Sudoku.EMPTY_CELL : parseInt(finalValue)), cell, input);
                }
            });

            input.addEventListener('focus', () => {
                if (onCellClickCallback) {
                    onCellClickCallback(r, c, cell, input);
                }
                input.select();
            });
            input.addEventListener('keydown', (e) => _handleArrowKeys(e, r, c));

            cell.appendChild(input);
            cell.dataset.readonly = "false";
            cell.addEventListener('click', (e) => {
                if (e.target === cell) {
                     input.focus();
                }
            });
        }
        return cell;
    }

    function render(element, boardData, initialPuzzleData, cellClickHandler, cellInputHandler) {
        boardElement = element;
        onCellClickCallback = cellClickHandler;
        onCellInputCallback = cellInputHandler;
        boardElement.innerHTML = '';
        cells = [];

        const fragment = document.createDocumentFragment();
        for (let r = 0; r < GRID_SIZE; r++) {
            cells[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const isReadonly = initialPuzzleData[r][c] !== Sudoku.EMPTY_CELL;
                const cellValue = boardData[r][c];
                const cellElement = _createCell(r, c, cellValue, isReadonly);
                cells[r][c] = cellElement;
                fragment.appendChild(cellElement);
            }
        }
        boardElement.appendChild(fragment);
    }

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
    
    function getCellElement(r, c) {
        return (cells[r] && cells[r][c]) ? cells[r][c] : null;
    }

    function clearAllHighlights() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = getCellElement(r,c);
                if (cell) {
                    cell.classList.remove('selected', 'error', 'highlight');
                    const input = cell.querySelector('input');
                    if (input) {
                        input.classList.remove('error');
                    }
                }
            }
        }
    }
    
    function highlightRelatedCells(selRow, selCol, currentBoardData) {
        clearAllHighlights();

        const selectedCellElement = getCellElement(selRow, selCol);
        if (!selectedCellElement) return;
        
        if (!selectedCellElement.classList.contains('error')) {
            selectedCellElement.classList.add('selected');
        }
        
        const selectedValue = parseInt(selectedCellElement.dataset.currentValue, 10) || Sudoku.EMPTY_CELL;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (r === selRow && c === selCol) continue;

                const cell = getCellElement(r,c);
                if (!cell) continue;

                const inSameRow = (r === selRow);
                const inSameCol = (c === selCol);
                const boxRowStart = selRow - (selRow % BOX_SIZE);
                const boxColStart = selCol - (selCol % BOX_SIZE);
                const inSameBox = (r >= boxRowStart && r < boxRowStart + BOX_SIZE &&
                                   c >= boxColStart && c < boxColStart + BOX_SIZE);

                if (inSameRow || inSameCol || inSameBox) {
                    if (!cell.classList.contains('error')) {
                        cell.classList.add('highlight');
                    }
                }
                
                const cellCurrentValue = parseInt(cell.dataset.currentValue, 10) || Sudoku.EMPTY_CELL;
                if (selectedValue !== Sudoku.EMPTY_CELL && cellCurrentValue === selectedValue) {
                     if (!cell.classList.contains('error')) {
                        cell.classList.add('highlight');
                        if (cell.classList.contains('readonly')) {
                           cell.classList.add('selected');
                        }
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
