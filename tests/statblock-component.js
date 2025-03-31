/**
 * Enhanced StatblockComponent for The Druid's Assistant
 * Designed to be integrated into the application's component architecture
 */

const EnhancedStatblockComponent = (function() {
    // Private variables
    let statblockContainer;
    let currentBeast = null;
    let options = {
        enableFavorites: true,
        enableActions: true,
        showEnvironment: true
    };
    
    /**
     * Initialize the statblock component
     * @param {string|HTMLElement} container - Container ID or element
     * @param {Object} customOptions - Custom options for the component
     */
    const init = function(container, customOptions = {}) {
        // Set container
        if (typeof container === 'string') {
            statblockContainer = document.getElementById(container);
        } else if (container instanceof HTMLElement) {
            statblockContainer = container;
        } else {
            throw new Error('Container must be an ID string or HTMLElement');
        }
        
        // Merge options
        options = {...options, ...customOptions};
        
        // Subscribe to events if EventManager exists
        if (typeof EventManager !== 'undefined') {
            EventManager.subscribe(EventManager.EVENTS.BEAST_SELECTED, renderBeast);
        }
        
        // Initialize action buttons if enabled
        if (options.enableActions) {
            initActionButtons();
        }
        
        // Show placeholder
        clearStatblock();
    };
    
    /**
     * Initialize action buttons
     */
    const initActionButtons = function() {
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        // Add event listeners
        if (wildshapeButton) {
            wildshapeButton.addEventListener('click', handleWildshapeClick);
        }
        
        if (conjureButton) {
            conjureButton.addEventListener('click', handleConjureClick);
        }
        
        if (favoriteButton && options.enableFavorites) {
            favoriteButton.addEventListener('click', handleFavoriteClick);
        }
    };
    
    /**
     * Handle wildshape button click
     */
    const handleWildshapeClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to wildshape tab with current beast
        if (typeof EventManager !== 'undefined') {
            EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'wildshape-tab' });
            EventManager.publish('wildshape:start', currentBeast);
        }
    };
    
    /**
     * Handle conjure animals button click
     */
    const handleConjureClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to conjure tab with current beast
        if (typeof EventManager !== 'undefined') {
            EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'conjure-tab' });
            EventManager.publish('conjure:start', currentBeast);
        }
    };
    
    /**
     * Handle favorite button click
     */
    const handleFavoriteClick = function() {
        if (!currentBeast || !options.enableFavorites) return;
        
        if (typeof UserStore !== 'undefined') {
            UserStore.isFavorite(currentBeast.id).then(isFavorite => {
                if (isFavorite) {
                    // Remove from favorites
                    UserStore.removeFavorite(currentBeast.id).then(() => {
                        updateFavoriteButtonState(currentBeast);
                        if (typeof EventManager !== 'undefined') {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, currentBeast);
                        }
                        if (typeof UIUtils !== 'undefined') {
                            UIUtils.showNotification(`Removed ${currentBeast.name} from favorites`, 'info');
                        }
                    });
                } else {
                    // Add to favorites
                    UserStore.addFavorite(currentBeast.id).then(() => {
                        updateFavoriteButtonState(currentBeast);
                        if (typeof EventManager !== 'undefined') {
                            EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, currentBeast);
                        }
                        if (typeof UIUtils !== 'undefined') {
                            UIUtils.showNotification(`Added ${currentBeast.name} to favorites`, 'success');
                        }
                    });
                }
            });
        }
    };
    
    /**
     * Update favorite button state
     * @param {Object} beast - The beast to check favorite status
     */
    const updateFavoriteButtonState = function(beast) {
        if (!options.enableFavorites) return;
        
        const favoriteButton = document.getElementById('favorite-button');
        if (!favoriteButton) return;
        
        if (typeof UserStore !== 'undefined') {
            UserStore.isFavorite(beast.id).then(isFavorite => {
                if (isFavorite) {
                    favoriteButton.textContent = 'Remove from Favorites';
                    favoriteButton.classList.add('active');
                } else {
                    favoriteButton.textContent = 'Add to Favorites';
                    favoriteButton.classList.remove('active');
                }
            });
        }
    };
    
    /**
     * Enable action buttons
     */
    const enableActionButtons = function() {
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        if (wildshapeButton) wildshapeButton.disabled = false;
        if (conjureButton) conjureButton.disabled = false;
        if (favoriteButton) favoriteButton.disabled = false;
    };
    
    /**
     * Clear the statblock container
     */
    const clearStatblock = function() {
        if (statblockContainer) {
            statblockContainer.innerHTML = '<div class="statblock-placeholder">Select a beast to view its statblock</div>';
        }
        
        // Disable action buttons
        const wildshapeButton = document.getElementById('wildshape-button');
        const conjureButton = document.getElementById('conjure-button');
        const favoriteButton = document.getElementById('favorite-button');
        
        if (wildshapeButton) wildshapeButton.disabled = true;
        if (conjureButton) conjureButton.disabled = true;
        if (favoriteButton) favoriteButton.disabled = true;
        
        currentBeast = null;
    };
    
    /**
     * Render a beast statblock
     * @param {Object} beast - The beast to render
     */
    const renderBeast = function(beast) {
        if (!beast || !statblockContainer) return;
        
        currentBeast = beast;
        
        // Clear the container
        statblockContainer.innerHTML = '';
        
        // Create the statblock element
        const statblock = createStatblock(beast);
        statblockContainer.appendChild(statblock);
        
        // Enable action buttons
        enableActionButtons();
        
        // Update favorite button state if favorites are enabled
        if (options.enableFavorites) {
            updateFavoriteButtonState(beast);
        }
    };
    
    /**
     * Create a statblock element for a beast
     * @param {Object} beast - The beast data object
     * @returns {HTMLElement} The statblock DOM element
     */
    const createStatblock = function(beast) {
        if (!beast) return null;
        
        // Create the main container
        const statblock = document.createElement('div');
        statblock.className = 'statblock';
        statblock.dataset.id = beast.id;
        
        // Add the beast header
        appendHeader(statblock, beast);
        
        // Add divider
        appendDivider(statblock);
        
        // Add attributes (AC, HP, Speed)
        appendAttributes(statblock, beast);
        
        // Add ability scores
        appendAbilityScores(statblock, beast);
        
        // Add details (skills, senses, languages, etc.)
        appendDetails(statblock, beast);
        
        // Add divider
        appendDivider(statblock);
        
        // Add traits (if any)
        if (beast.traits && beast.traits.length > 0) {
            appendTraits(statblock, beast);
        }
        
        // Add actions (if any)
        if (beast.actions && beast.actions.length > 0) {
            appendActions(statblock, beast);
        }
        
        // Add environment (if enabled and available)
        if (options.showEnvironment && beast.environment) {
            appendEnvironment(statblock, beast);
        }
        
        // Add additional text if available
        if (beast.additionalText) {
            appendAdditionalText(statblock, beast);
        }
        
        return statblock;
    };
    
    /**
     * Append the beast header to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendHeader = function(statblock, beast) {
        const header = document.createElement('div');
        header.className = 'statblock-header';
        
        const title = document.createElement('h2');
        title.className = 'statblock-title';
        title.textContent = beast.name;
        
        const subtitle = document.createElement('p');
        subtitle.className = 'statblock-subtitle';
        subtitle.textContent = `${beast.size} ${beast.type}, ${beast.alignment}`;
        
        header.appendChild(title);
        header.appendChild(subtitle);
        statblock.appendChild(header);
    };
    
    /**
     * Append a divider to the statblock
     * @param {HTMLElement} statblock - The statblock element
     */
    const appendDivider = function(statblock) {
        const divider = document.createElement('div');
        divider.className = 'statblock-divider';
        statblock.appendChild(divider);
    };
    
    /**
     * Append attributes (AC, HP, Speed) to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendAttributes = function(statblock, beast) {
        const attributes = document.createElement('div');
        attributes.className = 'statblock-attributes';
        
        // Armor Class
        const ac = document.createElement('p');
        const acLabel = document.createElement('span');
        acLabel.className = 'statblock-attributes-label';
        acLabel.textContent = 'Armor Class ';
        ac.appendChild(acLabel);
        ac.appendChild(document.createTextNode(beast.ac));
        
        // Hit Points
        const hp = document.createElement('p');
        const hpLabel = document.createElement('span');
        hpLabel.className = 'statblock-attributes-label';
        hpLabel.textContent = 'Hit Points ';
        hp.appendChild(hpLabel);
        hp.appendChild(document.createTextNode(beast.hp));
        
        // Speed
        const speed = document.createElement('p');
        const speedLabel = document.createElement('span');
        speedLabel.className = 'statblock-attributes-label';
        speedLabel.textContent = 'Speed ';
        speed.appendChild(speedLabel);
        speed.appendChild(document.createTextNode(beast.speed));
        
        attributes.appendChild(ac);
        attributes.appendChild(hp);
        attributes.appendChild(speed);
        statblock.appendChild(attributes);
    };
    
    /**
     * Append ability scores to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendAbilityScores = function(statblock, beast) {
        const abilitiesTable = document.createElement('div');
        abilitiesTable.className = 'statblock-abilities';
        
        // Create each ability score column
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        const abilityLabels = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        
        abilities.forEach((ability, index) => {
            const abilityColumn = document.createElement('div');
            abilityColumn.className = 'statblock-ability';
            
            const abilityLabel = document.createElement('div');
            abilityLabel.className = 'statblock-ability-label';
            abilityLabel.textContent = abilityLabels[index];
            
            const abilityScore = document.createElement('div');
            abilityScore.className = 'statblock-ability-score';
            abilityScore.textContent = beast.abilities[ability].score;
            
            const abilityMod = document.createElement('div');
            abilityMod.className = 'statblock-ability-modifier';
            abilityMod.textContent = beast.abilities[ability].modifier;
            
            abilityColumn.appendChild(abilityLabel);
            abilityColumn.appendChild(abilityScore);
            abilityColumn.appendChild(abilityMod);
            
            abilitiesTable.appendChild(abilityColumn);
        });
        
        statblock.appendChild(abilitiesTable);
    };
    
    /**
     * Append details (skills, senses, languages, CR) to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendDetails = function(statblock, beast) {
        const details = document.createElement('div');
        details.className = 'statblock-details';
        
        // Skills (if any)
        if (beast.skills) {
            const skills = document.createElement('p');
            const skillsLabel = document.createElement('span');
            skillsLabel.className = 'statblock-attributes-label';
            skillsLabel.textContent = 'Skills ';
            skills.appendChild(skillsLabel);
            skills.appendChild(document.createTextNode(beast.skills));
            details.appendChild(skills);
        }
        
        // Senses
        if (beast.senses) {
            const senses = document.createElement('p');
            const sensesLabel = document.createElement('span');
            sensesLabel.className = 'statblock-attributes-label';
            sensesLabel.textContent = 'Senses ';
            senses.appendChild(sensesLabel);
            senses.appendChild(document.createTextNode(beast.senses));
            details.appendChild(senses);
        }
        
        // Languages
        const languages = document.createElement('p');
        const languagesLabel = document.createElement('span');
        languagesLabel.className = 'statblock-attributes-label';
        languagesLabel.textContent = 'Languages ';
        languages.appendChild(languagesLabel);
        languages.appendChild(document.createTextNode(beast.languages || '—'));
        details.appendChild(languages);
        
        // Challenge Rating
        const challenge = document.createElement('p');
        const challengeLabel = document.createElement('span');
        challengeLabel.className = 'statblock-attributes-label';
        challengeLabel.textContent = 'Challenge ';
        challenge.appendChild(challengeLabel);
        challenge.appendChild(document.createTextNode(beast.cr));
        details.appendChild(challenge);
        
        // Proficiency Bonus (if present)
        if (beast.profBonus) {
            const profBonus = document.createElement('p');
            const profBonusLabel = document.createElement('span');
            profBonusLabel.className = 'statblock-attributes-label';
            profBonusLabel.textContent = 'Proficiency Bonus ';
            profBonus.appendChild(profBonusLabel);
            profBonus.appendChild(document.createTextNode(beast.profBonus));
            details.appendChild(profBonus);
        }
        
        statblock.appendChild(details);
    };
    
    /**
     * Append traits to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendTraits = function(statblock, beast) {
        const traitsSection = document.createElement('div');
        traitsSection.className = 'statblock-traits';
        
        beast.traits.forEach(trait => {
            const traitElement = document.createElement('div');
            traitElement.className = 'statblock-trait';
            
            const traitName = document.createElement('span');
            traitName.className = 'trait-name';
            traitName.textContent = `${trait.name}. `;
            
            traitElement.appendChild(traitName);
            traitElement.appendChild(document.createTextNode(trait.description));
            
            traitsSection.appendChild(traitElement);
        });
        
        statblock.appendChild(traitsSection);
    };
    
    /**
     * Append actions to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendActions = function(statblock, beast) {
        const actionsSection = document.createElement('div');
        actionsSection.className = 'statblock-actions';
        
        const actionsTitle = document.createElement('h3');
        actionsTitle.className = 'statblock-section-title';
        actionsTitle.textContent = 'Actions';
        actionsSection.appendChild(actionsTitle);
        
        beast.actions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'statblock-action';
            
            const actionName = document.createElement('span');
            actionName.className = 'action-name';
            actionName.textContent = `${action.name}. `;
            
            actionElement.appendChild(actionName);
            
            // Format action description with special handling for attacks
            const description = formatActionDescription(action.description);
            actionElement.appendChild(description);
            
            actionsSection.appendChild(actionElement);
        });
        
        statblock.appendChild(actionsSection);
    };
    
    /**
     * Format action description with proper styling for attacks
     * @param {string} description - The action description
     * @returns {DocumentFragment} Formatted description DOM fragment
     */
    const formatActionDescription = function(description) {
        const fragment = document.createDocumentFragment();
        
        // Check if this is an attack action
        if (description.includes('Attack:')) {
            // Split into attack type and the rest
            const parts = description.split('Attack:');
            const attackType = parts[0] + 'Attack:';
            const rest = parts[1];
            
            // Add attack type in italics
            const attackTypeSpan = document.createElement('em');
            attackTypeSpan.textContent = attackType + ' ';
            fragment.appendChild(attackTypeSpan);
            
            // Split the rest at "Hit:" if present
            if (rest.includes('Hit:')) {
                const hitParts = rest.split('Hit:');
                fragment.appendChild(document.createTextNode(hitParts[0]));
                
                const hitSpan = document.createElement('em');
                hitSpan.textContent = 'Hit: ';
                fragment.appendChild(hitSpan);
                
                fragment.appendChild(document.createTextNode(hitParts[1]));
            } else {
                fragment.appendChild(document.createTextNode(rest));
            }
        } else {
            // Just add the description as plain text
            fragment.appendChild(document.createTextNode(description));
        }
        
        return fragment;
    };
    
    /**
     * Append environment information to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendEnvironment = function(statblock, beast) {
        const environmentSection = document.createElement('div');
        environmentSection.className = 'statblock-environment';
        
        const environmentTitle = document.createElement('h3');
        environmentTitle.className = 'statblock-section-title';
        environmentTitle.textContent = 'Environment';
        environmentSection.appendChild(environmentTitle);
        
        const environmentText = document.createElement('p');
        environmentText.textContent = beast.environment;
        environmentSection.appendChild(environmentText);
        
        statblock.appendChild(environmentSection);
    };
    
    /**
     * Append additional text to the statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendAdditionalText = function(statblock, beast) {
        const additionalSection = document.createElement('div');
        additionalSection.className = 'statblock-additional';
        
        const additionalText = document.createElement('p');
        additionalText.textContent = beast.additionalText;
        additionalSection.appendChild(additionalText);
        
        statblock.appendChild(additionalSection);
    };
    
    /**
     * Get the current beast
     * @returns {Object|null} The current beast or null if none is selected
     */
    const getCurrentBeast = function() {
        return currentBeast;
    };
    
    // Public API
    return {
        init,
        renderBeast,
        clearStatblock,
        getCurrentBeast,
        createStatblock
    };
})();

// Initialize when DOM is ready if not being imported elsewhere
if (typeof module === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('statblock-display')) {
            EnhancedStatblockComponent.init('statblock-display');
        }
    });
}
