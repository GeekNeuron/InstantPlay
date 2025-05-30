# Sudoku Game

A classic Sudoku puzzle game implemented in vanilla JavaScript, HTML, and CSS. Designed for GitHub Pages.

## Features

* **Interactive Gameplay**: Click and type to fill the Sudoku grid.
* **Multiple Difficulty Levels**:
    * Easy
    * Medium
    * Hard
    * Expert
* **Theming**: Switch between a **Light (all white)** and a **Dark (all dark blue)** theme.
    * Theme switcher: A small, round button in the top-right corner with its color inverse to the current theme.
* **Visual Design**:
    * Rounded corners for the main game board container.
    * Rounded corners for individual cells within the grid.
    * Clear visual distinction for 3x3 subgrids.
* **Input Validation**: Highlights incorrect numbers based on Sudoku rules.
* **Responsive Design**: Adapts to different screen sizes.

## How to Play

1.  **Select Difficulty**: Choose a difficulty level from the dropdown menu.
2.  **Start Game**: Click "New Game" (a new game also starts when difficulty is changed).
3.  **Fill Cells**:
    * Click an empty cell to select it (its input field will focus).
    * Type a number (1-9). Invalid inputs (non-numeric, or outside 1-9) are ignored or cleared.
    * Pre-filled numbers are part of the puzzle and cannot be changed.
4.  **Check Progress**: Incorrectly placed numbers (violating row, column, or 3x3 subgrid rules) will be highlighted.
5.  **Reset**: Click "Reset Board" to clear your entries from the current puzzle and start over with the same puzzle.
6.  **Win**: The game is won when all cells are filled correctly. A success message will appear.

## Project Structure
```
Sudoku/
├── index.html             # Main game page
├── css/
│   └── main.css           # Styles for layout, grid, themes
├── js/
│   ├── app.js             # Main application, game flow, event handling
│   ├── board.js           # Grid rendering, cell interaction
│   ├── sudoku.js          # Puzzle generation, validation, solving
│   ├── ui.js              # Theme management, user messages
│   └── utils.js           # Utility functions (if any)
└── README.md              # This documentation
```

## Technologies Used

* HTML5
* CSS3 (Flexbox, Grid, CSS Variables)
* Vanilla JavaScript (ES6+)
## Author

* **GeekNeuron** ([https://github.com/GeekNeuron](https://github.com/GeekNeuron))
