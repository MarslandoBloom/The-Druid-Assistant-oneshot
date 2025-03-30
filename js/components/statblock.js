/**
 * Statblock component
 * Handles rendering and interaction with beast statblocks
 */
const StatblockComponent = (function() {
    // Cache DOM elements
    let statblockContainer;
    let currentBeast = null;
    
    /**
     * Initialize the statblock component
     */
    const init = function() {
        statblockContainer = document.getElementById('statblock-display');
        
        // Subscribe to events
        EventManager.subscribe(EventManager.EVENTS.BEAST_SELECTED, handleBeastSelected);
        
        // Initialize action buttons
        initActionButtons();
    };
    
    /**
     * Initialize action buttons
     */
    const initActionButtons = function() {
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        // Add event listeners
        if (wildshapeButton) {
            wildshapeButton.addEventListener('click', handleWildshapeClick);
        }
        
        if (conjureButton) {
            conjureButton.addEventListener('click', handleConjureClick);
        }
        
        if (favoriteButton) {
            favoriteButton.addEventListener('click', handleFavoriteClick);
        }
    };
    
    /**
     * Handle beast selected event
     * @param {Object} beast - The selected beast
     */
    const handleBeastSelected = function(beast) {
        if (!beast) return;
        
        currentBeast = beast;
        
        // Placeholder: Clear and show message that we're rebuilding this feature
        clearStatblock();
        statblockContainer.innerHTML = '<div class="statblock-placeholder">Statblock display is currently being rebuilt. Please check back later.</div>';
        
        // Enable action buttons
        enableActionButtons();
        
        // Update favorite button state
        updateFavoriteButtonState(beast);
    };
    
    /**
     * Enable action buttons
     */
    const enableActionButtons = function() {
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        if (wildshapeButton) wildshapeButton.disabled = false;
        if (conjureButton) conjureButton.disabled = false;
        if (favoriteButton) favoriteButton.disabled = false;
    };
    
    /**
     * Update favorite button state
     * @param {Object} beast - The beast to check favorite status
     */
    const updateFavoriteButtonState = function(beast) {
        const favoriteButton = document.getElementById('favorite-button');
        if (!favoriteButton) return;
        
        UserStore.isFavorite(beast.id).then(isFavorite => {
            if (isFavorite) {
                favoriteButton.textContent = 'Remove from Favorites';
                favoriteButton.classList.add('active');
            } else {
                favoriteButton.textContent = 'Add to Favorites';
                favoriteButton.classList.remove('active');
            }
        });
    };
    
    /**
     * Handle wildshape button click
     */
    const handleWildshapeClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to wildshape tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'wildshape-tab' });
        EventManager.publish('wildshape:start', currentBeast);
    };
    
    /**
     * Handle conjure animals button click
     */
    const handleConjureClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to conjure tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'conjure-tab' });
        EventManager.publish('conjure:start', currentBeast);
    };
    
    /**
     * Handle favorite button click
     */
    const handleFavoriteClick = function() {
        if (!currentBeast) return;
        
        UserStore.isFavorite(currentBeast.id).then(isFavorite => {
            if (isFavorite) {
                // Remove from favorites
                UserStore.removeFavorite(currentBeast.id).then(() => {
                    updateFavoriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, currentBeast);
                    UIUtils.showNotification(`Removed ${currentBeast.name} from favorites`, 'info');
                });
            } else {
                // Add to favorites
                UserStore.addFavorite(currentBeast.id).then(() => {
                    updateFavoriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, currentBeast);
                    UIUtils.showNotification(`Added ${currentBeast.name} to favorites`, 'success');
                });
            }
        });
    };
    
    /**
     * Clear the statblock container
     */
    const clearStatblock = function() {
        if (statblockContainer) {
            statblockContainer.innerHTML = '<div class="statblock-placeholder">Select a beast to view its statblock</div>';
        }
        
        // Disable action buttons
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        if (wildshapeButton) wildshapeButton.disabled = true;
        if (conjureButton) conjureButton.disabled = true;
        if (favoriteButton) favoriteButton.disabled = true;
        
        currentBeast = null;
    };
    
    /**
     * Get the current beast
     * @returns {Object} The current beast
     */
    const getCurrentBeast = function() {
        return currentBeast;
    };
    
    // Public API
    return {
        init,
        clearStatblock,
        getCurrentBeast
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    StatblockComponent.init();
});
