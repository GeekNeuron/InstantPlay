const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_CANVAS_BLOCK_SIZE = 25;

const COLORS = [
    null,
    '#FF0D72', // T-piece (Magenta)
    '#0DC2FF', // I-piece (Cyan)
    '#0DFF72', // S-piece (Green)
    '#F538FF', // Z-piece (Purple)
    '#FF8E0D', // L-piece (Orange)
    '#FFE138', // J-piece (Yellow)
    '#3877FF'  // O-piece (Blue)
];

const SHAPES = [
    [], // Empty shape.
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
    SPACE: 32  // For hard drop
};

const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800
};
