/**
 * Data Manager for handling import, export, and data management operations
 * Provides unified interface for importing, exporting, and reset functionality
 */
const DataManager = (function() {
    // Sample data file paths
    const SAMPLE_DATA = {
        BEASTS: 'Random 2nd selection of beasts.md',
        SPELLS: 'spells-5etools-2014-subset-druid.md'
    };
    
    /**
     * Import data from a Markdown file
     * @param {File} file - File object to import
     * @param {Object} options - Import options
     * @returns {Promise} Resolves with import results
     */
    const importFromFile = async (file, options = {}) => {
        const defaults = {
            merge: true,              // Merge with existing data instead of replacing
            showNotification: true,   // Show UI notification on completion
            processBeasts: true,      // Process beast data if present
            processSpells: true       // Process spell data if present
        };
        
        const settings = { ...defaults, ...options };
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const results = await processFileContent(content, settings);
                    
                    if (settings.showNotification && results.success) {
                        let message = `Import successful: `;
                        if (results.beastsImported > 0) {
                            message += `${results.beastsImported} beasts`;
                        }
                        if (results.spellsImported > 0) {
                            message += results.beastsImported > 0 ? ` and ${results.spellsImported} spells` : `${results.spellsImported} spells`;
                        }
                        UIUtils.showNotification(message, 'success');
                    } else if (settings.showNotification && !results.success) {
                        UIUtils.showNotification(`Import failed: ${results.error}`, 'error');
                    }
                    
                    resolve(results);
                } catch (error) {
                    console.error('Import error:', error);
                    if (settings.showNotification) {
                        UIUtils.showNotification(`Import failed: ${error.message}`, 'error');
                    }
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('File reading error:', error);
                if (settings.showNotification) {
                    UIUtils.showNotification('Error reading file', 'error');
                }
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    };
    
    /**
     * Process the file content and import data accordingly
     * @param {string} content - File content
     * @param {Object} options - Import options
     * @returns {Promise} Resolves with import results
     */
    const processFileContent = async (content, options) => {
        const result = {
            success: false,
            beastsImported: 0,
            spellsImported: 0,
            error: null
        };
        
        try {
            // Parse the markdown file to determine content type
            const parseResult = Parser.parseMarkdownFile(content);
            
            if (parseResult.type === 'unknown' || parseResult.data.length === 0) {
                result.error = 'No valid data found in the file';
                return result;
            }
            
            // Import beasts if present and option enabled
            if (parseResult.type === 'beasts' && options.processBeasts) {
                if (!options.merge) {
                    await BeastStore.clearBeasts();
                }
                await BeastStore.addBeasts(parseResult.data);
                result.beastsImported = parseResult.data.length;
                
                // Publish event
                EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                    source: 'import',
                    type: 'beasts',
                    count: parseResult.data.length,
                    merge: options.merge
                });
            }
            
            // Import spells if present and option enabled
            if (parseResult.type === 'spells' && options.processSpells) {
                if (!options.merge) {
                    await SpellStore.clearSpells();
                }
                await SpellStore.addSpells(parseResult.data);
                result.spellsImported = parseResult.data.length;
                
                // Publish event
                EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                    source: 'import',
                    type: 'spells',
                    count: parseResult.data.length,
                    merge: options.merge
                });
            }
            
            result.success = true;
        } catch (error) {
            console.error('Error processing file content:', error);
            result.error = error.message;
        }
        
        return result;
    };
    
    /**
     * Import from a text string (useful for testing or programmatic imports)
     * @param {string} content - Markdown content
     * @param {Object} options - Import options
     * @returns {Promise} Resolves with import results
     */
    const importFromText = async (content, options = {}) => {
        return processFileContent(content, {
            merge: true,
            showNotification: true,
            processBeasts: true,
            processSpells: true,
            ...options
        });
    };
    
    /**
     * Export all data to a JSON file
     * @param {Object} options - Export options
     * @returns {Promise} Resolves with export results
     */
    const exportAllData = async (options = {}) => {
        const defaults = {
            includeBeasts: true,
            includeSpells: true,
            includeUserPrefs: true,
            prettyPrint: true,
            fileName: `druid-assistant-export-${new Date().toISOString().slice(0, 10)}.json`,
            showNotification: true
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            // Get data to export
            const exportData = {};
            
            if (settings.includeBeasts) {
                exportData.beasts = await BeastStore.getAllBeasts();
            }
            
            if (settings.includeSpells) {
                exportData.spells = await SpellStore.getAllSpells();
            }
            
            if (settings.includeUserPrefs) {
                exportData.userPrefs = await UserStore.getAllSettings();
            }
            
            // Add metadata
            exportData.metadata = {
                timestamp: new Date().toISOString(),
                version: DruidAssistant.version,
                format: 'Druid\'s Assistant Export Format v1'
            };
            
            // Convert to JSON
            const jsonString = settings.prettyPrint 
                ? JSON.stringify(exportData, null, 2) 
                : JSON.stringify(exportData);
            
            // Create download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = settings.fileName;
            
            // Append to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Release the URL
            URL.revokeObjectURL(url);
            
            if (settings.showNotification) {
                UIUtils.showNotification('Data exported successfully', 'success');
            }
            
            // Publish export event
            EventManager.publish(EventManager.EVENTS.DATA_EXPORTED, {
                timestamp: new Date().toISOString(),
                beasts: exportData.beasts ? exportData.beasts.length : 0,
                spells: exportData.spells ? exportData.spells.length : 0,
                fileName: settings.fileName
            });
            
            return {
                success: true,
                fileName: settings.fileName,
                beasts: exportData.beasts ? exportData.beasts.length : 0,
                spells: exportData.spells ? exportData.spells.length : 0
            };
        } catch (error) {
            console.error('Export error:', error);
            
            if (settings.showNotification) {
                UIUtils.showNotification(`Export failed: ${error.message}`, 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    /**
     * Export data in markdown format
     * @param {string} dataType - Type of data to export ('beasts' or 'spells')
     * @param {Array} data - Data to export
     * @param {Object} options - Export options
     * @returns {Promise} Resolves with export results
     */
    const exportMarkdown = async (dataType, data, options = {}) => {
        const defaults = {
            fileName: `druid-assistant-${dataType}-${new Date().toISOString().slice(0, 10)}.md`,
            showNotification: true
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            let markdownContent = '';
            
            if (dataType === 'beasts') {
                // Generate beast markdown
                // This would be a complex conversion back to markdown format
                // For now, just use JSON as an example
                markdownContent = `# Beast Export\n\n`;
                data.forEach(beast => {
                    markdownContent += `## ${beast.name}\n`;
                    markdownContent += `*${beast.size} ${beast.type}, ${beast.alignment}*\n\n`;
                    // Add more beast details here
                });
            } else if (dataType === 'spells') {
                // Generate spell markdown
                markdownContent = `# Spell Export\n\n`;
                data.forEach(spell => {
                    markdownContent += `#### ${spell.name}\n`;
                    markdownContent += `*${spell.levelSchool}*\n\n`;
                    // Add more spell details here
                });
            } else {
                throw new Error(`Unsupported data type: ${dataType}`);
            }
            
            // Create download link
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = settings.fileName;
            
            // Append to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Release the URL
            URL.revokeObjectURL(url);
            
            if (settings.showNotification) {
                UIUtils.showNotification(`${dataType} exported successfully`, 'success');
            }
            
            return {
                success: true,
                fileName: settings.fileName,
                count: data.length
            };
        } catch (error) {
            console.error('Markdown export error:', error);
            
            if (settings.showNotification) {
                UIUtils.showNotification(`Export failed: ${error.message}`, 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    /**
     * Import data from a JSON export file
     * @param {File} file - JSON file to import
     * @param {Object} options - Import options
     * @returns {Promise} Resolves with import results
     */
    const importFromJSON = async (file, options = {}) => {
        const defaults = {
            overwrite: false,         // Overwrite existing data instead of merging
            showNotification: true,   // Show UI notification on completion
            importBeasts: true,       // Import beast data if present
            importSpells: true,       // Import spell data if present
            importUserPrefs: false    // Import user preferences if present
        };
        
        const settings = { ...defaults, ...options };
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const importData = JSON.parse(content);
                    
                    // Validate import data
                    if (!importData || typeof importData !== 'object') {
                        throw new Error('Invalid import data format');
                    }
                    
                    const result = {
                        success: false,
                        beastsImported: 0,
                        spellsImported: 0,
                        prefsImported: 0,
                        error: null
                    };
                    
                    // Import beasts if present and option enabled
                    if (importData.beasts && Array.isArray(importData.beasts) && settings.importBeasts) {
                        if (settings.overwrite) {
                            await BeastStore.clearBeasts();
                        }
                        await BeastStore.addBeasts(importData.beasts);
                        result.beastsImported = importData.beasts.length;
                        
                        // Publish event
                        EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                            source: 'import',
                            type: 'beasts',
                            count: importData.beasts.length,
                            merge: !settings.overwrite
                        });
                    }
                    
                    // Import spells if present and option enabled
                    if (importData.spells && Array.isArray(importData.spells) && settings.importSpells) {
                        if (settings.overwrite) {
                            await SpellStore.clearSpells();
                        }
                        await SpellStore.addSpells(importData.spells);
                        result.spellsImported = importData.spells.length;
                        
                        // Publish event
                        EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                            source: 'import',
                            type: 'spells',
                            count: importData.spells.length,
                            merge: !settings.overwrite
                        });
                    }
                    
                    // Import user preferences if present and option enabled
                    if (importData.userPrefs && Array.isArray(importData.userPrefs) && settings.importUserPrefs) {
                        if (settings.overwrite) {
                            await UserStore.clearSettings();
                        }
                        
                        for (const pref of importData.userPrefs) {
                            await UserStore.setSetting(pref.key, pref.value);
                        }
                        result.prefsImported = importData.userPrefs.length;
                        
                        // Publish event
                        EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                            source: 'import',
                            type: 'userPrefs',
                            count: importData.userPrefs.length,
                            merge: !settings.overwrite
                        });
                    }
                    
                    result.success = true;
                    
                    if (settings.showNotification) {
                        let message = `Import successful: `;
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
                        
                        message += parts.join(', ');
                        UIUtils.showNotification(message, 'success');
                    }
                    
                    resolve(result);
                } catch (error) {
                    console.error('JSON import error:', error);
                    
                    if (settings.showNotification) {
                        UIUtils.showNotification(`Import failed: ${error.message}`, 'error');
                    }
                    
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('File reading error:', error);
                
                if (settings.showNotification) {
                    UIUtils.showNotification('Error reading file', 'error');
                }
                
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    };
    
    /**
     * Reset all data and reload from sample files
     * @param {Object} options - Reset options
     * @returns {Promise} Resolves with reset results
     */
    const resetAllData = async (options = {}) => {
        const defaults = {
            showConfirmation: true,   // Show confirmation dialog before reset
            showNotification: true,   // Show UI notification on completion
            loadSampleData: true      // Load sample data after reset
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            // Show confirmation dialog if enabled
            if (settings.showConfirmation) {
                const confirmed = confirm('Are you sure you want to reset all data? This cannot be undone.');
                if (!confirmed) {
                    return { success: false, cancelled: true };
                }
            }
            
            const loadingIndicator = settings.showNotification ? 
                UIUtils.showLoading('Resetting data...') : null;
            
            try {
                // Clear all stores
                await BeastStore.clearBeasts();
                await SpellStore.clearSpells();
                await UserStore.clearSettings();
                
                // Load sample data if enabled
                if (settings.loadSampleData) {
                    await loadSampleData({ 
                        showNotification: false 
                    });
                }
                
                // Publish data reset event
                EventManager.publish(EventManager.EVENTS.DATA_RESET, {
                    timestamp: new Date().toISOString(),
                    loadedSamples: settings.loadSampleData
                });
                
                if (settings.showNotification) {
                    loadingIndicator.hide();
                    UIUtils.showNotification('All data has been reset', 'success');
                }
                
                return { 
                    success: true,
                    loadedSamples: settings.loadSampleData
                };
            } finally {
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
            }
        } catch (error) {
            console.error('Reset error:', error);
            
            if (settings.showNotification) {
                UIUtils.showNotification(`Reset failed: ${error.message}`, 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    /**
     * Load sample data from included files
     * @param {Object} options - Load options
     * @returns {Promise} Resolves with load results
     */
    const loadSampleData = async (options = {}) => {
        const defaults = {
            showNotification: true,   // Show UI notification on completion
            loadBeasts: true,         // Load sample beast data
            loadSpells: true          // Load sample spell data
        };
        
        const settings = { ...defaults, ...options };
        
        try {
            const loadingIndicator = settings.showNotification ? 
                UIUtils.showLoading('Loading sample data...') : null;
            
            try {
                const result = {
                    success: false,
                    beastsLoaded: 0,
                    spellsLoaded: 0,
                    error: null
                };
                
                // Load sample beast data if enabled
                if (settings.loadBeasts) {
                    try {
                        const beastResponse = await fetch(SAMPLE_DATA.BEASTS);
                        if (beastResponse.ok) {
                            const beastContent = await beastResponse.text();
                            const parsedBeasts = Parser.parseBeastMarkdown(beastContent);
                            
                            if (parsedBeasts.length > 0) {
                                await BeastStore.addBeasts(parsedBeasts);
                                result.beastsLoaded = parsedBeasts.length;
                                console.log(`Loaded ${parsedBeasts.length} sample beasts`);
                                
                                // Publish event
                                EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                                    source: 'sample',
                                    type: 'beasts',
                                    count: parsedBeasts.length
                                });
                            }
                        } else {
                            console.error('Failed to load sample beast data:', beastResponse.statusText);
                        }
                    } catch (error) {
                        console.error('Error loading sample beast data:', error);
                    }
                }
                
                // Load sample spell data if enabled
                if (settings.loadSpells) {
                    try {
                        const spellResponse = await fetch(SAMPLE_DATA.SPELLS);
                        if (spellResponse.ok) {
                            const spellContent = await spellResponse.text();
                            const parsedSpells = Parser.parseSpellMarkdown(spellContent);
                            
                            if (parsedSpells.length > 0) {
                                await SpellStore.addSpells(parsedSpells);
                                result.spellsLoaded = parsedSpells.length;
                                console.log(`Loaded ${parsedSpells.length} sample spells`);
                                
                                // Publish event
                                EventManager.publish(EventManager.EVENTS.DATA_IMPORTED, {
                                    source: 'sample',
                                    type: 'spells',
                                    count: parsedSpells.length
                                });
                            }
                        } else {
                            console.error('Failed to load sample spell data:', spellResponse.statusText);
                        }
                    } catch (error) {
                        console.error('Error loading sample spell data:', error);
                    }
                }
                
                result.success = true;
                
                if (settings.showNotification) {
                    if (result.beastsLoaded > 0 || result.spellsLoaded > 0) {
                        let message = `Sample data loaded: `;
                        if (result.beastsLoaded > 0) {
                            message += `${result.beastsLoaded} beasts`;
                        }
                        if (result.spellsLoaded > 0) {
                            message += result.beastsLoaded > 0 ? 
                                ` and ${result.spellsLoaded} spells` : 
                                `${result.spellsLoaded} spells`;
                        }
                        UIUtils.showNotification(message, 'success');
                    } else {
                        UIUtils.showNotification('No sample data could be loaded', 'warning');
                    }
                }
                
                return result;
            } finally {
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
            }
        } catch (error) {
            console.error('Sample data loading error:', error);
            
            if (settings.showNotification) {
                UIUtils.showNotification(`Failed to load sample data: ${error.message}`, 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    /**
     * Check if sample data files exist
     * @returns {Promise} Resolves with check results
     */
    const checkSampleDataFiles = async () => {
        try {
            const result = {
                beastsAvailable: false,
                spellsAvailable: false
            };
            
            // Check for beast sample file
            try {
                const beastResponse = await fetch(SAMPLE_DATA.BEASTS, { method: 'HEAD' });
                result.beastsAvailable = beastResponse.ok;
            } catch (error) {
                console.error('Error checking beast sample file:', error);
            }
            
            // Check for spell sample file
            try {
                const spellResponse = await fetch(SAMPLE_DATA.SPELLS, { method: 'HEAD' });
                result.spellsAvailable = spellResponse.ok;
            } catch (error) {
                console.error('Error checking spell sample file:', error);
            }
            
            return result;
        } catch (error) {
            console.error('Error checking sample data files:', error);
            return {
                beastsAvailable: false,
                spellsAvailable: false,
                error: error.message
            };
        }
    };
    
    /**
     * Check if database has any data
     * @returns {Promise} Resolves with check results
     */
    const checkDatabaseEmpty = async () => {
        try {
            const beasts = await BeastStore.getAllBeasts();
            const spells = await SpellStore.getAllSpells();
            
            return {
                isEmpty: beasts.length === 0 && spells.length === 0,
                beastCount: beasts.length,
                spellCount: spells.length
            };
        } catch (error) {
            console.error('Error checking database:', error);
            return {
                isEmpty: true,
                error: error.message
            };
        }
    };
    
    /**
     * Get data statistics
     * @returns {Promise} Resolves with data statistics
     */
    const getDataStats = async () => {
        try {
            const beasts = await BeastStore.getAllBeasts();
            const spells = await SpellStore.getAllSpells();
            const userPrefs = await UserStore.getAllSettings();
            
            // Beast statistics
            const beastStats = {
                total: beasts.length,
                byCR: {},
                bySize: {},
                byType: {},
                byEnvironment: {}
            };
            
            // Spell statistics
            const spellStats = {
                total: spells.length,
                byLevel: {},
                bySchool: {},
                prepared: 0
            };
            
            // Calculate beast statistics
            beasts.forEach(beast => {
                // Count by CR
                const cr = beast.cr;
                beastStats.byCR[cr] = (beastStats.byCR[cr] || 0) + 1;
                
                // Count by size
                const size = beast.size;
                beastStats.bySize[size] = (beastStats.bySize[size] || 0) + 1;
                
                // Count by type
                const type = beast.type;
                beastStats.byType[type] = (beastStats.byType[type] || 0) + 1;
                
                // Count by environment
                if (beast.environment) {
                    const environments = Array.isArray(beast.environment) ? 
                        beast.environment : [beast.environment];
                    
                    environments.forEach(env => {
                        if (env && env.trim() !== '') {
                            beastStats.byEnvironment[env] = (beastStats.byEnvironment[env] || 0) + 1;
                        }
                    });
                }
            });
            
            // Calculate spell statistics
            spells.forEach(spell => {
                // Count by level
                const level = spell.level;
                spellStats.byLevel[level] = (spellStats.byLevel[level] || 0) + 1;
                
                // Count by school
                const school = spell.school;
                spellStats.bySchool[school] = (spellStats.bySchool[school] || 0) + 1;
            });
            
            // Get prepared spells count
            const preparedSpells = await SpellStore.getPreparedSpells();
            spellStats.prepared = preparedSpells.length;
            
            return {
                beasts: beastStats,
                spells: spellStats,
                userPrefs: {
                    total: userPrefs.length
                }
            };
        } catch (error) {
            console.error('Error getting data statistics:', error);
            return {
                error: error.message
            };
        }
    };
    
    // Public API
    return {
        // Import methods
        importFromFile,
        importFromText,
        importFromJSON,
        
        // Export methods
        exportAllData,
        exportMarkdown,
        
        // Data management
        resetAllData,
        loadSampleData,
        
        // Utility methods
        checkSampleDataFiles,
        checkDatabaseEmpty,
        getDataStats,
        
        // Constants
        SAMPLE_DATA
    };
})();
