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
        const wildshapeFavButton = document.getElementById('wildshape-fav-button');
        const conjureFavButton = document.getElementById('conjure-fav-button');
        
        // Add event listeners
        if (wildshapeButton) {
            wildshapeButton.addEventListener('click', handleWildshapeClick);
        }
        
        if (conjureButton) {
            conjureButton.addEventListener('click', handleConjureClick);
        }
        
        if (wildshapeFavButton) {
            wildshapeFavButton.addEventListener('click', () => handleFavouriteClick('wildshape'));
        }
        
        if (conjureFavButton) {
            conjureFavButton.addEventListener('click', () => handleFavouriteClick('conjure'));
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
            
            // Update favourite button state
            updateFavouriteButtonState(beast);
            
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
        const wildshapeFavButton = document.getElementById('wildshape-fav-button');
            const conjureFavButton = document.getElementById('conjure-fav-button');
        
        if (wildshapeButton) wildshapeButton.disabled = false;
        if (conjureButton) conjureButton.disabled = false;
        if (wildshapeFavButton) wildshapeFavButton.disabled = false;
        if (conjureFavButton) conjureFavButton.disabled = false;
    };
    
    /**
     * Update favourite button state
     * @param {Object} beast - The beast to check favourite status
     */
    const updateFavouriteButtonState = function(beast) {
        const wildshapeFavButton = document.getElementById('wildshape-fav-button');
        const conjureFavButton = document.getElementById('conjure-fav-button');
        
        if (wildshapeFavButton) {
            UserStore.isFavouriteByType(beast.id, 'wildshape').then(isFavourite => {
                if (isFavourite) {
                    wildshapeFavButton.textContent = 'Remove from Wildshape Favourites';
                    wildshapeFavButton.classList.add('active');
                } else {
                    wildshapeFavButton.textContent = 'Add to Wildshape Favourites';
                    wildshapeFavButton.classList.remove('active');
                }
            });
        }
        
        if (conjureFavButton) {
            UserStore.isFavouriteByType(beast.id, 'conjure').then(isFavourite => {
                if (isFavourite) {
                    conjureFavButton.textContent = 'Remove from Conjure Favourites';
                    conjureFavButton.classList.add('active');
                } else {
                    conjureFavButton.textContent = 'Add to Conjure Favourites';
                    conjureFavButton.classList.remove('active');
                }
            });
        }
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
     * Handle favourite button click
     * @param {string} type - Type of favourite ('wildshape' or 'conjure')
     */
    const handleFavouriteClick = function(type) {
        if (!currentBeast) return;
        
        UserStore.isFavouriteByType(currentBeast.id, type).then(isFavourite => {
            if (isFavourite) {
                // Remove from favourites
                UserStore.removeFavouriteByType(currentBeast.id, type).then(() => {
                    updateFavouriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, { beast: currentBeast, type: type });
                    UIUtils.showNotification(`Removed ${currentBeast.name} from ${type} favourites`, 'info');
                });
            } else {
                // Add to favourites
                UserStore.addFavouriteByType(currentBeast.id, type).then(() => {
                    updateFavouriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, { beast: currentBeast, type: type });
                    UIUtils.showNotification(`Added ${currentBeast.name} to ${type} favourites`, 'success');
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
            const favouriteButton = document.getElementById('favorite-button');
            
            if (wildshapeButton) wildshapeButton.disabled = true;
            if (conjureButton) conjureButton.disabled = true;
            if (wildshapeFavButton) wildshapeFavButton.disabled = true;
            if (conjureFavButton) conjureFavButton.disabled = true;
            
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
