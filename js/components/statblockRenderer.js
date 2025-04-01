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
            
            // Add top row attributes (AC, HP, Speed, CR, PB) in a single row
            appendTopRowAttributes(statblock, beast);
            
            // Add ability scores
            appendAbilityScores(statblock, beast);
            
            // Add details (skills, senses, languages, etc.) - but not CR or PB which are now in top row
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
            
            // IMPORTANT: We stop here - per examples and requirements, we don't display:
            // - Reactions
            // - Legendary actions
            // - Environment information
            // - Any background lore text that appears after the 'null' marker in the data
            
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
     * Append top row attributes (AC, HP, Speed, CR, PB) to the statblock in a single row
     * @param {HTMLElement} statblock - The statblock element
     * @param {Object} beast - The beast data
     */
    const appendTopRowAttributes = function(statblock, beast) {
        const attributesRow = document.createElement('div');
        attributesRow.className = 'statblock-top-attributes';
        
        // Create container
        const attributesText = document.createElement('p');
        
        // Format the attributes into a single line
        // Armor Class
        const acSpan = document.createElement('span');
        acSpan.className = 'statblock-attributes-label';
        acSpan.textContent = 'Armor Class ';
        attributesText.appendChild(acSpan);
        attributesText.appendChild(document.createTextNode(beast.ac || '10'));
        
        // Separator
        attributesText.appendChild(document.createTextNode(' • '));
        
        // Hit Points
        const hpSpan = document.createElement('span');
        hpSpan.className = 'statblock-attributes-label';
        hpSpan.textContent = 'Hit Points ';
        attributesText.appendChild(hpSpan);
        attributesText.appendChild(document.createTextNode(beast.hp || '1'));
        
        // Separator
        attributesText.appendChild(document.createTextNode(' • '));
        
        // Speed
        const speedSpan = document.createElement('span');
        speedSpan.className = 'statblock-attributes-label';
        speedSpan.textContent = 'Speed ';
        attributesText.appendChild(speedSpan);
        attributesText.appendChild(document.createTextNode(beast.speed || '30 ft.'));
        
        // Separator
        attributesText.appendChild(document.createTextNode(' • '));
        
        // Challenge Rating with XP
        const crSpan = document.createElement('span');
        crSpan.className = 'statblock-attributes-label';
        crSpan.textContent = 'Challenge ';
        attributesText.appendChild(crSpan);
        
        // Add CR and calculate XP
        let xp = '0';
        if (beast.cr) {
            switch(beast.cr) {
                case '0': xp = '0'; break;
                case '1/8': xp = '25'; break;
                case '1/4': xp = '50'; break;
                case '1/2': xp = '100'; break;
                case '1': xp = '200'; break;
                case '2': xp = '450'; break;
                case '3': xp = '700'; break;
                case '4': xp = '1,100'; break;
                case '5': xp = '1,800'; break;
                case '6': xp = '2,300'; break;
                case '7': xp = '2,900'; break;
                case '8': xp = '3,900'; break;
                case '9': xp = '5,000'; break;
                case '10': xp = '5,900'; break;
                case '11': xp = '7,200'; break;
                case '12': xp = '8,400'; break;
                case '13': xp = '10,000'; break;
                case '14': xp = '11,500'; break;
                case '15': xp = '13,000'; break;
                case '16': xp = '15,000'; break;
                case '17': xp = '18,000'; break;
                case '18': xp = '20,000'; break;
                case '19': xp = '22,000'; break;
                case '20': xp = '25,000'; break;
                case '21': xp = '33,000'; break;
                case '22': xp = '41,000'; break;
                case '23': xp = '50,000'; break;
                case '24': xp = '62,000'; break;
                case '25': xp = '75,000'; break;
                case '26': xp = '90,000'; break;
                case '27': xp = '105,000'; break;
                case '28': xp = '120,000'; break;
                case '29': xp = '135,000'; break;
                case '30': xp = '155,000'; break;
                default: xp = '0';
            }
        }
        
        attributesText.appendChild(document.createTextNode(`${beast.cr || '0'} (${xp} XP)`));
        
        // Separator before PB if it exists
        if (beast.profBonus) {
            attributesText.appendChild(document.createTextNode(' • '));
            
            // Proficiency Bonus
            const pbSpan = document.createElement('span');
            pbSpan.className = 'statblock-attributes-label';
            pbSpan.textContent = 'PB ';
            attributesText.appendChild(pbSpan);
            attributesText.appendChild(document.createTextNode(beast.profBonus || '+2'));
        }
        
        attributesRow.appendChild(attributesText);
        statblock.appendChild(attributesRow);
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
     * Append details (skills, senses, languages) to the statblock
     * Note: CR and PB have been moved to the top attributes row
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
            
            // Remove any asterisks or > characters from skills text
            const cleanSkills = beast.skills.replace(/[\*>]/g, '');
            skills.appendChild(document.createTextNode(cleanSkills));
            details.appendChild(skills);
        }
        
        // Senses
        if (beast.senses) {
            const senses = document.createElement('p');
            const sensesLabel = document.createElement('span');
            sensesLabel.className = 'statblock-attributes-label';
            sensesLabel.textContent = 'Senses ';
            senses.appendChild(sensesLabel);
            
            // Remove any asterisks or > characters from senses text
            const cleanSenses = beast.senses.replace(/[\*>]/g, '');
            senses.appendChild(document.createTextNode(cleanSenses));
            details.appendChild(senses);
        }
        
        // Languages
        const languages = document.createElement('p');
        const languagesLabel = document.createElement('span');
        languagesLabel.className = 'statblock-attributes-label';
        languagesLabel.textContent = 'Languages ';
        languages.appendChild(languagesLabel);
        
        // Remove any asterisks or > characters from languages text
        const cleanLanguages = (beast.languages || '—').replace(/[\*>]/g, '');
        languages.appendChild(document.createTextNode(cleanLanguages));
        details.appendChild(languages);
        
        // Note: Challenge Rating and Proficiency Bonus have been moved to top row
        
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
            
            // Remove any asterisks or > characters from trait description
            const cleanDescription = trait.description.replace(/[\*>]/g, '');
            traitElement.appendChild(document.createTextNode(cleanDescription));
            
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
        actionsTitle.textContent = 'ACTIONS';
        actionsSection.appendChild(actionsTitle);
        
        beast.actions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'statblock-action';
            
            const actionName = document.createElement('span');
            actionName.className = 'action-name';
            
            // Clean the action name of any asterisks or > characters
            const cleanName = action.name.replace(/[\*>]/g, '');
            actionName.textContent = `${cleanName}. `;
            
            actionElement.appendChild(actionName);
            
            // Format action description with special handling for attacks
            const description = formatActionDescription(action.description);
            actionElement.appendChild(description);
            
            actionsSection.appendChild(actionElement);
        });
        
        statblock.appendChild(actionsSection);
    };
    
    // appendReactions function removed - not needed as we don't display reactions
    
    // appendLegendaryActions function removed - not needed as we don't display legendary actions
    
    /**
     * Format action description with proper styling for attacks
     * @param {string} description - The action description
     * @returns {DocumentFragment} Formatted description DOM fragment
     */
    const formatActionDescription = function(description) {
        const fragment = document.createDocumentFragment();
        
        try {
            // First, check if the description contains the 'null' marker which indicates the end of the statblock
            // and the beginning of background lore - we need to truncate the description at this point
            let processedDescription = description;
            if (description.includes('null')) {
                // Truncate the description at the 'null' marker
                processedDescription = description.split('null')[0].trim();
                console.log('StatblockRenderer: Truncated action description at null marker');
            }
            
            // Clean the description by removing asterisks and > characters
            const cleanDescription = processedDescription.replace(/[\*>]/g, '');
            
            // Check if this is an attack action
            if (cleanDescription.includes('Attack:')) {
                // Split into attack type and the rest
                const parts = cleanDescription.split('Attack:');
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
                // Just add the cleaned description as plain text
                fragment.appendChild(document.createTextNode(cleanDescription));
            }
        } catch (error) {
            console.error('StatblockRenderer: Error formatting action description:', error);
            // If there's an error, just return the plain description without asterisks/> and truncated at 'null'
            let errorText = description || 'Error formatting description';
            if (errorText.includes('null')) {
                errorText = errorText.split('null')[0].trim();
            }
            fragment.appendChild(document.createTextNode(errorText.replace(/[\*>]/g, '')));
        }
        
        return fragment;
    };
    
    // appendEnvironment function removed - not needed as we don't display environment information
    
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
