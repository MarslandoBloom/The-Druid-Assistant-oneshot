/**
 * IndexedDB database management
 * Handles database connection, version management, and schema upgrades
 */
const Database = (function() {
    // Constants
    const DB_NAME = 'druid-assistant-db';
    const DB_VERSION = 1;
    
    // Cache the database connection
    let dbPromise = null;
    let isConnected = false;
    
    // Database stores (tables)
    const STORES = {
        BEASTS: 'beasts',
        SPELLS: 'spells',
        USER_PREFS: 'userPrefs'
    };
    
    // Database indices
    const INDICES = {
        BEASTS: {
            NAME: 'name',
            CR: 'cr',
            SIZE: 'size',
            TYPE: 'type',
            ENVIRONMENT: 'environment'
        },
        SPELLS: {
            NAME: 'name',
            LEVEL: 'level',
            SCHOOL: 'school',
            CLASS: 'classes'
        }
    };
    
    /**
     * Initialize the database connection
     * @returns {Promise} Resolves with database connection
     */
    const initDatabase = () => {
        if (dbPromise) {
            return dbPromise;
        }
        
        dbPromise = new Promise((resolve, reject) => {
            console.log(`Opening database: ${DB_NAME}, version: ${DB_VERSION}`);
            
            // Open connection to IndexedDB
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            // Handle database upgrade (when version changes)
            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed');
                const db = event.target.result;
                
                // Check which stores need to be created
                if (!db.objectStoreNames.contains(STORES.BEASTS)) {
                    createBeastStore(db);
                }
                
                if (!db.objectStoreNames.contains(STORES.SPELLS)) {
                    createSpellStore(db);
                }
                
                if (!db.objectStoreNames.contains(STORES.USER_PREFS)) {
                    createUserPrefsStore(db);
                }
            };
            
            // Handle successful database open
            request.onsuccess = (event) => {
                const db = event.target.result;
                isConnected = true;
                console.log('Database connection established');
                
                // Handle database close events
                db.onversionchange = () => {
                    db.close();
                    isConnected = false;
                    dbPromise = null;
                    console.log('Database connection closed due to version change');
                    alert('Database was updated in another tab. Please reload the page.');
                };
                
                resolve(db);
            };
            
            // Handle errors
            request.onerror = (event) => {
                isConnected = false;
                console.error('Database connection error:', event.target.error);
                reject(event.target.error);
            };
        });
        
        return dbPromise;
    };
    
    /**
     * Create the beast store (table)
     * @param {IDBDatabase} db - The database connection
     */
    const createBeastStore = (db) => {
        console.log('Creating beast store');
        const store = db.createObjectStore(STORES.BEASTS, { keyPath: 'id' });
        
        // Create indices for faster querying
        store.createIndex(INDICES.BEASTS.NAME, 'name', { unique: false });
        store.createIndex(INDICES.BEASTS.CR, 'cr', { unique: false });
        store.createIndex(INDICES.BEASTS.SIZE, 'size', { unique: false });
        store.createIndex(INDICES.BEASTS.TYPE, 'type', { unique: false });
        store.createIndex(INDICES.BEASTS.ENVIRONMENT, 'environment', { unique: false });
        
        console.log('Beast store created successfully');
    };
    
    /**
     * Create the spell store (table)
     * @param {IDBDatabase} db - The database connection
     */
    const createSpellStore = (db) => {
        console.log('Creating spell store');
        const store = db.createObjectStore(STORES.SPELLS, { keyPath: 'id' });
        
        // Create indices for faster querying
        store.createIndex(INDICES.SPELLS.NAME, 'name', { unique: false });
        store.createIndex(INDICES.SPELLS.LEVEL, 'level', { unique: false });
        store.createIndex(INDICES.SPELLS.SCHOOL, 'school', { unique: false });
        store.createIndex(INDICES.SPELLS.CLASS, 'classes', { unique: false, multiEntry: true });
        
        console.log('Spell store created successfully');
    };
    
    /**
     * Create the user preferences store (table)
     * @param {IDBDatabase} db - The database connection
     */
    const createUserPrefsStore = (db) => {
        console.log('Creating user preferences store');
        const store = db.createObjectStore(STORES.USER_PREFS, { keyPath: 'key' });
        
        console.log('User preferences store created successfully');
    };
    
    /**
     * Helper function to create a transaction
     * @param {string|string[]} storeNames - Store name(s) to include in transaction
     * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
     * @returns {Promise} Resolves with transaction object
     */
    const transaction = async (storeNames, mode = 'readonly') => {
        const db = await initDatabase();
        return db.transaction(storeNames, mode);
    };
    
    /**
     * Helper function to get a store from a transaction
     * @param {IDBTransaction} tx - Transaction object
     * @param {string} storeName - Name of store to get
     * @returns {IDBObjectStore} The requested object store
     */
    const getStore = (tx, storeName) => {
        return tx.objectStore(storeName);
    };
    
    /**
     * Execute a database operation within a transaction
     * @param {string} storeName - Store to operate on
     * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
     * @param {Function} callback - Function to execute with the store
     * @returns {Promise} Resolves with the result of the operation
     */
    const executeOperation = async (storeName, mode, callback) => {
        try {
            const tx = await transaction(storeName, mode);
            const store = getStore(tx, storeName);
            
            return new Promise((resolve, reject) => {
                let result;
                
                try {
                    result = callback(store);
                } catch (error) {
                    reject(error);
                    return;
                }
                
                // Handle transaction completion
                tx.oncomplete = () => {
                    resolve(result);
                };
                
                // Handle transaction errors
                tx.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                    reject(event.target.error);
                };
                
                // Handle transaction abort
                tx.onabort = (event) => {
                    console.error('Transaction aborted:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Database operation failed:', error);
            throw error;
        }
    };
    
    /**
     * Convert IDBRequest to Promise
     * @param {IDBRequest} request - IndexedDB request to convert
     * @returns {Promise} Promise that resolves with request result
     */
    const requestToPromise = (request) => {
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    };
    
    /**
     * Get all records from a store
     * @param {string} storeName - Store to get records from
     * @returns {Promise} Resolves with array of all records
     */
    const getAll = async (storeName) => {
        return executeOperation(storeName, 'readonly', (store) => {
            return requestToPromise(store.getAll());
        });
    };
    
    /**
     * Get a record by ID
     * @param {string} storeName - Store to get record from
     * @param {string} id - ID of record to get
     * @returns {Promise} Resolves with the requested record
     */
    const getById = async (storeName, id) => {
        return executeOperation(storeName, 'readonly', (store) => {
            return requestToPromise(store.get(id));
        });
    };
    
    /**
     * Add a record to a store
     * @param {string} storeName - Store to add record to
     * @param {Object} data - Record data to add
     * @returns {Promise} Resolves with the ID of the added record
     */
    const add = async (storeName, data) => {
        return executeOperation(storeName, 'readwrite', (store) => {
            return requestToPromise(store.add(data));
        });
    };
    
    /**
     * Add multiple records to a store
     * @param {string} storeName - Store to add records to
     * @param {Array} dataArray - Array of records to add
     * @returns {Promise} Resolves when all records are added
     */
    const addMultiple = async (storeName, dataArray) => {
        return executeOperation(storeName, 'readwrite', (store) => {
            const promises = dataArray.map(data => {
                return requestToPromise(store.add(data));
            });
            return Promise.all(promises);
        });
    };
    
    /**
     * Update a record in a store
     * @param {string} storeName - Store to update record in
     * @param {Object} data - Record data to update
     * @returns {Promise} Resolves when the record is updated
     */
    const update = async (storeName, data) => {
        return executeOperation(storeName, 'readwrite', (store) => {
            return requestToPromise(store.put(data));
        });
    };
    
    /**
     * Delete a record from a store
     * @param {string} storeName - Store to delete record from
     * @param {string} id - ID of record to delete
     * @returns {Promise} Resolves when the record is deleted
     */
    const remove = async (storeName, id) => {
        return executeOperation(storeName, 'readwrite', (store) => {
            return requestToPromise(store.delete(id));
        });
    };
    
    /**
     * Clear all records from a store
     * @param {string} storeName - Store to clear
     * @returns {Promise} Resolves when the store is cleared
     */
    const clear = async (storeName) => {
        return executeOperation(storeName, 'readwrite', (store) => {
            return requestToPromise(store.clear());
        });
    };
    
    /**
     * Get records by an index value
     * @param {string} storeName - Store to query
     * @param {string} indexName - Index to query by
     * @param {*} value - Value to match
     * @returns {Promise} Resolves with matching records
     */
    const getByIndex = async (storeName, indexName, value) => {
        return executeOperation(storeName, 'readonly', (store) => {
            const index = store.index(indexName);
            return requestToPromise(index.getAll(value));
        });
    };
    
    /**
     * Get records by an index within a range
     * @param {string} storeName - Store to query
     * @param {string} indexName - Index to query by
     * @param {IDBKeyRange} range - Range to match
     * @returns {Promise} Resolves with matching records
     */
    const getByRange = async (storeName, indexName, range) => {
        return executeOperation(storeName, 'readonly', (store) => {
            const index = store.index(indexName);
            return requestToPromise(index.getAll(range));
        });
    };
    
    /**
     * Search records by matching text in a specified index
     * @param {string} storeName - Store to search in
     * @param {string} indexName - Index to search
     * @param {string} searchText - Text to search for
     * @returns {Promise} Resolves with matching records
     */
    const searchByText = async (storeName, indexName, searchText) => {
        // Get all records and filter in memory
        // Not the most efficient for large datasets, but works for our needs
        const allRecords = await getAll(storeName);
        const lowerSearchText = searchText.toLowerCase();
        
        return allRecords.filter(record => {
            const fieldValue = record[indexName];
            
            // Handle array fields (like 'classes' for spells)
            if (Array.isArray(fieldValue)) {
                return fieldValue.some(value => 
                    String(value).toLowerCase().includes(lowerSearchText)
                );
            }
            
            // Handle string and other value types
            return String(fieldValue).toLowerCase().includes(lowerSearchText);
        });
    };
    
    /**
     * Check if the database is connected
     * @returns {boolean} True if connected, false otherwise
     */
    const isConnectedToDB = () => {
        return isConnected;
    };
    
    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    /**
     * Verify database integrity
     * @returns {Promise} Resolves with integrity status
     */
    const verifyIntegrity = async () => {
        try {
            // Check if all stores exist
            const db = await initDatabase();
            const storeNames = Array.from(db.objectStoreNames);
            
            const requiredStores = [STORES.BEASTS, STORES.SPELLS, STORES.USER_PREFS];
            const missingStores = requiredStores.filter(store => !storeNames.includes(store));
            
            if (missingStores.length > 0) {
                console.error('Database integrity check failed: Missing stores', missingStores);
                return {
                    valid: false,
                    reason: `Missing database stores: ${missingStores.join(', ')}`
                };
            }
            
            return { valid: true };
        } catch (error) {
            console.error('Database integrity check failed:', error);
            return {
                valid: false,
                reason: `Error during integrity check: ${error.message}`
            };
        }
    };
    
    /**
     * Export database as JSON
     * @returns {Promise} Resolves with database data as JSON
     */
    const exportDatabase = async () => {
        try {
            const beasts = await getAll(STORES.BEASTS);
            const spells = await getAll(STORES.SPELLS);
            const userPrefs = await getAll(STORES.USER_PREFS);
            
            return {
                version: DB_VERSION,
                beasts,
                spells,
                userPrefs,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Export database error:', error);
            throw error;
        }
    };
    
    /**
     * Import data into the database
     * @param {Object} data - Data to import
     * @param {Object} options - Import options
     * @returns {Promise} Resolves when import is complete
     */
    const importDatabase = async (data, options = { overwrite: true }) => {
        try {
            if (options.overwrite) {
                // Clear existing data if overwrite is true
                await clear(STORES.BEASTS);
                await clear(STORES.SPELLS);
                await clear(STORES.USER_PREFS);
            }
            
            // Import beasts
            if (data.beasts && data.beasts.length > 0) {
                await addMultiple(STORES.BEASTS, data.beasts);
            }
            
            // Import spells
            if (data.spells && data.spells.length > 0) {
                await addMultiple(STORES.SPELLS, data.spells);
            }
            
            // Import user preferences
            if (data.userPrefs && data.userPrefs.length > 0) {
                await addMultiple(STORES.USER_PREFS, data.userPrefs);
            }
            
            return {
                success: true,
                message: 'Database import completed successfully'
            };
        } catch (error) {
            console.error('Import database error:', error);
            throw error;
        }
    };
    
    // Public API
    return {
        init: initDatabase,
        isConnected: isConnectedToDB,
        verifyIntegrity,
        exportDatabase,
        importDatabase,
        generateUUID,
        STORES,
        INDICES,
        // CRUD operations
        getAll,
        getById,
        add,
        addMultiple,
        update,
        remove,
        clear,
        // Query operations
        getByIndex,
        getByRange,
        searchByText
    };
})();
