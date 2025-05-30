// =================================================================
//  InstantPlay - Main JavaScript (v4)
// =================================================================
(function() {
    'use strict';

    // --- DOM Elements ---
    const elements = {
        body: document.body,
        html: document.documentElement,
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
        // Modal elements are removed as modal is no longer used for game details
        genreFilter: document.getElementById('genre-filter'),
        sortBy: document.getElementById('sort-by')
    };

    // --- App State ---
    let allGamesData = []; 
    let currentTranslations = {};
    let appSettings = {
        language: 'en',
        darkMode: false,
        favorites: [],
        currentGenre: 'all',
        currentSort: 'name_asc'
    };
    let selectedCard = null; // To keep track of the currently selected game card

    // --- Utilities ---
    const utils = { /* ... (Keep utils object as in previous version) ... */ 
        fetchJson: async (url) => {
            utils.showLoading(true);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                return await response.json();
            } catch (error) {
                console.error("Could not fetch JSON:", error);
                const errorMsg = currentTranslations.fetch_error || `Error fetching data. Check console. (${url})`;
                utils.showToast(errorMsg, 'error');
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
            const closeLabel = currentTranslations.close_button_label || 'Close';
            closeButton.setAttribute('aria-label', closeLabel);
            closeButton.title = closeLabel;

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
    const settingsManager = { /* ... (Keep settingsManager object as in previous version) ... */ 
        load: () => {
            try {
                const saved = localStorage.getItem('instantPlaySettingsV4'); // Use a new key if structure changes significantly
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
            localStorage.setItem('instantPlaySettingsV4', JSON.stringify(appSettings));
        },
        export: () => {
            const settingsJson = JSON.stringify(appSettings, null, 2);
            const blob = new Blob([settingsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'instantplay-settings.json';
            a.click();
            URL.revokeObjectURL(url);
            utils.showToast(currentTranslations.settings_exported_success, 'success');
        },
        import: (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    appSettings.language = imported.language || appSettings.language;
                    appSettings.darkMode = typeof imported.darkMode === 'boolean' ? imported.darkMode : appSettings.darkMode;
                    appSettings.favorites = Array.isArray(imported.favorites) ? imported.favorites : appSettings.favorites;
                    appSettings.currentGenre = imported.currentGenre || 'all';
                    appSettings.currentSort = imported.currentSort || 'name_asc';
                    
                    settingsManager.save();
                    app.init(); 
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
    const uiManager = { /* ... (Keep applyDarkMode, loadTranslations, changeLanguage, populateGenreFilter as in previous version) ... */ 
        applyDarkMode: () => {
            elements.body.classList.toggle('dark-mode', appSettings.darkMode);
            const icon = elements.darkModeToggle.querySelector('i');
            const srLabel = elements.darkModeToggle.querySelector('span.sr-only');
            const title = appSettings.darkMode ? (currentTranslations.light_mode_label || 'Switch to Light Mode') : (currentTranslations.dark_mode_label || 'Switch to Dark Mode');
            
            if (appSettings.darkMode) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
            if(srLabel) srLabel.textContent = title;
            elements.darkModeToggle.title = title;
            elements.darkModeToggle.setAttribute('aria-label', title);
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
                if (currentTranslations[key] !== undefined) {
                    if (el.tagName === 'TITLE') document.title = currentTranslations[key];
                    else el.textContent = currentTranslations[key];
                }
            });
            document.querySelectorAll('[data-translate-placeholder-key]').forEach(el => {
                const key = el.dataset.translatePlaceholderKey;
                if (currentTranslations[key] !== undefined) el.placeholder = currentTranslations[key];
            });
            document.querySelectorAll('[data-translate-aria-label]').forEach(el => {
                const key = el.dataset.translateAriaLabel;
                if (currentTranslations[key] !== undefined) el.setAttribute('aria-label', currentTranslations[key]);
            });
        },
        changeLanguage: (lang) => {
            appSettings.language = lang;
            elements.html.lang = lang;
            elements.html.dir = lang === 'fa' ? 'rtl' : 'ltr';
            settingsManager.save();
            uiManager.loadTranslations().then(() => {
                uiManager.populateGenreFilter();
                uiManager.renderGames();
                uiManager.applyDarkMode(); 
            });
        },
        populateGenreFilter: () => {
            if (!elements.genreFilter || !allGamesData) return;
            const lang = appSettings.language;
            const genres = [...new Set(allGamesData.map(g => lang === 'fa' ? g.genre_fa : g.genre_en).filter(Boolean))];
            genres.sort((a, b) => a.localeCompare(b, lang)); 
            
            elements.genreFilter.innerHTML = `<option value="all">${currentTranslations.all_genres || "All Genres"}</option>`;
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre; 
                option.textContent = genre;
                elements.genreFilter.appendChild(option);
            });
            elements.genreFilter.value = appSettings.currentGenre;
        },

        createGameCard: (game) => {
            const card = document.createElement('article');
            card.className = 'game-card';
            card.dataset.gameId = game.id;
            card.tabIndex = 0; // Make card focusable

            const isFav = appSettings.favorites.includes(game.id);
            const lang = appSettings.language;
            const name = lang === 'fa' ? game.name_fa : game.name_en;
            const favLabel = isFav ? currentTranslations.remove_from_favorites : currentTranslations.add_to_favorites;

            const favButton = document.createElement('button');
            favButton.className = `favorite-button ${isFav ? 'is-favorite' : ''}`;
            favButton.setAttribute('aria-label', favLabel);
            favButton.title = favLabel;
            favButton.innerHTML = `<i class="fas fa-star" aria-hidden="true"></i>`;
            favButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                gameManager.toggleFavorite(game.id);
            });

            // Inner content wrapper (excluding the play button which is now separate)
            const innerContentWrapper = document.createElement('div');
            innerContentWrapper.className = 'game-card-inner-content';

            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'thumbnail-container';
            const thumbnail = document.createElement('img');
            thumbnail.dataset.src = game.thumbnail_url || 'assets/images/default_thumb.png';
            thumbnail.alt = name;
            thumbnail.className = 'thumbnail lazy';
            thumbnail.width = 300; // Intrinsic size for layout
            thumbnail.height = 180;
            thumbnailContainer.appendChild(thumbnail);

            const content = document.createElement('div');
            content.className = 'game-card-content';
            const title = document.createElement('h3');
            title.textContent = name;
            const description = document.createElement('p');
            description.className = 'description';
            description.textContent = lang === 'fa' ? game.description_fa : game.description_en;

            content.appendChild(title);
            content.appendChild(description);
            
            innerContentWrapper.appendChild(thumbnailContainer);
            innerContentWrapper.appendChild(content);

            card.appendChild(favButton);
            card.appendChild(innerContentWrapper);

            // Event listener for card selection
            card.addEventListener('click', () => uiManager.selectCard(card, game));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    uiManager.selectCard(card, game);
                }
            });
            return card;
        },

        selectCard: (cardElement, gameData) => {
            // Remove previous selected state and play button
            if (selectedCard && selectedCard.element) {
                selectedCard.element.classList.remove('selected');
                const oldPlayButtonContainer = selectedCard.element.querySelector('.lets-play-button-container');
                if (oldPlayButtonContainer) {
                    oldPlayButtonContainer.remove();
                }
            }

            // If clicking the same card that's already selected, deselect it
            if (selectedCard && selectedCard.element === cardElement) {
                selectedCard = null;
                return;
            }

            // Set new selected card
            cardElement.classList.add('selected');
            selectedCard = { element: cardElement, data: gameData };

            // Create and append "Let's Play" button
            const playButtonContainer = document.createElement('div');
            playButtonContainer.className = 'lets-play-button-container';

            const playButton = document.createElement('a');
            playButton.className = 'lets-play-button';
            
            // Construct game URL with theme parameter
            const themeParam = appSettings.darkMode ? 'dark' : 'light';
            const gameUrlWithTheme = `${gameData.game_url}${gameData.game_url.includes('?') ? '&' : '?'}theme=${themeParam}`;
            playButton.href = gameUrlWithTheme;

            playButton.target = '_blank'; // Open in new tab
            playButton.rel = 'noopener noreferrer';
            playButton.textContent = currentTranslations.lets_play_button || "Let's Play!";
            playButton.addEventListener('click', (e) => e.stopPropagation()); // Prevent card click from re-triggering

            playButtonContainer.appendChild(playButton);
            cardElement.appendChild(playButtonContainer);
        },

        renderGames: () => { /* ... (Keep renderGames logic mostly as before, but it now calls the new createGameCard) ... */ 
            if (!elements.gameListContainer || !elements.favoritesListContainer) return;
            const filteredAndSortedGames = gameManager.getFilteredAndSortedGames();

            // Deselect card if it's no longer in the filtered list or if lists are cleared
            if (selectedCard && !filteredAndSortedGames.find(g => g.id === selectedCard.data.id)) {
                const oldPlayButtonContainer = selectedCard.element.querySelector('.lets-play-button-container');
                if (oldPlayButtonContainer) oldPlayButtonContainer.remove();
                selectedCard.element.classList.remove('selected');
                selectedCard = null;
            }


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
            
            if (filteredAndSortedGames.length === 0 && (elements.searchInput.value || appSettings.currentGenre !== 'all')) {
                 elements.noGamesMessage.textContent = currentTranslations.no_games_found;
                 elements.noGamesMessage.style.display = 'block';
            } else if (allGamesData.length === 0) {
                 elements.noGamesMessage.textContent = currentTranslations.no_games_available;
                 elements.noGamesMessage.style.display = 'block';
            }
            else {
                elements.noGamesMessage.style.display = 'none';
            }
            
            lazyLoadManager.observe();
        }
        // Modal open/close functions are removed as modal is not used for game details anymore
    };

    // --- Game Logic ---
    const gameManager = { /* ... (Keep getFilteredAndSortedGames and toggleFavorite as in previous version) ... */ 
        getFilteredAndSortedGames: () => {
            const searchTerm = elements.searchInput.value.toLowerCase().trim();
            const lang = appSettings.language;
            const selectedGenre = appSettings.currentGenre; 
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
            uiManager.renderGames(); // Re-render to update UI (star icon and favorite list)
        }
    };

    // --- Lazy Loading ---
    const lazyLoadManager = { /* ... (Keep lazyLoadManager object as in previous version) ... */ 
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
                        img.onload = () => img.classList.remove('lazy'); 
                        img.onerror = () => { 
                            img.classList.remove('lazy'); 
                            img.src = 'assets/images/default_thumb.png'; 
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
    const setupEventListeners = () => { /* ... (Keep setupEventListeners as in previous version, modal listeners are removed) ... */ 
        elements.darkModeToggle.addEventListener('click', uiManager.toggleDarkMode);
        elements.languageSelect.addEventListener('change', (e) => uiManager.changeLanguage(e.target.value));
        
        let searchTimeout;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(uiManager.renderGames, 300); 
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
        
        const importLabel = document.querySelector('.import-button-label');
        if (importLabel) {
            importLabel.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    elements.importInput.click();
                }
            });
        }
        // Remove modal specific event listeners if modal is fully removed
        // elements.modalCloseButton.addEventListener('click', uiManager.closeModal);
        // elements.gameModal.addEventListener('click', (e) => {
        //     if (e.target === elements.gameModal) uiManager.closeModal();
        // });
        // document.addEventListener('keydown', (e) => {
        //      if (e.key === 'Escape' && elements.gameModal.style.display === 'flex') {
        //         uiManager.closeModal();
        //      }
        // });

        // Deselect card if user clicks outside of any card
        document.addEventListener('click', (event) => {
            if (selectedCard && selectedCard.element) {
                const isClickInsideCard = selectedCard.element.contains(event.target);
                const isClickInsidePlayButton = event.target.classList.contains('lets-play-button');
                
                if (!isClickInsideCard && !isClickInsidePlayButton) {
                    selectedCard.element.classList.remove('selected');
                    const playButtonContainer = selectedCard.element.querySelector('.lets-play-button-container');
                    if (playButtonContainer) {
                        playButtonContainer.remove();
                    }
                    selectedCard = null;
                }
            }
        });
    };
    

    // --- App Initialization ---
    const app = { /* ... (Keep app.init as in previous version) ... */ 
        init: async () => {
            utils.showLoading(true);
            settingsManager.load(); 
            
            uiManager.applyDarkMode();
            elements.languageSelect.value = appSettings.language;
            elements.sortBy.value = appSettings.currentSort;
            
            elements.html.lang = appSettings.language;
            elements.html.dir = appSettings.language === 'fa' ? 'rtl' : 'ltr';

            await uiManager.loadTranslations(); 
            allGamesData = await utils.fetchJson('games.json') || [];

            if(allGamesData && allGamesData.length > 0) {
                uiManager.populateGenreFilter(); 
                elements.genreFilter.value = appSettings.currentGenre; 
                uiManager.renderGames(); 
            } else {
                 const errorMsg = currentTranslations.error_loading_games_data || "Could not load game data. Please check games.json.";
                 utils.showToast(errorMsg, "error", 5000);
                 if(elements.gameListContainer) elements.gameListContainer.innerHTML = `<p>${errorMsg}</p>`;
                 elements.noGamesMessage.textContent = currentTranslations.no_games_available;
                 elements.noGamesMessage.style.display = 'block';
            }
            
            lazyLoadManager.init(); 
            lazyLoadManager.observe(); 
            
            setupEventListeners(); 
            utils.showLoading(false);
        }
    };

    // --- Start the App ---
    app.init();

})();
