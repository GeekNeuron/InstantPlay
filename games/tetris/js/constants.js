const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const SHAPES = [
    [], // Empty shape
    [[1, 1, 1], [0, 1, 0]],
    [[2, 2, 2, 2]],
    [[0, 3, 3], [3, 3, 0]],
    [[4, 4, 0], [0, 4, 4]],
    [[5, 5, 5], [5, 0, 0]],
    [[6, 6, 6], [0, 0, 6]],
    [[7, 7], [7, 7]]
];

const KEY = {
    LEFT: 37, RIGHT: 39, DOWN: 40, UP: 38,
    SPACE: 32, C: 67
};

const POINTS = {
    SINGLE: 100, DOUBLE: 300, TRIPLE: 500, TETRIS: 800
};
