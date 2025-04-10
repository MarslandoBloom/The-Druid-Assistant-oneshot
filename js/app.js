/**
 * Main application controller for Druid's Assistant
 */
const DruidAssistant = (function() {
    // Application version
    const APP_VERSION = '0.1.0';
    
    // Global state object
    const state = {
        initialized: false,
        dataLoaded: false,
        selectedBeast: null,
        // Add more state properties as needed
    };
    
    // Cache DOM elements
    let elements = {};
    
    // Initialize the application
    const init = async () => {
        try {
            console.log(`Initializing Druid's Assistant v${APP_VERSION}`);
            
            // Check browser compatibility
            if (!checkBrowserSupport()) {
                showError('Your browser does not support required features. Please use a modern browser like Chrome, Firefox, or Edge.');
                return;
            }
            
            // First, cache frequently used DOM elements (this should be done early)
            try {
                console.log('Caching DOM elements...');
                cacheElements();
                console.log('DOM elements cached successfully');
            } catch (elemError) {
                console.error('Error caching DOM elements:', elemError);
                showError('Error initializing UI components. Some features may not work correctly.');
                // Continue initialization despite this error
            }
            
            // Set up basic event listeners before database operations
            try {
                console.log('Setting up event listeners...');
                setupEventListeners();
                console.log('Event listeners set up successfully');
            } catch (eventError) {
                console.error('Error setting up event listeners:', eventError);
                showError('Error setting up event system. Some features may not work correctly.');
                // Continue initialization despite this error
            }
            
            // Initialize the database
            try {
                console.log('Initializing database...');
                if (typeof Database === 'undefined') {
                    throw new Error('Database module is not defined');
                }
                await Database.init();
                console.log('Database initialized successfully');
                
                // Verify database integrity
                const integrityCheck = await Database.verifyIntegrity();
                if (!integrityCheck.valid) {
                    showError(`Database integrity check failed: ${integrityCheck.reason}`);
                    console.error('Database integrity check failed:', integrityCheck.reason);
                } else {
                    console.log('Database integrity check passed');
                }
                
                // Initialize favorites storage
                try {
                    console.log('Initializing user preferences...');
                    await UserStore.initializeAllFavourites();
                    console.log('User preferences initialized successfully');
                } catch (prefsError) {
                    console.error('Error initializing user preferences:', prefsError);
                    // Continue initialization despite this error
                }
                
                // Announce database readiness event explicitly
                EventManager.publish('database:ready', { status: 'connected' });
                console.log('Published database:ready event');
            } catch (dbError) {
                console.error('Critical database initialization error:', dbError);
                showError('Error initializing database. Please refresh the page or check console for details.');
                // We'll continue with UI initialization, but some features won't work
            }
            
            // Initialize UI-related components that don't depend on data
            try {
                console.log('Initializing data management controls...');
                initDataControls();
                console.log('Data management controls initialized');
            } catch (controlsError) {
                console.error('Error initializing data controls:', controlsError);
                // Continue initialization despite this error
            }
            
            // Check database state only if database initialized successfully
            try {
                if (typeof Database !== 'undefined' && Database.isConnected()) {
                    console.log('Checking database state...');
                    await checkDatabaseState();
                    console.log('Database state checked successfully');
                } else {
                    console.warn('Skipping database state check due to database initialization failure');
                    showNotification('Database is not available. Please reload the page.', 'warning');
                }
            } catch (stateError) {
                console.error('Error checking database state:', stateError);
                // Continue initialization despite this error
            }
            
            // Mark as initialized
            state.initialized = true;
            
            // Initialize the SpellsModule
            try {
                console.log('Initializing SpellsModule...');
                if (typeof SpellsModule !== 'undefined') {
                    await SpellsModule.init();
                    console.log('SpellsModule initialized successfully');
                } else {
                    console.warn('SpellsModule not found, skipping initialization');
                }
            } catch (spellsError) {
                console.error('Error initializing SpellsModule:', spellsError);
                // Continue initialization despite this error
            }

            // Publish initialization event
            try {
                console.log('Publishing APP_INITIALIZED event...');
                EventManager.publish(EventManager.EVENTS.APP_INITIALIZED, { version: APP_VERSION });
                console.log('Initialization complete');
            } catch (publishError) {
                console.error('Error publishing initialization event:', publishError);
                // Initialization is still considered complete
            }
        } catch (error) {
            console.error('Critical initialization error:', error);
            console.error('Stack trace:', error.stack);
            showError('Error initializing application. Please refresh the page or try again later.');
        }
    };
    
    // Check if the browser supports required features
    const checkBrowserSupport = () => {
        // Check for IndexedDB support
        if (!window.indexedDB) {
            return false;
        }
        
        // Check for other required features
        if (!window.FileReader || !window.localStorage) {
            return false;
        }
        
        return true;
    };
    
    // Cache frequently used DOM elements
    const cacheElements = () => {
        elements = {
            // Data control buttons
            importButton: document.getElementById('import-button'),
            exportButton: document.getElementById('export-button'),
            resetButton: document.getElementById('reset-button'),
            importFile: document.getElementById('import-file'),
            
            // Statblock tab elements
            beastSearch: document.getElementById('beast-search'),
            clearSearch: document.getElementById('clear-search'),
            resetFilters: document.getElementById('reset-filters'),
            beastList: document.getElementById('beast-list'),
            statblockDisplay: document.getElementById('statblock-display'),
            
            // Action buttons
            wildshapeButton: document.getElementById('wildshape-button'),
            conjureButton: document.getElementById('conjure-button'),
            favoriteButton: document.getElementById('favorite-button'),
            
            // Favorites
            favoritesList: document.getElementById('favorites-list')
        };
    };
    
    // Set up global event listeners
    const setupEventListeners = () => {
        // Listen for tab changes
        EventManager.subscribe(EventManager.EVENTS.TAB_CHANGED, handleTabChange);
        
        // Legacy DOM event listener (can be removed in future versions)
        document.addEventListener('tabChanged', (event) => {
            // We no longer need to publish from here since the TabManager now
            // directly publishes through EventManager
        });
        
        // Import button click
        elements.importButton.addEventListener('click', () => {
            elements.importFile.click();
        });
        
        // Import file change
        elements.importFile.addEventListener('change', handleFileImport);
        
        // Export button click
        elements.exportButton.addEventListener('click', handleExport);
        
        // Reset button click
        elements.resetButton.addEventListener('click', handleReset);
        
        // Search input
        elements.beastSearch.addEventListener('input', UIUtils.debounce(handleSearch, 300));
        
        // Clear search
        elements.clearSearch.addEventListener('click', clearSearch);
        
        // Reset filters
        elements.resetFilters.addEventListener('click', resetFilters);
        
        // Listen for data events
        EventManager.subscribe(EventManager.EVENTS.DATA_IMPORTED, handleDataImported);
        EventManager.subscribe(EventManager.EVENTS.DATA_EXPORTED, handleDataExported);
        EventManager.subscribe(EventManager.EVENTS.DATA_RESET, handleDataReset);
    };
    
    // Initialize data management controls
    const initDataControls = () => {
        // Add drag and drop support for file import
        const appContainer = document.getElementById('app');
        
        appContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.add('drag-over');
        });
        
        appContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove('drag-over');
        });
        
        appContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove('drag-over');
            
            // Process the dropped files
            if (e.dataTransfer.files.length > 0) {
                elements.importFile.files = e.dataTransfer.files;
                handleFileImport({ target: elements.importFile });
            }
        });
    };
    
    // Check database state without loading any sample data
    const checkDatabaseState = async () => {
        try {
            // Check if database has data
            const dbState = await DataManager.checkDatabaseEmpty();
            
            // Update dataLoaded state based on database content
            state.dataLoaded = !dbState.isEmpty;
            
            if (!dbState.isEmpty) {
                console.log(`Database contains ${dbState.beastCount} beasts and ${dbState.spellCount} spells`);
            } else {
                console.log('Database is empty. Please import data using the Import button.');
                // Inform the user they need to import data
                showNotification('Please import beast and spell data using the Import button', 'info');
            }
        } catch (error) {
            console.error('Error checking database state:', error);
        }
    };
    
    // Handle tab change events
    const handleTabChange = (event) => {
        const tabName = event.tabName;
        console.log(`Tab changed to: ${tabName}`);
        
        // Perform any necessary tab-specific initialization
        switch (tabName) {
            case 'statblock':
                // Initialize statblock tab if needed
                break;
            case 'wildshape':
                // Initialize wildshape tab if needed
                break;
            case 'conjure':
                // Initialize conjure tab if needed
                break;
            case 'spells':
                // Refresh spells tab content
                if (typeof SpellsModule !== 'undefined') {
                    // The SpellsModule tab:changed handler will handle this
                    // But we trigger an explicit event just in case
                    EventManager.publish('spell:tab:shown');
                }
                break;
            case 'dice':
                // Initialize dice tab if needed
                break;
        }
    };
    
    // Handle file import
    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if it's a markdown or JSON file
        const isMarkdown = file.type === 'text/markdown' || file.name.endsWith('.md');
        const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
        
        if (!isMarkdown && !isJSON) {
            showError('Please select a markdown (.md) or JSON (.json) file');
            return;
        }
        
        // Disable the import button while processing
        const importButton = document.getElementById('import-button');
        const originalText = importButton.textContent;
        importButton.textContent = 'Importing...';
        importButton.disabled = true;
        
        // Reset the file input for future imports
        elements.importFile.value = '';
        
        try {
            let result;
            
            // Use DataManager to import the file
            if (isMarkdown) {
                result = await DataManager.importFromFile(file, {
                    showNotification: false  // We'll handle notifications
                });
            } else if (isJSON) {
                result = await DataManager.importFromJSON(file, {
                    showNotification: false  // We'll handle notifications
                });
            }
            
            // Mark data as loaded
            state.dataLoaded = true;
            
            // Show notification based on result
            if (result && result.success) {
                let message = 'Import successful:';
                const parts = [];
                
                if (result.beastsImported > 0) {
                    parts.push(`${result.beastsImported} beasts`);
                }
                if (result.spellsImported > 0) {
                    parts.push(`${result.spellsImported} spells`);
                }
                if (result.prefsImported > 0) {
                    parts.push(`${result.prefsImported} preferences`);
                }
                
                message += ' ' + parts.join(', ');
                showNotification(message, 'success');
            } else {
                showError(`Import failed: ${result?.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Error importing data:', error);
            showError(`Error importing data: ${error.message}`);
        } finally {
            // Always restore the button state
            importButton.textContent = originalText;
            importButton.disabled = false;
        }
    };
    
    // Handle data export
    const handleExport = async () => {
        // Disable the export button while processing
        const exportButton = document.getElementById('export-button');
        const originalText = exportButton.textContent;
        exportButton.textContent = 'Exporting...';
        exportButton.disabled = true;
        
        try {
            // Use DataManager to export data
            const result = await DataManager.exportAllData({
                showNotification: false  // We'll handle notifications
            });
            
            if (result && result.success) {
                showNotification('Data exported successfully', 'success');
            } else {
                showError(`Export failed: ${result?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            showError(`Error exporting data: ${error.message}`);
        } finally {
            // Always restore button state
            exportButton.textContent = originalText;
            exportButton.disabled = false;
        }
    };
    
    // Handle data reset
    const handleReset = async () => {
        // Use DataManager to reset data - first get confirmation
        const confirmed = confirm('Are you sure you want to reset all data? This cannot be undone.');
        if (!confirmed) {
            return; // User cancelled
        }
        
        // Disable the reset button while processing
        const resetButton = document.getElementById('reset-button');
        const originalText = resetButton.textContent;
        resetButton.textContent = 'Resetting...';
        resetButton.disabled = true;
        
        try {
            // Use DataManager to reset data without showing confirmation again
            const result = await DataManager.resetAllData({
                showConfirmation: false,  // We've already confirmed
                showNotification: false    // We'll handle notifications
            });
            
            if (result && result.success) {
                showNotification('All data has been reset', 'success');
            } else {
                showError(`Reset failed: ${result?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error resetting data:', error);
            showError(`Error resetting data: ${error.message}`);
        } finally {
            // Always restore button state
            resetButton.textContent = originalText;
            resetButton.disabled = false;
        }
    };
    
    // Handle search input
    const handleSearch = async (event) => {
        const searchTerm = event.target.value.trim().toLowerCase();
        
        // Show/hide clear button based on search term
        elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
        
        // Record search in history if not empty
        if (searchTerm) {
            await UserStore.addSearchToHistory('statblock', searchTerm);
        }
        
        // Publish search event
        EventManager.publish(EventManager.EVENTS.SEARCH_PERFORMED, {
            tab: 'statblock',
            term: searchTerm
        });

        // For backwards compatibility with any components using search:performed
        // Ensure we're using the same format for both events
        EventManager.publish('search:performed', {
            tab: 'statblock',
            term: searchTerm
        });
    };
    
    // Clear search
    const clearSearch = () => {
        elements.beastSearch.value = '';
        elements.clearSearch.style.display = 'none';
        
        // Publish search cleared event with both event types for compatibility
        EventManager.publish(EventManager.EVENTS.SEARCH_CLEARED, {
            tab: 'statblock'
        });
        
        // Also publish empty search term for backward compatibility
        EventManager.publish('search:performed', {
            tab: 'statblock',
            term: ''
        });
        
        // This will trigger the search event with an empty term
        elements.beastSearch.dispatchEvent(new Event('input'));
    };
    
    // Reset filters
    const resetFilters = async () => {
        // Reset CR filters
        document.getElementById('cr-min').value = '0';
        document.getElementById('cr-max').value = '6';
        
        // Reset checkbox filters
        const checkboxes = document.querySelectorAll('.checkbox-filter input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Clear saved filters
        await UserStore.resetFilters('statblock');
        
        // Publish filter reset event
        EventManager.publish(EventManager.EVENTS.FILTER_RESET, {
            tab: 'statblock'
        });
    };
    
    // Handle data imported event
    const handleDataImported = (data) => {
        console.log('Data imported:', data);
        // Update UI or perform other actions based on imported data
    };
    
    // Handle data exported event
    const handleDataExported = (data) => {
        console.log('Data exported:', data);
        // Update UI or perform other actions based on exported data
    };
    
    // Handle data reset event
    const handleDataReset = (data) => {
        console.log('Data reset:', data);
        
        // Reload the beast list data
        if (typeof StatblockModule !== 'undefined') {
            console.log('Reloading beast list after data reset');
            StatblockModule.showBeasts();
        }
        
        // Reload any other components that need data refresh
        setTimeout(() => {
            // Force a browser storage check to update UI components
            EventManager.publish('database:ready', { status: 'reset' });
            
            // Clear statblock display if it exists
            const statblockDisplay = document.getElementById('statblock-display');
            if (statblockDisplay) {
                statblockDisplay.innerHTML = '<div class="statblock-placeholder">Select a beast to view its statblock</div>';
            }
            
            // Disable action buttons
            const wildshapeButton = document.getElementById('wildshape-button');
            const conjureButton = document.getElementById('conjure-button');
            if (wildshapeButton) wildshapeButton.disabled = true;
            if (conjureButton) conjureButton.disabled = true;
        }, 100); // Small delay to ensure database operations complete
    };
    
    // Show notification message
    const showNotification = (message, type = 'info') => {
        return UIUtils.showNotification(message, type);
    };
    
    // Show error message
    const showError = (message) => {
        return UIUtils.showNotification(message, 'error');
    };
    
    // Public API
    return {
        init,
        version: APP_VERSION,
        showNotification,
        showError,
        state
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', DruidAssistant.init);
