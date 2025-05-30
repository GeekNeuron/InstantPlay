// js/sudoku.js
const Sudoku = (() => {
    const GRID_SIZE = 9;
    const BOX_SIZE = 3;
    const EMPTY_CELL = 0;
    const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    /**
     * Checks if a number can be placed at a given cell (row, col) on the board.
     * @param {number[][]} board - The current Sudoku board.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @param {number} num - The number to check.
     * @returns {boolean} - True if the number can be placed, false otherwise.
     */
    function _isValidPlacement(board, row, col, num) {
        // Check row
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[row][c] === num) {
                return false;
            }
        }

        // Check column
        for (let r = 0; r < GRID_SIZE; r++) {
            if (board[r][col] === num) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRowStart = row - (row % BOX_SIZE);
        const boxColStart = col - (col % BOX_SIZE);
        for (let r = boxRowStart; r < boxRowStart + BOX_SIZE; r++) {
            for (let c = boxColStart; c < boxColStart + BOX_SIZE; c++) {
                if (board[r][c] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Finds an empty cell (value 0) on the board.
     * @param {number[][]} board - The Sudoku board.
     * @returns {number[]|null} - An array [row, col] of the empty cell, or null if no empty cell.
     */
    function _findEmptyCell(board) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (board[r][c] === EMPTY_CELL) {
                    return [r, c];
                }
            }
        }
        return null; // No empty cells
    }

    /**
     * Solves the Sudoku puzzle using a backtracking algorithm.
     * Modifies the board in place.
     * @param {number[][]} board - The Sudoku board to solve.
     * @returns {boolean} - True if a solution is found, false otherwise.
     */
    function solve(board) {
        const emptyCell = _findEmptyCell(board);
        if (!emptyCell) {
            return true; // Board is full, puzzle solved
        }
        const [row, col] = emptyCell;

        const shuffledNumbers = Utils.shuffleArray([...NUMBERS]); // Try numbers in random order

        for (const num of shuffledNumbers) {
            if (_isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) {
                    return true; // Solution found
                }
                board[row][col] = EMPTY_CELL; // Backtrack
            }
        }
        return false; // No valid number found for this cell
    }

    /**
     * Generates a complete, valid Sudoku solution.
     * @returns {number[][]} - A 9x9 array representing a solved Sudoku board.
     */
    function generateSolution() {
        let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(EMPTY_CELL));
        solve(board); // Fills the board with a valid solution
        return board;
    }

    /**
     * Creates a Sudoku puzzle from a solution by removing cells.
     * @param {number[][]} solutionBoard - A fully solved Sudoku board.
     * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard', 'expert').
     * @returns {number[][]} - A 9x9 array representing the puzzle with some cells empty.
     */
    function createPuzzle(solutionBoard, difficulty) {
        let puzzle = Utils.deepCopy2DArray(solutionBoard);
        let cellsToRemove;

        // Determine the number of cells to remove based on difficulty
        // These numbers are approximate and can be fine-tuned.
        switch (difficulty) {
            case 'easy':    cellsToRemove = 35 + Math.floor(Math.random() * 5); break; // 35-39
            case 'medium':  cellsToRemove = 45 + Math.floor(Math.random() * 5); break; // 45-49
            case 'hard':    cellsToRemove = 50 + Math.floor(Math.random() * 5); break; // 50-54
            case 'expert':  cellsToRemove = 54 + Math.floor(Math.random() * 4); break; // 54-57 (max ~58-60 for unique)
            default:        cellsToRemove = 45;
        }

        let attempts = 0; // To prevent infinite loops if too many cells are removed
        const maxAttemptsPerCell = 5; // Try a few times to remove a cell before giving up on that one

        // Create a list of all cell coordinates and shuffle it
        let cellCoordinates = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                cellCoordinates.push([r, c]);
            }
        }
        Utils.shuffleArray(cellCoordinates);

        let removedCount = 0;
        for (const [r, c] of cellCoordinates) {
            if (removedCount >= cellsToRemove) break;

            if (puzzle[r][c] !== EMPTY_CELL) {
                const tempVal = puzzle[r][c];
                puzzle[r][c] = EMPTY_CELL;
                
                // Basic check: For a more robust unique solution guarantee,
                // you'd need a counter for solutions here.
                // This simplified version prioritizes speed of generation.
                // For a truly unique puzzle, you'd check if `countSolutions(Utils.deepCopy2DArray(puzzle))` is 1.
                // This is computationally expensive.
                
                removedCount++;
            }
        }
        return puzzle;
    }
    
    // Function to count solutions (can be slow, use judiciously or for a separate "puzzle validator" tool)
    // function countSolutions(board) {
    //     let count = 0;
    //     function _solveAndCount(b) {
    //         const empty = _findEmptyCell(b);
    //         if (!empty) {
    //             count++;
    //             return;
    //         }
    //         const [r, c] = empty;
    //         for (let num = 1; num <= GRID_SIZE; num++) {
    //             if (_isValidPlacement(b, r, c, num)) {
    //                 b[r][c] = num;
    //                 _solveAndCount(b);
    //                 if (count > 1) return; // Optimization: if more than one solution, stop
    //                 b[r][c] = EMPTY_CELL; // Backtrack
    //             }
    //         }
    //     }
    //     _solveAndCount(board);
    //     return count;
    // }


    /**
     * Checks if the user's move is valid according to Sudoku rules (ignoring other user inputs).
     * This is for immediate feedback on a single cell entry.
     * @param {number[][]} board - The current board state (user's entries).
     * @param {number} row - The row of the move.
     * @param {number} col - The column of the move.
     * @param {number} num - The number entered by the user.
     * @returns {boolean} - True if the move is valid, false otherwise.
     */
    function isMoveValid(board, row, col, num) {
        // Check row (excluding the cell itself if it already had that number)
        for (let c = 0; c < GRID_SIZE; c++) {
            if (c !== col && board[row][c] === num) return false;
        }
        // Check column
        for (let r = 0; r < GRID_SIZE; r++) {
            if (r !== row && board[r][col] === num) return false;
        }
        // Check 3x3 box
        const boxRowStart = row - (row % BOX_SIZE);
        const boxColStart = col - (col % BOX_SIZE);
        for (let r = boxRowStart; r < boxRowStart + BOX_SIZE; r++) {
            for (let c = boxColStart; c < boxColStart + BOX_SIZE; c++) {
                if ((r !== row || c !== col) && board[r][c] === num) return false;
            }
        }
        return true;
    }

    /**
     * Checks if the entire board is solved correctly against the solution.
     * @param {number[][]} userBoard - The user's current board.
     * @param {number[][]} solutionBoard - The correct solution.
     * @returns {boolean} - True if the board is completely and correctly solved.
     */
    function isBoardSolved(userBoard, solutionBoard) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (userBoard[r][c] === EMPTY_CELL || userBoard[r][c] !== solutionBoard[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Checks if the board is full (no empty cells).
     * @param {number[][]} board - The board to check.
     * @returns {boolean} - True if the board is full.
     */
    function isBoardFull(board) {
        return !_findEmptyCell(board);
    }


    return {
        GRID_SIZE,
        EMPTY_CELL,
        generateSolution,
        createPuzzle,
        solve, // Expose solver for hint/solve functionality
        isMoveValid,
        isBoardSolved,
        isBoardFull,
        _isValidPlacement // Exposed for potential use in UI for highlighting conflicts
    };
})();
