/**
 * User preferences storage operations
 * Handles storing and retrieving user preferences
 */
const UserStore = (function() {
    // Get store name from Database module
    const STORE_NAME = Database.STORES.USER_PREFS;
    
    // Constants for settings keys
    const KEYS = {
        FAVORITES: 'favorites'
    };
    
    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if setting doesn't exist
     * @returns {Promise} Resolves with setting value
     */
    const getSetting = async (key, defaultValue = null) => {
        try {
            const setting = await Database.getById(STORE_NAME, key);
            
            if (setting) {
                return setting.value;
            } else {
                // If setting doesn't exist and default value is provided, create it
                if (defaultValue !== null) {
                    await setSetting(key, defaultValue);
                }
                return defaultValue;
            }
        } catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            return defaultValue;
        }
    };
    
    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @returns {Promise} Resolves when setting is saved
     */
    const setSetting = async (key, value) => {
        try {
            // Check if setting already exists
            const existing = await Database.getById(STORE_NAME, key);
            
            if (existing) {
                return Database.update(STORE_NAME, {
                    key,
                    value
                });
            } else {
                return Database.add(STORE_NAME, {
                    key,
                    value
                });
            }
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            throw error;
        }
    };
    
    /**
     * Delete a setting
     * @param {string} key - Setting key
     * @returns {Promise} Resolves when setting is deleted
     */
    const deleteSetting = async (key) => {
        try {
            return Database.remove(STORE_NAME, key);
        } catch (error) {
            console.error(`Error deleting setting ${key}:`, error);
            throw error;
        }
    };
    
    /**
     * Get multiple settings at once
     * @param {string[]} keys - Array of setting keys
     * @param {Object} defaults - Default values map
     * @returns {Promise} Resolves with settings object
     */
    const getSettings = async (keys, defaults = {}) => {
        try {
            const settings = {};
            
            // Get each setting
            for (const key of keys) {
                settings[key] = await getSetting(key, defaults[key]);
            }
            
            return settings;
        } catch (error) {
            console.error('Error getting multiple settings:', error);
            return { ...defaults };
        }
    };
    
    /**
     * Set multiple settings at once
     * @param {Object} settings - Settings object with key-value pairs
     * @returns {Promise} Resolves when all settings are saved
     */
    const setSettings = async (settings) => {
        try {
            const promises = Object.entries(settings).map(([key, value]) => 
                setSetting(key, value)
            );
            
            return Promise.all(promises);
        } catch (error) {
            console.error('Error setting multiple settings:', error);
            throw error;
        }
    };
    
    /**
     * Clear all settings
     * @returns {Promise} Resolves when all settings are cleared
     */
    const clearSettings = async () => {
        try {
            return Database.clear(STORE_NAME);
        } catch (error) {
            console.error('Error clearing settings:', error);
            throw error;
        }
    };
    
    /**
     * Save UI state
     * @param {string} component - Component name
     * @param {Object} state - UI state to save
     * @returns {Promise} Resolves when state is saved
     */
    const saveUIState = async (component, state) => {
        return setSetting(`ui.${component}`, state);
    };
    
    /**
     * Load UI state
     * @param {string} component - Component name
     * @param {Object} defaultState - Default state if none exists
     * @returns {Promise} Resolves with UI state
     */
    const loadUIState = async (component, defaultState = {}) => {
        return getSetting(`ui.${component}`, defaultState);
    };
    
    /**
     * Save filter state
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @param {Object} filters - Filter state to save
     * @returns {Promise} Resolves when filters are saved
     */
    const saveFilters = async (tabName, filters) => {
        return setSetting(`filters.${tabName}`, filters);
    };
    
    /**
     * Load filter state
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @param {Object} defaultFilters - Default filters if none exist
     * @returns {Promise} Resolves with filter state
     */
    const loadFilters = async (tabName, defaultFilters = {}) => {
        return getSetting(`filters.${tabName}`, defaultFilters);
    };
    
    /**
     * Reset filter state
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @returns {Promise} Resolves when filters are reset
     */
    const resetFilters = async (tabName) => {
        return deleteSetting(`filters.${tabName}`);
    };
    
    /**
     * Save search history
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @param {string[]} searches - Recent searches to save
     * @returns {Promise} Resolves when search history is saved
     */
    const saveSearchHistory = async (tabName, searches) => {
        // Keep only the last 10 searches
        const limitedSearches = searches.slice(0, 10);
        return setSetting(`search.${tabName}`, limitedSearches);
    };
    
    /**
     * Load search history
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @returns {Promise} Resolves with search history
     */
    const loadSearchHistory = async (tabName) => {
        return getSetting(`search.${tabName}`, []);
    };
    
    /**
     * Add search to history
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @param {string} search - Search term to add
     * @returns {Promise} Resolves with updated search history
     */
    const addSearchToHistory = async (tabName, search) => {
        if (!search || search.trim() === '') {
            return loadSearchHistory(tabName);
        }
        
        const history = await loadSearchHistory(tabName);
        
        // Remove any existing instances of this search
        const filteredHistory = history.filter(s => s !== search);
        
        // Add to the beginning of the array
        filteredHistory.unshift(search);
        
        // Save and return updated history
        await saveSearchHistory(tabName, filteredHistory);
        return filteredHistory;
    };
    
    /**
     * Clear search history
     * @param {string} tabName - Tab name (e.g., 'statblock', 'spells')
     * @returns {Promise} Resolves when search history is cleared
     */
    const clearSearchHistory = async (tabName) => {
        return deleteSetting(`search.${tabName}`);
    };
    
    /**
     * Get all favorites
     * @returns {Promise<string[]>} Promise resolving to array of favorite IDs
     */
    const getFavorites = async () => {
        try {
            // Direct database check first
            const existing = await Database.getById(STORE_NAME, KEYS.FAVORITES);
            
            if (existing) {
                return existing.value || [];
            }
            
            // If not found, create the setting
            await Database.update(STORE_NAME, {
                key: KEYS.FAVORITES,
                value: []
            });
            
            return [];
        } catch (error) {
            console.warn('Error getting favorites, returning empty array:', error);
            return [];
        }
    };
    
    /**
     * Check if an entity is favorited
     * @param {string} id - Entity ID to check
     * @returns {Promise<boolean>} Promise resolving to boolean indicating favorite status
     */
    const isFavorite = async (id) => {
        const favorites = await getFavorites();
        return favorites.includes(id);
    };
    
    /**
     * Add a favorite
     * @param {string} id - Entity ID to add to favorites
     * @returns {Promise<boolean>} Promise resolving to success indicator
     */
    const addFavorite = async (id) => {
        if (!id) return false;
        
        const favorites = await getFavorites();
        
        // Check if already exists
        if (favorites.includes(id)) {
            return true; // Already a favorite
        }
        
        // Add to favorites
        favorites.push(id);
        await setSetting(KEYS.FAVORITES, favorites);
        
        return true;
    };
    
    /**
     * Remove a favorite
     * @param {string} id - Entity ID to remove from favorites
     * @returns {Promise<boolean>} Promise resolving to success indicator
     */
    const removeFavorite = async (id) => {
        if (!id) return false;
        
        const favorites = await getFavorites();
        
        // Check if exists
        if (!favorites.includes(id)) {
            return true; // Not a favorite, no action needed
        }
        
        // Remove from favorites
        const updatedFavorites = favorites.filter(fid => fid !== id);
        await setSetting(KEYS.FAVORITES, updatedFavorites);
        
        return true;
    };
    
    /**
     * Clear all favorites
     * @returns {Promise<boolean>} Promise resolving to success indicator
     */
    const clearFavorites = async () => {
        await setSetting(KEYS.FAVORITES, []);
        return true;
    };
    
    /**
     * Get all settings
     * @returns {Promise} Resolves with all settings
     */
    const getAllSettings = async () => {
        try {
            return Database.getAll(STORE_NAME);
        } catch (error) {
            console.error('Error getting all settings:', error);
            return [];
        }
    };
    
    /**
     * Export settings to JSON
     * @returns {Promise} Resolves with settings JSON
     */
    const exportSettings = async () => {
        const settings = await getAllSettings();
        return JSON.stringify(settings, null, 2);
    };
    
    /**
     * Import settings from JSON
     * @param {string} json - Settings JSON
     * @param {boolean} overwrite - Whether to overwrite existing settings
     * @returns {Promise} Resolves when settings are imported
     */
    const importSettings = async (json, overwrite = false) => {
        try {
            const settings = JSON.parse(json);
            
            if (overwrite) {
                await clearSettings();
            }
            
            const promises = settings.map(setting => setSetting(setting.key, setting.value));
            await Promise.all(promises);
            
            return { success: true, count: settings.length };
        } catch (error) {
            console.error('Error importing settings:', error);
            throw new Error('Invalid settings JSON: ' + error.message);
        }
    };
    
    // Public API
    return {
        // Basic operations
        getSetting,
        setSetting,
        deleteSetting,
        getSettings,
        setSettings,
        clearSettings,
        
        // UI state
        saveUIState,
        loadUIState,
        
        // Filters
        saveFilters,
        loadFilters,
        resetFilters,
        
        // Search history
        saveSearchHistory,
        loadSearchHistory,
        addSearchToHistory,
        clearSearchHistory,
        
        // Favorites
        getFavorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        
        // Import/Export
        getAllSettings,
        exportSettings,
        importSettings
    };
})();
