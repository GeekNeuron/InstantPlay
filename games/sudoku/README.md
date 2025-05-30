# Sudoku Game

A classic Sudoku game implemented purely in HTML, CSS, and JavaScript. This project is designed to be played directly in your browser and is easily deployable to GitHub Pages.

## ✨ Features

* **Multiple Difficulty Levels:** Choose from Easy, Medium, Hard, and "Very Hard" to challenge yourself.
* **Interactive 9x9 Grid:** Standard Sudoku layout with intuitive input cells.
* **Sleek User Interface:**
    * The main game board features rounded corners for a modern aesthetic.
    * Individual cells within the grid also have rounded corners.
* **Dual Theme Support:**
    * **Light Theme:** A clean, all-white background with dark blue text and accents.
    * **Dark Theme:** A deep, all-dark-blue background with white text and accents.
* **Dynamic Theme Switcher:** A minimalist, circular button located at the top-right of the screen. It has no icon or text and its color is always the inverse of the current theme, providing a subtle yet clear visual cue.
* **Input Validation:** Basic validation to ensure only numbers 1-9 can be entered.
* **Solution Checking:** Instantly verify if your current solution is correct.
* **"Solve" Feature:** Option to reveal the complete solution for the current puzzle.
* **Responsive Design:** The game interface adapts gracefully to various screen sizes, ensuring playability on both desktop and mobile devices.
* **Persistent Theme Preference:** Your chosen theme (Light or Dark) is saved in `localStorage` and remembered across sessions.

## 🚀 How to Play

1.  **Select Difficulty:** Use the dropdown menu to choose your desired difficulty level (Easy, Medium, Hard, Very Hard).
2.  **Start a New Game:** Click the "New Game" button. A fresh Sudoku puzzle will be generated and displayed on the board.
3.  **Fill the Grid:**
    * Click on an empty cell.
    * Type a number from 1 to 9.
    * The rules of Sudoku apply:
        * Each number (1-9) must appear only once in each **row**.
        * Each number (1-9) must appear only once in each **column**.
        * Each number (1-9) must appear only once in each **3x3 subgrid**.
4.  **Switch Themes:** Click the small, circular button in the top-right corner of the page to toggle between the Light and Dark themes.
5.  **Check Your Solution:** Once you believe you have solved the puzzle (or want to check your progress), click the "Check Solution" button. You'll receive feedback on whether your solution is correct.
6.  **Reveal Solution:** If you're stuck or just curious, click the "Solve" button to display the complete solution for the current puzzle.

## 📂 Project Structure

The project is organized with a clear and modular structure to promote maintainability and scalability:
