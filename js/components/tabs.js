/**
 * Tab navigation component
 * Handles switching between tabs
 */
const TabManager = (function() {
    // Private variables
    let activeTab = '';
    
    // Cache DOM elements
    const init = () => {
        // Set up event listeners for tab navigation
        const tabInputs = document.querySelectorAll('.tab-navigation input[type="radio"]');
        
        // Get the default active tab
        const defaultTab = localStorage.getItem('activeTab') || 'tab-statblock';
        
        // Activate the default tab
        activateTab(defaultTab);
        
        // Add event listeners to tab inputs
        tabInputs.forEach(input => {
            input.addEventListener('change', handleTabChange);
            
            // Set the default tab as checked
            if (input.id === defaultTab) {
                input.checked = true;
            }
        });
        
        // Handle direct links with hash
        if (window.location.hash) {
            const tabId = window.location.hash.substring(1);
            activateTab(`tab-${tabId}`);
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
    };
    
    // Handle tab change event
    const handleTabChange = (event) => {
        const tabId = event.target.id;
        activateTab(tabId);
        
        // Update URL hash without triggering a page jump
        const tabName = tabId.replace('tab-', '');
        history.replaceState(null, null, `#${tabName}`);
        
        // Save active tab to localStorage
        localStorage.setItem('activeTab', tabId);
        
        // Publish tab change event
        publishTabChange(tabId);
    };
    
    // Handle URL hash change
    const handleHashChange = () => {
        if (window.location.hash) {
            const tabName = window.location.hash.substring(1);
            activateTab(`tab-${tabName}`);
        }
    };
    
    // Activate a specific tab
    const activateTab = (tabId) => {
        // Update activeTab variable
        activeTab = tabId;
        
        // Find the corresponding radio input and set it as checked
        const tabInput = document.getElementById(tabId);
        if (tabInput) {
            tabInput.checked = true;
        }
        
        // Hide all tab content sections
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show the selected tab content
        const selectedContent = document.getElementById(`${tabId.replace('tab-', '')}-tab`);
        if (selectedContent) {
            selectedContent.classList.add('active');
        }
        
        // Update ARIA attributes for accessibility
        const tabLabels = document.querySelectorAll('.tab-navigation label');
        tabLabels.forEach(label => {
            const isSelected = label.getAttribute('for') === tabId;
            label.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
    };
    
    // Publish tab change event for other modules
    const publishTabChange = (tabId) => {
        // Create and dispatch a custom event
        const event = new CustomEvent('tabChanged', {
            detail: {
                tabId: tabId,
                tabName: tabId.replace('tab-', '')
            }
        });
        document.dispatchEvent(event);
    };
    
    // Public API
    return {
        init,
        activateTab,
        getActiveTab: () => activeTab
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', TabManager.init);
