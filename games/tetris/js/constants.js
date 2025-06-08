// --- NEW: Control the size of pieces in Hold/Next boxes here ---
// Control the piece's Width (پهنا)
const SIDE_PANEL_SCALE_X = 2.0; 
// Control the piece's Height (طول)
const SIDE_PANEL_SCALE_Y = 2.0;


const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const SHAPES = [
    [], // Empty shape
    [[1, 1, 1], [0, 1, 0]],                                 // T
    [[2, 2, 2, 2]],                                        // I
    [[0, 3, 3], [3, 3, 0]],                                 // S
    [[4, 4, 0], [0, 4, 4]],                                 // Z
    [[5, 5, 5], [5, 0, 0]],                                 // L
    [[6, 6, 6], [0, 0, 6]],                                 // J
    [[7, 7], [7, 7]]                                       // O
];

const KEY = {
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40,
    UP: 38,    // For rotation
    SPACE: 32, // For hard drop
    C: 67      // For Hold
};

const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800
};
