/**
 * Filters Component
 * Handles beast filtering functionality
 */
const FiltersComponent = (function() {
    // Private variables
    let crMinSelect;
    let crMaxSelect;
    let sizeCheckboxes;
    let resetButton;
    let filterToggleButton;
    let filterContent;
    let filterHeader;
    
    // Default filters
    const defaultFilters = {
        cr: {
            min: 0,
            max: 6
        },
        size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
    };
    
    // Current active filters
    let activeFilters = JSON.parse(JSON.stringify(defaultFilters));
    
    /**
     * Initialize the filters component
     */
    const init = function() {
        // Cache DOM elements
        crMinSelect = document.getElementById('cr-min');
        crMaxSelect = document.getElementById('cr-max');
        sizeCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"][value^="Tiny"], .filter-group input[type="checkbox"][value^="Small"], .filter-group input[type="checkbox"][value^="Medium"], .filter-group input[type="checkbox"][value^="Large"], .filter-group input[type="checkbox"][value^="Huge"], .filter-group input[type="checkbox"][value^="Gargantuan"]');
        resetButton = document.getElementById('reset-filters');
        filterToggleButton = document.getElementById('toggle-filters');
        filterContent = document.getElementById('filter-content');
        filterHeader = document.querySelector('.filter-header');
        
        // Set up event listeners
        if (crMinSelect) {
            crMinSelect.addEventListener('change', handleCrChange);
        }
        
        if (crMaxSelect) {
            crMaxSelect.addEventListener('change', handleCrChange);
        }
        
        sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleSizeChange);
        });
        

        if (resetButton) {
            resetButton.addEventListener('click', resetFilters);
        }
        
        // Set up filter toggle functionality
        if (filterHeader) {
            filterHeader.addEventListener('click', toggleFilters);
        }
        
        if (filterToggleButton) {
            filterToggleButton.addEventListener('click', function(event) {
                // Prevent the event from bubbling up to the header
                event.stopPropagation();
                toggleFilters();
            });
        }
        
        // Load saved filter visibility state
        loadFilterVisibilityState();
        
        // Load saved filters from localStorage
        loadSavedFilters();
        
        // Update UI with active filters
        updateFilterUI();
    };
    
    /**
     * Load saved filters from localStorage
     */
    const loadSavedFilters = function() {
        try {
            const savedFilters = localStorage.getItem('beastFilters');
            if (savedFilters) {
                activeFilters = JSON.parse(savedFilters);
            }
        } catch (error) {
            console.error('Error loading saved filters:', error);
            activeFilters = JSON.parse(JSON.stringify(defaultFilters));
        }
    };
    
    /**
     * Save current filters to localStorage
     */
    const saveFilters = function() {
        try {
            localStorage.setItem('beastFilters', JSON.stringify(activeFilters));
        } catch (error) {
            console.error('Error saving filters:', error);
        }
    };
    
    /**
     * Update UI to reflect current filter state
     */
    const updateFilterUI = function() {
        // Update CR selects
        if (crMinSelect) {
            crMinSelect.value = activeFilters.cr.min;
        }
        
        if (crMaxSelect) {
            crMaxSelect.value = activeFilters.cr.max;
        }
        
        // Update size checkboxes
        sizeCheckboxes.forEach(checkbox => {
            checkbox.checked = activeFilters.size.includes(checkbox.value);
        });
        

        // Apply filters
        applyFilters();
    };
    
    /**
     * Handle CR select change
     */
    const handleCrChange = function() {
        const minValue = parseFloat(crMinSelect.value);
        const maxValue = parseFloat(crMaxSelect.value);
        
        // Ensure min is not greater than max
        if (minValue > maxValue) {
            if (this === crMinSelect) {
                crMaxSelect.value = minValue;
                activeFilters.cr.max = minValue;
            } else {
                crMinSelect.value = maxValue;
                activeFilters.cr.min = maxValue;
            }
        }
        
        // Update active filters
        activeFilters.cr.min = parseFloat(crMinSelect.value);
        activeFilters.cr.max = parseFloat(crMaxSelect.value);
        
        // Save and apply filters
        saveFilters();
        applyFilters();
    };
    
    /**
     * Handle size checkbox change
     */
    const handleSizeChange = function() {
        // Update size filters
        activeFilters.size = Array.from(sizeCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        // Save and apply filters
        saveFilters();
        applyFilters();
    };
    
    /**
     * Toggle filters visibility
     */
    const toggleFilters = function(event) {
        // If triggered by event and the click was on the button itself, prevent double toggle
        if (event && event.target === filterToggleButton) {
            return;
        }
        
        if (filterContent) {
            filterContent.classList.toggle('collapsed');
            
            // Update button icon
            if (filterToggleButton) {
                filterToggleButton.classList.toggle('collapsed');
                const icon = filterToggleButton.querySelector('.toggle-icon');
                if (icon) {
                    icon.textContent = filterContent.classList.contains('collapsed') ? '+' : '−';
                }
            }
            
            // Save state to localStorage
            saveFilterVisibilityState();
        }
    };
    
    /**
     * Save filter visibility state to localStorage
     */
    const saveFilterVisibilityState = function() {
        try {
            const isCollapsed = filterContent && filterContent.classList.contains('collapsed');
            localStorage.setItem('filtersCollapsed', isCollapsed ? 'true' : 'false');
        } catch (error) {
            console.error('Error saving filter visibility state:', error);
        }
    };
    
    /**
     * Load filter visibility state from localStorage
     */
    const loadFilterVisibilityState = function() {
        try {
            const isCollapsed = localStorage.getItem('filtersCollapsed') === 'true';
            
            if (isCollapsed && filterContent) {
                filterContent.classList.add('collapsed');
                
                if (filterToggleButton) {
                    filterToggleButton.classList.add('collapsed');
                    const icon = filterToggleButton.querySelector('.toggle-icon');
                    if (icon) {
                        icon.textContent = '+';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading filter visibility state:', error);
        }
    };
    
    /**
     * Apply the current filters
     */
    const applyFilters = function() {
        // Publish filter changed event with current active filters
        EventManager.publish(EventManager.EVENTS.FILTER_APPLIED, activeFilters);
        
        // For backwards compatibility with any components using filter:changed
        EventManager.publish('filter:changed', activeFilters);
    };
    
    /**
     * Reset filters to default values
     */
    const resetFilters = function() {
        // Reset to default filters
        activeFilters = JSON.parse(JSON.stringify(defaultFilters));
        
        // Update UI
        updateFilterUI();
        
        // Save and apply filters
        saveFilters();
        
        // Show notification
        UIUtils.showNotification('Filters have been reset to default values', 'info');
    };
    
    /**
     * Set filters programmatically
     * @param {Object} filters - Filter object to set
     */
    const setFilters = function(filters) {
        // Validate filters
        if (!filters) return;
        
        // Update active filters with provided values
        if (filters.cr) {
            activeFilters.cr.min = typeof filters.cr.min === 'number' ? filters.cr.min : defaultFilters.cr.min;
            activeFilters.cr.max = typeof filters.cr.max === 'number' ? filters.cr.max : defaultFilters.cr.max;
        }
        
        if (filters.size && Array.isArray(filters.size)) {
            activeFilters.size = filters.size;
        }
        

        // Update UI
        updateFilterUI();
        
        // Save filters
        saveFilters();
    };
    
    /**
     * Get the current active filters
     * @returns {Object} The current filters
     */
    const getFilters = function() {
        return JSON.parse(JSON.stringify(activeFilters));
    };
    
    /**
     * Set a preset filter
     * @param {string} preset - Preset name: 'wildshape-all', 'wildshape-moon', 'conjure', 'grassland', 'forest', 'hill'
     */
    const setPresetFilter = function(preset) {
        switch (preset) {
            case 'wildshape-all':
                setFilters({
                    cr: { min: 0, max: 1 },
                    size: ['Tiny', 'Small', 'Medium', 'Large']
                });
                break;
                
            case 'wildshape-moon':
                setFilters({
                    cr: { min: 0, max: 3 },
                    size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge']
                });
                break;
                
            case 'conjure':
                setFilters({
                    cr: { min: 0, max: 2 },
                    size: ['Tiny', 'Small', 'Medium', 'Large']
                });
                break;
                
            case 'grassland':
                setFilters({
                    cr: { min: 0, max: 6 },
                    size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
                });
                break;
                
            case 'forest':
                setFilters({
                    cr: { min: 0, max: 6 },
                    size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
                });
                break;
                
            case 'hill':
                setFilters({
                    cr: { min: 0, max: 6 },
                    size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
                });
                break;
                
            default:
                resetFilters();
        }
    };
    
    /**
     * Apply a filter function to a beast to see if it matches current filters
     * @param {Object} beast - The beast to filter
     * @returns {boolean} True if the beast matches the current filters
     */
    const filterBeast = function(beast) {
        // Filter by CR
        const cr = parseFloat(beast.cr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
        if (cr < activeFilters.cr.min || cr > activeFilters.cr.max) {
            return false;
        }
        
        // Filter by size
        if (!activeFilters.size.includes(beast.size)) {
            return false;
        }
        

        // Beast passed all filters
        return true;
    };
    
    // Public API
    return {
        init,
        resetFilters,
        setFilters,
        getFilters,
        setPresetFilter,
        filterBeast
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    FiltersComponent.init();
});
