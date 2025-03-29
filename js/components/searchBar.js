/**
 * Search Bar Component
 * Handles beast name search functionality
 */
const SearchBarComponent = (function() {
    // Private variables
    let searchInput;
    let clearButton;
    let searchTimeout;
    let lastQuery = '';
    
    /**
     * Initialize the search bar component
     */
    const init = function() {
        // Cache DOM elements
        searchInput = document.getElementById('beast-search');
        clearButton = document.getElementById('clear-search');
        
        // Add event listeners
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
            searchInput.addEventListener('keydown', handleKeyDown);
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', clearSearch);
        }
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
    };
    
    /**
     * Set up keyboard shortcuts
     */
    const setupKeyboardShortcuts = function() {
        document.addEventListener('keydown', function(event) {
            // Ctrl+F or Command+F focuses the search input
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                if (searchInput && document.activeElement !== searchInput) {
                    event.preventDefault();
                    searchInput.focus();
                }
            }
            
            // Escape clears the search if focused
            if (event.key === 'Escape' && document.activeElement === searchInput) {
                clearSearch();
            }
        });
    };
    
    /**
     * Handle search input with debouncing
     * @param {Event} event - The input event
     */
    const handleSearchInput = function(event) {
        const query = event.target.value.trim();
        
        // Clear any existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout (debounce for 300ms)
        searchTimeout = setTimeout(() => {
            if (query !== lastQuery) {
                lastQuery = query;
                executeSearch(query);
            }
        }, 300);
        
        // Toggle clear button visibility
        toggleClearButton(query);
    };
    
    /**
     * Handle keydown events for the search input
     * @param {Event} event - The keydown event
     */
    const handleKeyDown = function(event) {
        // If Enter key is pressed, execute search immediately
        if (event.key === 'Enter') {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            executeSearch(event.target.value.trim());
        }
    };
    
    /**
     * Execute the search with the given query
     * @param {string} query - The search query
     */
    const executeSearch = function(query) {
        // Publish search event with query
        // Use consistent format with app.js search events
        EventManager.publish('search:performed', {
            tab: 'statblock',
            term: query
        });
    };
    
    /**
     * Toggle the visibility of the clear button
     * @param {string} query - The current search query
     */
    const toggleClearButton = function(query) {
        if (clearButton) {
            clearButton.style.display = query ? 'block' : 'none';
        }
    };
    
    /**
     * Clear the search input and results
     */
    const clearSearch = function() {
        if (searchInput) {
            searchInput.value = '';
            lastQuery = '';
            
            // Hide clear button
            toggleClearButton('');
            
            // Execute empty search to show all results
            executeSearch('');
            
            // Focus the search input
            searchInput.focus();
        }
    };
    
    /**
     * Set the search query programmatically
     * @param {string} query - The search query to set
     */
    const setSearchQuery = function(query) {
        if (searchInput) {
            searchInput.value = query;
            lastQuery = query;
            toggleClearButton(query);
            executeSearch(query);
        }
    };
    
    /**
     * Get the current search query
     * @returns {string} The current search query
     */
    const getSearchQuery = function() {
        return lastQuery;
    };
    
    // Public API
    return {
        init,
        clearSearch,
        setSearchQuery,
        getSearchQuery
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    SearchBarComponent.init();
});
