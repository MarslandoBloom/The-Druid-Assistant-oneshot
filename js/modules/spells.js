/**
 * Spells Tab Module
 * Handles spell management for Druids
 */
const SpellsModule = (function() {
    // DOM Element references
    const elements = {
        // Tab and containers
        spellsTab: null,
        spellList: null,
        spellDetail: null,
        
        // Druid level management
        druidLevelInput: null,
        levelUpButton: null,
        levelDownButton: null,
        wisdomModifierSelect: null,
        preparationLimit: null,
        
        // Spell management buttons
        unprepareAllButton: null,
        resetHistoryButton: null,
        restButton: null,
        
        // View tabs
        viewTabs: null,
        
        // Search
        spellSearch: null,
        clearSpellSearch: null,
        
        // Filters
        filterToggle: null,
        spellFilterContent: null,
        spellLevelMin: null,
        spellLevelMax: null,
        classCheckboxes: null,
        resetFiltersButton: null,
        
        // Spell slots
        spellSlotsContainer: null
    };
    
    // Current state
    const state = {
        currentView: 'all',         // 'all', 'prepared', or 'history'
        selectedSpellId: null,
        searchTerm: '',
        filters: {
            minLevel: 0,
            maxLevel: 9,
            classes: ['Druid']
        },
        druidLevel: 1,
        wisdomModifier: 3,
        preparedSpells: [],         // Array of spell IDs
        spellHistory: [],           // Array of casting records
        allSpells: [],              // Cache of all spells
        warningShown: false,        // Track if we've shown the over-limit warning
        sortMethod: 'level-desc'    // Default sort method: level-desc, level-asc, name-asc, name-desc
    };
    
    /**
     * Initialize the spells module
     */
    const init = async () => {
        // Cache DOM elements
        cacheElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial data
        await loadInitialData();
        
        // Register for global events
        registerEvents();
        
        // Initial render
        renderSpellList();
        updateSpellSlots();
        
        console.log('Spells module initialized');
    };
    
    /**
     * Cache DOM element references
     */
    const cacheElements = () => {
        elements.spellsTab = document.getElementById('spells-tab');
        elements.spellList = document.getElementById('spell-list');
        elements.spellDetail = document.getElementById('spell-detail');
        
        elements.druidLevelInput = document.getElementById('druid-level-input');
        elements.levelUpButton = elements.spellsTab.querySelector('.level-up');
        elements.levelDownButton = elements.spellsTab.querySelector('.level-down');
        elements.wisdomModifierSelect = document.getElementById('wisdom-modifier-select');
        elements.preparationLimit = elements.spellsTab.querySelector('.preparation-limit');
        
        elements.unprepareAllButton = document.getElementById('unprepare-all');
        elements.resetHistoryButton = document.getElementById('reset-history');
        elements.restButton = document.getElementById('rest-button');
        
        elements.viewTabs = elements.spellsTab.querySelectorAll('.spell-view-tabs .tab-btn');
        
        elements.spellSearch = document.getElementById('spell-search');
        elements.clearSpellSearch = document.getElementById('clear-spell-search');
        
        elements.filterToggle = document.getElementById('toggle-spell-filters');
        elements.spellFilterContent = document.getElementById('spell-filter-content');
        elements.spellLevelMin = document.getElementById('spell-level-min');
        elements.spellLevelMax = document.getElementById('spell-level-max');
        elements.classCheckboxes = elements.spellsTab.querySelectorAll('.checkbox-filter input[type="checkbox"]');
        elements.resetFiltersButton = document.getElementById('reset-spell-filters');
        
        elements.spellSlotsContainer = elements.spellsTab.querySelector('.spell-slots');
    };
    
    /**
     * Set up event listeners
     */
    const setupEventListeners = () => {
        // Druid level management
        elements.druidLevelInput.addEventListener('change', handleDruidLevelChange);
        elements.levelUpButton.addEventListener('click', handleLevelUp);
        elements.levelDownButton.addEventListener('click', handleLevelDown);
        elements.wisdomModifierSelect.addEventListener('change', handleWisdomModifierChange);
        
        // Spell management buttons
        elements.unprepareAllButton.addEventListener('click', handleUnprepareAll);
        elements.resetHistoryButton.addEventListener('click', handleResetHistory);
        elements.restButton.addEventListener('click', handleLongRest);
        
        // View tabs
        elements.viewTabs.forEach(tab => {
            tab.addEventListener('click', () => handleViewChange(tab.dataset.view));
        });
        
        // Search
        elements.spellSearch.addEventListener('input', handleSearchInput);
        elements.clearSpellSearch.addEventListener('click', handleClearSearch);
        
        // Filters
        elements.filterToggle.addEventListener('click', toggleFilters);
        elements.spellLevelMin.addEventListener('change', handleLevelFilterChange);
        elements.spellLevelMax.addEventListener('change', handleLevelFilterChange);
        elements.classCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleClassFilterChange);
        });
        elements.resetFiltersButton.addEventListener('click', handleResetFilters);
    };
    
    /**
     * Load initial data
     */
    const loadInitialData = async () => {
        try {
            // Load druid level from storage
            const savedDruidLevel = await SpellStore.getDruidLevel();
            state.druidLevel = savedDruidLevel;
            elements.druidLevelInput.value = savedDruidLevel;
            
            // Load wisdom modifier from local storage
            const savedWisdomMod = localStorage.getItem('wisdomModifier');
            if (savedWisdomMod !== null) {
                state.wisdomModifier = parseInt(savedWisdomMod);
                elements.wisdomModifierSelect.value = savedWisdomMod;
            }
            
            // Load prepared spells
            state.preparedSpells = await SpellStore.getPreparedSpells();
            
            // Load spell history
            state.spellHistory = await SpellStore.getSpellHistory();
            
            // Load all spells
            state.allSpells = await SpellStore.getAllSpells();
            
            console.log('Loaded spells:', state.allSpells.length);
            // Log the first few spells to see their structure
            if (state.allSpells.length > 0) {
                console.log('First 3 spells:');
                for (let i = 0; i < Math.min(3, state.allSpells.length); i++) {
                    console.log(`Spell ${i+1}: ${state.allSpells[i].name}`, 'classes:', state.allSpells[i].classes);
                }
            }
            // Sort spells by level (high to low) and then by name
            state.allSpells.sort((a, b) => {
                if (b.level === a.level) {
                    return a.name.localeCompare(b.name);
                }
                return b.level - a.level;
            });
            
            // Update UI based on loaded data
            updatePreparedCount();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            UIUtils.showNotification('Failed to load spell data', 'error');
        }
    };
    
    /**
     * Register for global events
     */
    const registerEvents = () => {
        // Listen for spell selection events
        EventManager.subscribe('spell:selected', handleSpellSelected);
        
        // Listen for preparation change events
        EventManager.subscribe('spell:preparation:changed', handlePreparationChanged);
        
        // Listen for spell cast events
        EventManager.subscribe('spell:cast', handleSpellCast);
        
        // Listen for tab change events
        EventManager.subscribe('tab:changed', handleTabChanged);
        
        // Listen for data import events
        EventManager.subscribe('data:imported', handleDataImported);
        
        // Listen for spell tab shown events
        EventManager.subscribe('spell:tab:shown', () => {
            // Refresh data when spell tab is explicitly shown
            loadInitialData().then(() => {
                renderSpellList();
                updateSpellSlots();
            });
        });
    };
    
    /**
     * Handle druid level change
     * @param {Event} event - Change event
     */
    const handleDruidLevelChange = async (event) => {
        try {
            // Get new level
            let newLevel = parseInt(event.target.value);
            
            // Validate level (1-20)
            newLevel = Math.max(1, Math.min(20, newLevel));
            
            // Update UI if validation changed the value
            if (newLevel !== parseInt(event.target.value)) {
                event.target.value = newLevel;
            }
            
            // Update state
            state.druidLevel = newLevel;
            
            // Save to storage
            await SpellStore.setDruidLevel(newLevel);
            
            // Update UI
            updatePreparedCount();
            updateSpellSlots();
            
            UIUtils.showNotification(`Druid level set to ${newLevel}`, 'success');
        } catch (error) {
            console.error('Error changing druid level:', error);
            UIUtils.showNotification('Failed to update druid level', 'error');
        }
    };
    
    /**
     * Handle level up button click
     */
    const handleLevelUp = () => {
        if (state.druidLevel < 20) {
            elements.druidLevelInput.value = state.druidLevel + 1;
            elements.druidLevelInput.dispatchEvent(new Event('change'));
        }
    };
    
    /**
     * Handle level down button click
     */
    const handleLevelDown = () => {
        if (state.druidLevel > 1) {
            elements.druidLevelInput.value = state.druidLevel - 1;
            elements.druidLevelInput.dispatchEvent(new Event('change'));
        }
    };
    
    /**
     * Handle wisdom modifier change
     * @param {Event} event - Change event
     */
    const handleWisdomModifierChange = (event) => {
        try {
            // Get new wisdom modifier
            const newMod = parseInt(event.target.value);
            
            // Update state
            state.wisdomModifier = newMod;
            
            // Save to local storage
            localStorage.setItem('wisdomModifier', newMod);
            
            // Update UI
            updatePreparedCount();
            
        } catch (error) {
            console.error('Error changing wisdom modifier:', error);
            UIUtils.showNotification('Failed to update wisdom modifier', 'error');
        }
    };
    
    /**
     * Handle unprepare all button click
     */
    const handleUnprepareAll = async () => {
        try {
            // Confirm with user
            if (!confirm('Are you sure you want to unprepare all spells?')) {
                return;
            }
            
            // Unprepare all spells
            await SpellStore.unprepareAllSpells();
            
            // Update state
            state.preparedSpells = [];
            
            // Update UI
            updatePreparedCount();
            renderSpellList();
            
            if (state.selectedSpellId) {
                renderSpellDetail(state.selectedSpellId);
            }
            
            UIUtils.showNotification('All spells unprepared', 'success');
        } catch (error) {
            console.error('Error unpreparing all spells:', error);
            UIUtils.showNotification('Failed to unprepare all spells', 'error');
        }
    };
    
    /**
     * Handle reset history button click
     */
    const handleResetHistory = async () => {
        try {
            // Confirm with user
            if (!confirm('Are you sure you want to reset your spell casting history?')) {
                return;
            }
            
            // Clear spell history
            await SpellStore.clearSpellHistory();
            
            // Update state
            state.spellHistory = [];
            
            // Update UI
            updateSpellSlots();
            if (state.currentView === 'history') {
                renderSpellList();
            }
            
            UIUtils.showNotification('Spell history reset', 'success');
        } catch (error) {
            console.error('Error resetting spell history:', error);
            UIUtils.showNotification('Failed to reset spell history', 'error');
        }
    };
    
    /**
     * Handle long rest button click
     */
    const handleLongRest = async () => {
        try {
            // Confirm with user
            if (confirm('Take a long rest? This will restore all spell slots.')) {
                // Clear spell history (regain all spell slots)
                await SpellStore.clearSpellHistory();
                
                // Update state
                state.spellHistory = [];
                
                // Update UI
                updateSpellSlots();
                if (state.currentView === 'history') {
                    renderSpellList();
                }
                
                UIUtils.showNotification('Long rest completed - all spell slots restored', 'success');
                
                // Display detailed information about spell slots
                displayRestInfo();
            }
        } catch (error) {
            console.error('Error taking long rest:', error);
            UIUtils.showNotification('Failed to complete long rest', 'error');
        }
    };
    
    /**
     * Display information after a rest
     */
    const displayRestInfo = () => {
        // Get spell slots information
        const slots = SpellStore.getSpellSlots(state.druidLevel);
        
        // Create message with available spell slots
        let message = 'Available spell slots:\n';
        for (let i = 1; i <= 9; i++) {
            if (slots[i] > 0) {
                message += `Level ${i}: ${slots[i]}\n`;
            }
        }
        
        // Display in alert
        setTimeout(() => alert(message), 500);
    };
    
    /**
     * Handle view change
     * @param {string} view - The view to change to ('all', 'prepared', or 'history')
     */
    const handleViewChange = (view) => {
        // Update active tab
        elements.viewTabs.forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update state
        state.currentView = view;
        
        // Reset selection when changing views
        state.selectedSpellId = null;
        
        // Reset search when changing views
        elements.spellSearch.value = '';
        state.searchTerm = '';
        
        // Update UI
        renderSpellList();
        renderEmptyDetail();
    };
    
    /**
     * Handle search input
     * @param {Event} event - Input event
     */
    const handleSearchInput = (event) => {
        // Update state
        state.searchTerm = event.target.value.trim().toLowerCase();
        
        // Show/hide clear button
        elements.clearSpellSearch.style.display = state.searchTerm ? 'block' : 'none';
        
        // Update UI
        renderSpellList();
    };
    
    /**
     * Handle clear search button click
     */
    const handleClearSearch = () => {
        // Clear search input
        elements.spellSearch.value = '';
        state.searchTerm = '';
        
        // Hide clear button
        elements.clearSpellSearch.style.display = 'none';
        
        // Update UI
        renderSpellList();
        
        // Focus search input for convenience
        elements.spellSearch.focus();
    };
    
    /**
     * Toggle filters visibility
     */
    const toggleFilters = () => {
        elements.spellFilterContent.classList.toggle('collapsed');
        elements.filterToggle.querySelector('.toggle-icon').textContent = 
            elements.spellFilterContent.classList.contains('collapsed') ? '+' : '−';
    };
    
    /**
     * Handle level filter change
     */
    const handleLevelFilterChange = () => {
        // Get min and max levels
        const minLevel = parseInt(elements.spellLevelMin.value);
        const maxLevel = parseInt(elements.spellLevelMax.value);
        
        // Validate and swap if needed
        if (minLevel > maxLevel) {
            elements.spellLevelMin.value = maxLevel;
            elements.spellLevelMax.value = minLevel;
            state.filters.minLevel = maxLevel;
            state.filters.maxLevel = minLevel;
        } else {
            state.filters.minLevel = minLevel;
            state.filters.maxLevel = maxLevel;
        }
        
        // Update UI
        renderSpellList();
    };
    
    /**
     * Handle class filter change
     */
    const handleClassFilterChange = () => {
        // Get selected classes
        const selectedClasses = Array.from(elements.classCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        console.log('Class filter changed. Selected classes:', selectedClasses);
        
        // Update state
        state.filters.classes = selectedClasses;
        
        // Update UI
        renderSpellList();
    };
    
    /**
     * Handle reset filters button click
     */
    const handleResetFilters = () => {
        // Reset level filters
        elements.spellLevelMin.value = 0;
        elements.spellLevelMax.value = 9;
        state.filters.minLevel = 0;
        state.filters.maxLevel = 9;
        
        // Reset class filters (check only Druid)
        elements.classCheckboxes.forEach(checkbox => {
            checkbox.checked = checkbox.value === 'Druid';
        });
        state.filters.classes = ['Druid'];
        
        // Update UI
        renderSpellList();
    };
    
    /**
     * Handle spell selection
     * @param {string} spellId - ID of selected spell
     */
    const handleSpellSelected = (spellId) => {
        // Update state
        state.selectedSpellId = spellId;
        
        // Update UI
        renderSpellDetail(spellId);
    };
    
    /**
     * Handle preparation state change
     * @param {Object} data - Event data
     */
    const handlePreparationChanged = async ({ spellId, isPrepared }) => {
        try {
            // Update state
            if (isPrepared) {
                state.preparedSpells.push(spellId);
            } else {
                state.preparedSpells = state.preparedSpells.filter(id => id !== spellId);
            }
            
            // Update UI if in prepared view
            if (state.currentView === 'prepared') {
                renderSpellList();
            }
            
        } catch (error) {
            console.error('Error handling preparation change:', error);
        }
    };
    
    /**
     * Handle spell cast event
     * @param {Object} data - Event data
     */
    const handleSpellCast = ({ spellId, slotLevel }) => {
        try {
            // Add to history
            state.spellHistory.push({
                spellId,
                slotLevel,
                timestamp: Date.now()
            });
            
            // Update UI if in history view
            if (state.currentView === 'history') {
                renderSpellList();
            }
            
            // Update spell slots
            updateSpellSlots();
            
        } catch (error) {
            console.error('Error handling spell cast:', error);
        }
    };
    
    /**
     * Handle tab changed event
     * @param {string} tabId - ID of the activated tab
     */
    const handleTabChanged = (tabId) => {
        if (tabId === 'tab-spells') {
            // Refresh data when tab is activated
            loadInitialData().then(() => {
                renderSpellList();
                updateSpellSlots();
            });
        }
    };
    
    /**
     * Handle data imported event
     */
    const handleDataImported = (data) => {
        // If spell data was imported, refresh the spell list
        if (data.type === 'spells' || data.type === 'all') {
            loadInitialData().then(() => {
                renderSpellList();
                updateSpellSlots();
            });
        }
    };
    
    /**
     * Render the spell list based on current view and filters
     */
    const renderSpellList = async () => {
        // Clear current list
        elements.spellList.innerHTML = '';
        
        let spellsToShow = [];
        
        try {
            switch (state.currentView) {
                case 'all':
                    // Get all spells and apply filters
                    spellsToShow = filterSpells(state.allSpells);
                    // Sort by level (high to low) and then by name
                    spellsToShow = sortSpells(spellsToShow);
                    break;
                    
                case 'prepared':
                    // Get prepared spells
                    const preparedDetails = await SpellStore.getPreparedSpellDetails();
                    spellsToShow = filterSpells(preparedDetails);
                    // Sort by level (high to low) and then by name
                    spellsToShow = sortSpells(spellsToShow);
                    break;
                    
                case 'history':
                    // Get spell history with details
                    const history = await SpellStore.getDetailedSpellHistory();
                    
                    // Group by spell ID and sort by most recent timestamp
                    const spellsByRecency = new Map();
                    
                    for (const record of history) {
                        // Skip 'manual-slot-usage' which is a placeholder for slot management
                        if (record.spellId === 'manual-slot-usage') continue;
                        
                        if (!spellsByRecency.has(record.spellId) || 
                            spellsByRecency.get(record.spellId).timestamp < record.timestamp) {
                            spellsByRecency.set(record.spellId, record);
                        }
                    }
                    
                    // Convert to array of records ordered by recency
                    const historyRecords = Array.from(spellsByRecency.values());
                    historyRecords.sort((a, b) => b.timestamp - a.timestamp);
                    
                    // Get spell details for each record
                    const spellHistory = [];
                    for (const record of historyRecords) {
                        const spell = state.allSpells.find(s => s.id === record.spellId);
                        if (spell) {
                            // Add casting information to the spell object
                            const spellWithHistory = {
                                ...spell,
                                lastCast: record.timestamp,
                                lastSlotLevel: record.slotLevel
                            };
                            spellHistory.push(spellWithHistory);
                        }
                    }
                    
                    spellsToShow = filterSpells(spellHistory);
                    break;
            }
            
            // Add result count display
            const resultCount = document.createElement('div');
            resultCount.className = 'result-count';
            resultCount.textContent = `${spellsToShow.length} spell${spellsToShow.length !== 1 ? 's' : ''} found`;
            elements.spellList.appendChild(resultCount);
            
            // If no spells found after filtering
            if (spellsToShow.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'list-empty';
                
                if (state.searchTerm) {
                    emptyMessage.textContent = `No spells found matching "${state.searchTerm}"`;
                } else if (state.currentView === 'prepared') {
                    emptyMessage.textContent = 'No spells prepared yet';
                } else if (state.currentView === 'history') {
                    emptyMessage.textContent = 'No spells cast yet';
                } else {
                    emptyMessage.textContent = 'No spells found matching the filters';
                }
                
                elements.spellList.appendChild(emptyMessage);
                return;
            }
            
            // Group spells by level for better organization
            if (state.currentView !== 'history') {
                const spellsByLevel = groupSpellsByLevel(spellsToShow);
                
                // Create sections for each level
                for (const [level, levelSpells] of spellsByLevel) {
                    // Create level header
                    const levelHeader = document.createElement('div');
                    levelHeader.className = 'spell-level-header';
                    levelHeader.textContent = level === 0 ? 'Cantrips' : `Level ${level}`;
                    elements.spellList.appendChild(levelHeader);
                    
                    // Create spell list items for this level
                    for (const spell of levelSpells) {
                        // Check if prepared
                        const isPrepared = state.preparedSpells.includes(spell.id);
                        
                        // Create list item
                        SpellCard.createSpellListItem(spell, elements.spellList, {
                            isPrepared,
                            isSelected: spell.id === state.selectedSpellId
                        });
                    }
                }
            } else {
                // For history view, display in order of most recent first
                for (const spell of spellsToShow) {
                    // Format the last cast time
                    const lastCastDate = new Date(spell.lastCast);
                    const formattedDate = lastCastDate.toLocaleString();
                    
                    // Create a spell with modified level info to show cast info
                    const spellWithHistory = {
                        ...spell,
                        levelSchool: `${spell.levelSchool} (Cast at level ${spell.lastSlotLevel}, ${formattedDate})`
                    };
                    
                    // Check if prepared
                    const isPrepared = state.preparedSpells.includes(spell.id);
                    
                    // Create list item
                    SpellCard.createSpellListItem(spellWithHistory, elements.spellList, {
                        isPrepared,
                        isSelected: spell.id === state.selectedSpellId
                    });
                }
            }
            
        } catch (error) {
            console.error('Error rendering spell list:', error);
            elements.spellList.innerHTML = '<div class="list-empty">Error loading spells</div>';
        }
    };
    
    /**
     * Render spell detail view
     * @param {string} spellId - ID of the spell to display
     */
    const renderSpellDetail = async (spellId) => {
        try {
            // Get spell data
            const spell = await SpellStore.getSpell(spellId);
            
            if (!spell) {
                renderEmptyDetail();
                return;
            }
            
            // Clear current detail view
            elements.spellDetail.innerHTML = '';
            
            // Check if prepared
            const isPrepared = state.preparedSpells.includes(spellId);
            
            // Create spell card
            SpellCard.createSpellCard(spell, elements.spellDetail, { isPrepared });
        } catch (error) {
            console.error('Error rendering spell detail:', error);
            renderEmptyDetail('Error loading spell details');
        }
    };
    
    /**
     * Render empty detail view
     * @param {string} message - Optional message to display
     */
    const renderEmptyDetail = (message = 'Select a spell to view details') => {
        elements.spellDetail.innerHTML = `<div class="spell-placeholder">${message}</div>`;
    };
    
    /**
     * Update prepared spells count display
     */
    const updatePreparedCount = async () => {
        try {
            const prepLimit = SpellStore.getMaxPreparedSpells(state.druidLevel, state.wisdomModifier);
            const prepCount = state.preparedSpells.length;
            
            elements.preparationLimit.textContent = `${prepCount}/${prepLimit} prepared spells`;
            
            // Highlight if over limit
            if (prepCount > prepLimit) {
                elements.preparationLimit.classList.add('over-limit');
                
                // Show warning if over limit
                if (prepCount > prepLimit && !state.warningShown) {
                    UIUtils.showNotification('Warning: You have exceeded your prepared spell limit!', 'warning', 5000);
                    state.warningShown = true;
                }
            } else {
                elements.preparationLimit.classList.remove('over-limit');
                state.warningShown = false;
            }
        } catch (error) {
            console.error('Error updating prepared count:', error);
        }
    };
    
    /**
     * Update spell slots display
     */
    const updateSpellSlots = async () => {
        try {
            // Call the SpellCard utility to update slots visually
            SpellCard.updateSpellSlots();
            
            // Also update available spells in Prepared view based on slots
            if (state.currentView === 'prepared') {
                renderSpellList();
            }
        } catch (error) {
            console.error('Error updating spell slots:', error);
        }
    };
    
    /**
     * Filter spells based on current filters and search term
     * @param {Array} spells - Spells to filter
     * @returns {Array} Filtered spells
     */
    const filterSpells = (spells) => {
        return spells.filter(spell => {
            // Filter by level
            if (spell.level < state.filters.minLevel || spell.level > state.filters.maxLevel) {
                return false;
            }
            
            // Filter by class
            if (state.filters.classes.length > 0) {
                const matchesClass = state.filters.classes.some(className => {
                    // Handle both array and string formats for classes
                    if (Array.isArray(spell.classes)) {
                        // Case-insensitive comparison
                        return spell.classes.some(spellClass => 
                            spellClass.toLowerCase() === className.toLowerCase());
                    } else if (typeof spell.classes === 'string') {
                        // Case-insensitive search in string
                        return spell.classes.toLowerCase().includes(className.toLowerCase());
                    }
                    return false;
                });
                
                if (!matchesClass) {
                    return false;
                }
            }
            
            // Filter by search term
            if (state.searchTerm && state.searchTerm.trim() !== '') {
                const searchLower = state.searchTerm.toLowerCase();
                
                // Search in multiple fields
                return (
                    spell.name.toLowerCase().includes(searchLower) ||
                    (spell.description && spell.description.toLowerCase().includes(searchLower)) ||
                    (spell.levelSchool && spell.levelSchool.toLowerCase().includes(searchLower)) ||
                    (spell.school && spell.school.toLowerCase().includes(searchLower)) ||
                    (spell.castingTime && spell.castingTime.toLowerCase().includes(searchLower)) ||
                    (spell.components && spell.components.toLowerCase().includes(searchLower))
                );
            }
            
            return true;
        });
    };
    
    /**
     * Sort spells by level (high to low) and then by name
     * @param {Array} spells - Spells to sort
     * @returns {Array} Sorted spells
     */
    const sortSpells = (spells) => {
        return [...spells].sort((a, b) => {
            // First sort by level (high to low)
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            // Then sort by name (A-Z)
            return a.name.localeCompare(b.name);
        });
    };
    
    /**
     * Group spells by level
     * @param {Array} spells - Spells to group
     * @returns {Map} Map of level -> spells
     */
    const groupSpellsByLevel = (spells) => {
        const spellsByLevel = new Map();
        
        // Initialize map with all possible spell levels
        for (let i = 9; i >= 0; i--) {
            spellsByLevel.set(i, []);
        }
        
        // Group spells by level
        for (const spell of spells) {
            const level = spell.level;
            if (!spellsByLevel.has(level)) {
                spellsByLevel.set(level, []);
            }
            spellsByLevel.get(level).push(spell);
        }
        
        // Sort spells within each level by name
        for (const [level, levelSpells] of spellsByLevel) {
            levelSpells.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Remove levels with no spells
        for (const [level, levelSpells] of spellsByLevel) {
            if (levelSpells.length === 0) {
                spellsByLevel.delete(level);
            }
        }
        
        return spellsByLevel;
    };
    
    // Return public API
    return {
        init
    };
})();
