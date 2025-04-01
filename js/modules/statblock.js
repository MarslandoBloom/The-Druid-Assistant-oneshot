/**
 * Statblock Tab Module
 * Manages the statblock tab functionality and interactions
 */
const StatblockModule = (function() {
    // Private variables
    let beastListElement;
    let beastList = [];
    let filteredList = [];
    let selectedBeastId = null;
    let loadingIndicator;
    let isLoading = false;
    let lastScrollPosition = 0;
    let virtualListContainer;
    let virtualListContent;
    let favoritesListElement;
    // History-related variables removed
    
    // Virtual list settings
    const ITEM_HEIGHT = 44; // Height of each beast item in pixels
    const VISIBLE_PADDING = 5; // Number of items to render above and below visible area
    
    /**
     * Initialize the statblock module
     */
    const init = function() {
        console.log('Initializing statblock module...');
        // Cache DOM elements
        beastListElement = document.getElementById('beast-list');
        favoritesListElement = document.getElementById('favorites-list');
        
        // Create loading indicator
        createLoadingIndicator();
        
        // Set up virtual list
        setupVirtualList();
        
        // Subscribe to events - IMPORTANT: We don't subscribe to DATA_LOAD_COMPLETE to avoid infinite loops
        EventManager.subscribe('database:ready', loadBeasts);
        EventManager.subscribe('search:performed', handleSearch);
        EventManager.subscribe('filter:changed', handleFilterChange);
        EventManager.subscribe('favorite:added', updateFavoritesList);
        EventManager.subscribe('favorite:removed', updateFavoritesList);
        EventManager.subscribe('tab:changed', handleTabChange);
        
        // The critical subscription for beast import
        EventManager.subscribe(EventManager.EVENTS.DATA_IMPORTED, function(data) {
            console.log('StatblockModule received DATA_IMPORTED event:', data);
            if (data.type === 'beasts') {
                console.log('Loading beasts after import...');
                loadBeasts();
            }
        });
        
        // If database is already connected, load beasts
        if (Database.isConnected()) {
            loadBeasts();
        }
        
        // URL hash navigation removed
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Recently viewed beasts functionality removed
        
        console.log('Statblock module initialized');
    };
    
    /**
     * Set up keyboard shortcuts for navigation
     */
    const setupKeyboardShortcuts = function() {
        document.addEventListener('keydown', function(event) {
            // Only process when statblock tab is active
            const statblockTab = document.getElementById('statblock-tab');
            if (!statblockTab || !statblockTab.classList.contains('active')) return;
            
            // Handle navigation keys
            switch(event.key) {
                case 'ArrowUp':
                    navigateBeastList(-1);
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    navigateBeastList(1);
                    event.preventDefault();
                    break;
                case 'PageUp':
                    navigateBeastList(-10);
                    event.preventDefault();
                    break;
                case 'PageDown':
                    navigateBeastList(10);
                    event.preventDefault();
                    break;
                case 'Home':
                    navigateBeastList('first');
                    event.preventDefault();
                    break;
                case 'End':
                    navigateBeastList('last');
                    event.preventDefault();
                    break;
                // History navigation keyboard shortcuts removed
                case 'f':
                    // Toggle favorite with Alt+F
                    if (event.altKey && selectedBeastId) {
                        toggleFavorite(selectedBeastId);
                        event.preventDefault();
                    }
                    break;
                case 'w':
                    // Wildshape with Alt+W
                    if (event.altKey && selectedBeastId) {
                        switchToWildshape();
                        event.preventDefault();
                    }
                    break;
                case 'c':
                    // Conjure with Alt+C
                    if (event.altKey && selectedBeastId) {
                        switchToConjure();
                        event.preventDefault();
                    }
                    break;
            }
        });
    };
    
    /**
     * Navigate the beast list by a relative number of items
     * @param {number|string} delta - Number of items to move, or 'first'/'last'
     */
    const navigateBeastList = function(delta) {
        if (filteredList.length === 0) return;
        
        let index;
        
        if (delta === 'first') {
            index = 0;
        } else if (delta === 'last') {
            index = filteredList.length - 1;
        } else {
            // Find current index
            const currentIndex = selectedBeastId ? 
                filteredList.findIndex(beast => beast.id === selectedBeastId) : -1;
            
            // Calculate new index
            index = currentIndex + delta;
            index = Math.max(0, Math.min(filteredList.length - 1, index));
            
            // If current index not found or unchanged, default to first item
            if (currentIndex === -1 || index === currentIndex) {
                index = delta > 0 ? 0 : filteredList.length - 1;
            }
        }
        
        // Select the beast at the new index
        selectBeast(filteredList[index].id);
        
        // Ensure selected item is visible
        scrollToSelectedBeast();
    };
    
    // History navigation function removed
    
    /**
     * Create loading indicator
     */
    const createLoadingIndicator = function() {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><div>Loading beasts...</div>';
    };
    
    /**
     * Set up virtual list for better performance
     */
    const setupVirtualList = function() {
        try {
            if (!beastListElement) {
                console.error('Beast list element not found');
                return;
            }
            
            // Ensure we have a parent node
            if (!beastListElement.parentNode) {
                console.error('Beast list element has no parent node');
                return;
            }
            
            // Wrap list with virtual list container
            virtualListContainer = document.createElement('div');
            virtualListContainer.className = 'virtual-list';
            virtualListContainer.style.height = '100%';
            
            // Create content container
            virtualListContent = document.createElement('div');
            virtualListContent.className = 'virtual-list-content';
            
            // Replace beast list with virtual list
            beastListElement.parentNode.replaceChild(virtualListContainer, beastListElement);
            virtualListContainer.appendChild(virtualListContent);
            
            // Update beastListElement reference
            beastListElement = virtualListContent;
            
            // Add scroll event listener
            virtualListContainer.addEventListener('scroll', handleScroll);
            
            console.log('Virtual list setup complete');
        } catch (error) {
            console.error('Error setting up virtual list:', error);
            // If virtual list setup fails, try to recover
            beastListElement = document.getElementById('beast-list');
        }
    };
    
    /**
     * Handle scroll event for virtual list
     */
    const handleScroll = function() {
        if (isLoading) return;
        
        const scrollTop = virtualListContainer.scrollTop;
        if (Math.abs(scrollTop - lastScrollPosition) < ITEM_HEIGHT) return;
        
        lastScrollPosition = scrollTop;
        renderVisibleItems();
    };
    
    /**
     * Handle tab change event
     * @param {string} tabId - The ID of the newly active tab
     */
    const handleTabChange = function(tabId) {
        // If switching to statblock tab and we have a selection, ensure it's visible
        if (tabId === 'statblock-tab' && selectedBeastId) {
            // Defer scrolling to next tick to ensure DOM is updated
            setTimeout(scrollToSelectedBeast, 0);
        }
    };
    
    // Flag to prevent multiple simultaneous loads
    let isLoadingBeasts = false;
    
    /**
     * Load beasts from database
     */
    const loadBeasts = function() {
        try {
            // Prevent multiple simultaneous loads
            if (isLoadingBeasts) {
                console.log('StatblockModule: Already loading beasts, skipping duplicate call...');
                return;
            }
            
            isLoadingBeasts = true;
            console.log('StatblockModule: Loading beasts from database...');
            showLoading();
            
            if (typeof BeastStore === 'undefined') {
                console.error('StatblockModule: BeastStore is not defined');
                showEmptyState('Error: BeastStore is not available. Please reload the page.');
                hideLoading();
                isLoadingBeasts = false;
                return;
            }
            
            BeastStore.getAllBeasts().then(beasts => {
                try {
                    console.log(`StatblockModule: Loaded ${beasts ? beasts.length : 0} beasts from database`);
                    beastList = beasts || [];
                    
                    if (beastList.length === 0) {
                        console.warn('StatblockModule: No beasts loaded from database');
                        showEmptyState('No beasts found in the database. Try importing beast data.');
                        hideLoading();
                        isLoadingBeasts = false;
                        return;
                    }
                    
                    if (beastList.length > 0) {
                        console.log('StatblockModule: Sample beast data:', beastList[0]);
                    }
                    
                    // Sort by CR (highest to lowest) by default
                    try {
                        beastList.sort((a, b) => {
                            try {
                                const crA = parseFloat(a.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                                const crB = parseFloat(b.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                                return crB - crA;
                            } catch (sortError) {
                                console.error('StatblockModule: Error sorting beast items:', sortError);
                                return 0; // Keep order unchanged if error
                            }
                        });
                    } catch (sortingError) {
                        console.error('StatblockModule: Error during beast list sorting:', sortingError);
                    }
                    
                    // Apply initial filters
                    console.log('StatblockModule: Applying filters...');
                    try {
                        // Check if FiltersComponent exists
                        const filters = typeof FiltersComponent !== 'undefined' ? 
                            FiltersComponent.getFilters() : null;
                        applyFilters(filters);
                        console.log(`StatblockModule: After filtering: ${filteredList.length} beasts`);
                    } catch (filterError) {
                        console.error('StatblockModule: Error applying filters:', filterError);
                        filteredList = [...beastList]; // Use all beasts if filters fail
                    }
                    
                    // Update favorites list
                    try {
                        updateFavoritesList();
                    } catch (error) {
                        console.error('StatblockModule: Error updating favorites list:', error);
                    }
                    
                    // Recently viewed functionality removed
                    
                    // Render the beast list
                    try {
                        console.log('StatblockModule: Rendering beast list...');
                        renderBeastList();
                        console.log('StatblockModule: Beast list rendered successfully');
                    } catch (renderError) {
                        console.error('StatblockModule: Error rendering beast list:', renderError);
                        showEmptyState('Error rendering beast list. See console for details.');
                    }
                    
                    hideLoading();
                    // Reset loading flag
                    isLoadingBeasts = false;
                } catch (processingError) {
                    console.error('StatblockModule: Error processing beast data:', processingError);
                    showEmptyState('Error processing beast data. Please check console for details.');
                    hideLoading();
                    isLoadingBeasts = false;
                }
            }).catch(error => {
                console.error('StatblockModule: Error loading beasts:', error);
                showEmptyState('Error loading beasts. Please try reloading the page.');
                hideLoading();
                isLoadingBeasts = false;
            });
        } catch (criticalError) {
            console.error('StatblockModule: Critical error in loadBeasts:', criticalError);
            try {
                showEmptyState('A critical error occurred. Please reload the page.');
                hideLoading();
            } catch (e) {
                console.error('StatblockModule: Failed to show error state:', e);
            }
            isLoadingBeasts = false;
        }
    };
    
    /**
     * Show loading indicator
     */
    const showLoading = function() {
        isLoading = true;
        
        if (beastListElement && loadingIndicator && !beastListElement.contains(loadingIndicator)) {
            beastListElement.innerHTML = '';
            beastListElement.appendChild(loadingIndicator);
        }
    };
    
    /**
     * Hide loading indicator
     */
    const hideLoading = function() {
        isLoading = false;
        
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
    };
    
    /**
     * Show empty state message
     * @param {string} message - The message to display
     */
    const showEmptyState = function(message) {
        if (beastListElement) {
            beastListElement.innerHTML = `<div class="empty-state">${message}</div>`;
        }
    };
    
    /**
     * Handle search event
     * @param {string} query - The search query
     */
    const handleSearch = function(query) {
        // Apply current filters and search
        applyFiltersAndSearch(FiltersComponent.getFilters(), query);
    };
    
    /**
     * Handle filter change event
     * @param {Object} filters - The new filters
     */
    const handleFilterChange = function(filters) {
        // Apply new filters with current search query
        applyFiltersAndSearch(filters, SearchBarComponent.getSearchQuery());
    };
    
    /**
     * Apply filters and search query
     * @param {Object} filters - The filters to apply
     * @param {string} searchQuery - The search query
     */
    const applyFiltersAndSearch = function(filters, searchQuery) {
        // Apply filters first
        applyFilters(filters);
        
        // Then apply search if there's a query
        if (searchQuery) {
            applySearch(searchQuery);
        }
        
        // Render the filtered list
        renderBeastList();
    };
    
    /**
     * Apply filters to the beast list
     * @param {Object} filters - The filters to apply
     */
    const applyFilters = function(filters) {
        console.log('Applying filters to beast list...');
        if (!filters) {
            console.log('No filters provided, using all beasts');
            filteredList = [...beastList];
            return;
        }
        
        try {
            // Check if FiltersComponent is available
            if (typeof FiltersComponent !== 'undefined' && FiltersComponent.filterBeast) {
                console.log('Using FiltersComponent.filterBeast');
                filteredList = beastList.filter(beast => FiltersComponent.filterBeast(beast));
            } else {
                // Fallback to basic filtering if FiltersComponent is not available
                console.log('FiltersComponent not available, using basic filtering');
                filteredList = beastList.filter(beast => {
                    // Basic CR filtering
                    if (filters.cr) {
                        const beastCR = parseCR(beast.cr);
                        if (beastCR < filters.cr.min || beastCR > filters.cr.max) {
                            return false;
                        }
                    }
                    
                    // Basic size filtering
                    if (filters.size && filters.size.length > 0) {
                        if (!filters.size.includes(beast.size)) {
                            return false;
                        }
                    }
                    
                    return true;
                });
            }
        } catch (error) {
            console.error('Error during filtering:', error);
            filteredList = [...beastList]; // Use all beasts if filtering fails
        }
        
        console.log(`After filtering: ${filteredList.length} beasts remaining`);
    };
    
    /**
     * Apply search to the filtered beast list
     * @param {string|Object} query - The search query or query object
     */
    const applySearch = function(query) {
        if (!query) return;
        
        // Handle both string queries and object format from EventManager
        const queryText = typeof query === 'string' ? query : (query.term || '');
        if (!queryText) return;
        
        const queryLower = queryText.toLowerCase();
        
        filteredList = filteredList.filter(beast => {
            // Search by name
            if (beast.name.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Search by type
            if (beast.type.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Search by CR
            if (beast.cr.toString().includes(queryLower)) {
                return true;
            }
            
            // Search by size
            if (beast.size.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Search in traits and actions
            if (beast.traits && beast.traits.some(trait => 
                trait.name.toLowerCase().includes(queryLower) || 
                trait.description.toLowerCase().includes(queryLower)
            )) {
                return true;
            }
            
            if (beast.actions && beast.actions.some(action => 
                action.name.toLowerCase().includes(queryLower) || 
                action.description.toLowerCase().includes(queryLower)
            )) {
                return true;
            }
            
            // Search in environment (if present)
            if (beast.environment && beast.environment.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            return false;
        });
    };
    
    /**
     * Render the beast list
     */
    const renderBeastList = function() {
        if (!beastListElement) {
            console.error('Beast list element not found');
            return;
        }
        
        console.log('Starting beast list rendering...');
        
        // Clear list
        beastListElement.innerHTML = '';
        
        if (filteredList.length === 0) {
            showEmptyState('No beasts found matching current filters and search.');
            return;
        }
                
        // Render all beasts directly
        renderVisibleItems();
        
        // If there's a selected beast, scroll to it
        if (selectedBeastId) {
            scrollToSelectedBeast();
        }
        
        // Update or add result count at the top of sidebar
        // First, remove any existing result count element to avoid duplicates
        const existingResultCount = document.querySelector('.result-count');
        if (existingResultCount) {
            existingResultCount.remove();
        }
        
        // Get sidebar element (parent of virtual list container's parent)
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        // Create and insert result count at the right position
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.textContent = `${filteredList.length} beasts found`;
        
        // Insert after the filter container
        const filterContainer = document.querySelector('.filter-container');
        if (filterContainer && filterContainer.nextSibling) {
            sidebar.insertBefore(resultCount, filterContainer.nextSibling);
        } else {
            sidebar.appendChild(resultCount);
        }
        
        console.log('Beast list rendering complete');
    };
    
    /**
     * Render all beast items directly
     */
    const renderVisibleItems = function() {
        if (!virtualListContainer || !virtualListContent || filteredList.length === 0) {
            console.warn('Cannot render items - missing container, content, or empty list');
            return;
        }
        
        // For debugging, let's render ALL beasts directly without virtual scrolling
        console.log(`Rendering ${filteredList.length} beast items in list`);
        
        // Clear existing items
        virtualListContent.innerHTML = '';
        
        // Render all items directly instead of using virtual scrolling
        for (let i = 0; i < filteredList.length; i++) {
            const beast = filteredList[i];
            const beastItem = createBeastItem(beast);
            
            // Use normal flow positioning instead of absolute positioning
            beastItem.style.position = 'relative';
            beastItem.style.margin = '8px';
            
            virtualListContent.appendChild(beastItem);
            
            // If this is the selected beast, mark it as selected
            if (beast.id === selectedBeastId) {
                beastItem.classList.add('selected');
            }
            
            // Log the first few items for debugging
            if (i < 3) {
                console.log(`Added beast item: ${beast.name} (${beast.id})`);
            }
        }
        
        console.log('Finished rendering beast list');
    };
    
    /**
     * Create a beast list item element
     * @param {Object} beast - The beast data
     * @returns {HTMLElement} The beast item element
     */
    const createBeastItem = function(beast) {
        if (!beast || !beast.id) {
            console.error('Invalid beast data:', beast);
            return document.createElement('div');
        }
        
        const beastItem = document.createElement('div');
        beastItem.className = 'beast-item';
        beastItem.dataset.id = beast.id;
        
        // Create left content (name and type/size)
        const leftContent = document.createElement('div');
        leftContent.className = 'beast-item-left';
        
        // Beast name
        const beastName = document.createElement('div');
        beastName.className = 'beast-name';
        beastName.textContent = beast.name;
        
        // Beast size and type (smaller text)
        const beastType = document.createElement('div');
        beastType.className = 'beast-type';
        beastType.textContent = `${beast.size} ${beast.type}`;
        
        leftContent.appendChild(beastName);
        leftContent.appendChild(beastType);
        
        // Create right content (CR and favorite button)
        const rightContent = document.createElement('div');
        rightContent.className = 'beast-item-right';
        
        // Beast CR
        const beastCr = document.createElement('div');
        beastCr.className = 'beast-cr';
        beastCr.textContent = `CR ${beast.cr}`;
        
        // Add quick favorite toggle
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-button';
        favoriteBtn.innerHTML = '★';
        favoriteBtn.title = 'Add to favorites';
        favoriteBtn.setAttribute('aria-label', 'Toggle favorite');
        
        // Check favorite status and update button - but don't break if it fails
        try {
            UserStore.isFavorite(beast.id).then(isFavorite => {
                try {
                    if (isFavorite) {
                        beastItem.classList.add('favorite');
                        favoriteBtn.classList.add('active');
                        favoriteBtn.title = 'Remove from favorites';
                    }
                } catch (error) {
                    console.warn('Error updating favorite UI:', error);
                }
            }).catch(error => {
                console.warn('Error checking favorite status:', error);
            });
        } catch (error) {
            console.warn('Error in favorite check:', error);
        }
        
        // Add favorite button event
        favoriteBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent beast selection
            toggleFavorite(beast.id);
        });
        
        rightContent.appendChild(beastCr);
        rightContent.appendChild(favoriteBtn);
        
        // Add to item
        beastItem.appendChild(leftContent);
        beastItem.appendChild(rightContent);
        
        // Add click handler for beast selection
        beastItem.addEventListener('click', function() {
            selectBeast(beast.id);
        });
        
        // Add double-click handler for wildshape
        beastItem.addEventListener('dblclick', function() {
            selectBeast(beast.id);
            switchToWildshape();
        });
        
        // Add right-click contextmenu
        beastItem.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            showBeastContextMenu(event, beast);
        });
        
        return beastItem;
    };
    
    /**
     * Show context menu for a beast
     * @param {Event} event - The triggering event
     * @param {Object} beast - The beast data
     */
    const showBeastContextMenu = function(event, beast) {
        // First select the beast
        selectBeast(beast.id);
        
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        // Calculate CR-dependent actions
        const cr = parseFloat(beast.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
        const canWildshape = cr <= 1; // Standard druid wildshape limit
        const canConjure = cr <= 2; // Conjure Animals limit
        
        // Check favorite status
        UserStore.isFavorite(beast.id).then(isFavorite => {
            // Add menu items
            const menuItems = [
                {
                    text: canWildshape ? 'Wildshape into this Beast' : 'Wildshape (CR too high)',
                    handler: canWildshape ? switchToWildshape : null,
                    disabled: !canWildshape
                },
                {
                    text: canConjure ? 'Conjure this Beast' : 'Conjure (CR too high)',
                    handler: canConjure ? switchToConjure : null,
                    disabled: !canConjure
                },
                {
                    text: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
                    handler: () => toggleFavorite(beast.id)
                },
                {
                    text: 'Copy Beast Name',
                    handler: () => navigator.clipboard.writeText(beast.name)
                }
            ];
            
            // Create menu items
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                if (item.disabled) menuItem.classList.add('disabled');
                menuItem.textContent = item.text;
                
                if (item.handler && !item.disabled) {
                    menuItem.addEventListener('click', () => {
                        item.handler();
                        removeContextMenu();
                    });
                }
                
                menu.appendChild(menuItem);
            });
            
            // Add to document
            document.body.appendChild(menu);
            
            // Handle closing the menu
            const removeContextMenu = () => {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
                document.removeEventListener('click', removeContextMenu);
                document.removeEventListener('contextmenu', removeContextMenu);
            };
            
            // Close on any click or another context menu
            setTimeout(() => {
                document.addEventListener('click', removeContextMenu);
                document.addEventListener('contextmenu', removeContextMenu);
            }, 0);
        });
    };
    
    /**
     * Parse CR string to numeric value
     * @param {string} cr - CR string (e.g., '1/4', '1/2', '2')
     * @returns {number} Numeric CR value
     */
    const parseCR = function(cr) {
        if (typeof cr === 'number') return cr;
        
        // Handle fractions
        if (cr === '1/8') return 0.125;
        if (cr === '1/4') return 0.25;
        if (cr === '1/2') return 0.5;
        
        // Handle numeric strings
        return parseFloat(cr);
    };
    
    /**
     * Toggle favorite status for a beast
     * @param {string} beastId - The beast ID to toggle
     */
    const toggleFavorite = function(beastId) {
        if (!beastId) return;
        
        // Get the beast data
        const beast = beastList.find(b => b.id === beastId);
        if (!beast) return;
        
        UserStore.isFavorite(beastId).then(isFavorite => {
            if (isFavorite) {
                // Remove from favorites
                UserStore.removeFavorite(beastId).then(() => {
                    // Update favorites list
                    updateFavoritesList();
                    
                    // Update the beast item in the list if visible
                    updateBeastItemFavoriteStatus(beastId, false);
                    
                    // Update favorite button in the statblock if this is the selected beast
                    if (beastId === selectedBeastId) {
                        const favoriteButton = document.getElementById('favorite-button');
                        if (favoriteButton) {
                            favoriteButton.textContent = 'Add to Favorites';
                            favoriteButton.classList.remove('active');
                        }
                    }
                    
                    // Notify user
                    UIUtils.showNotification(`Removed ${beast.name} from favorites`, 'info');
                    
                    // Publish event
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, beast);
                });
            } else {
                // Add to favorites
                UserStore.addFavorite(beastId).then(() => {
                    // Update favorites list
                    updateFavoritesList();
                    
                    // Update the beast item in the list if visible
                    updateBeastItemFavoriteStatus(beastId, true);
                    
                    // Update favorite button in the statblock if this is the selected beast
                    if (beastId === selectedBeastId) {
                        const favoriteButton = document.getElementById('favorite-button');
                        if (favoriteButton) {
                            favoriteButton.textContent = 'Remove from Favorites';
                            favoriteButton.classList.add('active');
                        }
                    }
                    
                    // Notify user
                    UIUtils.showNotification(`Added ${beast.name} to favorites`, 'success');
                    
                    // Publish event
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, beast);
                });
            }
        });
    };
    
    /**
     * Update favorite status in the UI for a beast item
     * @param {string} beastId - The beast ID
     * @param {boolean} isFavorite - Whether the beast is favorited
     */
    const updateBeastItemFavoriteStatus = function(beastId, isFavorite) {
        // Find beast item in the visible list
        const beastItem = beastListElement.querySelector(`.beast-item[data-id="${beastId}"]`);
        
        if (beastItem) {
            // Update the item's favorite class
            if (isFavorite) {
                beastItem.classList.add('favorite');
            } else {
                beastItem.classList.remove('favorite');
            }
            
            // Update the favorite button
            const favoriteBtn = beastItem.querySelector('.favorite-button');
            if (favoriteBtn) {
                if (isFavorite) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.title = 'Remove from favorites';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.title = 'Add to favorites';
                }
            }
        }
    };
    
    /**
     * Switch to wildshape tab with current beast
     */
    const switchToWildshape = function() {
        // Check if we have a selected beast
        if (!selectedBeastId) return;
        
        // Get the beast data
        const beast = beastList.find(beast => beast.id === selectedBeastId);
        if (!beast) return;
        
        // Check CR limitations (standard Druid wildshape)
        const cr = parseFloat(beast.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
        if (cr > 1) {
            UIUtils.showNotification(`${beast.name} (CR ${beast.cr}) exceeds Wildshape CR limit of 1`, 'warning');
            return;
        }
        
        // Publish event to switch to wildshape tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'wildshape-tab' });
        EventManager.publish('wildshape:start', beast);
    };
    
    /**
     * Switch to conjure animals tab with current beast
     */
    const switchToConjure = function() {
        // Check if we have a selected beast
        if (!selectedBeastId) return;
        
        // Get the beast data
        const beast = beastList.find(beast => beast.id === selectedBeastId);
        if (!beast) return;
        
        // Check CR limitations for Conjure Animals
        const cr = parseFloat(beast.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
        if (cr > 2) {
            UIUtils.showNotification(`${beast.name} (CR ${beast.cr}) exceeds Conjure Animals CR limit of 2`, 'warning');
            return;
        }
        
        // Publish event to switch to conjure tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'conjure-tab' });
        EventManager.publish('conjure:start', beast);
    };
    
    /**
     * Select a beast by ID
     * @param {string} beastId - The ID of the beast to select
     */
    const selectBeast = function(beastId) {
        try {
            console.log('StatblockModule: Selecting beast with ID:', beastId);
            
            // Don't reselect the same beast
            if (beastId === selectedBeastId) {
                console.log('StatblockModule: Beast already selected, skipping');
                return;
            }
            
            // Find the beast in the list
            const beast = beastList.find(beast => beast.id === beastId);
            if (!beast) {
                console.error('StatblockModule: Cannot find beast with ID:', beastId);
                return;
            }
            
            console.log('StatblockModule: Found beast:', beast.name);
            
            // Selection history tracking removed
            
            try {
                // Perform the actual selection
                console.log('StatblockModule: Performing beast selection');
                selectBeastWithoutHistory(beastId);
            } catch (selectionError) {
                console.error('StatblockModule: Error in selectBeastWithoutHistory:', selectionError);
                throw selectionError; // Re-throw to outer handler
            }
            
            // Recently viewed functionality removed
            
            console.log('StatblockModule: Beast selection completed successfully');
        } catch (error) {
            console.error('StatblockModule: Critical error in selectBeast:', error);
        }
    };
    
    /**
     * Select a beast without affecting history (used for history navigation)
     * @param {string} beastId - The ID of the beast to select
     */
    const selectBeastWithoutHistory = function(beastId) {
        try {
            console.log('StatblockModule: Selecting beast without history update:', beastId);
            
            // Check if beastListElement exists
            if (!beastListElement) {
                console.error('StatblockModule: beastListElement is not defined');
                return;
            }
            
            // Deselect currently selected beast
            try {
                const currentlySelected = beastListElement.querySelector('.beast-item.selected');
                if (currentlySelected) {
                    currentlySelected.classList.remove('selected');
                }
            } catch (deselectError) {
                console.error('StatblockModule: Error deselecting current beast:', deselectError);
                // Continue even if deselection fails
            }
            
            // Select new beast
            try {
                const beastItem = beastListElement.querySelector(`.beast-item[data-id="${beastId}"]`);
                if (beastItem) {
                    beastItem.classList.add('selected');
                    console.log('StatblockModule: Added selected class to beast item');
                } else {
                    console.warn(`StatblockModule: Could not find beast item with ID: ${beastId}`);
                }
            } catch (selectError) {
                console.error('StatblockModule: Error selecting beast item:', selectError);
                // Continue even if selection UI fails
            }
            
            // Update selected beast ID
            selectedBeastId = beastId;
            
            // URL hash update removed
            
            // Find the beast in the list
            const beast = beastList.find(beast => beast.id === beastId);
            if (!beast) {
                console.error(`StatblockModule: Could not find beast with ID ${beastId} in beast list`);
                return;
            }
            
            console.log('StatblockModule: Found beast for publishing:', beast.name);
            
            // Create a clean copy of the beast to avoid any reference issues
            try {
                const beastCopy = JSON.parse(JSON.stringify(beast));
                console.log('StatblockModule: Publishing BEAST_SELECTED event with beast data');
                
                // Check if EventManager exists
                if (typeof EventManager === 'undefined') {
                    console.error('StatblockModule: EventManager is not defined');
                    return;
                }
                
                // Publish beast selected event
                EventManager.publish(EventManager.EVENTS.BEAST_SELECTED, beastCopy);
                console.log('StatblockModule: BEAST_SELECTED event published successfully');
            } catch (publishError) {
                console.error('StatblockModule: Error publishing beast selected event:', publishError);
            }
        } catch (error) {
            console.error('StatblockModule: Critical error in selectBeastWithoutHistory:', error);
        }
    };
    
    // Recently viewed functions removed
    
    /**
     * Scroll to the selected beast in the list
     */
    const scrollToSelectedBeast = function() {
        if (!virtualListContainer || !selectedBeastId) return;
        
        // Find the index of the selected beast in the filtered list
        const index = filteredList.findIndex(beast => beast.id === selectedBeastId);
        if (index === -1) return;
        
        // Calculate scroll position (center the item in the viewport)
        const scrollTop = index * ITEM_HEIGHT - (virtualListContainer.clientHeight / 2) + (ITEM_HEIGHT / 2);
        
        // Scroll to the position
        virtualListContainer.scrollTop = Math.max(0, scrollTop);
    };
    
    /**
     * Update the favorites list
     */
    const updateFavoritesList = function() {
        if (!favoritesListElement) return;
        
        try {
            // Get all favorites
            UserStore.getFavorites().then(favorites => {
                try {
                    // Clear the list
                    favoritesListElement.innerHTML = '';
                    
                    if (!favorites || favorites.length === 0) {
                        favoritesListElement.innerHTML = '<div class="list-empty">No favorites yet</div>';
                        return;
                    }
                    
                    // Find the favorite beasts in the beast list
                    const favoriteBeasts = [];
                    for (const favoriteId of favorites) {
                        const beast = beastList.find(beast => beast.id === favoriteId);
                        if (beast) {
                            favoriteBeasts.push(beast);
                        }
                    }
                    
                    // Sort by name
                    favoriteBeasts.sort((a, b) => a.name.localeCompare(b.name));
                    
                    // Create favorite items
                    favoriteBeasts.forEach(beast => {
                        const favoriteItem = document.createElement('div');
                        favoriteItem.className = 'favorite-item';
                        
                        // More complex structure for favorite items
                        const nameElement = document.createElement('span');
                        nameElement.className = 'favorite-name';
                        nameElement.textContent = beast.name;
                        
                        const crElement = document.createElement('span');
                        crElement.className = 'favorite-cr';
                        crElement.textContent = `CR ${beast.cr}`;
                        
                        // Action buttons for quick access
                        const actionButtons = document.createElement('div');
                        actionButtons.className = 'favorite-actions';
                        
                        // Calculate beast CR to determine valid actions
                        const cr = parseFloat(beast.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                        
                        // Wildshape button (only for CR <= 1)
                        if (cr <= 1) {
                            const wildshapeBtn = document.createElement('button');
                            wildshapeBtn.className = 'favorite-action wildshape-action';
                            wildshapeBtn.title = 'Wildshape into this beast';
                            wildshapeBtn.textContent = 'W';
                            wildshapeBtn.setAttribute('aria-label', 'Wildshape');
                            
                            wildshapeBtn.addEventListener('click', function(event) {
                                event.stopPropagation();
                                selectBeast(beast.id);
                                switchToWildshape();
                            });
                            
                            actionButtons.appendChild(wildshapeBtn);
                        }
                        
                        // Conjure button (only for CR <= 2)
                        if (cr <= 2) {
                            const conjureBtn = document.createElement('button');
                            conjureBtn.className = 'favorite-action conjure-action';
                            conjureBtn.title = 'Conjure this beast';
                            conjureBtn.textContent = 'C';
                            conjureBtn.setAttribute('aria-label', 'Conjure');
                            
                            conjureBtn.addEventListener('click', function(event) {
                                event.stopPropagation();
                                selectBeast(beast.id);
                                switchToConjure();
                            });
                            
                            actionButtons.appendChild(conjureBtn);
                        }
                        
                        // Remove button
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'favorite-action remove-action';
                        removeBtn.title = 'Remove from favorites';
                        removeBtn.textContent = '×';
                        removeBtn.setAttribute('aria-label', 'Remove from favorites');
                        
                        removeBtn.addEventListener('click', function(event) {
                            event.stopPropagation();
                            toggleFavorite(beast.id);
                        });
                        
                        actionButtons.appendChild(removeBtn);
                        
                        // Add main click handler for selection
                        favoriteItem.addEventListener('click', function() {
                            selectBeast(beast.id);
                        });
                        
                        // Add all parts to the favorite item
                        favoriteItem.appendChild(nameElement);
                        favoriteItem.appendChild(crElement);
                        favoriteItem.appendChild(actionButtons);
                        
                        favoritesListElement.appendChild(favoriteItem);
                    });
                } catch (innerError) {
                    console.error('Error updating favorites UI:', innerError);
                    // Show a simpler fallback UI if there's an error
                    favoritesListElement.innerHTML = '<div class="list-empty">Error displaying favorites</div>';
                }
            }).catch(error => {
                console.error('Error getting favorites:', error);
                favoritesListElement.innerHTML = '<div class="list-empty">Error loading favorites</div>';
            });
        } catch (error) {
            console.error('Critical error in updateFavoritesList:', error);
        }
    };
    
    // URL hash functions removed
    
    /**
     * Get a beast by ID
     * @param {string} beastId - The ID of the beast to get
     * @returns {Promise<Object>} Promise resolving to the beast object
     */
    const getBeastById = function(beastId) {
        return new Promise((resolve, reject) => {
            const beast = beastList.find(beast => beast.id === beastId);
            if (beast) {
                resolve(beast);
            } else {
                BeastStore.getBeast(beastId)
                    .then(beast => resolve(beast))
                    .catch(error => reject(error));
            }
        });
    };
    
    /**
     * Sort the beast list
     * @param {string} sortBy - Property to sort by ('name', 'cr', 'type', 'size')
     * @param {boolean} ascending - Sort direction (true for ascending, false for descending)
     */
    const sortBeastList = function(sortBy = 'cr', ascending = false) {
        if (beastList.length === 0) return;
        
        switch (sortBy) {
            case 'name':
                beastList.sort((a, b) => {
                    return ascending ? 
                        a.name.localeCompare(b.name) : 
                        b.name.localeCompare(a.name);
                });
                break;
                
            case 'cr':
                beastList.sort((a, b) => {
                    const crA = parseFloat(a.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                    const crB = parseFloat(b.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                    return ascending ? crA - crB : crB - crA;
                });
                break;
                
            case 'type':
                beastList.sort((a, b) => {
                    return ascending ? 
                        a.type.localeCompare(b.type) : 
                        b.type.localeCompare(a.type);
                });
                break;
                
            case 'size':
                // Size order: Tiny, Small, Medium, Large, Huge, Gargantuan
                const sizeOrder = { 'Tiny': 0, 'Small': 1, 'Medium': 2, 'Large': 3, 'Huge': 4, 'Gargantuan': 5 };
                beastList.sort((a, b) => {
                    const sizeA = sizeOrder[a.size] || 0;
                    const sizeB = sizeOrder[b.size] || 0;
                    return ascending ? sizeA - sizeB : sizeB - sizeA;
                });
                break;
        }
        
        // Re-apply current filters and search
        applyFiltersAndSearch(FiltersComponent.getFilters(), SearchBarComponent.getSearchQuery());
    };
    
    /**
     * Get available beast types from the current dataset
     * @returns {string[]} Array of unique beast types
     */
    const getAvailableBeastTypes = function() {
        if (beastList.length === 0) return [];
        
        // Create a Set to eliminate duplicates
        const typesSet = new Set(beastList.map(beast => beast.type));
        
        // Convert Set to Array and sort alphabetically
        return [...typesSet].sort();
    };
    
    /**
     * Get available environments from the current dataset
     * @returns {string[]} Array of unique environments
     */
    // Environment function removed as it's no longer needed
    
    // Public API
    return {
        init,
        getBeastById,
        selectBeast,
        updateFavoritesList,
        sortBeastList,
        getAvailableBeastTypes,
        switchToWildshape,
        switchToConjure
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    StatblockModule.init();
});
