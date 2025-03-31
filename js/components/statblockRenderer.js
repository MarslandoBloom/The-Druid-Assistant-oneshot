/**
 * Statblock Renderer for The Druid's Assistant
 * 
 * This component provides a faithful implementation of D&D 5e statblocks
 * based on the official formatting guidelines.
 */

const StatblockRenderer = (function() {
    /**
     * Create a statblock element for a beast
     * @param {Object} beast - The beast data object
     * @returns {HTMLElement} The statblock DOM element
     */
    const createStatblock = function(beast) {
        try {
            if (!beast) {
                console.error('StatblockRenderer: Cannot create statblock for null beast');
                return createErrorStatblock('No beast data provided');
            }
            
            console.log(`StatblockRenderer: Creating statblock for ${beast.name}`);
            
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
            
            // Add reactions (if any)
            if (beast.reactions && beast.reactions.length > 0) {
                appendReactions(statblock, beast);
            }
            
            // Add legendary actions (if any)
            if (beast.legendary && beast.legendary.length > 0) {
                appendLegendaryActions(statblock, beast);
            }
            
            // Add environment information (if present)
            if (beast.environment) {
                appendEnvironment(statblock, beast);
            }
            
            console.log('StatblockRenderer: Statblock created successfully');
            return statblock;
        } catch (error) {
            console.error('StatblockRenderer: Error creating statblock:', error);
            return createErrorStatblock(`Error creating statblock: ${error.message}`);
        }
    };
    
    /**
     * Create an error statblock to display when statblock creation fails
     * @param {string} errorMessage - The error message to display
     * @returns {HTMLElement} The error statblock element
     */
    const createErrorStatblock = function(errorMessage) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'statblock statblock-error';
        
        const errorTitle = document.createElement('h3');
        errorTitle.textContent = 'Error Displaying Statblock';
        
        const errorText = document.createElement('p');
        errorText.textContent = errorMessage || 'Unknown error';
        
        const instructionText = document.createElement('p');
        instructionText.textContent = 'Check browser console for details (F12).';
        
        errorContainer.appendChild(errorTitle);
        errorContainer.appendChild(errorText);
        errorContainer.appendChild(instructionText);
        
        return errorContainer;
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
            
            // Make sure beast.abilities and the specific ability exist
            if (beast.abilities && beast.abilities[ability]) {
                abilityScore.textContent = beast.abilities[ability].score;
            } else {
                abilityScore.textContent = '10';
                console.warn(`StatblockRenderer: Missing ability score for ${ability}`);
            }
            
            const abilityMod = document.createElement('div');
            abilityMod.className = 'statblock-ability-modifier';
            
            // Make sure beast.abilities and the specific ability exist
            if (beast.abilities && beast.abilities[ability]) {
                abilityMod.textContent = beast.abilities[ability].modifier;
            } else {
                abilityMod.textContent = '+0';
            }
            
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
     * Append reactions to the statblock (if any)
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendReactions = function(statblock, beast) {
        const reactionsSection = document.createElement('div');
        reactionsSection.className = 'statblock-reactions';
        
        const reactionsTitle = document.createElement('h3');
        reactionsTitle.className = 'statblock-section-title';
        reactionsTitle.textContent = 'Reactions';
        reactionsSection.appendChild(reactionsTitle);
        
        beast.reactions.forEach(reaction => {
            const reactionElement = document.createElement('div');
            reactionElement.className = 'statblock-reaction';
            
            const reactionName = document.createElement('span');
            reactionName.className = 'reaction-name';
            reactionName.textContent = `${reaction.name}. `;
            
            reactionElement.appendChild(reactionName);
            reactionElement.appendChild(document.createTextNode(reaction.description));
            
            reactionsSection.appendChild(reactionElement);
        });
        
        statblock.appendChild(reactionsSection);
    };
    
    /**
     * Append legendary actions to the statblock (if any)
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendLegendaryActions = function(statblock, beast) {
        const legendarySection = document.createElement('div');
        legendarySection.className = 'statblock-legendary';
        
        const legendaryTitle = document.createElement('h3');
        legendaryTitle.className = 'statblock-section-title';
        legendaryTitle.textContent = 'Legendary Actions';
        legendarySection.appendChild(legendaryTitle);
        
        // Add legendary actions description if available
        if (beast.legendaryDescription) {
            const description = document.createElement('p');
            description.className = 'legendary-description';
            description.textContent = beast.legendaryDescription;
            legendarySection.appendChild(description);
        } else {
            // Default legendary actions description
            const description = document.createElement('p');
            description.className = 'legendary-description';
            description.textContent = `${beast.name} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. ${beast.name} regains spent legendary actions at the start of its turn.`;
            legendarySection.appendChild(description);
        }
        
        // Add each legendary action
        beast.legendary.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'statblock-legendary-action';
            
            const actionName = document.createElement('span');
            actionName.className = 'action-name';
            actionName.textContent = `${action.name}. `;
            
            actionElement.appendChild(actionName);
            actionElement.appendChild(document.createTextNode(action.description));
            
            legendarySection.appendChild(actionElement);
        });
        
        statblock.appendChild(legendarySection);
    };
    
    /**
     * Format action description with proper styling for attacks
     * @param {string} description - The action description
     * @returns {DocumentFragment} Formatted description DOM fragment
     */
    const formatActionDescription = function(description) {
        const fragment = document.createDocumentFragment();
        
        try {
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
        } catch (error) {
            console.error('StatblockRenderer: Error formatting action description:', error);
            fragment.appendChild(document.createTextNode(description || 'Error formatting description'));
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
     * Render a beast statblock in a container
     * @param {Object} beast - The beast data
     * @param {HTMLElement|string} container - The container element or its ID
     * @returns {HTMLElement} The created statblock
     */
    const renderStatblock = function(beast, container) {
        try {
            console.log('StatblockRenderer: Rendering statblock');
            
            // Get container element
            let containerElement;
            if (typeof container === 'string') {
                containerElement = document.getElementById(container);
                if (!containerElement) {
                    throw new Error(`Container element with ID '${container}' not found`);
                }
            } else if (container instanceof HTMLElement) {
                containerElement = container;
            } else {
                throw new Error('Container must be an element or ID string');
            }
            
            // Validate beast data
            if (!beast) {
                throw new Error('Beast data is required');
            }
            
            // Clear the container
            containerElement.innerHTML = '';
            
            // Create and append the statblock
            const statblock = createStatblock(beast);
            containerElement.appendChild(statblock);
            
            console.log('StatblockRenderer: Statblock rendered successfully');
            return statblock;
        } catch (error) {
            console.error('StatblockRenderer: Error rendering statblock:', error);
            
            // Try to show error in container
            if (container) {
                try {
                    let containerElement;
                    if (typeof container === 'string') {
                        containerElement = document.getElementById(container);
                    } else {
                        containerElement = container;
                    }
                    
                    if (containerElement) {
                        containerElement.innerHTML = '';
                        const errorStatblock = createErrorStatblock(`Error rendering statblock: ${error.message}`);
                        containerElement.appendChild(errorStatblock);
                    }
                } catch (innerError) {
                    console.error('StatblockRenderer: Error creating error statblock:', innerError);
                }
            }
            
            return null;
        }
    };
    
    // Public API
    return {
        createStatblock,
        renderStatblock
    };
})();
