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
    
    // Virtual list settings
    const ITEM_HEIGHT = 44; // Height of each beast item in pixels
    const VISIBLE_PADDING = 5; // Number of items to render above and below visible area
    
    /**
     * Initialize the statblock module
     */
    const init = function() {
        // Cache DOM elements
        beastListElement = document.getElementById('beast-list');
        favoritesListElement = document.getElementById('favorites-list');
        
        // Create loading indicator
        createLoadingIndicator();
        
        // Set up virtual list
        setupVirtualList();
        
        // Subscribe to events
        EventSystem.subscribe('database:ready', loadBeasts);
        EventSystem.subscribe('search:performed', handleSearch);
        EventSystem.subscribe('filter:changed', handleFilterChange);
        EventSystem.subscribe('favorite:added', updateFavoritesList);
        EventSystem.subscribe('favorite:removed', updateFavoritesList);
        
        // If database is already ready, load beasts
        if (Database.isReady()) {
            loadBeasts();
        }
        
        // Restore selected beast from URL hash if present
        restoreSelectedBeastFromHash();
        
        // Set up window events
        window.addEventListener('hashchange', handleHashChange);
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
        if (!beastListElement) return;
        
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
     * Load beasts from database
     */
    const loadBeasts = function() {
        showLoading();
        
        BeastStore.getAllBeasts().then(beasts => {
            beastList = beasts || [];
            
            // Sort by CR (highest to lowest) by default
            beastList.sort((a, b) => {
                const crA = parseFloat(a.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                const crB = parseFloat(b.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                return crB - crA;
            });
            
            // Apply initial filters
            applyFilters(FiltersComponent.getFilters());
            
            // Update favorites list
            updateFavoritesList();
            
            hideLoading();
        }).catch(error => {
            console.error('Error loading beasts:', error);
            showEmptyState('Error loading beasts. Please try reloading the page.');
            hideLoading();
        });
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
        if (!filters) {
            filteredList = [...beastList];
            return;
        }
        
        filteredList = beastList.filter(beast => FiltersComponent.filterBeast(beast));
    };
    
    /**
     * Apply search to the filtered beast list
     * @param {string} query - The search query
     */
    const applySearch = function(query) {
        if (!query) return;
        
        const queryLower = query.toLowerCase();
        
        filteredList = filteredList.filter(beast => {
            // Search by name
            if (beast.name.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Search by type
            if (beast.type.toLowerCase().includes(queryLower)) {
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
            
            return false;
        });
    };
    
    /**
     * Render the beast list
     */
    const renderBeastList = function() {
        if (!beastListElement) return;
        
        // Clear list
        beastListElement.innerHTML = '';
        
        if (filteredList.length === 0) {
            showEmptyState('No beasts found matching current filters and search.');
            return;
        }
        
        // Set height for virtual list
        if (virtualListContent) {
            virtualListContent.style.height = `${filteredList.length * ITEM_HEIGHT}px`;
        }
        
        // Render visible items
        renderVisibleItems();
        
        // If there's a selected beast, scroll to it
        if (selectedBeastId) {
            scrollToSelectedBeast();
        }
    };
    
    /**
     * Render only the items visible in the viewport plus padding
     */
    const renderVisibleItems = function() {
        if (!virtualListContainer || !virtualListContent || filteredList.length === 0) return;
        
        // Clear existing items
        virtualListContent.innerHTML = '';
        
        // Calculate visible range
        const scrollTop = virtualListContainer.scrollTop;
        const viewportHeight = virtualListContainer.clientHeight;
        
        // Calculate start and end indices with padding
        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT) - VISIBLE_PADDING;
        startIndex = Math.max(0, startIndex);
        
        let endIndex = Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT) + VISIBLE_PADDING;
        endIndex = Math.min(filteredList.length - 1, endIndex);
        
        // Render only visible items
        for (let i = startIndex; i <= endIndex; i++) {
            const beast = filteredList[i];
            const beastItem = createBeastItem(beast);
            
            // Position absolutely
            beastItem.style.position = 'absolute';
            beastItem.style.top = `${i * ITEM_HEIGHT}px`;
            beastItem.style.left = '0';
            beastItem.style.right = '0';
            beastItem.style.height = `${ITEM_HEIGHT}px`;
            
            virtualListContent.appendChild(beastItem);
            
            // If this is the selected beast, mark it as selected
            if (beast.id === selectedBeastId) {
                beastItem.classList.add('selected');
            }
        }
    };
    
    /**
     * Create a beast list item element
     * @param {Object} beast - The beast data
     * @returns {HTMLElement} The beast item element
     */
    const createBeastItem = function(beast) {
        const beastItem = document.createElement('div');
        beastItem.className = 'beast-item';
        beastItem.dataset.id = beast.id;
        
        // Check if this beast is a favorite
        UserStore.isFavorite(beast.id).then(isFavorite => {
            if (isFavorite) {
                beastItem.classList.add('favorite');
            }
        });
        
        // Beast name
        const beastName = document.createElement('div');
        beastName.className = 'beast-name';
        beastName.textContent = beast.name;
        
        // Beast CR
        const beastCr = document.createElement('div');
        beastCr.className = 'beast-cr';
        beastCr.textContent = `CR ${beast.cr}`;
        
        beastItem.appendChild(beastName);
        beastItem.appendChild(beastCr);
        
        // Add click handler
        beastItem.addEventListener('click', function() {
            selectBeast(beast.id);
        });
        
        return beastItem;
    };
    
    /**
     * Select a beast by ID
     * @param {string} beastId - The ID of the beast to select
     */
    const selectBeast = function(beastId) {
        // Deselect currently selected beast
        const currentlySelected = beastListElement.querySelector('.beast-item.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        
        // Select new beast
        const beastItem = beastListElement.querySelector(`.beast-item[data-id="${beastId}"]`);
        if (beastItem) {
            beastItem.classList.add('selected');
        }
        
        // Update selected beast ID
        selectedBeastId = beastId;
        
        // Update URL hash
        window.location.hash = `beast=${beastId}`;
        
        // Find the beast in the list
        const beast = beastList.find(beast => beast.id === beastId);
        if (beast) {
            // Publish beast selected event
            EventSystem.publish('beast:selected', beast);
        }
    };
    
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
        
        // Get all favorites
        UserStore.getFavorites().then(favorites => {
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
                favoriteItem.textContent = beast.name;
                
                // Add click handler
                favoriteItem.addEventListener('click', function() {
                    selectBeast(beast.id);
                });
                
                favoritesListElement.appendChild(favoriteItem);
            });
        });
    };
    
    /**
     * Restore selected beast from URL hash
     */
    const restoreSelectedBeastFromHash = function() {
        const hash = window.location.hash;
        if (!hash) return;
        
        const match = hash.match(/beast=([^&]+)/);
        if (match && match[1]) {
            const beastId = match[1];
            
            // Wait for beasts to load
            if (beastList.length === 0) {
                const checkInterval = setInterval(() => {
                    if (beastList.length > 0) {
                        clearInterval(checkInterval);
                        selectBeast(beastId);
                    }
                }, 100);
                
                // Clear interval after 5 seconds to prevent infinite checking
                setTimeout(() => clearInterval(checkInterval), 5000);
            } else {
                selectBeast(beastId);
            }
        }
    };
    
    /**
     * Handle hash change event
     */
    const handleHashChange = function() {
        restoreSelectedBeastFromHash();
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
    
    // Public API
    return {
        init,
        getBeastById,
        selectBeast
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    StatblockModule.init();
});
