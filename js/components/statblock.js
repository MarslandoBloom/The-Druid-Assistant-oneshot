/**
 * Statblock component
 * Handles rendering and interaction with beast statblocks
 */
const StatblockComponent = (function() {
    // Cache DOM elements
    let statblockContainer;
    let currentBeast = null;
    
    /**
     * Initialize the statblock component
     */
    const init = function() {
        statblockContainer = document.getElementById('statblock-display');
        
        // Subscribe to events
        EventManager.subscribe(EventManager.EVENTS.BEAST_SELECTED, handleBeastSelected);
        
        // Initialize action buttons
        initActionButtons();
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
        
        if (favoriteButton) {
            favoriteButton.addEventListener('click', handleFavoriteClick);
        }
    };
    
    /**
     * Handle beast selected event
     * @param {Object} beast - The selected beast
     */
    const handleBeastSelected = function(beast) {
        if (!beast) return;
        
        currentBeast = beast;
        renderStatblock(beast);
        
        // Enable action buttons
        enableActionButtons();
        
        // Update favorite button state
        updateFavoriteButtonState(beast);
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
     * Update favorite button state
     * @param {Object} beast - The beast to check favorite status
     */
    const updateFavoriteButtonState = function(beast) {
        const favoriteButton = document.getElementById('favorite-button');
        if (!favoriteButton) return;
        
        UserStore.isFavorite(beast.id).then(isFavorite => {
            if (isFavorite) {
                favoriteButton.textContent = 'Remove from Favorites';
                favoriteButton.classList.add('active');
            } else {
                favoriteButton.textContent = 'Add to Favorites';
                favoriteButton.classList.remove('active');
            }
        });
    };
    
    /**
     * Handle wildshape button click
     */
    const handleWildshapeClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to wildshape tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'wildshape-tab' });
        EventManager.publish('wildshape:start', currentBeast);
    };
    
    /**
     * Handle conjure animals button click
     */
    const handleConjureClick = function() {
        if (!currentBeast) return;
        
        // Publish event to switch to conjure tab with current beast
        EventManager.publish(EventManager.EVENTS.TAB_CHANGED, { tabName: 'conjure-tab' });
        EventManager.publish('conjure:start', currentBeast);
    };
    
    /**
     * Handle favorite button click
     */
    const handleFavoriteClick = function() {
        if (!currentBeast) return;
        
        UserStore.isFavorite(currentBeast.id).then(isFavorite => {
            if (isFavorite) {
                // Remove from favorites
                UserStore.removeFavorite(currentBeast.id).then(() => {
                    updateFavoriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_REMOVED, currentBeast);
                    UIUtils.showNotification(`Removed ${currentBeast.name} from favorites`, 'info');
                });
            } else {
                // Add to favorites
                UserStore.addFavorite(currentBeast.id).then(() => {
                    updateFavoriteButtonState(currentBeast);
                    EventManager.publish(EventManager.EVENTS.BEAST_FAVORITE_ADDED, currentBeast);
                    UIUtils.showNotification(`Added ${currentBeast.name} to favorites`, 'success');
                });
            }
        });
    };
    
    /**
     * Render a statblock for the given beast
     * @param {Object} beast - The beast to render
     */
    const renderStatblock = function(beast) {
        if (!statblockContainer || !beast) return;
        
        // Create the statblock
        const statblock = createStatblock(beast);
        
        // Clear container and add new statblock
        statblockContainer.innerHTML = '';
        statblockContainer.appendChild(statblock);
        
        // Add fade-in animation
        setTimeout(() => {
            statblock.classList.add('active');
        }, 10);
    };
    
    /**
     * Create a statblock element for the given beast
     * @param {Object} beast - The beast to create a statblock for
     * @returns {HTMLElement} The statblock element
     */
    const createStatblock = function(beast) {
        // Create the main container
        const statblock = document.createElement('div');
        statblock.className = 'statblock';
        
        // Add header
        addHeader(statblock, beast);
        
        // Add divider
        addDivider(statblock);
        
        // Add attributes (AC, HP, Speed)
        addAttributes(statblock, beast);
        
        // Add abilities (STR, DEX, CON, INT, WIS, CHA)
        addAbilities(statblock, beast);
        
        // Add details (skills, senses, languages, CR)
        addDetails(statblock, beast);
        
        // Add divider
        addDivider(statblock);
        
        // Add traits
        addTraits(statblock, beast);
        
        // Add actions
        addActions(statblock, beast);
        
        // Add reactions (if any)
        if (beast.reactions && beast.reactions.length > 0) {
            addReactions(statblock, beast);
        }
        
        // Add legendary actions (if any)
        if (beast.legendary && beast.legendary.length > 0) {
            addLegendaryActions(statblock, beast);
        }
        
        return statblock;
    };
    
    /**
     * Add header to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addHeader = function(statblock, beast) {
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
     * Add divider to statblock
     * @param {HTMLElement} statblock - The statblock element
     */
    const addDivider = function(statblock) {
        const divider = document.createElement('div');
        divider.className = 'statblock-divider';
        statblock.appendChild(divider);
    };
    
    /**
     * Add attributes to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addAttributes = function(statblock, beast) {
        const attributes = document.createElement('div');
        attributes.className = 'statblock-attributes';
        
        // Armor Class
        const ac = document.createElement('p');
        ac.innerHTML = '<span class="statblock-attributes-label">Armor Class</span> ' + beast.ac;
        
        // Hit Points
        const hp = document.createElement('p');
        hp.innerHTML = '<span class="statblock-attributes-label">Hit Points</span> ' + beast.hp;
        
        // Speed
        const speed = document.createElement('p');
        speed.innerHTML = '<span class="statblock-attributes-label">Speed</span> ' + beast.speed;
        
        attributes.appendChild(ac);
        attributes.appendChild(hp);
        attributes.appendChild(speed);
        statblock.appendChild(attributes);
    };
    
    /**
     * Add abilities to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addAbilities = function(statblock, beast) {
        const abilities = document.createElement('div');
        abilities.className = 'statblock-abilities';
        
        // Add each ability score
        addAbility(abilities, 'STR', beast.abilities.str);
        addAbility(abilities, 'DEX', beast.abilities.dex);
        addAbility(abilities, 'CON', beast.abilities.con);
        addAbility(abilities, 'INT', beast.abilities.int);
        addAbility(abilities, 'WIS', beast.abilities.wis);
        addAbility(abilities, 'CHA', beast.abilities.cha);
        
        statblock.appendChild(abilities);
    };
    
    /**
     * Add a single ability to the abilities container
     * @param {HTMLElement} container - The abilities container
     * @param {string} name - The ability name
     * @param {Object} ability - The ability data
     */
    const addAbility = function(container, name, ability) {
        const abilityElement = document.createElement('div');
        abilityElement.className = 'statblock-ability';
        
        const label = document.createElement('div');
        label.className = 'statblock-ability-label';
        label.textContent = name;
        
        const score = document.createElement('div');
        score.className = 'statblock-ability-score';
        score.textContent = ability.score;
        
        const modifier = document.createElement('div');
        modifier.className = 'statblock-ability-modifier';
        modifier.textContent = ability.modifier;
        
        abilityElement.appendChild(label);
        abilityElement.appendChild(score);
        abilityElement.appendChild(modifier);
        container.appendChild(abilityElement);
    };
    
    /**
     * Add details to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addDetails = function(statblock, beast) {
        const details = document.createElement('div');
        details.className = 'statblock-details';
        
        // Skills
        if (beast.skills) {
            const skills = document.createElement('p');
            skills.innerHTML = '<span class="statblock-attributes-label">Skills</span> ' + beast.skills;
            details.appendChild(skills);
        }
        
        // Senses
        if (beast.senses) {
            const senses = document.createElement('p');
            senses.innerHTML = '<span class="statblock-attributes-label">Senses</span> ' + beast.senses;
            details.appendChild(senses);
        }
        
        // Languages
        const languages = document.createElement('p');
        languages.innerHTML = '<span class="statblock-attributes-label">Languages</span> ' + (beast.languages || '—');
        details.appendChild(languages);
        
        // Challenge Rating
        const cr = document.createElement('p');
        cr.innerHTML = '<span class="statblock-attributes-label">Challenge</span> ' + beast.cr;
        if (beast.profBonus) {
            cr.innerHTML += ' (' + beast.profBonus + ')';
        }
        details.appendChild(cr);
        
        statblock.appendChild(details);
    };
    
    /**
     * Add traits to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addTraits = function(statblock, beast) {
        if (!beast.traits || beast.traits.length === 0) {
            return;
        }
        
        const traits = document.createElement('div');
        traits.className = 'statblock-traits';
        
        // Add each trait
        beast.traits.forEach(trait => {
            const traitElement = document.createElement('p');
            traitElement.innerHTML = '<span class="trait-name">' + trait.name + '.</span> ' + trait.description;
            traits.appendChild(traitElement);
        });
        
        statblock.appendChild(traits);
    };
    
    /**
     * Add actions to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addActions = function(statblock, beast) {
        if (!beast.actions || beast.actions.length === 0) {
            return;
        }
        
        const actions = document.createElement('div');
        actions.className = 'statblock-actions';
        
        // Add section title
        const title = document.createElement('h3');
        title.className = 'statblock-section-title';
        title.textContent = 'Actions';
        actions.appendChild(title);
        
        // Add each action
        beast.actions.forEach(action => {
            const actionElement = document.createElement('p');
            actionElement.innerHTML = '<span class="action-name">' + action.name + '.</span> ' + action.description;
            actions.appendChild(actionElement);
        });
        
        statblock.appendChild(actions);
    };
    
    /**
     * Add reactions to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addReactions = function(statblock, beast) {
        const reactions = document.createElement('div');
        reactions.className = 'statblock-reactions';
        
        // Add section title
        const title = document.createElement('h3');
        title.className = 'statblock-section-title';
        title.textContent = 'Reactions';
        reactions.appendChild(title);
        
        // Add each reaction
        beast.reactions.forEach(reaction => {
            const reactionElement = document.createElement('p');
            reactionElement.innerHTML = '<span class="reaction-name">' + reaction.name + '.</span> ' + reaction.description;
            reactions.appendChild(reactionElement);
        });
        
        statblock.appendChild(reactions);
    };
    
    /**
     * Add legendary actions to statblock
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const addLegendaryActions = function(statblock, beast) {
        const legendary = document.createElement('div');
        legendary.className = 'statblock-legendary';
        
        // Add section title
        const title = document.createElement('h3');
        title.className = 'statblock-section-title';
        title.textContent = 'Legendary Actions';
        legendary.appendChild(title);
        
        // Add description
        const description = document.createElement('p');
        description.textContent = `${beast.name} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. ${beast.name} regains spent legendary actions at the start of its turn.`;
        legendary.appendChild(description);
        
        // Add each legendary action
        beast.legendary.forEach(action => {
            const actionElement = document.createElement('p');
            actionElement.innerHTML = '<span class="legendary-name">' + action.name + '.</span> ' + action.description;
            legendary.appendChild(actionElement);
        });
        
        statblock.appendChild(legendary);
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
     * Get the current beast
     * @returns {Object} The current beast
     */
    const getCurrentBeast = function() {
        return currentBeast;
    };
    
    // Public API
    return {
        init,
        renderStatblock,
        clearStatblock,
        getCurrentBeast
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    StatblockComponent.init();
});
