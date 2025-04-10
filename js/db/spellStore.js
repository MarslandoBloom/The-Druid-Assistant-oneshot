/**
 * Spell data storage operations
 * Handles CRUD operations for spell data
 */
const SpellStore = (function() {
    // Get store name from Database module
    const STORE_NAME = Database.STORES.SPELLS;
    
    /**
     * Add a single spell to the database
     * @param {Object} spell - The spell data to add
     * @returns {Promise} Resolves with the ID of the added spell
     */
    const addSpell = async (spell) => {
        // Ensure spell has an ID
        if (!spell.id) {
            spell.id = Database.generateUUID();
        }
        
        // Validate spell data
        if (!validateSpell(spell)) {
            throw new Error('Invalid spell data');
        }
        
        return Database.add(STORE_NAME, spell);
    };
    
    /**
     * Add multiple spells to the database
     * @param {Array} spells - Array of spell data to add
     * @returns {Promise} Resolves when all spells are added
     */
    const addSpells = async (spells) => {
        console.log(`Attempting to add ${spells.length} spells to database`);
        
        // Ensure all spells have IDs and are valid
        const validatedSpells = [];
        
        for (const spell of spells) {
            try {
                if (!spell.id) {
                    spell.id = Database.generateUUID();
                }
                
                if (validateSpell(spell)) {
                    validatedSpells.push(spell);
                } else {
                    console.error(`Invalid spell data rejected: ${spell.name || 'unknown'}`);
                }
            } catch (error) {
                console.error(`Error processing spell ${spell.name || 'unknown'}:`, error);
            }
        }
        
        console.log(`Successfully validated ${validatedSpells.length} out of ${spells.length} spells`);
        
        if (validatedSpells.length === 0) {
            throw new Error('No valid spells to add');
        }
        
        return Database.addMultiple(STORE_NAME, validatedSpells);
    };
    
    /**
     * Get a spell by ID
     * @param {string} id - ID of the spell to get
     * @returns {Promise} Resolves with the spell data
     */
    const getSpell = async (id) => {
        return Database.getById(STORE_NAME, id);
    };
    
    /**
     * Get all spells
     * @returns {Promise} Resolves with an array of all spells
     */
    const getAllSpells = async () => {
        return Database.getAll(STORE_NAME);
    };
    
    /**
     * Update a spell
     * @param {Object} spell - Spell data to update
     * @returns {Promise} Resolves when the spell is updated
     */
    const updateSpell = async (spell) => {
        // Ensure spell has an ID
        if (!spell.id) {
            throw new Error('Spell ID is required for update');
        }
        
        // Validate spell data
        if (!validateSpell(spell)) {
            throw new Error('Invalid spell data');
        }
        
        return Database.update(STORE_NAME, spell);
    };
    
    /**
     * Delete a spell
     * @param {string} id - ID of the spell to delete
     * @returns {Promise} Resolves when the spell is deleted
     */
    const deleteSpell = async (id) => {
        return Database.remove(STORE_NAME, id);
    };
    
    /**
     * Clear all spells
     * @returns {Promise} Resolves when all spells are cleared
     */
    const clearSpells = async () => {
        return Database.clear(STORE_NAME);
    };
    
    /**
     * Get spells by level
     * @param {number} level - Spell level to filter by
     * @returns {Promise} Resolves with matching spells
     */
    const getSpellsByLevel = async (level) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.SPELLS.LEVEL, level);
    };
    
    /**
     * Get spells within a level range
     * @param {number} minLevel - Minimum level (inclusive)
     * @param {number} maxLevel - Maximum level (inclusive)
     * @returns {Promise} Resolves with matching spells
     */
    const getSpellsByLevelRange = async (minLevel, maxLevel) => {
        // Get all spells and filter by level range
        const allSpells = await getAllSpells();
        
        return allSpells.filter(spell => {
            return spell.level >= minLevel && spell.level <= maxLevel;
        });
    };
    
    /**
     * Get spells by school
     * @param {string} school - Spell school to filter by
     * @returns {Promise} Resolves with matching spells
     */
    const getSpellsBySchool = async (school) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.SPELLS.SCHOOL, school);
    };
    
    /**
     * Get spells by class
     * @param {string} className - Class name to filter by (e.g., 'Druid')
     * @returns {Promise} Resolves with matching spells
     */
    const getSpellsByClass = async (className) => {
        return Database.getByIndex(STORE_NAME, Database.INDICES.SPELLS.CLASS, className);
    };
    
    /**
     * Search spells by name
     * @param {string} query - Search query
     * @returns {Promise} Resolves with matching spells
     */
    const searchSpells = async (query) => {
        return Database.searchByText(STORE_NAME, Database.INDICES.SPELLS.NAME, query);
    };
    
    /**
     * Prepare a spell
     * @param {string} spellId - ID of the spell to prepare
     * @returns {Promise} Resolves with updated prepared spells list
     */
    const prepareSpell = async (spellId) => {
        // Get current prepared spells
        const preparedSpells = await getPreparedSpells();
        
        // Add this spell if not already prepared
        if (!preparedSpells.includes(spellId)) {
            preparedSpells.push(spellId);
            
            // Save updated prepared spells
            return Database.update(Database.STORES.USER_PREFS, {
                key: 'preparedSpells',
                value: preparedSpells
            });
        }
        
        return preparedSpells;
    };
    
    /**
     * Unprepare a spell
     * @param {string} spellId - ID of the spell to unprepare
     * @returns {Promise} Resolves with updated prepared spells list
     */
    const unprepareSpell = async (spellId) => {
        // Get current prepared spells
        const preparedSpells = await getPreparedSpells();
        
        // Remove this spell from prepared list
        const updatedPreparedSpells = preparedSpells.filter(id => id !== spellId);
        
        // Save updated prepared spells
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'preparedSpells',
            value: updatedPreparedSpells
        });
    };
    
    /**
     * Unprepare all spells
     * @returns {Promise} Resolves when all spells are unprepared
     */
    const unprepareAllSpells = async () => {
        // Save empty prepared spells list
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'preparedSpells',
            value: []
        });
    };
    
    /**
     * Get all prepared spell IDs
     * @returns {Promise} Resolves with an array of prepared spell IDs
     */
    const getPreparedSpells = async () => {
        try {
            const preparedEntry = await Database.getById(Database.STORES.USER_PREFS, 'preparedSpells');
            
            if (preparedEntry) {
                return preparedEntry.value;
            } else {
                // Initialize prepared spells if they don't exist
                await Database.add(Database.STORES.USER_PREFS, {
                    key: 'preparedSpells',
                    value: []
                });
                return [];
            }
        } catch (error) {
            console.error('Error getting prepared spells:', error);
            return [];
        }
    };
    
    /**
     * Get prepared spell details
     * @returns {Promise} Resolves with an array of prepared spell objects
     */
    const getPreparedSpellDetails = async () => {
        const preparedIds = await getPreparedSpells();
        
        if (preparedIds.length === 0) {
            return [];
        }
        
        // Get all spells and filter to just prepared ones
        const allSpells = await getAllSpells();
        return allSpells.filter(spell => preparedIds.includes(spell.id));
    };
    
    /**
     * Record a spell casting in history
     * @param {string} spellId - ID of the cast spell
     * @param {number} slotLevel - Spell slot level used
     * @returns {Promise} Resolves with updated spell history
     */
    const castSpell = async (spellId, slotLevel) => {
        // Get current spell history
        const history = await getSpellHistory();
        
        // Add this casting to history
        const castingRecord = {
            spellId,
            slotLevel,
            timestamp: Date.now()
        };
        
        history.push(castingRecord);
        
        // Save updated history
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'spellHistory',
            value: history
        });
    };
    
    /**
     * Get spell casting history
     * @returns {Promise} Resolves with spell casting history
     */
    const getSpellHistory = async () => {
        try {
            const historyEntry = await Database.getById(Database.STORES.USER_PREFS, 'spellHistory');
            
            if (historyEntry) {
                return historyEntry.value;
            } else {
                // Initialize spell history if it doesn't exist
                await Database.add(Database.STORES.USER_PREFS, {
                    key: 'spellHistory',
                    value: []
                });
                return [];
            }
        } catch (error) {
            console.error('Error getting spell history:', error);
            return [];
        }
    };
    
    /**
     * Get detailed spell history with spell details
     * @returns {Promise} Resolves with detailed spell history
     */
    const getDetailedSpellHistory = async () => {
        const history = await getSpellHistory();
        
        if (history.length === 0) {
            return [];
        }
        
        // Get all spells
        const allSpells = await getAllSpells();
        const spellsMap = new Map(allSpells.map(spell => [spell.id, spell]));
        
        // Add spell details to history records
        return history.map(record => ({
            ...record,
            spell: spellsMap.get(record.spellId) || { name: 'Unknown Spell' }
        }));
    };
    
    /**
     * Clear spell casting history
     * @returns {Promise} Resolves when history is cleared
     */
    const clearSpellHistory = async () => {
        // Save empty history
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'spellHistory',
            value: []
        });
    };
    
    /**
     * Get available spell slots based on Druid level
     * @param {number} druidLevel - Character's Druid level (1-20)
     * @returns {Array} Array of spell slots per level
     */
    const getSpellSlots = (druidLevel) => {
        // Spell slots by level, index is spell level (0 = cantrips)
        // Values represent number of slots available
        const spellSlotsByLevel = {
            1: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],  // unlimited cantrips represented by 0
            2: [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
            4: [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
            5: [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
            6: [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
            7: [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
            8: [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
            9: [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
            10: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
            11: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
            12: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
            13: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
            14: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
            15: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
            16: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
            17: [0, 4, 3, 3, 3, 2, 1, 1, 1, 1],
            18: [0, 4, 3, 3, 3, 3, 1, 1, 1, 1],
            19: [0, 4, 3, 3, 3, 3, 2, 1, 1, 1],
            20: [0, 4, 3, 3, 3, 3, 2, 2, 1, 1]
        };
        
        // Validate druid level
        const level = Math.max(1, Math.min(20, druidLevel || 1));
        
        return spellSlotsByLevel[level];
    };
    
    /**
     * Calculate the maximum number of prepared spells
     * @param {number} druidLevel - Character's Druid level
     * @param {number} wisdomModifier - Character's Wisdom modifier
     * @returns {number} Maximum number of prepared spells
     */
    const getMaxPreparedSpells = (druidLevel, wisdomModifier) => {
        // Druids can prepare druid level + wisdom modifier spells
        return Math.max(1, (druidLevel || 1) + (wisdomModifier || 0));
    };
    
    /**
     * Get used spell slots from history
     * @returns {Promise} Resolves with array of used spell slots per level
     */
    const getUsedSpellSlots = async () => {
        const history = await getSpellHistory();
        
        // Initialize array of used slots (index is spell level)
        const usedSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        // Count used slots by level
        history.forEach(record => {
            if (record.slotLevel >= 1 && record.slotLevel <= 9) {
                usedSlots[record.slotLevel]++;
            }
        });
        
        return usedSlots;
    };
    
    /**
     * Get available spell slots based on Druid level and used slots
     * @param {number} druidLevel - Character's Druid level
     * @returns {Promise} Resolves with array of available spell slots
     */
    const getAvailableSpellSlots = async (druidLevel) => {
        const totalSlots = getSpellSlots(druidLevel);
        const usedSlots = await getUsedSpellSlots();
        
        // Calculate available slots (total - used)
        const availableSlots = totalSlots.map((total, index) => {
            // For cantrips (level 0), always return unlimited (represented by -1)
            if (index === 0) return -1;
            // For other levels, calculate remaining slots
            return Math.max(0, total - usedSlots[index]);
        });
        
        return availableSlots;
    };
    
    /**
     * Get Druid level stored in preferences
     * @returns {Promise} Resolves with stored Druid level
     */
    const getDruidLevel = async () => {
        try {
            const levelEntry = await Database.getById(Database.STORES.USER_PREFS, 'druidLevel');
            
            if (levelEntry) {
                return levelEntry.value;
            } else {
                // Initialize Druid level if it doesn't exist
                await Database.add(Database.STORES.USER_PREFS, {
                    key: 'druidLevel',
                    value: 1
                });
                return 1;
            }
        } catch (error) {
            console.error('Error getting Druid level:', error);
            return 1;
        }
    };
    
    /**
     * Set Druid level
     * @param {number} level - Druid level (1-20)
     * @returns {Promise} Resolves when level is set
     */
    const setDruidLevel = async (level) => {
        // Validate level
        const validLevel = Math.max(1, Math.min(20, level));
        
        return Database.update(Database.STORES.USER_PREFS, {
            key: 'druidLevel',
            value: validLevel
        });
    };
    
    /**
     * Get spells by multiple filter criteria
     * @param {Object} filters - Filter criteria
     * @returns {Promise} Resolves with matching spells
     */
    const filterSpells = async (filters) => {
        // Get all spells
        const allSpells = await getAllSpells();
        
        // Apply filters
        return allSpells.filter(spell => {
            // Filter by level range
            if (filters.minLevel !== undefined && filters.maxLevel !== undefined) {
                if (spell.level < filters.minLevel || spell.level > filters.maxLevel) {
                    return false;
                }
            }
            
            // Filter by school
            if (filters.schools && filters.schools.length > 0) {
                if (!filters.schools.includes(spell.school)) {
                    return false;
                }
            }
            
            // Filter by class
            if (filters.classes && filters.classes.length > 0) {
                // Make sure the spell is available to at least one of the specified classes
                const hasMatchingClass = filters.classes.some(className => 
                    spell.classes.includes(className)
                );
                
                if (!hasMatchingClass) {
                    return false;
                }
            }
            
            // Filter by search term
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTerm = filters.searchTerm.toLowerCase();
                return spell.name.toLowerCase().includes(searchTerm);
            }
            
            // If all filters pass, include the spell
            return true;
        });
    };
    
    /**
     * Validate spell data structure
     * @param {Object} spell - Spell data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    const validateSpell = (spell) => {
        // Required fields
        if (!spell.name || spell.level === undefined || !spell.school) {
            console.warn(`Invalid spell missing required fields: ${spell.name || 'unnamed'}`);
            return false;
        }
        
        // Ensure spell level is a number between 0 and 9
        if (typeof spell.level !== 'number' || spell.level < 0 || spell.level > 9) {
            console.warn(`Invalid spell level for ${spell.name}: ${spell.level}`);
            return false;
        }
        
        // Ensure classes is an array or convert it to one
        if (!spell.classes) {
            // Default to empty array if classes is missing
            spell.classes = [];
        } else if (!Array.isArray(spell.classes)) {
            // If classes is a string, convert it to an array
            if (typeof spell.classes === 'string') {
                spell.classes = spell.classes.split(', ').map(c => c.trim());
            } else {
                console.warn(`Invalid classes format for ${spell.name}: ${typeof spell.classes}`);
                // Instead of failing, convert to empty array
                spell.classes = [];
            }
        }
        
        return true;
    };
    
    // Public API
    return {
        // CRUD operations
        addSpell,
        addSpells,
        getSpell,
        getAllSpells,
        updateSpell,
        deleteSpell,
        clearSpells,
        
        // Specialized queries
        getSpellsByLevel,
        getSpellsByLevelRange,
        getSpellsBySchool,
        getSpellsByClass,
        searchSpells,
        filterSpells,
        
        // Spell preparation
        prepareSpell,
        unprepareSpell,
        unprepareAllSpells,
        getPreparedSpells,
        getPreparedSpellDetails,
        getMaxPreparedSpells,
        
        // Spell casting and history
        castSpell,
        getSpellHistory,
        getDetailedSpellHistory,
        clearSpellHistory,
        
        // Spell slots
        getSpellSlots,
        getUsedSpellSlots,
        getAvailableSpellSlots,
        
        // Druid level
        getDruidLevel,
        setDruidLevel,
        
        // Utility functions
        validateSpell
    };
})();
