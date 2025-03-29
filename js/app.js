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
        console.log(`Initializing Druid's Assistant v${APP_VERSION}`);
        
        // Check browser compatibility
        if (!checkBrowserSupport()) {
            showError('Your browser does not support required features. Please use a modern browser like Chrome, Firefox, or Edge.');
            return;
        }
        
        try {
            // Initialize database
            await Database.init();
            
            // Verify database integrity
            const integrityCheck = await Database.verifyIntegrity();
            if (!integrityCheck.valid) {
                showError(`Database integrity check failed: ${integrityCheck.reason}`);
                console.error('Database integrity check failed:', integrityCheck.reason);
            }
            
            // Cache frequently used DOM elements
            cacheElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize data management buttons
            initDataControls();
            
            // Check if database is empty and load sample data if needed
            await loadInitialDataIfNeeded();
            
            // Mark as initialized
            state.initialized = true;
            
            // Publish initialization event
            EventManager.publish(EventManager.EVENTS.APP_INITIALIZED, { version: APP_VERSION });
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Initialization error:', error);
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
    
    // Check if database is empty and load sample data if needed
    const loadInitialDataIfNeeded = async () => {
        try {
            // Check if database is empty
            const dbState = await DataManager.checkDatabaseEmpty();
            
            // If database is empty, load sample data
            if (dbState.isEmpty) {
                const loadingIndicator = UIUtils.showLoading('Loading initial data...');
                
                try {
                    // Load sample data using DataManager
                    const result = await DataManager.loadSampleData({
                        showNotification: false  // We'll handle notifications ourselves
                    });
                    
                    state.dataLoaded = true;
                    
                    EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                        source: 'initial',
                        beasts: result.beastsLoaded,
                        spells: result.spellsLoaded
                    });
                    
                    if (result.beastsLoaded > 0 || result.spellsLoaded > 0) {
                        showNotification('Sample data loaded successfully', 'success');
                    } else {
                        showError('No sample data available. You can import your own data using the Import button.');
                    }
                } catch (error) {
                    console.error('Error loading sample data:', error);
                    showError('Failed to load sample data. You can import your own data using the Import button.');
                } finally {
                    loadingIndicator.hide();
                }
            } else {
                state.dataLoaded = true;
                console.log(`Database contains ${dbState.beastCount} beasts and ${dbState.spellCount} spells`);
            }
        } catch (error) {
            console.error('Error checking initial data:', error);
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
                // Initialize spells tab if needed
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
        
        // Show loading state
        const loadingIndicator = UIUtils.showLoading('Importing data...');
        
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
            if (result.success) {
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
                showError(`Import failed: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Error importing data:', error);
            showError(`Error importing data: ${error.message}`);
        } finally {
            loadingIndicator.hide();
        }
    };
    
    // Handle data export
    const handleExport = async () => {
        try {
            const loadingIndicator = UIUtils.showLoading('Exporting data...');
            
            try {
                // Use DataManager to export data
                const result = await DataManager.exportAllData({
                    showNotification: false  // We'll handle notifications
                });
                
                if (result.success) {
                    showNotification('Data exported successfully', 'success');
                } else {
                    showError(`Export failed: ${result.error || 'Unknown error'}`);
                }
            } finally {
                loadingIndicator.hide();
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            showError(`Error exporting data: ${error.message}`);
        }
    };
    
    // Handle data reset
    const handleReset = async () => {
        try {
            // Use DataManager to reset data
            const result = await DataManager.resetAllData({
                showConfirmation: true,       // Show confirmation dialog
                showNotification: false,       // We'll handle notifications
                loadSampleData: true           // Load sample data after reset
            });
            
            // If reset was cancelled, do nothing
            if (result.cancelled) {
                return;
            }
            
            if (result.success) {
                showNotification('All data has been reset', 'success');
            } else {
                showError(`Reset failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error resetting data:', error);
            showError(`Error resetting data: ${error.message}`);
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
        // Update UI or perform other actions based on data reset
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
