# Snake

A modern, feature-rich Snake game built with pure JavaScript, HTML, and CSS, designed for GitHub Pages.

## ✨ Features (Implemented & Planned)

* Classic Snake gameplay
* **Responsive Design (Desktop & Mobile)**
* **Light & Dark Themes (toggle by clicking title)**
* **Modular Codebase using ES6 Modules**
* **Grid lines within the game board**
* **Snake with rounded segments and distinct head**
* **Small grid cells for detailed movement**
* **Programmatic Sound Effects (no audio files needed)**
* **Diverse Food Types with different scores and effects (e.g., speed boost, slow down, extra growth)**
* Local High Score System (Implemented)
* Power-ups and Power-downs (Partially implemented with `PowerUpManager` skeleton, food effects are separate for now)
* Advanced Scoring & Combos (Planned)
* Various Game Modes (Classic, Campaign, Time Attack, Survival) (Planned)
* Obstacles (Basic structure in `board.js`, can be expanded)
* Customizable Snake & Board Themes (Beyond light/dark) (Planned)
* Engaging Visuals & Animations (Basic smooth movements, theme transition)
* Achievements/Badges (Planned)
* Optimized Touch Controls (Implemented)

## 🎮 How to Play

* **Desktop:** Use Arrow Keys (Up, Down, Left, Right) or W, A, S, D to control the snake.
* **Mobile:** Swipe in the desired direction.
* **Pause/Resume:** Press Space bar or Escape key.
* Eat food to grow and score points. Different foods have different effects!
* Avoid hitting walls or your own tail.

## 🛠️ Project Structure

* `index.html`: Main game page.
* `assets/css/`: Stylesheets (main, light theme, dark theme).
* `assets/js/`: JavaScript modules (game logic, UI, input, etc.).
    * `main.js`: Entry point, theme management, game initialization.
    * `constants.js`: Game constants (grid size, colors, food types, etc.).
    * `utils.js`: Utility helper functions.
    * `board.js`: Game board rendering and logic.
    * `snake.js`: Snake object: movement, growth, drawing, effects.
    * `food.js`: Food object: placement, drawing, types, effects.
    * `input.js`: Keyboard and touch input handling.
    * `ui.js`: Score display, messages, UI elements.
    * `sfx.js`: Sound effects management (programmatic).
    * `powerups.js`: Logic for collectible power-ups (future expansion).
    * `game.js`: Core game loop, state management, rules, orchestration.
* `docs/`: (Optional) Detailed documentation.

## 開発 (Development)

This project is developed by **GeekNeuron** with AI assistance.

### Running Locally

1.  Clone the repository: `git clone https://github.com/GeekNeuron/Snake.git`
2.  Navigate to the project directory: `cd Snake`
3.  Open `index.html` in your web browser.

---
*This README will be updated as the project progresses.*
