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
    const init = () => {
        console.log(`Initializing Druid's Assistant v${APP_VERSION}`);
        
        // Check browser compatibility
        if (!checkBrowserSupport()) {
            showError('Your browser does not support required features. Please use a modern browser like Chrome, Firefox, or Edge.');
            return;
        }
        
        // Cache frequently used DOM elements
        cacheElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize data management buttons
        initDataControls();
        
        // Mark as initialized
        state.initialized = true;
        
        // Publish initialization event
        const event = new CustomEvent('appInitialized', { detail: { version: APP_VERSION } });
        document.dispatchEvent(event);
        
        console.log('Initialization complete');
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
        document.addEventListener('tabChanged', handleTabChange);
        
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
        elements.beastSearch.addEventListener('input', handleSearch);
        
        // Clear search
        elements.clearSearch.addEventListener('click', clearSearch);
        
        // Reset filters
        elements.resetFilters.addEventListener('click', resetFilters);
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
    
    // Handle tab change events
    const handleTabChange = (event) => {
        const tabName = event.detail.tabName;
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
        showNotification('Importing data...', 'info');
        
        // Reset the file input for future imports
        elements.importFile.value = '';
        
        // Read the file
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            
            // At this point, we would pass the content to a parser
            // Since we haven't implemented the parser yet, we'll just show a success message
            showNotification('Data imported successfully!', 'success');
            
            // In the future, this will trigger data processing
            console.log('File content loaded, ready for parsing');
        };
        
        reader.onerror = () => {
            showError('Error reading file');
        };
        
        reader.readAsText(file);
    };
    
    // Handle data export
    const handleExport = () => {
        // This will be implemented in a future stage
        showNotification('Export functionality will be available soon', 'info');
    };
    
    // Handle data reset
    const handleReset = () => {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            // This will be implemented in a future stage
            showNotification('Data reset functionality will be available soon', 'info');
        }
    };
    
    // Handle search input
    const handleSearch = (event) => {
        const searchTerm = event.target.value.trim().toLowerCase();
        
        // Show/hide clear button based on search term
        elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
        
        // This will be implemented in a future stage
        console.log(`Searching for: ${searchTerm}`);
    };
    
    // Clear search
    const clearSearch = () => {
        elements.beastSearch.value = '';
        elements.clearSearch.style.display = 'none';
        
        // This will trigger the search event with an empty term
        elements.beastSearch.dispatchEvent(new Event('input'));
    };
    
    // Reset filters
    const resetFilters = () => {
        // Reset CR filters
        document.getElementById('cr-min').value = '0';
        document.getElementById('cr-max').value = '6';
        
        // Reset checkbox filters
        const checkboxes = document.querySelectorAll('.checkbox-filter input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Trigger filter change event (to be implemented)
        // This will be implemented in a future stage
        console.log('Filters reset');
    };
    
    // Show notification message
    const showNotification = (message, type = 'info') => {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show the notification
        notification.classList.add('visible');
        
        // Hide after timeout
        setTimeout(() => {
            notification.classList.remove('visible');
        }, 3000);
    };
    
    // Show error message
    const showError = (message) => {
        showNotification(message, 'error');
    };
    
    // Public API
    return {
        init,
        version: APP_VERSION,
        showNotification,
        showError
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', DruidAssistant.init);
