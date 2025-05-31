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

## 🚀 Setup and Installation

This project is designed to be run directly in a web browser and is perfect for hosting on GitHub Pages.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/GeekNeuron/Minesweeper.git](https://github.com/GeekNeuron/Minesweeper.git)
    ```
    *(Replace with your repository URL if you fork it)*
2.  **Navigate to the project directory:**
    ```bash
    cd Minesweeper
    ```
3.  **Open `index.html` in your browser:**
    Simply open the `index.html` file in your preferred web browser to play the game locally.

### Deployment to GitHub Pages

1.  Ensure your code is pushed to the `main` (or `master`) branch of your GitHub repository.
2.  Go to your repository's **Settings** tab.
3.  Scroll down to the **GitHub Pages** section.
4.  Under **Source**, select your `main` branch (or `master`) and the `/ (root)` folder.
5.  Click **Save**. Your site should be published at `https://<your-username>.github.io/<repository-name>/` (e.g., `https://geekneuron.github.io/Minesweeper/`). It might take a few minutes for the site to go live.

## 🖼️ Screenshots / Demo

*(Here you can add more screenshots or a GIF showcasing the gameplay and theme switching)*

**Light Theme:**
![Minesweeper Light Theme Placeholder](https://placehold.co/400x300/f8f9fa/212529?text=Light+Theme)

**Dark Theme:**
![Minesweeper Dark Theme Placeholder](https://placehold.co/400x300/0d1117/c9d1d9?text=Dark+Theme)

## 🌱 Future Enhancements

While this version is a complete game, here are some potential ideas for future improvements:

* [ ] **Advanced Mobile Controls:** Implement a dedicated flag toggle button or a more refined long-press for flagging on touch devices.
* [ ] **Sound Effects:** Add subtle sounds for clicks, flags, explosions, and winning.
* [ ] **Custom Game Mode:** Allow users to input custom grid dimensions and mine counts.
* [ ] **Leaderboard:** If a backend or `localStorage` for high scores is implemented.
* [ ] **"Chord" Clicking:** Implement the ability to click on a revealed number tile to automatically reveal its unflagged neighbors if the correct number of flags has been placed around it.
* [ ] **Animations:** Add more elaborate animations for tile reveals or game over.
* [ ] **Accessibility (A11y) Improvements:** Further enhance keyboard navigation and ARIA attributes.

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find any bugs, feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please ensure your code follows the existing style and that any new features are well-tested.

## 📜 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details (you'll need to create this file if you want one, a common practice).

A simple `LICENSE` file with MIT License content would be:
MIT LicenseCopyright (c) 2024 GeekNeuron (Your Name/Username)Permission is hereby granted, free of charge, to any person obtaining a copyof this software and associated documentation files (the "Software"), to dealin the Software without restriction, including without limitation the rightsto use, copy, modify, merge, publish, distribute, sublicense, and/or sellcopies of the Software, and to permit persons to whom the Software isfurnished to do so, subject to the following conditions:The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS ORIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THEAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THESOFTWARE.
## 🙏 Acknowledgements

* Inspired by the classic Microsoft Minesweeper game.
* The clean UI and theming approach were influenced by modern web design trends and the structure of the [2048 Game by GeekNeuron](link-to-your-2048-project-if-applicable). *(You can remove or modify this if it's not relevant)*.
* Placeholder images generated via [placehold.co](https://placehold.co/).

---

**GeekNeuron** - *Happy Coding!*
