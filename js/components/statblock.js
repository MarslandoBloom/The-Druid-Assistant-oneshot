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
        try {
            console.log('StatblockComponent: Initializing...');
            statblockContainer = document.getElementById('statblock-display');
            
            if (!statblockContainer) {
                console.error('StatblockComponent: Failed to find statblock-display element');
                return;
            }
            
            // Subscribe to events
            if (typeof EventManager === 'undefined') {
                console.error('StatblockComponent: EventManager is not defined');
            } else {
                EventManager.subscribe(EventManager.EVENTS.BEAST_SELECTED, handleBeastSelected);
                console.log('StatblockComponent: Subscribed to BEAST_SELECTED event');
            }
            
            // Initialize action buttons
            initActionButtons();
            
            console.log('StatblockComponent: Initialization complete');
        } catch (error) {
            console.error('StatblockComponent: Error during initialization:', error);
        }
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
        try {
            console.log('StatblockComponent: Beast selected event received', beast ? beast.id : 'No beast');
            
            if (!beast) {
                console.warn('StatblockComponent: Received null or undefined beast');
                return;
            }
            
            if (!statblockContainer) {
                console.error('StatblockComponent: statblockContainer is null or undefined');
                return;
            }
            
            // Log the beast data structure for debugging
            console.log('StatblockComponent: Beast data structure:', JSON.stringify(beast, null, 2));
            
            currentBeast = beast;
            
            // Use the StatblockRenderer to render the statblock
            try {
                if (typeof StatblockRenderer === 'undefined') {
                    console.error('StatblockComponent: StatblockRenderer is not defined');
                    statblockContainer.innerHTML = '<div class="statblock-error"><h3>Error</h3><p>StatblockRenderer is not available</p></div>';
                } else {
                    // Use the renderer to display the statblock
                    StatblockRenderer.renderStatblock(beast, statblockContainer);
                    console.log('StatblockComponent: Statblock rendered successfully');
                }
            } catch (renderError) {
                console.error('StatblockComponent: Error rendering statblock:', renderError);
                statblockContainer.innerHTML = `<div class="statblock-error">
                    <h3>Error Rendering Statblock</h3>
                    <p>${renderError.message}</p>
                </div>`;
            }
            
            // Enable action buttons
            enableActionButtons();
            
            // Update favorite button state
            updateFavoriteButtonState(beast);
            
            console.log('StatblockComponent: Beast rendering completed successfully');
        } catch (error) {
            console.error('StatblockComponent: Error in handleBeastSelected:', error);
            
            // Try to show an error message in the statblock container
            try {
                if (statblockContainer) {
                    statblockContainer.innerHTML = `<div class="statblock-error">
                        <h3>Error Displaying Statblock</h3>
                        <p>${error.message}</p>
                        <p>Check browser console for details (F12).</p>
                    </div>`;
                }
            } catch (innerError) {
                console.error('StatblockComponent: Failed to display error message:', innerError);
            }
        }
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
        try {
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
            console.log('StatblockComponent: Statblock cleared successfully');
        } catch (error) {
            console.error('StatblockComponent: Error clearing statblock:', error);
        }
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
