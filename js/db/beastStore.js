/**
 * Beast data storage operations
 * Handles CRUD operations for beast data
 */
const BeastStore = (function() {
    // Get store name from Database module
    const STORE_NAME = Database.STORES.BEASTS;
    
    /**
     * Add a single beast to the database
     * @param {Object} beast - The beast data to add
     * @returns {Promise} Resolves with the ID of the added beast
     */
    const addBeast = async (beast) => {
        // Ensure beast has an ID
        if (!beast.id) {
            beast.id = Database.generateUUID();
        }
        
        // Validate beast data
        if (!validateBeast(beast)) {
            throw new Error('Invalid beast data');
        }
        
        return Database.add(STORE_NAME, beast);
    };
    
    /**
     * Add multiple beasts to the database
     * @param {Array} beasts - Array of beast data to add
     * @returns {Promise} Resolves when all beasts are added
     */
    const addBeasts = async (beasts) => {
        // Ensure all beasts have IDs and are valid
        const validatedBeasts = beasts.map(beast => {
            if (!beast.id) {
                beast.id = Database.generateUUID();
            }
            
            if (!validateBeast(beast)) {
                throw new Error(`Invalid beast data: ${beast.name || 'unknown'}`);
            }
            
            return beast;
        });
        
        return Database.addMultiple(STORE_NAME, validatedBeasts);
    };
    
    /**
     * Get a beast by ID
     * @param {string} id - ID of the beast to get
     * @returns {Promise} Resolves with the beast data
     */
    const getBeast = async (id) => {
        return Database.getById(STORE_NAME, id);
    };
    
    /**
     * Get all beasts
     * @returns {Promise} Resolves with an array of all beasts
     */
    const getAllBeasts = async () => {
        return Database.getAll(STORE_NAME);
    };
    
    /**
     * Update a beast
     * @param {Object} beast - Beast data to update
     * @returns {Promise} Resolves when the beast is updated
     */
    const updateBeast = async (beast) => {
        // Ensure beast has an ID
        if (!beast.id) {
            throw new Error('Beast ID is required for update');
        }
        
        // Validate beast data
        if (!validateBeast(beast)) {
            throw new Error('Invalid beast data');
        }
        
        return Database.update(STORE_NAME, beast);
    };
    
    /**
     * Delete a beast
     * @param {string} id - ID of the beast to delete
     * @returns {Promise} Resolves when the beast is deleted
     */
    const deleteBeast = async (id) => {
        return Database.remove(STORE_NAME, id);
    };
    
    /**
     * Clear all beasts
     * @returns {Promise} Resolves when all beasts are cleared
     */
    const clearBeasts = async () => {
        return Database.clear(STORE_NAME);
    };
    
    /**
     * Get beasts by CR
     * @param {number|string} cr - Challenge Rating to filter by
     * @returns {Promise} Resolves with matching beasts
     */
    const getBeastsByCR = async (cr) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.BEASTS.CR, cr);
    };
    
    /**
     * Get beasts within a CR range
     * @param {number|string} minCR - Minimum CR (inclusive)
     * @param {number|string} maxCR - Maximum CR (inclusive)
     * @returns {Promise} Resolves with matching beasts
     */
    const getBeastsByCRRange = async (minCR, maxCR) => {
        // Convert string CRs to numbers for comparison
        const numericMinCR = typeof minCR === 'string' ? parseCR(minCR) : minCR;
        const numericMaxCR = typeof maxCR === 'string' ? parseCR(maxCR) : maxCR;
        
        // Get all beasts and filter by CR range
        const allBeasts = await getAllBeasts();
        
        return allBeasts.filter(beast => {
            const beastCR = typeof beast.cr === 'string' ? parseCR(beast.cr) : beast.cr;
            return beastCR >= numericMinCR && beastCR <= numericMaxCR;
        });
    };
    
    /**
     * Get beasts by size
     * @param {string} size - Size to filter by
     * @returns {Promise} Resolves with matching beasts
     */
    const getBeastsBySize = async (size) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.BEASTS.SIZE, size);
    };
    
    /**
     * Get beasts by type
     * @param {string} type - Type to filter by
     * @returns {Promise} Resolves with matching beasts
     */
    const getBeastsByType = async (type) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.BEASTS.TYPE, type);
    };
    
    /**
     * Get beasts by environment
     * @param {string} environment - Environment to filter by
     * @returns {Promise} Resolves with matching beasts
     */
    const getBeastsByEnvironment = async (environment) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.BEASTS.ENVIRONMENT, environment);
    };
    
    /**
     * Search beasts by name
     * @param {string} query - Search query
     * @returns {Promise} Resolves with matching beasts
     */
    const searchBeasts = async (query) => {
        return Database.searchByText(STORE_NAME, Database.INDICES.BEASTS.NAME, query);
    };
    
    /**
     * Add a beast to favorites
     * @param {string} beastId - ID of the beast to add to favorites
     * @returns {Promise} Resolves when favorite is added
     */
    const addFavorite = async (beastId) => {
        // Get current favorites
        const favorites = await getFavorites();
        
        // Add this beast if not already in favorites
        if (!favorites.includes(beastId)) {
            favorites.push(beastId);
            
            // Save updated favorites
            return Database.update(Database.STORES.USER_PREFS, {
                key: 'favorites',
                value: favorites
            });
        }
        
        return favorites;
    };
    
    /**
     * Remove a beast from favorites
     * @param {string} beastId - ID of the beast to remove from favorites
     * @returns {Promise} Resolves when favorite is removed
     */
    const removeFavorite = async (beastId) => {
        // Get current favorites
        const favorites = await getFavorites();
        
        // Remove this beast from favorites
        const updatedFavorites = favorites.filter(id => id !== beastId);
        
        // Save updated favorites
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'favorites',
            value: updatedFavorites
        });
    };
    
    /**
     * Get all favorite beasts
     * @returns {Promise} Resolves with an array of favorite beast IDs
     */
    const getFavorites = async () => {
        try {
            const favoritesEntry = await Database.getById(Database.STORES.USER_PREFS, 'favorites');
            
            if (favoritesEntry) {
                return favoritesEntry.value;
            } else {
                // Initialize favorites if they don't exist
                await Database.add(Database.STORES.USER_PREFS, {
                    key: 'favorites',
                    value: []
                });
                return [];
            }
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    };
    
    /**
     * Get favorite beast details
     * @returns {Promise} Resolves with an array of favorite beast objects
     */
    const getFavoriteBeasts = async () => {
        const favoriteIds = await getFavorites();
        
        if (favoriteIds.length === 0) {
            return [];
        }
        
        // Get all beasts and filter to just favorites
        const allBeasts = await getAllBeasts();
        return allBeasts.filter(beast => favoriteIds.includes(beast.id));
    };
    
    /**
     * Get beasts by multiple filter criteria
     * @param {Object} filters - Filter criteria
     * @returns {Promise} Resolves with matching beasts
     */
    const filterBeasts = async (filters) => {
        // Get all beasts
        const allBeasts = await getAllBeasts();
        
        // Apply filters
        return allBeasts.filter(beast => {
            // Filter by CR range
            if (filters.minCR !== undefined && filters.maxCR !== undefined) {
                const beastCR = typeof beast.cr === 'string' ? parseCR(beast.cr) : beast.cr;
                if (beastCR < filters.minCR || beastCR > filters.maxCR) {
                    return false;
                }
            }
            
            // Filter by size
            if (filters.sizes && filters.sizes.length > 0) {
                if (!filters.sizes.includes(beast.size)) {
                    return false;
                }
            }
            
            // Filter by environment
            if (filters.environments && filters.environments.length > 0) {
                // Handle cases where beast has multiple environments
                const beastEnvironments = Array.isArray(beast.environment) 
                    ? beast.environment 
                    : [beast.environment];
                
                // Check if any of the beast's environments match the filter
                const hasMatchingEnvironment = beastEnvironments.some(env => 
                    filters.environments.includes(env)
                );
                
                if (!hasMatchingEnvironment) {
                    return false;
                }
            }
            
            // Filter by search term
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTerm = filters.searchTerm.toLowerCase();
                if (!beast.name.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            
            // If all filters pass, include the beast
            return true;
        });
    };
    
    /**
     * Parse CR string to numeric value
     * @param {string} cr - CR string (e.g., '1/4', '1/2', '2')
     * @returns {number} Numeric CR value
     */
    const parseCR = (cr) => {
        // Handle fractions
        if (cr === '1/8') return 0.125;
        if (cr === '1/4') return 0.25;
        if (cr === '1/2') return 0.5;
        
        // Handle numeric strings and extract the first number if CR includes XP
        const match = cr.match(/^(\d+)/);
        if (match) {
            return parseFloat(match[1]);
        }
        
        // Default
        return 0;
    };
    
    /**
     * Validate beast data structure
     * @param {Object} beast - Beast data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    const validateBeast = (beast) => {
        // Required fields
        if (!beast.name || !beast.size || !beast.type) {
            return false;
        }
        
        // Ensure abilities is an object with the required properties
        if (!beast.abilities || typeof beast.abilities !== 'object') {
            return false;
        }
        
        const requiredAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        for (const ability of requiredAbilities) {
            if (!beast.abilities[ability]) {
                // Create default values if missing
                beast.abilities[ability] = {
                    score: 10,
                    modifier: '+0'
                };
            }
        }
        
        // Ensure actions is an array
        if (beast.actions && !Array.isArray(beast.actions)) {
            return false;
        }
        
        // Ensure traits is an array
        if (beast.traits && !Array.isArray(beast.traits)) {
            return false;
        }
        
        return true;
    };
    
    // Public API
    return {
        // CRUD operations
        addBeast,
        addBeasts,
        getBeast,
        getAllBeasts,
        updateBeast,
        deleteBeast,
        clearBeasts,
        
        // Specialized queries
        getBeastsByCR,
        getBeastsByCRRange,
        getBeastsBySize,
        getBeastsByType,
        getBeastsByEnvironment,
        searchBeasts,
        filterBeasts,
        
        // Favorites management
        addFavorite,
        removeFavorite,
        getFavorites,
        getFavoriteBeasts,
        
        // Utility functions
        parseCR,
        validateBeast
    };
})();
