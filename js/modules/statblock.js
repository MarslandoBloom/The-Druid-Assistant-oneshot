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
    
    // Current view state
    let currentView = 'beasts'; // 'beasts', 'wildshape-favourites', 'conjure-favourites'
    
    // Store expanded CR groups state
    let expandedGroups = {};
    
    // CR Groups definition
    const CR_GROUPS = [
        { name: "CR 0 - 1/8", min: 0, max: 0.125 },
        { name: "CR 1/4", min: 0.25, max: 0.25 },
        { name: "CR 1/2", min: 0.5, max: 0.5 },
        { name: "CR 1", min: 1, max: 1 },
        { name: "CR 2", min: 2, max: 2 },
        { name: "CR 3 - 4", min: 3, max: 4 },
        { name: "CR 5 - 6", min: 5, max: 6 }
    ];
    
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
        
        // Create loading indicator
        createLoadingIndicator();
        
        // Set up virtual list
        setupVirtualList();
        
        // Add favourite buttons to filter container
        addFavouriteButtons();
        
        // Subscribe to events
        EventManager.subscribe('database:ready', loadBeasts);
        EventManager.subscribe('search:performed', handleSearch);
        EventManager.subscribe('filter:changed', handleFilterChange);
        EventManager.subscribe('favorite:added', updateResultCount);
        EventManager.subscribe('favorite:removed', updateResultCount);
        EventManager.subscribe('tab:changed', handleTabChange);
        
        // The critical subscription for beast import
        EventManager.subscribe(EventManager.EVENTS.DATA_IMPORTED, function(data) {
            console.log('StatblockModule received DATA_IMPORTED event:', data);
            if (data.type === 'beasts') {
                console.log('Loading beasts after import...');
                loadBeasts();
            }
        });
        
        // Load expanded groups state
        UserStore.getSetting('statblock.expandedGroups', {}).then(savedGroups => {
            if (savedGroups) {
                expandedGroups = savedGroups;
            }
            
            // If database is already connected, load beasts
            if (Database.isConnected()) {
                loadBeasts();
            }
        });
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        console.log('Statblock module initialized');
    };
    
    /**
     * Add favourite buttons to the filter container
     */
    const addFavouriteButtons = function() {
        // Get the filter container
        const filterContainer = document.querySelector('.filter-container');
        if (!filterContainer) {
            console.error('Filter container not found');
            return;
        }
        
        // Create the favourite buttons container
        const favouriteButtonsContainer = document.createElement('div');
        favouriteButtonsContainer.className = 'favorite-buttons-container';
        
        // Add the wildshape favourites button
        const wildshapeFavouritesBtn = document.createElement('button');
        wildshapeFavouritesBtn.id = 'wildshape-favourites-btn';
        wildshapeFavouritesBtn.className = 'favorite-category-button';
        wildshapeFavouritesBtn.textContent = 'Wildshape Favourites';
        wildshapeFavouritesBtn.addEventListener('click', () => {
            showFavourites('wildshape');
        });
        
        // Add the conjure favourites button
        const conjureFavouritesBtn = document.createElement('button');
        conjureFavouritesBtn.id = 'conjure-favourites-btn';
        conjureFavouritesBtn.className = 'favorite-category-button';
        conjureFavouritesBtn.textContent = 'Conjure Favourites';
        conjureFavouritesBtn.addEventListener('click', () => {
            showFavourites('conjure');
        });
        
        // Add buttons to container
        favouriteButtonsContainer.appendChild(wildshapeFavouritesBtn);
        favouriteButtonsContainer.appendChild(conjureFavouritesBtn);
        
        // Insert after the filter container
        filterContainer.insertAdjacentElement('afterend', favouriteButtonsContainer);
    };
    
    /**
     * Show favourites list based on type
     * @param {string} type - Type of favourites to show ('wildshape' or 'conjure')
     */
    const showFavourites = function(type) {
        // Save current expanded groups state before switching view
        if (currentView === 'beasts') {
            const currentGroups = document.querySelectorAll('.cr-group');
            currentGroups.forEach(group => {
                const groupName = group.dataset.group;
                if (groupName) {
                    expandedGroups[groupName] = !group.classList.contains('collapsed');
                }
            });
            UserStore.setSetting('statblock.expandedGroups', expandedGroups);
        }
        
        // Update current view
        currentView = `${type}-favourites`;
        
        // Get type-specific favourites
        UserStore.getFavouritesByType(type).then(favourites => {
            // Clear list
            virtualListContent.innerHTML = '';
            
            // Add return button - always show this regardless of whether there are favourites
            const returnBtn = document.createElement('button');
            returnBtn.id = 'return-to-beasts-btn';
            returnBtn.className = 'return-button';
            returnBtn.textContent = 'Return to Beasts';
            returnBtn.setAttribute('data-type', type);
            returnBtn.addEventListener('click', () => {
                showBeasts();
            });
            
            virtualListContent.appendChild(returnBtn);
            
            if (!favourites || favourites.length === 0) {
                // If no favourites, show empty message
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = `No favourites yet`;
                virtualListContent.appendChild(emptyState);
                return;
            }
            
            // Find the favourite beasts in the beast list
            let favouriteBeasts = [];
            for (const favouriteId of favourites) {
                const beast = beastList.find(beast => beast.id === favouriteId);
                if (beast) {
                    favouriteBeasts.push(beast);
                }
            }
            
            // Sort by name
            favouriteBeasts.sort((a, b) => a.name.localeCompare(b.name));
            
            if (favouriteBeasts.length === 0) {
                // If no matching favourites, show empty message
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = `No favourites found`;
                virtualListContent.appendChild(emptyState);
                return;
            }
            
            // Create a flat list of favourites - without CR filtering
            favouriteBeasts.forEach(beast => {
                const beastItem = createBeastItem(beast);
                virtualListContent.appendChild(beastItem);
                
                // If this is the selected beast, mark it as selected
                if (beast.id === selectedBeastId) {
                    beastItem.classList.add('selected');
                }
            });
            
            // Update the result count
            updateResultCount();
        });
    };
    
    /**
     * Show the main beast list
     */
    const showBeasts = function() {
        currentView = 'beasts';
        
        // Load the expanded groups state
        UserStore.getSetting('statblock.expandedGroups', {}).then(savedGroups => {
            if (savedGroups) {
                expandedGroups = savedGroups;
            }
            renderBeastList();
        });
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
                case 'f':
                    // Show favorite options with Alt+F
                    if (event.altKey && selectedBeastId) {
                        // Find the beast
                        const beast = beastList.find(b => b.id === selectedBeastId);
                        if (beast) {
                            // Create a menu near the statblock
                            const statblockContainer = document.getElementById('statblock-display');
                            if (statblockContainer) {
                                const rect = statblockContainer.getBoundingClientRect();
                                const event = {
                                    pageX: window.pageXOffset + rect.left + rect.width / 2,
                                    pageY: window.pageYOffset + rect.top + 100,
                                    preventDefault: () => {},
                                    stopPropagation: () => {}
                                };
                                showFavoriteOptionsMenu(event, beast);
                            }
                        }
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
        
        // If in beast view (not favourites), update collapsible groups
        if (currentView === 'beasts') {
            // No specific action needed as we're rendering all items at once
        }
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
                    
                    // Sort alphabetically within each CR group
                    try {
                        beastList.sort((a, b) => {
                            try {
                                return a.name.localeCompare(b.name);
                            } catch (sortError) {
                                console.error('StatblockModule: Error sorting beast items by name:', sortError);
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
        // If in favourites view, return to beast view for searching
        if (currentView !== 'beasts') {
            currentView = 'beasts';
        }
        
        // Apply current filters and search
        applyFiltersAndSearch(FiltersComponent.getFilters(), query);
    };
    
    /**
     * Handle filter change event
     * @param {Object} filters - The new filters
     */
    const handleFilterChange = function(filters) {
        // If in favourites view, return to beast view for filtering
        if (currentView !== 'beasts') {
            currentView = 'beasts';
        }
        
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
                        const beastCR = normalizeCR(beast.cr);
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
     * Normalize CR for comparisons
     * @param {string} cr - The CR string (e.g., "1/4", "1/2")
     * @returns {number} - The normalized CR as a number
     */
    const normalizeCR = function(cr) {
        if (cr === '1/8') return 0.125;
        if (cr === '1/4') return 0.25;
        if (cr === '1/2') return 0.5;
        return parseFloat(cr);
    };
    
    /**
     * Group beasts by CR according to the defined groups
     * @param {Array} beasts - List of beasts to group
     * @returns {Object} - Grouped beasts
     */
    const groupBeastsByCR = function(beasts) {
        // Initialize groups
        const groupedBeasts = {};
        CR_GROUPS.forEach(group => {
            groupedBeasts[group.name] = {
                min: group.min,
                max: group.max,
                beasts: []
            };
        });
        
        // Place each beast into its appropriate group
        beasts.forEach(beast => {
            const cr = normalizeCR(beast.cr);
            
            // Find the appropriate group
            const group = CR_GROUPS.find(group => cr >= group.min && cr <= group.max);
            
            if (group) {
                groupedBeasts[group.name].beasts.push(beast);
            } else {
                console.warn(`Beast ${beast.name} with CR ${beast.cr} does not fit in any defined group`);
            }
        });
        
        return groupedBeasts;
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
        
        // If we're in favourites view, render favourites instead
        if (currentView !== 'beasts') {
            const type = currentView.split('-')[0]; // 'wildshape' or 'conjure'
            showFavourites(type);
            return;
        }
        
        // Group beasts by CR for main beast view
        const groupedBeasts = groupBeastsByCR(filteredList);
        
        // Create container for CR groups
        const crGroupsContainer = document.createElement('div');
        crGroupsContainer.className = 'cr-groups-container';
        
        // Add expand/collapse all buttons
        const groupsHeader = document.createElement('div');
        groupsHeader.className = 'cr-groups-header';
        
        const expandAllBtn = document.createElement('button');
        expandAllBtn.id = 'expand-all-groups';
        expandAllBtn.className = 'expand-all-button';
        expandAllBtn.textContent = 'Expand All';
        expandAllBtn.addEventListener('click', expandAllGroups);
        
        const collapseAllBtn = document.createElement('button');
        collapseAllBtn.id = 'collapse-all-groups';
        collapseAllBtn.className = 'collapse-all-button';
        collapseAllBtn.textContent = 'Collapse All';
        collapseAllBtn.addEventListener('click', collapseAllGroups);
        
        groupsHeader.appendChild(expandAllBtn);
        groupsHeader.appendChild(collapseAllBtn);
        crGroupsContainer.appendChild(groupsHeader);
        
        // Create each CR group
        CR_GROUPS.forEach(groupDef => {
            const group = groupedBeasts[groupDef.name];
            const beasts = group.beasts;
            
            const crGroup = document.createElement('div');
            crGroup.className = 'cr-group';
            crGroup.dataset.group = groupDef.name;
            
            // Group header
            const header = document.createElement('div');
            header.className = 'cr-group-header';
            header.addEventListener('click', toggleGroup);
            
            const title = document.createElement('h3');
            title.textContent = `${groupDef.name} (${beasts.length})`;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-group-button';
            toggleBtn.textContent = '▼';
            toggleBtn.setAttribute('aria-label', 'Toggle group');
            
            header.appendChild(title);
            header.appendChild(toggleBtn);
            crGroup.appendChild(header);
            
            // Group content
            const content = document.createElement('div');
            content.className = 'cr-group-content';
            
            // Add beasts to group
            beasts.forEach(beast => {
                const beastItem = createBeastItem(beast);
                content.appendChild(beastItem);
                
                // If this is the selected beast, mark it as selected
                if (beast.id === selectedBeastId) {
                    beastItem.classList.add('selected');
                    
                    // Ensure the group containing the selected beast is expanded
                    setTimeout(() => {
                        crGroup.classList.remove('collapsed');
                        expandedGroups[groupDef.name] = true;
                    }, 0);
                }
            });
            
            crGroup.appendChild(content);
            
            // Set collapsed state based on saved state or default (empty groups collapsed)
            if (expandedGroups.hasOwnProperty(groupDef.name)) {
                // Use saved state
                if (!expandedGroups[groupDef.name]) {
                    crGroup.classList.add('collapsed');
                }
            } else if (beasts.length === 0) {
                // Collapse empty groups by default
                crGroup.classList.add('collapsed');
                expandedGroups[groupDef.name] = false;
            } else {
                // Default state for non-empty groups is expanded
                expandedGroups[groupDef.name] = true;
            }
            
            crGroupsContainer.appendChild(crGroup);
        });
        
        // Add the CR groups to the list
        beastListElement.appendChild(crGroupsContainer);
        
        // If there's a selected beast, scroll to it
        if (selectedBeastId) {
            scrollToSelectedBeast();
        }
        
        // Update result count
        updateResultCount();
        
        console.log('Beast list rendering complete');
    };
    
    /**
     * Toggle a CR group's expanded/collapsed state
     * @param {Event} event - The click event
     */
    const toggleGroup = function(event) {
        const header = event.currentTarget;
        const group = header.closest('.cr-group');
        
        if (group) {
            const groupName = group.dataset.group;
            const isCollapsed = group.classList.toggle('collapsed');
            
            // Store the group's state
            expandedGroups[groupName] = !isCollapsed;
            
            // Save state to user preferences
            UserStore.setSetting('statblock.expandedGroups', expandedGroups);
        }
    };
    
    /**
     * Expand all CR groups
     */
    const expandAllGroups = function() {
        const groups = document.querySelectorAll('.cr-group');
        groups.forEach(group => {
            const groupName = group.dataset.group;
            group.classList.remove('collapsed');
            expandedGroups[groupName] = true;
        });
        
        // Save state to user preferences
        UserStore.setSetting('statblock.expandedGroups', expandedGroups);
    };
    
    /**
     * Collapse all CR groups
     */
    const collapseAllGroups = function() {
        const groups = document.querySelectorAll('.cr-group');
        groups.forEach(group => {
            const groupName = group.dataset.group;
            group.classList.add('collapsed');
            expandedGroups[groupName] = false;
        });
        
        // Save state to user preferences
        UserStore.setSetting('statblock.expandedGroups', expandedGroups);
    };
    
    /**
     * Update the result count display
     */
    const updateResultCount = function() {
        // Get the result count container
        const resultCountContainer = document.getElementById('result-count-container');
        if (!resultCountContainer) {
            console.error('Result count container not found');
            return;
        }
        
        // Clear the container
        resultCountContainer.innerHTML = '';
        
        // Create new result count element
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        
        // Set text content based on current view
        if (currentView === 'beasts') {
            resultCount.textContent = `${filteredList.length} beasts found`;
        } else {
            // For favourites view, count visible beasts in the list
            const beastItems = document.querySelectorAll('.beast-item');
            resultCount.textContent = `${beastItems.length} favourites found`;
        }
        
        // Add to container
        resultCountContainer.appendChild(resultCount);
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
        
        // Create right content (CR and favourite button)
        const rightContent = document.createElement('div');
        rightContent.className = 'beast-item-right';
        
        // Beast CR
        const beastCr = document.createElement('div');
        beastCr.className = 'beast-cr';
        beastCr.textContent = `CR ${beast.cr}`;
        
        // Add quick favourite toggle
        const favouriteBtn = document.createElement('button');
        favouriteBtn.className = 'favorite-button';
        favouriteBtn.innerHTML = '★';
        favouriteBtn.title = 'Add to favourites';
        favouriteBtn.setAttribute('aria-label', 'Toggle favourite');
        
        // Check favourite status and update button - but don't break if it fails
        try {
            UserStore.isFavourite(beast.id).then(isFavourite => {
                try {
                    if (isFavourite) {
                        beastItem.classList.add('favorite');
                        favouriteBtn.classList.add('active');
                        favouriteBtn.title = 'Remove from favourites';
                    }
                } catch (error) {
                    console.warn('Error updating favourite UI:', error);
                }
            }).catch(error => {
                console.warn('Error checking favourite status:', error);
            });
        } catch (error) {
            console.warn('Error in favourite check:', error);
        }
        
        // Add contextmenu event for favorite button to show options
        favouriteBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent beast selection
            
            // Create and show favorite options menu
            showFavoriteOptionsMenu(event, beast);
        });
        
        rightContent.appendChild(beastCr);
        rightContent.appendChild(favouriteBtn);
        
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
        const cr = normalizeCR(beast.cr);
        const canWildshape = cr <= 1; // Standard druid wildshape limit
        const canConjure = cr <= 2; // Conjure Animals limit
        
        // Check favourite status for wildshape and conjure separately
        Promise.all([
            UserStore.isFavouriteByType(beast.id, 'wildshape'),
            UserStore.isFavouriteByType(beast.id, 'conjure')
        ]).then(([isWildshapeFav, isConjureFav]) => {
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
                    text: isWildshapeFav ? 'Remove from Wildshape Favourites' : 'Add to Wildshape Favourites',
                    handler: () => isWildshapeFav ? 
                        UserStore.removeFavouriteByType(beast.id, 'wildshape').then(() => {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, { beast, type: 'wildshape' });
                            UIUtils.showNotification(`Removed ${beast.name} from wildshape favourites`, 'info');
                        }) :
                        UserStore.addFavouriteByType(beast.id, 'wildshape').then(() => {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, { beast, type: 'wildshape' });
                            UIUtils.showNotification(`Added ${beast.name} to wildshape favourites`, 'success');
                        })
                },
                {
                    text: isConjureFav ? 'Remove from Conjure Favourites' : 'Add to Conjure Favourites',
                    handler: () => isConjureFav ? 
                        UserStore.removeFavouriteByType(beast.id, 'conjure').then(() => {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, { beast, type: 'conjure' });
                            UIUtils.showNotification(`Removed ${beast.name} from conjure favourites`, 'info');
                        }) :
                        UserStore.addFavouriteByType(beast.id, 'conjure').then(() => {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, { beast, type: 'conjure' });
                            UIUtils.showNotification(`Added ${beast.name} to conjure favourites`, 'success');
                        })
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
     * Show favorite options menu for a beast
     * @param {Event} event - The click event
     * @param {Object} beast - The beast object
     */
    const showFavoriteOptionsMenu = function(event, beast) {
        event.preventDefault();
        event.stopPropagation();
        
        // Create a mini menu for favorite options
        const menu = document.createElement('div');
        menu.className = 'context-menu favorite-options-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        // Get current favorite status
        Promise.all([
            UserStore.isFavouriteByType(beast.id, 'wildshape'),
            UserStore.isFavouriteByType(beast.id, 'conjure')
        ]).then(([isWildshapeFav, isConjureFav]) => {
            // Add menu items
            const menuItems = [
                {
                    text: isWildshapeFav ? 'Remove from Wildshape' : 'Add to Wildshape',
                    handler: () => toggleFavouriteByType(beast.id, 'wildshape')
                },
                {
                    text: isConjureFav ? 'Remove from Conjure' : 'Add to Conjure',
                    handler: () => toggleFavouriteByType(beast.id, 'conjure')
                }
            ];
            
            // Create menu items
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.textContent = item.text;
                
                menuItem.addEventListener('click', () => {
                    item.handler();
                    removeMenu();
                });
                
                menu.appendChild(menuItem);
            });
            
            // Add to document
            document.body.appendChild(menu);
            
            // Handle closing the menu
            const removeMenu = () => {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
                document.removeEventListener('click', removeMenu);
                document.removeEventListener('contextmenu', removeMenu);
            };
            
            // Close on any click or another contextmenu
            setTimeout(() => {
                document.addEventListener('click', removeMenu);
                document.addEventListener('contextmenu', removeMenu);
            }, 0);
        });
    };
    
    /**
     * Toggle favorite status for a beast by type
     * @param {string} beastId - The beast ID to toggle
     * @param {string} type - Type of favorite ('wildshape' or 'conjure')
     */
    const toggleFavouriteByType = function(beastId, type) {
        if (!beastId) return;
        
        // Get the beast data
        const beast = beastList.find(b => b.id === beastId);
        if (!beast) return;
        
        UserStore.isFavouriteByType(beastId, type).then(isFavourite => {
            if (isFavourite) {
                // Remove from favourites
                UserStore.removeFavouriteByType(beastId, type).then(() => {
                    // Check if both types are now unfavorited
                    Promise.all([
                        UserStore.isFavouriteByType(beastId, 'wildshape'),
                        UserStore.isFavouriteByType(beastId, 'conjure')
                    ]).then(([isWildshapeFav, isConjureFav]) => {
                        // Update favorite star only if both are removed
                        if (!isWildshapeFav && !isConjureFav) {
                            updateBeastItemFavouriteStatus(beastId, false);
                        }
                    });
                    
                    // Notify user
                    UIUtils.showNotification(`Removed ${beast.name} from ${type} favourites`, 'info');
                    
                    // Publish event
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, { beast, type });
                });
            } else {
                // Add to favourites
                UserStore.addFavouriteByType(beastId, type).then(() => {
                    // Update the beast item in the list to show it's a favorite
                    updateBeastItemFavouriteStatus(beastId, true);
                    
                    // Notify user
                    UIUtils.showNotification(`Added ${beast.name} to ${type} favourites`, 'success');
                    
                    // Publish event
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, { beast, type });
                });
            }
        });
    };
    
    /**
     * Update favourite status in the UI for a beast item
     * @param {string} beastId - The beast ID
     * @param {boolean} isFavourite - Whether the beast is favourited
     */
    const updateBeastItemFavouriteStatus = function(beastId, isFavourite) {
        // Find beast item in the visible list
        const beastItem = beastListElement.querySelector(`.beast-item[data-id="${beastId}"]`);
        
        if (beastItem) {
            // Update the item's favourite class
            if (isFavourite) {
                beastItem.classList.add('favorite');
            } else {
                beastItem.classList.remove('favorite');
            }
            
            // Update the favourite button
            const favouriteBtn = beastItem.querySelector('.favorite-button');
            if (favouriteBtn) {
                if (isFavourite) {
                    favouriteBtn.classList.add('active');
                    favouriteBtn.title = 'Remove from favourites';
                } else {
                    favouriteBtn.classList.remove('active');
                    favouriteBtn.title = 'Add to favourites';
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
        const cr = normalizeCR(beast.cr);
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
        const cr = normalizeCR(beast.cr);
        if (cr > 2) {
            UIUtils.showNotification(`${beast.name} (CR ${beast.cr}) exceeds Conjure Animals limit of 2`, 'warning');
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
            
            try {
                // Perform the actual selection
                console.log('StatblockModule: Performing beast selection');
                selectBeastWithoutHistory(beastId);
            } catch (selectionError) {
                console.error('StatblockModule: Error in selectBeastWithoutHistory:', selectionError);
                throw selectionError; // Re-throw to outer handler
            }
            
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
                    
                    // If in CR grouped view, ensure the group is expanded
                    const group = beastItem.closest('.cr-group');
                    if (group) {
                        group.classList.remove('collapsed');
                    }
                } else {
                    console.warn(`StatblockModule: Could not find beast item with ID: ${beastId}`);
                }
            } catch (selectError) {
                console.error('StatblockModule: Error selecting beast item:', selectError);
                // Continue even if selection UI fails
            }
            
            // Update selected beast ID
            selectedBeastId = beastId;
            
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
    
    /**
     * Scroll to the selected beast in the list
     */
    const scrollToSelectedBeast = function() {
        if (!virtualListContainer || !selectedBeastId) return;
        
        // Find the beast item in the DOM
        const beastItem = virtualListContent.querySelector(`.beast-item[data-id="${selectedBeastId}"]`);
        if (!beastItem) return;
        
        // Get the position of the beast item
        const itemRect = beastItem.getBoundingClientRect();
        const containerRect = virtualListContainer.getBoundingClientRect();
        
        // If item is not visible, scroll to it
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
            // Calculate scroll position (center the item in the viewport if possible)
            const scrollTop = beastItem.offsetTop - (virtualListContainer.clientHeight / 2) + (beastItem.clientHeight / 2);
            
            // Scroll to the position
            virtualListContainer.scrollTop = Math.max(0, scrollTop);
        }
    };
    
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
    const sortBeastList = function(sortBy = 'name', ascending = true) {
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
                    const crA = normalizeCR(a.cr);
                    const crB = normalizeCR(b.cr);
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
    
    // Public API
    return {
        init,
        getBeastById,
        selectBeast,
        sortBeastList,
        getAvailableBeastTypes,
        switchToWildshape,
        switchToConjure,
        showFavourites,
        showBeasts
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    StatblockModule.init();
});
