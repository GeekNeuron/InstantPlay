# 2048 Game

A JavaScript implementation of the classic 2048 game.

## Features

-   Classic 2048 gameplay (slide and merge tiles)
-   Score and Best Score tracking (best score saved in localStorage)
-   Responsive design for various screen sizes
-   Keyboard controls (Arrow keys, WASD)
-   Touch controls (Swipe gestures)
-   User interface inspired by isega.ro
-   Clear, organized project structure

## How to Play

1.  Clone this repository or download the files.
2.  Open the `index.html` file in your web browser.
3.  Use arrow keys or swipe on a touch screen to move the tiles.
4.  When two tiles with the same number touch, they merge into one!
5.  Try to reach the 2048 tile!

## Project Structure

-   `index.html`: The main HTML structure of the game.
-   `css/style.css`: Styles for the game's appearance.
-   `js/`: Contains the JavaScript modules:
    -   `main.js`: Initializes the game and sets up event listeners.
    -   `game.js`: Core game logic, including moves, scoring, and game over conditions.
    -   `grid.js`: Manages the game grid, tile creation, and display.
    -   `tile.js`: Represents individual tiles on the grid.
    -   `input.js`: Handles user input from keyboard and touch events.
-   `LICENSE`: The MIT License for this project.
-   `README.md`: This file.

## Deployment to GitHub Pages

This project is ready for easy deployment to GitHub Pages:

1.  Create a new public repository on GitHub named `2048` (or your preferred name) under your `GeekNeuron` account.
2.  Initialize a Git repository in your project folder, commit your files, and push them to the GitHub repository:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of 2048 game"
    git remote add origin [https://github.com/GeekNeuron/2048.git](https://github.com/GeekNeuron/2048.git) # Replace with your repo URL
    git branch -M main
    git push -u origin main
    ```
3.  In your GitHub repository, go to `Settings` > `Pages`.
4.  Under `Build and deployment`, for `Source`, select `Deploy from a branch`.
5.  Choose your branch (usually `main` or `master`) and the folder (`/(root)`). Click `Save`.
6.  After a few minutes, your game will be live at `https://GeekNeuron.github.io/2048/`.

## Development Notes

-   **Animations:** The current `game.js` (`animateBoardChanges` function) has a simplified approach to updating the board visually after a move. For smooth, individual tile slide and merge animations, this function would need to be significantly expanded to track individual tile movements and use the `grid.moveTile()` and `grid.mergeTiles()` methods with `Promise.all` for synchronization.
-   **Styling:** The CSS aims for a look similar to `isega.ro`. Further refinements to colors, fonts, and spacing can be made for a closer match.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Created by GeekNeuron.
