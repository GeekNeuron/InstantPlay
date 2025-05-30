# InstantPlay

A feature-rich, bilingual (English/Persian) portal to host and play a collection of open-source HTML5 games. Designed for GitHub Pages, this portal includes dynamic game loading, a favorites system, search functionality, filtering by genre, sorting options, dark mode, user settings backup/restore, a game detail modal, toast notifications, and lazy loading for images.

## Project Structure
```
/ (Project Root)
├── index.html               # Main page, includes Font Awesome & Google Fonts (Vazirmatn) links
├── style.css                # Main stylesheet, including Vazirmatn for Persian & mobile media queries
├── main.js                  # Core JavaScript for all functionalities
├── games.json               # JSON file listing all games (name, desc, genre, paths, etc.)
│├── games/                   # Directory to store actual game files
│   ├── (game1_folder/)      # Each game in its own subfolder
│   └── README_HOW_TO_ADD_GAMES.txt # Instructions for adding new games
│├── assets/
│   └── images/              # For game thumbnails, site logo (optional)
│       └── default_thumb.png # Default thumbnail image
│└── lang/
├── en.json              # English language strings
└── fa.json              # Persian language stringsREADME.md                    # This file
```

## Key Features

* **Bilingual Support:** English and Persian, with automatic UI updates and Vazirmatn font specifically for Persian text.
* **Dynamic Game Loading:** Games listed in `games.json` are dynamically rendered on the page.
* **Favorites System:** Users can mark games as favorites. This list is displayed in a separate section and saved in `localStorage`.
* **Search Functionality:** Filter games by name or description.
* **Filter & Sort:** Filter games by genre and sort them by name (A-Z, Z-A).
* **Dark Mode:** Toggle between light and dark themes, with the user's preference saved.
* **Settings Backup/Restore:** Users can export their preferences (language, dark mode, favorites, current filter/sort) to a JSON file and import them back.
* **Game Detail Modal:** Clicking on a game card (not the star icon) opens a modal with more details about the game (image, description, genre), and the play button is located within this modal.
* **Toast Notifications:** User-friendly, non-blocking messages provide feedback for user actions.
* **Loading Spinner:** Visual feedback during data fetching operations.
* **Lazy Loading:** Game thumbnail images are loaded only when they scroll into the user's viewport.
* **Responsive Design:** Optimized for various screen sizes, including mobile devices, with specific CSS media queries.

## Setup & Usage

1.  **Add Vazirmatn Font Link:** Ensure the Google Fonts link for Vazirmatn is present in the `<head>` of `index.html` (already included in the provided `index.html`). This is primarily for rendering Persian text correctly.
2.  **Clone/Download Project:** Get these files into your GitHub repository or your local development environment.
3.  **Configure GitHub Pages (if applicable):** In your repository settings, navigate to the "Pages" section and set the source to the branch containing these files (e.g., `main`).
4.  **Add Your Games:**
    * Follow the detailed instructions in the `games/README_HOW_TO_ADD_GAMES.txt` file.
    * In summary: download HTML5 games, unzip them, and place each game's files into a new, separate subfolder within the `games/` directory.
    * Update the `games.json` file with accurate metadata for each new game. This includes paths to its `index.html` file (within the `games/your_game_folder/` structure) and its thumbnail image (located in `assets/images/`). **Crucially, remember to fill in the `genre_en` and `genre_fa` fields for filtering.**
5.  **Customize (Optional):**
    * Modify `style.css` for further visual customization to match your preferences.
    * Add more translation keys or refine existing translations in the `lang/en.json` and `lang/fa.json` files.
    * Add a `assets/images/default_thumb.png` image to serve as a default thumbnail if a specific game's thumbnail is missing.

## How It Works

* `main.js` is an IIFE (Immediately Invoked Function Expression) that encapsulates all the application's logic.
* It loads initial settings from `localStorage` or uses default values.
* It fetches language strings from the corresponding `lang/{lang}.json` file based on the selected language.
* It fetches game data from the `games.json` file.
* UI elements (game cards, filter options, etc.) are dynamically rendered based on the current language, search query, active filters, and sort order.
* User preferences (language, dark mode status, favorite games, current filter/sort settings) are saved to `localStorage` to persist across sessions.
* Game cards trigger a modal window displaying more detailed information about the game; the actual "Play Game" button is located within this modal.

Enjoy your InstantPlay!
