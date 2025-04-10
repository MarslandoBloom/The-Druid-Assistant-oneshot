/**
 * Spell Card Component
 * Creates and manages spell card displays
 */
const SpellCard = (function() {
    /**
     * Create a spell card component
     * @param {Object} spell - The spell data to display
     * @param {HTMLElement} container - Container to append the card to
     * @param {Object} options - Optional configuration
     * @returns {HTMLElement} The created spell card element
     */
    const createSpellCard = (spell, container, options = {}) => {
        const spellCard = document.createElement('div');
        spellCard.className = 'spell-card';
        spellCard.dataset.id = spell.id;
        spellCard.dataset.level = spell.level;
        spellCard.dataset.school = spell.school;
        
        // Header
        const header = document.createElement('div');
        header.className = 'spell-header';
        
        const name = document.createElement('h2');
        name.className = 'spell-name';
        name.textContent = spell.name;
        
        const levelSchool = document.createElement('p');
        levelSchool.className = 'spell-level-school';
        levelSchool.textContent = spell.levelSchool;
        
        header.appendChild(name);
        header.appendChild(levelSchool);
        spellCard.appendChild(header);
        
        // First Divider
        const divider1 = document.createElement('div');
        divider1.className = 'spell-divider';
        spellCard.appendChild(divider1);
        
        // Meta Information
        const meta = document.createElement('div');
        meta.className = 'spell-meta';
        
        const metaProps = [
            { name: 'Casting Time', value: spell.castingTime },
            { name: 'Range', value: spell.range },
            { name: 'Components', value: spell.components },
            { name: 'Duration', value: spell.duration }
        ];
        
        for (const prop of metaProps) {
            const propElement = document.createElement('p');
            propElement.className = 'spell-meta-property';
            
            const propName = document.createElement('span');
            propName.className = 'spell-meta-property-name';
            propName.textContent = `${prop.name}: `;
            
            propElement.appendChild(propName);
            propElement.appendChild(document.createTextNode(prop.value));
            
            meta.appendChild(propElement);
        }
        
        spellCard.appendChild(meta);
        
        // Second Divider
        const divider2 = document.createElement('div');
        divider2.className = 'spell-divider';
        spellCard.appendChild(divider2);
        
        // Description
        const description = document.createElement('div');
        description.className = 'spell-description';
        
        // Handle description with potential tables
        description.innerHTML = formatSpellDescription(spell.description);
        
        spellCard.appendChild(description);
        
        // Higher Levels (if applicable)
        if (spell.higherLevels) {
            const higherLevels = document.createElement('div');
            higherLevels.className = 'spell-higher-levels';
            higherLevels.innerHTML = `<strong><em>At Higher Levels.</em></strong> ${spell.higherLevels}`;
            spellCard.appendChild(higherLevels);
        }
        
        // Classes
        const classes = document.createElement('div');
        classes.className = 'spell-classes';
        
        const classesLabel = document.createElement('span');
        classesLabel.className = 'spell-meta-property-name';
        classesLabel.textContent = 'Classes: ';
        
        classes.appendChild(classesLabel);
        classes.appendChild(document.createTextNode(Array.isArray(spell.classes) 
            ? spell.classes.join(', ') 
            : spell.classes));
        
        spellCard.appendChild(classes);
        
        // Actions (if not in list view mode)
        if (!options.listViewMode) {
            const actions = document.createElement('div');
            actions.className = 'spell-actions';
            
            // Prepare button (only shown for non-cantrips)
            if (spell.level > 0) {
                const prepareButton = document.createElement('button');
                prepareButton.className = 'spell-action-button prepare-spell';
                prepareButton.textContent = 'Prepare';
                prepareButton.dataset.spellId = spell.id;
                
                if (options.isPrepared) {
                    prepareButton.textContent = 'Unprepare';
                    prepareButton.classList.add('active');
                }
                
                prepareButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    handlePrepareSpell(spell.id, prepareButton);
                });
                
                actions.appendChild(prepareButton);
            }
            
            // Cast button (only shown for prepared spells or cantrips)
            if (options.isPrepared || spell.level === 0) {
                const castButton = document.createElement('button');
                castButton.className = 'spell-action-button cast-spell';
                castButton.textContent = 'Cast';
                castButton.dataset.spellId = spell.id;
                
                castButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    handleCastSpell(spell);
                });
                
                actions.appendChild(castButton);
            }
            
            spellCard.appendChild(actions);
        }
        
        // Add to container if provided
        if (container) {
            container.appendChild(spellCard);
        }
        
        return spellCard;
    };
    
    /**
     * Create a spell list item (compact version)
     * @param {Object} spell - The spell data
     * @param {HTMLElement} container - Container to append to
     * @param {Object} options - Optional configuration
     * @returns {HTMLElement} The created list item
     */
    const createSpellListItem = (spell, container, options = {}) => {
        const listItem = document.createElement('div');
        listItem.className = 'spell-list-item';
        listItem.dataset.id = spell.id;
        listItem.dataset.level = spell.level;
        
        if (options.isPrepared) {
            listItem.classList.add('prepared');
        }
        
        if (options.isSelected) {
            listItem.classList.add('selected');
        }
        
        const leftSection = document.createElement('div');
        leftSection.className = 'spell-list-item-left';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'spell-item-name';
        nameElement.textContent = spell.name;
        
        const levelElement = document.createElement('div');
        levelElement.className = 'spell-item-level';
        levelElement.textContent = spell.levelSchool;
        
        leftSection.appendChild(nameElement);
        leftSection.appendChild(levelElement);
        
        const rightSection = document.createElement('div');
        rightSection.className = 'spell-list-item-right';
        
        // Add quick action buttons if needed
        
        listItem.appendChild(leftSection);
        listItem.appendChild(rightSection);
        
        // Add click handler
        listItem.addEventListener('click', () => {
            handleSpellSelection(spell.id);
        });
        
        // Add to container if provided
        if (container) {
            container.appendChild(listItem);
        }
        
        return listItem;
    };
    
    /**
     * Format the spell description with proper table rendering
     * @param {string} description - The spell description
     * @returns {string} HTML-formatted description
     */
    const formatSpellDescription = (description) => {
        if (!description) return '';
        
        let formattedText = '';
        const lines = description.split('\n');
        let inTable = false;
        let tableContent = '';
        let tableHeader = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this is a table header
            if (line.match(/^##### /)) {
                const title = line.replace(/^##### /, '');
                formattedText += `<div class="spell-table-title">${title}</div>`;
                continue;
            }
            
            // Check if this is a table row
            if (line.startsWith('|') && line.endsWith('|')) {
                // If this is the first table row, start a new table
                if (!inTable) {
                    inTable = true;
                    tableContent = '<div class="spell-table">';
                    tableHeader = true;
                }
                
                // Format the table row
                let formattedRow = '<div class="spell-table-row">';
                
                // Split the line into cells
                const cells = line.split('|')
                    .filter(cell => cell !== '') // Remove empty cells (beginning/end)
                    .map(cell => cell.trim());  // Trim each cell
                
                for (const cell of cells) {
                    formattedRow += `<div class="spell-table-cell">${cell}</div>`;
                }
                
                formattedRow += '</div>';
                tableContent += formattedRow;
                
                // If this is a separator row (contains only dashes and pipes), skip it
                if (line.match(/^\|[\-\|:]+\|$/)) {
                    continue;
                }
                
                // Toggle header flag after first content row
                if (tableHeader && !line.match(/^\|[\-\|:]+\|$/)) {
                    tableHeader = false;
                }
                
                continue;
            }
            
            // If we were in a table but this line is not a table row, end the table
            if (inTable && (!line.startsWith('|') || !line.endsWith('|'))) {
                inTable = false;
                tableContent += '</div>';
                formattedText += tableContent;
                tableContent = '';
            }
            
            // Regular paragraph
            if (line !== '') {
                formattedText += `<p>${line}</p>`;
            } else {
                formattedText += '<br>';
            }
        }
        
        // If we ended while still in a table, close it
        if (inTable) {
            tableContent += '</div>';
            formattedText += tableContent;
        }
        
        return formattedText;
    };
    
    /**
     * Handle spell selection
     * @param {string} spellId - ID of the selected spell
     */
    const handleSpellSelection = (spellId) => {
        // Clear previous selection
        const previousSelection = document.querySelector('.spell-list-item.selected');
        if (previousSelection) {
            previousSelection.classList.remove('selected');
        }
        
        // Add selected class to current selection
        const currentSelection = document.querySelector(`.spell-list-item[data-id="${spellId}"]`);
        if (currentSelection) {
            currentSelection.classList.add('selected');
        }
        
        // Publish selection event
        Events.publish('spell:selected', spellId);
    };
    
    /**
     * Handle prepare spell action
     * @param {string} spellId - ID of the spell to prepare
     * @param {HTMLElement} buttonElement - The button element clicked
     */
    const handlePrepareSpell = async (spellId, buttonElement) => {
        try {
            // Toggle preparation state
            const isPrepared = buttonElement.classList.contains('active');
            
            if (isPrepared) {
                // Unprepare the spell
                await SpellStore.unprepareSpell(spellId);
                buttonElement.textContent = 'Prepare';
                buttonElement.classList.remove('active');
                
                // Find and update list item if it exists
                const listItem = document.querySelector(`.spell-list-item[data-id="${spellId}"]`);
                if (listItem) {
                    listItem.classList.remove('prepared');
                }
                
                UI.showNotification('Spell unprepared', 'info');
            } else {
                // Check if we've exceeded preparation limit
                const druidLevel = await SpellStore.getDruidLevel();
                const wisdomMod = parseInt(document.querySelector('#wisdom-modifier-select')?.value || '0');
                const prepLimit = SpellStore.getMaxPreparedSpells(druidLevel, wisdomMod);
                const preparedSpells = await SpellStore.getPreparedSpells();
                
                if (preparedSpells.length >= prepLimit) {
                    UI.showNotification('You have exceeded your prepared spell limit!', 'warning');
                    
                    // Update the limit counter to show it's over the limit
                    const prepCounter = document.querySelector('.preparation-limit');
                    if (prepCounter) {
                        prepCounter.classList.add('over-limit');
                    }
                }
                
                // Prepare the spell
                await SpellStore.prepareSpell(spellId);
                buttonElement.textContent = 'Unprepare';
                buttonElement.classList.add('active');
                
                // Find and update list item if it exists
                const listItem = document.querySelector(`.spell-list-item[data-id="${spellId}"]`);
                if (listItem) {
                    listItem.classList.add('prepared');
                }
                
                UI.showNotification('Spell prepared', 'success');
            }
            
            // Update prepared count
            updatePreparedCount();
            
            // Publish event
            Events.publish('spell:preparation:changed', { spellId, isPrepared: !isPrepared });
        } catch (error) {
            console.error('Error preparing/unpreparing spell:', error);
            UI.showNotification('Failed to prepare/unprepare spell', 'error');
        }
    };
    
    /**
     * Handle cast spell action
     * @param {Object} spell - The spell being cast
     */
    const handleCastSpell = async (spell) => {
        try {
            // Cantrips don't use spell slots
            if (spell.level === 0) {
                await SpellStore.castSpell(spell.id, 0);
                UI.showNotification(`${spell.name} cast`, 'success');
                Events.publish('spell:cast', { spellId: spell.id, slotLevel: 0 });
                return;
            }
            
            // Get available slots for this level
            const druidLevel = await SpellStore.getDruidLevel();
            const availableSlots = await SpellStore.getAvailableSpellSlots(druidLevel);
            
            // Find the minimum available slot level
            let slotLevel = spell.level;
            
            // If no slots available at the spell's level, try higher levels
            if (availableSlots[slotLevel] === 0) {
                // Look for higher level slots
                for (let i = slotLevel + 1; i <= 9; i++) {
                    if (availableSlots[i] > 0) {
                        slotLevel = i;
                        break;
                    }
                }
                
                // If still no available slots
                if (availableSlots[slotLevel] === 0) {
                    UI.showNotification(`No available spell slots for ${spell.name}`, 'warning');
                    return;
                }
            }
            
            // For spells that can be upcast, ask for slot level
            if (spell.higherLevels && slotLevel > spell.level) {
                // Create slot selection dialog
                const dialog = document.createElement('div');
                dialog.className = 'slot-selection-dialog';
                dialog.innerHTML = `
                    <h3>Cast ${spell.name}</h3>
                    <p>Choose a spell slot level:</p>
                    <div class="slot-options"></div>
                    <div class="dialog-buttons">
                        <button class="cancel-cast">Cancel</button>
                    </div>
                `;
                
                const slotOptions = dialog.querySelector('.slot-options');
                
                // Add options for each available slot level
                for (let i = spell.level; i <= 9; i++) {
                    if (availableSlots[i] > 0) {
                        const option = document.createElement('button');
                        option.className = 'slot-option';
                        option.textContent = `Level ${i} (${availableSlots[i]} slot${availableSlots[i] > 1 ? 's' : ''} available)`;
                        option.dataset.level = i;
                        
                        option.addEventListener('click', async () => {
                            const selectedLevel = parseInt(option.dataset.level);
                            await SpellStore.castSpell(spell.id, selectedLevel);
                            UI.showNotification(`${spell.name} cast using a level ${selectedLevel} slot`, 'success');
                            dialog.remove();
                            
                            // Update slot indicators
                            updateSpellSlots();
                            
                            Events.publish('spell:cast', { spellId: spell.id, slotLevel: selectedLevel });
                        });
                        
                        slotOptions.appendChild(option);
                    }
                }
                
                // Add cancel button handler
                dialog.querySelector('.cancel-cast').addEventListener('click', () => {
                    dialog.remove();
                });
                
                // Show dialog
                document.body.appendChild(dialog);
                return;
            }
            
            // Cast using the available slot
            await SpellStore.castSpell(spell.id, slotLevel);
            UI.showNotification(`${spell.name} cast using a level ${slotLevel} slot`, 'success');
            
            // Update slot indicators
            updateSpellSlots();
            
            Events.publish('spell:cast', { spellId: spell.id, slotLevel });
        } catch (error) {
            console.error('Error casting spell:', error);
            UI.showNotification('Failed to cast spell', 'error');
        }
    };
    
    /**
     * Update the prepared spells count display
     */
    const updatePreparedCount = async () => {
        try {
            const prepCounter = document.querySelector('.preparation-limit');
            if (!prepCounter) return;
            
            const druidLevel = await SpellStore.getDruidLevel();
            const wisdomMod = parseInt(document.querySelector('#wisdom-modifier-select')?.value || '0');
            const prepLimit = SpellStore.getMaxPreparedSpells(druidLevel, wisdomMod);
            const preparedSpells = await SpellStore.getPreparedSpells();
            
            prepCounter.textContent = `${preparedSpells.length}/${prepLimit} prepared spells`;
            
            // Highlight if over limit
            if (preparedSpells.length > prepLimit) {
                prepCounter.classList.add('over-limit');
            } else {
                prepCounter.classList.remove('over-limit');
            }
        } catch (error) {
            console.error('Error updating prepared count:', error);
        }
    };
    
    /**
     * Update spell slot indicators
     */
    const updateSpellSlots = async () => {
        try {
            const slotsContainer = document.querySelector('.spell-slots');
            if (!slotsContainer) return;
            
            const druidLevel = await SpellStore.getDruidLevel();
            const availableSlots = await SpellStore.getAvailableSpellSlots(druidLevel);
            const totalSlots = SpellStore.getSpellSlots(druidLevel);
            
            // Clear existing slot indicators
            slotsContainer.innerHTML = '';
            
            // Create slot indicators for each level
            for (let level = 1; level <= 9; level++) {
                // Skip if no slots at this level
                if (totalSlots[level] === 0) continue;
                
                const slotLevel = document.createElement('div');
                slotLevel.className = 'slot-level';
                
                const levelTitle = document.createElement('h4');
                levelTitle.textContent = `Level ${level}`;
                slotLevel.appendChild(levelTitle);
                
                const slotTrackers = document.createElement('div');
                slotTrackers.className = 'slot-trackers';
                
                // Create indicators for each slot
                for (let i = 0; i < totalSlots[level]; i++) {
                    const tracker = document.createElement('div');
                    tracker.className = 'slot-tracker';
                    
                    // Mark slot as used if it's beyond available count
                    if (i >= availableSlots[level]) {
                        tracker.classList.add('used');
                    }
                    
                    tracker.addEventListener('click', async () => {
                        // Toggle slot used/unused
                        if (tracker.classList.contains('used')) {
                            // Restore a slot - modify spell history
                            await restoreSpellSlot(level);
                        } else {
                            // Use a slot without casting a spell
                            await useSpellSlot(level);
                        }
                        
                        // Update all slots
                        updateSpellSlots();
                    });
                    
                    slotTrackers.appendChild(tracker);
                }
                
                slotLevel.appendChild(slotTrackers);
                slotsContainer.appendChild(slotLevel);
            }
        } catch (error) {
            console.error('Error updating spell slots:', error);
        }
    };
    
    /**
     * Use a spell slot without casting a spell
     * @param {number} level - Slot level to use
     */
    const useSpellSlot = async (level) => {
        try {
            // Create a dummy spell cast record
            await SpellStore.castSpell('manual-slot-usage', level);
            UI.showNotification(`Used a level ${level} spell slot`, 'info');
        } catch (error) {
            console.error('Error using spell slot:', error);
            UI.showNotification('Failed to use spell slot', 'error');
        }
    };
    
    /**
     * Restore a used spell slot
     * @param {number} level - Slot level to restore
     */
    const restoreSpellSlot = async (level) => {
        try {
            // Get spell history
            const history = await SpellStore.getSpellHistory();
            
            // Find the most recent cast at this level
            let indexToRemove = -1;
            
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].slotLevel === level) {
                    indexToRemove = i;
                    break;
                }
            }
            
            if (indexToRemove === -1) {
                UI.showNotification(`No used level ${level} slots found`, 'warning');
                return;
            }
            
            // Remove this entry from history
            history.splice(indexToRemove, 1);
            
            // Update the history
            await Database.update(Database.STORES.USER_PREFS, {
                key: 'spellHistory',
                value: history
            });
            
            UI.showNotification(`Restored a level ${level} spell slot`, 'success');
        } catch (error) {
            console.error('Error restoring spell slot:', error);
            UI.showNotification('Failed to restore spell slot', 'error');
        }
    };
    
    // Public API
    return {
        createSpellCard,
        createSpellListItem,
        formatSpellDescription,
        updatePreparedCount,
        updateSpellSlots
    };
})();
