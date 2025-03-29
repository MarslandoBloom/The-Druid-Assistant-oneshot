/**
 * Event management system
 * Provides pub/sub pattern for component communication
 */
const EventManager = (function() {
    // Event listeners storage
    const listeners = new Map();
    
    // Event history for debugging
    const eventHistory = [];
    const MAX_HISTORY = 100;
    const debugMode = false;
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is published
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    const subscribe = (eventName, callback, options = {}) => {
        if (!eventName || typeof callback !== 'function') {
            throw new Error('Event name and callback function are required');
        }
        
        // Create event namespace if it doesn't exist
        if (!listeners.has(eventName)) {
            listeners.set(eventName, []);
        }
        
        // Create subscription object
        const subscription = {
            callback,
            options: {
                once: options.once || false,
                priority: options.priority || 0,
                context: options.context || null
            }
        };
        
        // Add subscription to listeners
        listeners.get(eventName).push(subscription);
        
        // Sort listeners by priority (higher numbers first)
        listeners.get(eventName).sort((a, b) => b.options.priority - a.options.priority);
        
        // Log subscription in debug mode
        if (debugMode) {
            console.log(`Event: Subscribed to '${eventName}'`, subscription);
        }
        
        // Return unsubscribe function
        return () => {
            const currentListeners = listeners.get(eventName);
            if (currentListeners) {
                const index = currentListeners.findIndex(l => l.callback === callback);
                if (index !== -1) {
                    currentListeners.splice(index, 1);
                    
                    // Log unsubscription in debug mode
                    if (debugMode) {
                        console.log(`Event: Unsubscribed from '${eventName}'`, subscription);
                    }
                }
            }
        };
    };
    
    /**
     * Subscribe to an event once
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is published
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    const subscribeOnce = (eventName, callback, options = {}) => {
        return subscribe(eventName, callback, { ...options, once: true });
    };
    
    /**
     * Publish an event
     * @param {string} eventName - Name of the event to publish
     * @param {Object} data - Data to pass to subscribers
     * @returns {boolean} True if event had subscribers
     */
    const publish = (eventName, data = {}) => {
        if (!eventName) {
            throw new Error('Event name is required');
        }
        
        // Add timestamp to event data
        const eventData = {
            ...data,
            _timestamp: Date.now(),
            _eventName: eventName
        };
        
        // Log event to history
        if (eventHistory.length >= MAX_HISTORY) {
            eventHistory.shift();
        }
        eventHistory.push({
            eventName,
            data: eventData,
            timestamp: eventData._timestamp
        });
        
        // Log published event in debug mode
        if (debugMode) {
            console.log(`Event: Published '${eventName}'`, eventData);
        }
        
        // If no listeners, return false
        if (!listeners.has(eventName)) {
            return false;
        }
        
        const eventListeners = listeners.get(eventName);
        const onceListeners = [];
        
        // Call each listener
        eventListeners.forEach(subscription => {
            try {
                const { callback, options } = subscription;
                callback.call(options.context, eventData);
                
                // Track 'once' listeners to remove later
                if (options.once) {
                    onceListeners.push(subscription);
                }
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        });
        
        // Remove 'once' listeners
        if (onceListeners.length > 0) {
            onceListeners.forEach(onceListener => {
                const index = eventListeners.indexOf(onceListener);
                if (index !== -1) {
                    eventListeners.splice(index, 1);
                }
            });
        }
        
        return true;
    };
    
    /**
     * Clear all listeners for an event
     * @param {string} eventName - Name of the event to clear
     * @returns {boolean} True if event existed and was cleared
     */
    const clear = (eventName) => {
        if (!eventName) {
            throw new Error('Event name is required');
        }
        
        if (listeners.has(eventName)) {
            listeners.set(eventName, []);
            
            // Log clear in debug mode
            if (debugMode) {
                console.log(`Event: Cleared all listeners for '${eventName}'`);
            }
            
            return true;
        }
        
        return false;
    };
    
    /**
     * Clear all event listeners
     * @returns {void}
     */
    const clearAll = () => {
        listeners.clear();
        
        // Log clear all in debug mode
        if (debugMode) {
            console.log('Event: Cleared all event listeners');
        }
    };
    
    /**
     * Check if an event has subscribers
     * @param {string} eventName - Name of the event to check
     * @returns {boolean} True if event has subscribers
     */
    const hasSubscribers = (eventName) => {
        if (!eventName) {
            throw new Error('Event name is required');
        }
        
        return listeners.has(eventName) && listeners.get(eventName).length > 0;
    };
    
    /**
     * Get subscriber count for an event
     * @param {string} eventName - Name of the event to check
     * @returns {number} Number of subscribers
     */
    const getSubscriberCount = (eventName) => {
        if (!eventName) {
            throw new Error('Event name is required');
        }
        
        return listeners.has(eventName) ? listeners.get(eventName).length : 0;
    };
    
    /**
     * Get event history
     * @param {number} limit - Maximum number of history items to return
     * @returns {Array} Event history
     */
    const getEventHistory = (limit = MAX_HISTORY) => {
        return eventHistory.slice(-limit);
    };
    
    /**
     * Clear event history
     * @returns {void}
     */
    const clearEventHistory = () => {
        eventHistory.length = 0;
    };
    
    /**
     * Create a debounced publish function
     * @param {string} eventName - Name of the event to publish
     * @param {number} wait - Milliseconds to wait before publishing
     * @returns {Function} Debounced publish function
     */
    const debouncePublish = (eventName, wait = 300) => {
        let timeout;
        
        return (data) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                publish(eventName, data);
            }, wait);
        };
    };
    
    /**
     * Create a throttled publish function
     * @param {string} eventName - Name of the event to publish
     * @param {number} wait - Milliseconds to wait between publishes
     * @returns {Function} Throttled publish function
     */
    const throttlePublish = (eventName, wait = 300) => {
        let timeout = null;
        let lastPublish = 0;
        
        return (data) => {
            const now = Date.now();
            const remaining = wait - (now - lastPublish);
            
            if (remaining <= 0) {
                // Publish immediately
                lastPublish = now;
                publish(eventName, data);
            } else if (!timeout) {
                // Schedule a publish
                timeout = setTimeout(() => {
                    timeout = null;
                    lastPublish = Date.now();
                    publish(eventName, data);
                }, remaining);
            }
        };
    };
    
    // Define common event types
    const EVENT_TYPES = {
        // Data events
        DATA_IMPORTED: 'data:imported',
        DATA_EXPORTED: 'data:exported',
        DATA_RESET: 'data:reset',
        
        // Beast events
        BEAST_SELECTED: 'beast:selected',
        BEAST_ADDED: 'beast:added',
        BEAST_UPDATED: 'beast:updated',
        BEAST_REMOVED: 'beast:removed',
        BEAST_FILTERED: 'beast:filtered',
        BEAST_FAVORITE_ADDED: 'beast:favorite:added',
        BEAST_FAVORITE_REMOVED: 'beast:favorite:removed',
        
        // Spell events
        SPELL_SELECTED: 'spell:selected',
        SPELL_ADDED: 'spell:added',
        SPELL_UPDATED: 'spell:updated',
        SPELL_REMOVED: 'spell:removed',
        SPELL_FILTERED: 'spell:filtered',
        SPELL_PREPARED: 'spell:prepared',
        SPELL_UNPREPARED: 'spell:unprepared',
        SPELL_CAST: 'spell:cast',
        
        // UI events
        TAB_CHANGED: 'tab:changed',
        FILTER_APPLIED: 'filter:applied',
        FILTER_RESET: 'filter:reset',
        SEARCH_PERFORMED: 'search:performed',
        SEARCH_CLEARED: 'search:cleared',
        
        // Application events
        APP_INITIALIZED: 'app:initialized',
        APP_ERROR: 'app:error',
        APP_NOTIFICATION: 'app:notification',
        
        // Component events
        COMPONENT_LOADED: 'component:loaded',
        COMPONENT_UPDATED: 'component:updated',
        COMPONENT_ERROR: 'component:error'
    };
    
    // Public API
    return {
        subscribe,
        subscribeOnce,
        publish,
        clear,
        clearAll,
        hasSubscribers,
        getSubscriberCount,
        getEventHistory,
        clearEventHistory,
        debouncePublish,
        throttlePublish,
        EVENTS: EVENT_TYPES
    };
})();
