// js/board.js (Conceptual)
const Board = (() => {
    const GRID_SIZE = 9;
    const SUBGRID_SIZE = 3;
    let boardElement;
    let onCellClickCallback;
    let onCellInputCallback;

    function _createCell(r, c, value, isReadonly) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Add strong borders
        if ((c + 1) % SUBGRID_SIZE === 0 && c < GRID_SIZE - 1) {
            cell.classList.add('border-right-strong');
        }
        if ((r + 1) % SUBGRID_SIZE === 0 && r < GRID_SIZE - 1) {
            cell.classList.add('border-bottom-strong');
        }

        if (isReadonly) {
            cell.textContent = value;
            cell.classList.add('readonly');
        } else {
            const input = document.createElement('input');
            input.type = 'text'; // Use text to better control input, JS will validate
            input.maxLength = 1;
            input.value = value === 0 ? '' : value;
            input.addEventListener('input', (e) => {
                let val = e.target.value;
                if (val !== '' && !/^[1-9]$/.test(val)) {
                    e.target.value = ''; // Clear invalid input
                    val = '';
                }
                onCellInputCallback(r, c, val === '' ? 0 : parseInt(val), cell);
            });
            input.addEventListener('focus', () => onCellClickCallback(r,c,cell));
            cell.appendChild(input);
        }
        cell.addEventListener('click', () => {
            if (!isReadonly) {
                const input = cell.querySelector('input');
                if (input) input.focus(); // Focus the input field
                else onCellClickCallback(r,c,cell); // For non-input cells (if any change)
            } else {
                 onCellClickCallback(r,c,cell); // Allow selecting readonly for highlighting related numbers
            }
        });
        return cell;
    }

    function render(element, boardData, initialPuzzle, onCellClick, onCellInput) {
        boardElement = element;
        onCellClickCallback = onCellClick;
        onCellInputCallback = onCellInput;
        boardElement.innerHTML = ''; // Clear previous board

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const isReadonly = initialPuzzle[r][c] !== 0;
                const cellValue = boardData[r][c];
                const cellElement = _createCell(r, c, cellValue, isReadonly);
                boardElement.appendChild(cellElement);
            }
        }
    }
    function updateCell(r,c, value) { /* ... update specific cell's display ... */ }
    function highlightCell(r,c, state) { /* ... add/remove 'selected' or 'error' class ... */ }
    function getCellElement(r,c) { return boardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);}

    return { render, updateCell, highlightCell, getCellElement };
})();
