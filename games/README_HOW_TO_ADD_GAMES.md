How to Add New Games to InstantPlay:

1.  **Create a New Game Folder:**
    * Inside the main `games/` directory of your InstantPlay project, create a new folder.
    * Name this folder descriptively for the game you are adding (e.g., `cool_platformer/`, `puzzle_master_2048/`).
    * It's best to use simple names with lowercase letters, numbers, underscores (`_`), or hyphens (`-`) and avoid spaces or special characters.

2.  **Add Game Files:**
    * Download the open-source HTML5 game you want to include. These games usually come as a ZIP file or a collection of files in a repository.
    * **Unzip** the game files if they are in a ZIP archive.
    * Copy **ALL** the unzipped game files and folders (this typically includes an `index.html` file, and often folders like `js/`, `css/`, `assets/`, `images/`, `audio/`, etc.) directly into the new game folder you created in step 1 (e.g., into `games/cool_platformer/`).

3.  **Update `games.json`:**
    * Open the `games.json` file located in the root directory of your InstantPlay project. This file contains an array of game objects.
    * Add a new JSON object to this array for your new game. Carefully follow the existing structure and fill in all the required fields. Here's a template:

    ```json
    {
        "id": "unique_game_id_here",         // A unique identifier for the game (e.g., "cool_platformer_v1")
        "name_en": "Game Name in English",     // The game's display name in English
        "name_fa": "نام بازی به فارسی",          // The game's display name in Persian
        "description_en": "A brief description of the game in English.",
        "description_fa": "توضیحات مختصر بازی به فارسی.",
        "thumbnail_url": "assets/images/your_game_thumbnail.png", // Path to the game's thumbnail image
        "game_url": "games/cool_platformer/index.html",        // CRITICAL: Path to the game's main HTML file
        "genre_en": "Platformer",              // Game genre in English (e.g., "Puzzle", "Action", "Strategy")
        "genre_fa": "سکوبازی"                   // Game genre in Persian
    }
    ```
    * **Important Notes for `games.json`:**
        * **`id`**: Must be unique for each game.
        * **`thumbnail_url`**: Path should point to an image in your `assets/images/` folder.
        * **`game_url`**: This is the direct path to the `index.html` (or equivalent main file) of the game *inside its folder within the `games/` directory*. Double-check this path.
        * **`genre_en` / `genre_fa`**: Be consistent with your genre naming for effective filtering.

4.  **Add Game Thumbnail Image:**
    * Create or find a suitable thumbnail image for your game (e.g., a 300x180 pixels PNG or JPG).
    * Place this image file into the `assets/images/` folder of your InstantPlay project.
    * Ensure the `thumbnail_url` you specified in `games.json` correctly points to this new image file.
    * If you don't have a specific thumbnail yet, you can temporarily use `assets/images/default_thumb.png` (make sure this default image exists).

5.  **Test Thoroughly:**
    * If you're using GitHub Pages, commit and push all your changes (the new game files in the `games/` subfolder, the updated `games.json`, and the new thumbnail image in `assets/images/`).
    * Open your InstantPlay site in a web browser.
    * Check the following:
        * Does the new game appear in the list?
        * Is the thumbnail, name, and description displayed correctly in both English and Persian?
        * Does the genre filter work for the new game's genre?
        * Does clicking on the game card open the detail modal correctly?
        * Most importantly, does clicking the "Play Game" button in the modal launch the game successfully?

That's it! Your new game should now be part of your InstantPlay portal. Repeat these steps for each game you want to add.
