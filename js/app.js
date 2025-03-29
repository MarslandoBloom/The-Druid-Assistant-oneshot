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
        document.addEventListener('tabChanged', (event) => {
            EventManager.publish(EventManager.EVENTS.TAB_CHANGED, event.detail);
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
            // Check if we have any beasts
            const beasts = await BeastStore.getAllBeasts();
            const spells = await SpellStore.getAllSpells();
            
            // If no beasts and no spells, try to load sample data
            if (beasts.length === 0 && spells.length === 0) {
                const loadingIndicator = UIUtils.showLoading('Loading initial data...');
                
                try {
                    // Load sample beast data
                    const beastResponse = await fetch('Random 2nd selection of beasts.md');
                    if (beastResponse.ok) {
                        const beastContent = await beastResponse.text();
                        const parsedBeasts = Parser.parseBeastMarkdown(beastContent);
                        
                        if (parsedBeasts.length > 0) {
                            await BeastStore.addBeasts(parsedBeasts);
                            console.log(`Loaded ${parsedBeasts.length} sample beasts`);
                        }
                    }
                    
                    // Load sample spell data
                    const spellResponse = await fetch('spells-5etools-2014-subset-druid.md');
                    if (spellResponse.ok) {
                        const spellContent = await spellResponse.text();
                        const parsedSpells = Parser.parseSpellMarkdown(spellContent);
                        
                        if (parsedSpells.length > 0) {
                            await SpellStore.addSpells(parsedSpells);
                            console.log(`Loaded ${parsedSpells.length} sample spells`);
                        }
                    }
                    
                    state.dataLoaded = true;
                    EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                        source: 'initial',
                        beasts: beasts.length,
                        spells: spells.length
                    });
                    
                    showNotification('Sample data loaded successfully', 'success');
                } catch (error) {
                    console.error('Error loading sample data:', error);
                    showError('Failed to load sample data. You can import your own data using the Import button.');
                } finally {
                    loadingIndicator.hide();
                }
            } else {
                state.dataLoaded = true;
                console.log(`Database contains ${beasts.length} beasts and ${spells.length} spells`);
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
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if it's a markdown file
        if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
            showError('Please select a markdown (.md) file');
            return;
        }
        
        // Show loading state
        const loadingIndicator = UIUtils.showLoading('Importing data...');
        
        // Reset the file input for future imports
        elements.importFile.value = '';
        
        // Read the file
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                
                // Parse the markdown file
                const parseResult = Parser.parseMarkdownFile(content);
                
                if (parseResult.type === 'unknown' || parseResult.data.length === 0) {
                    showError('No valid data found in the imported file');
                    loadingIndicator.hide();
                    return;
                }
                
                // Import the data based on type
                if (parseResult.type === 'beasts') {
                    await BeastStore.addBeasts(parseResult.data);
                    showNotification(`Imported ${parseResult.data.length} beasts successfully`, 'success');
                } else if (parseResult.type === 'spells') {
                    await SpellStore.addSpells(parseResult.data);
                    showNotification(`Imported ${parseResult.data.length} spells successfully`, 'success');
                }
                
                // Mark data as loaded
                state.dataLoaded = true;
                
                // Publish data imported event
                EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                    source: 'import',
                    type: parseResult.type,
                    count: parseResult.data.length
                });
            } catch (error) {
                console.error('Error importing data:', error);
                showError(`Error importing data: ${error.message}`);
            } finally {
                loadingIndicator.hide();
            }
        };
        
        reader.onerror = () => {
            showError('Error reading file');
            loadingIndicator.hide();
        };
        
        reader.readAsText(file);
    };
    
    // Handle data export
    const handleExport = async () => {
        try {
            const loadingIndicator = UIUtils.showLoading('Exporting data...');
            
            // Get database data
            const exportData = await Database.exportDatabase();
            
            // Convert to JSON string
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create a blob and download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `druid-assistant-export-${new Date().toISOString().slice(0, 10)}.json`;
            
            // Append to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Release the URL
            URL.revokeObjectURL(url);
            
            loadingIndicator.hide();
            showNotification('Data exported successfully', 'success');
            
            // Publish data exported event
            EventManager.publish(EventManager.EVENTS.DATA_EXPORTED, {
                timestamp: new Date().toISOString(),
                beasts: exportData.beasts.length,
                spells: exportData.spells.length
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            showError(`Error exporting data: ${error.message}`);
        }
    };
    
    // Handle data reset
    const handleReset = async () => {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            try {
                const loadingIndicator = UIUtils.showLoading('Resetting data...');
                
                // Clear all stores
                await BeastStore.clearBeasts();
                await SpellStore.clearSpells();
                await UserStore.clearSettings();
                
                loadingIndicator.hide();
                showNotification('All data has been reset', 'success');
                
                // Reload sample data
                await loadInitialDataIfNeeded();
                
                // Publish data reset event
                EventManager.publish(EventManager.EVENTS.DATA_RESET, {
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error resetting data:', error);
                showError(`Error resetting data: ${error.message}`);
            }
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
    };
    
    // Clear search
    const clearSearch = () => {
        elements.beastSearch.value = '';
        elements.clearSearch.style.display = 'none';
        
        // Publish search cleared event
        EventManager.publish(EventManager.EVENTS.SEARCH_CLEARED, {
            tab: 'statblock'
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
