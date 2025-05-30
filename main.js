// =================================================================
//  Game Portal Ultimate - Main JavaScript
// =================================================================
(function() {
    'use strict';

    // --- DOM Elements ---
    const elements = {
        body: document.body,
        gameListContainer: document.getElementById('game-list-container'),
        favoritesListContainer: document.getElementById('favorites-list-container'),
        favoritesSection: document.getElementById('favorites-section'),
        languageSelect: document.getElementById('language-select'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        searchInput: document.getElementById('search-input'),
        exportButton: document.getElementById('export-settings-button'),
        importInput: document.getElementById('import-settings-input'),
        noGamesMessage: document.getElementById('no-games-found'),
        allGamesHeader: document.getElementById('all_games_main_header'),
        loadingOverlay: document.getElementById('loading-overlay'),
        toastContainer: document.getElementById('toast-container'),
        gameModal: document.getElementById('game-modal'),
        modalContent: document.querySelector('.modal-content'),
        modalCloseButton: document.querySelector('.modal-close-button'),
        modalImg: document.getElementById('modal-img'),
        modalTitle: document.getElementById('modal-title'),
        modalGenre: document.getElementById('modal-genre'),
        modalDescription: document.getElementById('modal-description'),
        modalPlayButton: document.getElementById('modal-play-button'),
        genreFilter: document.getElementById('genre-filter'),
        sortBy: document.getElementById('sort-by')
    };

    // --- App State ---
    let allGamesData = []; // To store the original games data
    let currentTranslations = {};
    let appSettings = {
        language: 'en',
        darkMode: false,
        favorites: [],
        currentGenre: 'all',
        currentSort: 'name_asc'
    };

    // --- Utilities ---
    const utils = {
        fetchJson: async (url) => {
            utils.showLoading(true);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                return await response.json();
            } catch (error) {
                console.error("Could not fetch JSON:", error);
                utils.showToast(currentTranslations.fetch_error || `Error fetching data. Check console.`, 'error');
                return null;
            } finally {
                utils.showLoading(false);
            }
        },
        showLoading: (isLoading) => {
            if (elements.loadingOverlay) {
                elements.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
            }
        },
        showToast: (message, type = 'info', duration = 3500) => {
            if (!elements.toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');

            const messageSpan = document.createElement('span');
            messageSpan.textContent = message;

            const closeButton = document.createElement('button');
            closeButton.className = 'toast-close-button';
            closeButton.innerHTML = '&times;';
            closeButton.setAttribute('aria-label', currentTranslations.close_button_label || 'Close');

            toast.appendChild(messageSpan);
            toast.appendChild(closeButton);
            elements.toastContainer.appendChild(toast);

            requestAnimationFrame(() => {
                 toast.classList.add('show');
            });

            const hideToast = () => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, { once: true });
            };

            closeButton.addEventListener('click', hideToast);
            setTimeout(hideToast, duration);
        }
    };

    // --- Settings Management ---
    const settingsManager = {
        load: () => {
            try {
                const saved = localStorage.getItem('gamePortalUltimateSettings');
                if (saved) {
                    const loaded = JSON.parse(saved);
                    appSettings = { ...appSettings, ...loaded };
                    appSettings.favorites = Array.isArray(appSettings.favorites) ? appSettings.favorites : [];
                }
            } catch (e) {
                console.error("Failed to load settings from localStorage:", e);
            }
        },
        save: () => {
            localStorage.setItem('gamePortalUltimateSettings', JSON.stringify(appSettings));
        },
        export: () => {
            const settingsJson = JSON.stringify(appSettings, null, 2);
            const blob = new Blob([settingsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'game-portal-settings.json';
            a.click();
            URL.revokeObjectURL(url);
            utils.showToast(currentTranslations.settings_exported_success || "Settings exported!", 'success');
        },
        import: (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    // Basic validation/merge
                    appSettings.language = imported.language || appSettings.language;
                    appSettings.darkMode = typeof imported.darkMode === 'boolean' ? imported.darkMode : appSettings.darkMode;
                    appSettings.favorites = Array.isArray(imported.favorites) ? imported.favorites : appSettings.favorites;
                    appSettings.currentGenre = imported.currentGenre || 'all';
                    appSettings.currentSort = imported.currentSort || 'name_asc';
                    
                    settingsManager.save();
                    app.init(); // Re-initialize fully
                    utils.showToast(currentTranslations.settings_imported_success, 'success');
                } catch (error) {
                    console.error("Error importing settings:", error);
                    utils.showToast(currentTranslations.settings_imported_error, 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = null;
        }
    };

    // --- UI Management ---
    const uiManager = {
        applyDarkMode: () => {
            elements.body.classList.toggle('dark-mode', appSettings.darkMode);
            const icon = elements.darkModeToggle.querySelector('i');
            const label = elements.darkModeToggle.querySelector('span.sr-only'); // The visible text is now sr-only as icon is primary
            if (appSettings.darkMode) {
                icon.className = 'fas fa-sun';
                if(label) label.textContent = currentTranslations.light_mode_label || 'Light Mode';
                elements.darkModeToggle.title = currentTranslations.light_mode_label || 'Switch to Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                if(label) label.textContent = currentTranslations.dark_mode_label || 'Dark Mode';
                elements.darkModeToggle.title = currentTranslations.dark_mode_label || 'Switch to Dark Mode';
            }
        },
        toggleDarkMode: () => {
            appSettings.darkMode = !appSettings.darkMode;
            uiManager.applyDarkMode();
            settingsManager.save();
        },
        loadTranslations: async () => {
            currentTranslations = await utils.fetchJson(`lang/${appSettings.language}.json`) || {};
            document.querySelectorAll('[data-translate-key]').forEach(el => {
                const key = el.dataset.translateKey;
                if (currentTranslations[key]) {
                    if (el.tagName === 'TITLE') document.title = currentTranslations[key];
                    else el.textContent = currentTranslations[key];
                }
            });
            document.querySelectorAll('[data-translate-placeholder-key]').forEach(el => {
                const key = el.dataset.translatePlaceholderKey;
                if (currentTranslations[key]) el.placeholder = currentTranslations[key];
            });
            document.querySelectorAll('[data-translate-aria-label]').forEach(el => {
                const key = el.dataset.translateAriaLabel;
                if (currentTranslations[key]) el.setAttribute('aria-label', currentTranslations[key]);
            });
        },
        changeLanguage: (lang) => {
            appSettings.language = lang;
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
            settingsManager.save();
            uiManager.loadTranslations().then(() => {
                uiManager.populateGenreFilter();
                uiManager.renderGames();
                uiManager.applyDarkMode(); // Re-apply to update button title if translated
            });
        },
        populateGenreFilter: () => {
            if (!elements.genreFilter || !allGamesData) return;
            const lang = appSettings.language;
            const genres = [...new Set(allGamesData.map(g => lang === 'fa' ? g.genre_fa : g.genre_en).filter(Boolean))];
            genres.sort((a, b) => a.localeCompare(b, lang)); // Sort genres based on current language
            
            elements.genreFilter.innerHTML = `<option value="all">${currentTranslations.all_genres || "All Genres"}</option>`;
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre; // Store the localized genre name as value
                option.textContent = genre;
                elements.genreFilter.appendChild(option);
            });
            elements.genreFilter.value = appSettings.currentGenre;
        },
        createGameCard: (game) => {
            const card = document.createElement('article');
            card.className = 'game-card';
            card.dataset.gameId = game.id;

            const isFav = appSettings.favorites.includes(game.id);
            const lang = appSettings.language;
            const name = lang === 'fa' ? game.name_fa : game.name_en;

            const favButton = document.createElement('button');
            favButton.className = `favorite-button ${isFav ? 'is-favorite' : ''}`;
            favButton.setAttribute('aria-label', isFav ? currentTranslations.remove_from_favorites : currentTranslations.add_to_favorites);
            favButton.title = isFav ? currentTranslations.remove_from_favorites : currentTranslations.add_to_favorites;
            favButton.innerHTML = `<i class="fas fa-star"></i>`;
            favButton.addEventListener('click', (e) => {
                e.stopPropagation(); 
                gameManager.toggleFavorite(game.id);
            });

            const clickableArea = document.createElement('div');
            clickableArea.className = 'game-card-clickable-area';
            clickableArea.addEventListener('click', () => uiManager.openModal(game));

            const thumbnail = document.createElement('img');
            thumbnail.dataset.src = game.thumbnail_url || 'assets/images/default_thumb.png';
            thumbnail.alt = name;
            thumbnail.className = 'thumbnail lazy';
            thumbnail.width = 300;
            thumbnail.height = 180;

            const content = document.createElement('div');
            content.className = 'game-card-content';
            const title = document.createElement('h3');
            title.textContent = name;
            const description = document.createElement('p');
            description.className = 'description';
            description.textContent = lang === 'fa' ? game.description_fa : game.description_en;

            content.appendChild(title);
            content.appendChild(description);
            clickableArea.appendChild(thumbnail);
            clickableArea.appendChild(content);

            card.appendChild(favButton);
            card.appendChild(clickableArea);
            return card;
        },
        renderGames: () => {
            if (!elements.gameListContainer || !elements.favoritesListContainer) return;
            const filteredAndSortedGames = gameManager.getFilteredAndSortedGames();

            elements.favoritesListContainer.innerHTML = '';
            elements.gameListContainer.innerHTML = '';

            let favoriteGamesCount = 0;
            const nonFavoritesFragment = document.createDocumentFragment();

            if (filteredAndSortedGames.length > 0) {
                filteredAndSortedGames.forEach(game => {
                    const card = uiManager.createGameCard(game);
                    if (appSettings.favorites.includes(game.id)) {
                        elements.favoritesListContainer.appendChild(card);
                        favoriteGamesCount++;
                    } else {
                        nonFavoritesFragment.appendChild(card);
                    }
                });
            }
            
            elements.gameListContainer.appendChild(nonFavoritesFragment);
            elements.favoritesSection.style.display = favoriteGamesCount > 0 ? 'block' : 'none';
            elements.allGamesHeader.style.display = (filteredAndSortedGames.length > favoriteGamesCount || favoriteGamesCount === 0 || filteredAndSortedGames.length > 0) ? 'block' : 'none';
            
            if (filteredAndSortedGames.length === 0 && elements.searchInput.value) {
                 elements.noGamesMessage.textContent = currentTranslations.no_games_found || "No games found matching your criteria.";
                 elements.noGamesMessage.style.display = 'block';
            } else if (allGamesData.length === 0) {
                 elements.noGamesMessage.textContent = currentTranslations.no_games_available || "No games available yet."; // Add this key to lang files
                 elements.noGamesMessage.style.display = 'block';
            }
            else {
                elements.noGamesMessage.style.display = 'none';
            }
            
            lazyLoadManager.observe();
        },
        openModal: (game) => {
            const lang = appSettings.language;
            elements.modalImg.src = game.thumbnail_url || 'assets/images/default_thumb.png';
            elements.modalImg.alt = lang === 'fa' ? game.name_fa : game.name_en;
            elements.modalTitle.textContent = lang === 'fa' ? game.name_fa : game.name_en;
            elements.modalGenre.textContent = lang === 'fa' ? game.genre_fa : game.genre_en;
            elements.modalDescription.textContent = lang === 'fa' ? game.description_fa : game.description_en;
            elements.modalPlayButton.href = game.game_url;
            
            elements.gameModal.style.display = 'flex';
            elements.body.classList.add('modal-open');
            elements.modalCloseButton.focus(); // For accessibility
            requestAnimationFrame(() => {
                elements.gameModal.classList.add('show');
            });
        },
        closeModal: () => {
            elements.gameModal.classList.remove('show');
             elements.gameModal.addEventListener('transitionend', () => {
                if (!elements.gameModal.classList.contains('show')) { // Check if it's still meant to be hidden
                    elements.gameModal.style.display = 'none';
                    elements.body.classList.remove('modal-open');
                }
            }, { once: true });
        }
    };

    // --- Game Logic ---
    const gameManager = {
        getFilteredAndSortedGames: () => {
            const searchTerm = elements.searchInput.value.toLowerCase().trim();
            const lang = appSettings.language;
            const selectedGenre = appSettings.currentGenre; // This is the localized genre name
            const sortType = appSettings.currentSort;

            let filtered = allGamesData.filter(game => {
                const name = (lang === 'fa' ? game.name_fa : game.name_en).toLowerCase();
                const description = (lang === 'fa' ? game.description_fa : game.description_en).toLowerCase();
                const gameGenre = lang === 'fa' ? game.genre_fa : game.genre_en;

                const searchMatch = !searchTerm || name.includes(searchTerm) || description.includes(searchTerm);
                const genreMatch = selectedGenre === 'all' || gameGenre === selectedGenre;
                
                return searchMatch && genreMatch;
            });

            filtered.sort((a, b) => {
                const nameA = (lang === 'fa' ? a.name_fa : a.name_en).toLowerCase();
                const nameB = (lang === 'fa' ? b.name_fa : b.name_en).toLowerCase();
                if (sortType === 'name_asc') return nameA.localeCompare(nameB, lang);
                if (sortType === 'name_desc') return nameB.localeCompare(nameA, lang);
                return 0;
            });

            return filtered;
        },
        toggleFavorite: (gameId) => {
            const index = appSettings.favorites.indexOf(gameId);
            if (index > -1) {
                appSettings.favorites.splice(index, 1);
                utils.showToast(currentTranslations.removed_from_favorites, 'info');
            } else {
                appSettings.favorites.push(gameId);
                utils.showToast(currentTranslations.added_to_favorites, 'success');
            }
            settingsManager.save();
            uiManager.renderGames();
        }
    };

    // --- Lazy Loading ---
    const lazyLoadManager = {
        observer: null,
        init: () => {
            if (!('IntersectionObserver' in window)) {
                lazyLoadManager.loadAllFallback(); 
                return;
            }
            lazyLoadManager.observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.onload = () => img.classList.remove('lazy'); // Remove lazy class after load
                        img.onerror = () => { // Handle broken images
                            img.classList.remove('lazy'); 
                            // Optionally set a placeholder for broken images
                            // img.src = 'assets/images/broken_thumb.png'; 
                        }
                        obs.unobserve(img);
                    }
                });
            }, { rootMargin: "0px 0px 200px 0px" });
        },
        observe: () => {
            if (lazyLoadManager.observer) {
                document.querySelectorAll('img.lazy').forEach(img => lazyLoadManager.observer.observe(img));
            } else {
                 lazyLoadManager.loadAllFallback();
            }
        },
        loadAllFallback: () => { 
            document.querySelectorAll('img.lazy').forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    };

    // --- Event Listener Setup ---
    const setupEventListeners = () => {
        elements.darkModeToggle.addEventListener('click', uiManager.toggleDarkMode);
        elements.languageSelect.addEventListener('change', (e) => uiManager.changeLanguage(e.target.value));
        
        let searchTimeout;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(uiManager.renderGames, 300); // Debounce search
        });

        elements.genreFilter.addEventListener('change', (e) => {
             appSettings.currentGenre = e.target.value;
             settingsManager.save();
             uiManager.renderGames();
        });
        elements.sortBy.addEventListener('change', (e) => {
            appSettings.currentSort = e.target.value;
            settingsManager.save();
            uiManager.renderGames();
        });
        elements.exportButton.addEventListener('click', settingsManager.export);
        elements.importInput.addEventListener('change', settingsManager.import);
        elements.modalCloseButton.addEventListener('click', uiManager.closeModal);
        elements.gameModal.addEventListener('click', (e) => {
            if (e.target === elements.gameModal) uiManager.closeModal();
        });
        document.addEventListener('keydown', (e) => {
             if (e.key === 'Escape' && elements.gameModal.style.display === 'flex') {
                uiManager.closeModal();
             }
        });
    };

    // --- App Initialization ---
    const app = {
        init: async () => {
            utils.showLoading(true);
            settingsManager.load(); // Load settings first
            
            // Apply initial UI settings from loaded appSettings
            uiManager.applyDarkMode();
            elements.languageSelect.value = appSettings.language;
            elements.sortBy.value = appSettings.currentSort;
            // Genre filter value set after genres are populated
            document.documentElement.lang = appSettings.language;
            document.documentElement.dir = appSettings.language === 'fa' ? 'rtl' : 'ltr';

            await uiManager.loadTranslations(); // Load translations based on current language
            allGamesData = await utils.fetchJson('games.json') || [];

            if(allGamesData) {
                uiManager.populateGenreFilter(); // Needs allGamesData & translations
                elements.genreFilter.value = appSettings.currentGenre; // Set filter after population
                uiManager.renderGames(); 
            } else {
                 utils.showToast(currentTranslations.error_loading_games_data || "Could not load game data.", "error");
                 elements.gameListContainer.innerHTML = `<p>${currentTranslations.error_loading_games_data || "Could not load game data. Please check games.json and try again."}</p>`;
            }
            
            lazyLoadManager.init(); // Initialize observer
            lazyLoadManager.observe(); // Initial observation
            
            setupEventListeners(); // Setup event listeners after everything is ready
            utils.showLoading(false);
        }
    };

    // --- Start the App ---
    app.init();

})()
