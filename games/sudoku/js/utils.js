// Utility functions (can be empty initially or include common helpers)
// For example, a shuffle function if not part of the Sudoku class
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// You might add other utilities here as needed
