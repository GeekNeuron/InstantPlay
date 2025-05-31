# Minesweeper by GeekNeuron

A modern, responsive, and engaging implementation of the classic Minesweeper game, built with pure JavaScript, HTML, and CSS. Designed for a seamless experience on both desktop and mobile devices, hosted on GitHub Pages.

## 🌟 Features

* **Classic Minesweeper Gameplay:** Uncover safe tiles and flag mines to clear the board.
* **Multiple Difficulty Levels:**
    * Beginner (8x8 grid, 10 mines)
    * Easy (10x10 grid, 15 mines)
    * Medium (16x16 grid, 40 mines)
    * Hard (16x30 grid, 99 mines)
    * Huge (24x24 grid, 120 mines)
    * Extreme (30x30 grid, 200 mines)
* **Responsive Design:** Adapts beautifully to various screen sizes, from mobile phones to desktops.
* **Dual Themes:** Easily switch between a sleek **Light Theme** and a cool **Dark Theme** by clicking the game title. Theme preference is saved locally.
* **Dynamic Tile Sizing:** Tiles adjust their size for optimal playability based on the grid dimensions and screen size.
* **Clear Game Information:** Displays remaining mines and elapsed time.
* **Interactive Modal Messages:** Provides clear feedback for game win/loss.
* **Touch and Mouse Controls:** Intuitive interaction for all devices.
    * **Left Click (Tap):** Reveal a tile.
    * **Right Click (Long Press/Tap - *implementation detail*):** Flag/unflag a tile. *(Note: True right-click for flagging is standard on desktop. Mobile might use a toggle or long press if implemented).*
* **Pure JavaScript:** No external game frameworks, showcasing vanilla JS capabilities.

## 🎮 How to Play

1.  **Select Difficulty:** Choose your preferred grid size and mine count from the dropdown menu.
2.  **Start a New Game:** Click the "New Game" button.
3.  **Reveal Tiles:**
    * Click (or tap) on a tile to reveal it.
    * If you reveal a mine (💣), the game is over!
    * If you reveal a safe tile, it will either be blank or show a number.
    * The number indicates how many mines are adjacent (horizontally, vertically, or diagonally) to that tile.
4.  **Flag Mines:**
    * Right-click (or long-press on mobile, if implemented) on a tile you suspect is a mine to place a flag (🚩).
    * Right-click again to unflag it.
    * The "Mines" counter shows the total number of mines minus the number of flags you've placed.
5.  **Win the Game:**
    * You win by revealing all safe tiles on the board. You do not need to flag all mines to win, but all safe tiles must be uncovered.
6.  **Switch Theme:** Click on the "Minesweeper" title at any time to toggle between light and dark themes.

## 🛠️ Technologies Used

* **HTML5:** For the basic structure of the game.
* **CSS3:** For styling, theming, and responsive design (using Flexbox and CSS Grid).
* **JavaScript (ES6+):** For all game logic, DOM manipulation, and interactivity. No external libraries or frameworks are used for the core game mechanics.

## 🌱 Future Enhancements

While this version is a complete game, here are some potential ideas for future improvements:

* [ ] **Advanced Mobile Controls:** Implement a dedicated flag toggle button or a more refined long-press for flagging on touch devices.
* [ ] **Sound Effects:** Add subtle sounds for clicks, flags, explosions, and winning.
* [ ] **Custom Game Mode:** Allow users to input custom grid dimensions and mine counts.
* [ ] **Leaderboard:** If a backend or `localStorage` for high scores is implemented.
* [ ] **"Chord" Clicking:** Implement the ability to click on a revealed number tile to automatically reveal its unflagged neighbors if the correct number of flags has been placed around it.
* [ ] **Animations:** Add more elaborate animations for tile reveals or game over.
* [ ] **Accessibility (A11y) Improvements:** Further enhance keyboard navigation and ARIA attributes.

## LICENSE
MIT License

---

**GeekNeuron** - *Happy Coding!*
