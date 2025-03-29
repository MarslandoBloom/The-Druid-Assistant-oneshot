/**
 * UI utility functions
 * Helper functions for DOM manipulation and UI components
 */
const UIUtils = (function() {
    /**
     * Create a DOM element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {Array|Node|string} children - Child elements or text content
     * @returns {HTMLElement} The created element
     */
    const createElement = (tag, attributes = {}, children = null) => {
        const element = document.createElement(tag);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.assign(element.dataset, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // Add children
        if (children !== null) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child) {
                        appendTo(element, child);
                    }
                });
            } else {
                appendTo(element, children);
            }
        }
        
        return element;
    };
    
    /**
     * Append a child to a parent element
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement|string} child - Child element or text content
     * @returns {HTMLElement} The parent element
     */
    const appendTo = (parent, child) => {
        if (!parent) return parent;
        
        if (typeof child === 'string') {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        }
        
        return parent;
    };
    
    /**
     * Remove an element from the DOM
     * @param {HTMLElement} element - Element to remove
     * @returns {boolean} True if element was removed
     */
    const removeElement = (element) => {
        if (!element) return false;
        
        if (element.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        
        return false;
    };
    
    /**
     * Toggle a class on an element
     * @param {HTMLElement} element - Element to modify
     * @param {string} className - Class to toggle
     * @param {boolean} force - Force add or remove
     * @returns {boolean} New state of the class
     */
    const toggleClass = (element, className, force) => {
        if (!element || !className) return false;
        
        if (force !== undefined) {
            if (force) {
                element.classList.add(className);
                return true;
            } else {
                element.classList.remove(className);
                return false;
            }
        } else {
            return element.classList.toggle(className);
        }
    };
    
    /**
     * Get a data attribute from an element
     * @param {HTMLElement} element - Element to get data from
     * @param {string} key - Data attribute key
     * @returns {string} Data attribute value
     */
    const getData = (element, key) => {
        if (!element || !key) return null;
        
        return element.dataset[key];
    };
    
    /**
     * Set a data attribute on an element
     * @param {HTMLElement} element - Element to set data on
     * @param {string} key - Data attribute key
     * @param {string} value - Data attribute value
     * @returns {HTMLElement} The modified element
     */
    const setData = (element, key, value) => {
        if (!element || !key) return element;
        
        element.dataset[key] = value;
        return element;
    };
    
    /**
     * Render a template with data
     * @param {string} templateId - ID of template element
     * @param {Object} data - Data to use in template
     * @returns {DocumentFragment} Rendered template content
     */
    const renderTemplate = (templateId, data = {}) => {
        const template = document.getElementById(templateId);
        if (!template) {
            throw new Error(`Template with ID '${templateId}' not found`);
        }
        
        // Clone the template content
        const content = document.importNode(template.content, true);
        
        // Replace placeholders with data
        const placeholders = content.querySelectorAll('[data-placeholder]');
        placeholders.forEach(placeholder => {
            const key = placeholder.dataset.placeholder;
            if (data[key] !== undefined) {
                placeholder.textContent = data[key];
            }
        });
        
        // Handle conditional display
        const conditionals = content.querySelectorAll('[data-if]');
        conditionals.forEach(conditional => {
            const key = conditional.dataset.if;
            if (!data[key]) {
                removeElement(conditional);
            }
        });
        
        return content;
    };
    
    /**
     * Create elements from an HTML string with data binding
     * @param {string} html - HTML string with placeholders
     * @param {Object} data - Data to use in template
     * @returns {DocumentFragment} Created elements
     */
    const createFromTemplate = (html, data = {}) => {
        // Replace data placeholders
        let processedHtml = html;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            processedHtml = processedHtml.replace(regex, value);
        }
        
        // Create a document fragment from the HTML
        const template = document.createElement('template');
        template.innerHTML = processedHtml.trim();
        return document.importNode(template.content, true);
    };
    
    /**
     * Get form data as an object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data as key-value pairs
     */
    const getFormData = (form) => {
        if (!form || !(form instanceof HTMLFormElement)) {
            throw new Error('Invalid form element');
        }
        
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (data[key] !== undefined) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        return data;
    };
    
    /**
     * Set form data from an object
     * @param {HTMLFormElement} form - Form element
     * @param {Object} data - Data to set
     * @returns {HTMLFormElement} The form element
     */
    const setFormData = (form, data) => {
        if (!form || !(form instanceof HTMLFormElement)) {
            throw new Error('Invalid form element');
        }
        
        for (const [key, value] of Object.entries(data)) {
            const elements = form.elements[key];
            
            if (!elements) continue;
            
            if (elements instanceof RadioNodeList) {
                // Handle radio buttons and checkboxes
                for (const element of elements) {
                    if (element.type === 'checkbox') {
                        if (Array.isArray(value)) {
                            element.checked = value.includes(element.value);
                        } else {
                            element.checked = element.value === value.toString();
                        }
                    } else if (element.type === 'radio') {
                        element.checked = element.value === value.toString();
                    }
                }
            } else if (elements.type === 'checkbox') {
                elements.checked = !!value;
            } else if (elements.type === 'radio') {
                elements.checked = elements.value === value.toString();
            } else {
                // Handle text inputs, selects, etc.
                elements.value = value;
            }
        }
        
        return form;
    };
    
    /**
     * Validate a form against rules
     * @param {HTMLFormElement} form - Form to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    const validateForm = (form, rules) => {
        if (!form || !(form instanceof HTMLFormElement)) {
            throw new Error('Invalid form element');
        }
        
        const formData = getFormData(form);
        const errors = {};
        
        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = formData[field];
            
            for (const rule of fieldRules) {
                switch (rule.type) {
                    case 'required':
                        if (!value || value.trim() === '') {
                            errors[field] = rule.message || 'This field is required';
                        }
                        break;
                    case 'minLength':
                        if (value && value.length < rule.value) {
                            errors[field] = rule.message || `Minimum length is ${rule.value} characters`;
                        }
                        break;
                    case 'maxLength':
                        if (value && value.length > rule.value) {
                            errors[field] = rule.message || `Maximum length is ${rule.value} characters`;
                        }
                        break;
                    case 'pattern':
                        if (value && !rule.value.test(value)) {
                            errors[field] = rule.message || 'Invalid format';
                        }
                        break;
                    case 'custom':
                        if (typeof rule.validator === 'function') {
                            const result = rule.validator(value, formData);
                            if (result !== true) {
                                errors[field] = result || rule.message || 'Invalid value';
                            }
                        }
                        break;
                }
                
                // Stop validating this field if there's already an error
                if (errors[field]) break;
            }
        }
        
        // Show errors on the form
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        for (const [field, message] of Object.entries(errors)) {
            const errorElement = form.querySelector(`[data-error="${field}"]`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    };
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Notification type (info, success, warning, error)
     * @param {number} duration - How long to display the notification (ms)
     * @returns {HTMLElement} The notification element
     */
    const showNotification = (message, type = 'info', duration = 3000) => {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = createElement('div', { className: 'notification' });
            document.body.appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show the notification
        notification.classList.add('visible');
        
        // Hide after timeout
        const timeoutId = setTimeout(() => {
            notification.classList.remove('visible');
        }, duration);
        
        // Allow clicking to dismiss
        notification.addEventListener('click', () => {
            clearTimeout(timeoutId);
            notification.classList.remove('visible');
        });
        
        return notification;
    };
    
    /**
     * Clear all notifications
     * @returns {void}
     */
    const clearNotifications = () => {
        document.querySelectorAll('.notification').forEach(notification => {
            notification.classList.remove('visible');
        });
    };
    
    /**
     * Show a modal dialog
     * @param {string|Node} content - Modal content
     * @param {Object} options - Modal options
     * @returns {Object} Modal control object
     */
    const showModal = (content, options = {}) => {
        const defaults = {
            title: '',
            closeButton: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            width: 'auto',
            height: 'auto',
            buttons: [],
            onOpen: null,
            onClose: null
        };
        
        const settings = { ...defaults, ...options };
        
        // Generate unique ID for this modal
        const modalId = 'modal-' + Date.now();
        
        // Create modal elements
        const backdropElement = createElement('div', {
            className: 'modal-backdrop',
            dataset: { modalId }
        });
        
        const modalElement = createElement('div', {
            className: 'modal',
            id: modalId,
            style: {
                width: settings.width,
                height: settings.height
            }
        });
        
        // Create header if title or close button is provided
        if (settings.title || settings.closeButton) {
            const headerElement = createElement('div', { className: 'modal-header' });
            
            if (settings.title) {
                const titleElement = createElement('h2', { className: 'modal-title' }, settings.title);
                headerElement.appendChild(titleElement);
            }
            
            if (settings.closeButton) {
                const closeButton = createElement('button', {
                    className: 'modal-close',
                    type: 'button',
                    innerHTML: '&times;',
                    ariaLabel: 'Close',
                    onclick: () => closeModal(modalId)
                });
                headerElement.appendChild(closeButton);
            }
            
            modalElement.appendChild(headerElement);
        }
        
        // Create content container
        const contentElement = createElement('div', { className: 'modal-content' });
        
        // Add content
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof Node) {
            contentElement.appendChild(content);
        }
        
        modalElement.appendChild(contentElement);
        
        // Create footer if buttons are provided
        if (settings.buttons && settings.buttons.length > 0) {
            const footerElement = createElement('div', { className: 'modal-footer' });
            
            settings.buttons.forEach(button => {
                const buttonElement = createElement('button', {
                    className: `modal-button ${button.className || ''}`,
                    type: 'button',
                    onclick: () => {
                        if (typeof button.action === 'function') {
                            button.action();
                        }
                        if (button.closeModal !== false) {
                            closeModal(modalId);
                        }
                    }
                }, button.text || 'Button');
                
                footerElement.appendChild(buttonElement);
            });
            
            modalElement.appendChild(footerElement);
        }
        
        // Add modal to the DOM
        document.body.appendChild(backdropElement);
        document.body.appendChild(modalElement);
        
        // Handle backdrop clicks
        if (settings.closeOnBackdrop) {
            backdropElement.addEventListener('click', () => {
                closeModal(modalId);
            });
            
            // Prevent clicks inside modal from closing it
            modalElement.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
        
        // Handle escape key
        if (settings.closeOnEscape) {
            const escapeHandler = (event) => {
                if (event.key === 'Escape') {
                    closeModal(modalId);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
        
        // Show the modal
        setTimeout(() => {
            backdropElement.classList.add('active');
            modalElement.classList.add('active');
            
            // Call onOpen callback
            if (typeof settings.onOpen === 'function') {
                settings.onOpen(modalElement, backdropElement);
            }
        }, 10);
        
        // Return modal control object
        return {
            id: modalId,
            element: modalElement,
            backdrop: backdropElement,
            close: () => closeModal(modalId)
        };
    };
    
    /**
     * Close a modal dialog
     * @param {string} modalId - ID of modal to close
     * @returns {boolean} True if modal was closed
     */
    const closeModal = (modalId) => {
        const modalElement = document.getElementById(modalId);
        const backdropElement = document.querySelector(`.modal-backdrop[data-modal-id="${modalId}"]`);
        
        if (!modalElement || !backdropElement) {
            return false;
        }
        
        // Get onClose callback from data attribute
        const onClose = modalElement.dataset.onClose;
        
        // Remove active class to trigger animations
        modalElement.classList.remove('active');
        backdropElement.classList.remove('active');
        
        // Remove elements after animation
        setTimeout(() => {
            removeElement(modalElement);
            removeElement(backdropElement);
            
            // Call onClose callback
            if (onClose && typeof window[onClose] === 'function') {
                window[onClose](modalId);
            }
        }, 300);
        
        return true;
    };
    
    /**
     * Show a loading indicator
     * @param {string} message - Loading message
     * @returns {Object} Loading indicator control object
     */
    const showLoading = (message = 'Loading...') => {
        // Create loading elements
        const loadingId = 'loading-' + Date.now();
        
        const backdropElement = createElement('div', {
            className: 'loading-backdrop',
            dataset: { loadingId }
        });
        
        const loadingElement = createElement('div', {
            className: 'loading-indicator',
            id: loadingId
        });
        
        const spinnerElement = createElement('div', { className: 'loading-spinner' });
        for (let i = 0; i < 12; i++) {
            spinnerElement.appendChild(createElement('div'));
        }
        
        loadingElement.appendChild(spinnerElement);
        
        if (message) {
            const messageElement = createElement('div', { className: 'loading-message' }, message);
            loadingElement.appendChild(messageElement);
        }
        
        // Add to the DOM
        document.body.appendChild(backdropElement);
        document.body.appendChild(loadingElement);
        
        // Show the loading indicator
        setTimeout(() => {
            backdropElement.classList.add('active');
            loadingElement.classList.add('active');
        }, 10);
        
        // Return control object
        return {
            id: loadingId,
            element: loadingElement,
            backdrop: backdropElement,
            hide: () => hideLoading(loadingId),
            updateMessage: (newMessage) => {
                const messageElement = loadingElement.querySelector('.loading-message');
                if (messageElement) {
                    messageElement.textContent = newMessage;
                }
            }
        };
    };
    
    /**
     * Hide a loading indicator
     * @param {string} loadingId - ID of loading indicator to hide
     * @returns {boolean} True if loading indicator was hidden
     */
    const hideLoading = (loadingId) => {
        const loadingElement = document.getElementById(loadingId);
        const backdropElement = document.querySelector(`.loading-backdrop[data-loading-id="${loadingId}"]`);
        
        if (!loadingElement || !backdropElement) {
            return false;
        }
        
        // Remove active class to trigger animations
        loadingElement.classList.remove('active');
        backdropElement.classList.remove('active');
        
        // Remove elements after animation
        setTimeout(() => {
            removeElement(loadingElement);
            removeElement(backdropElement);
        }, 300);
        
        return true;
    };
    
    /**
     * Create a debounced function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait = 300) => {
        let timeout;
        
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    };
    
    /**
     * Create a throttled function
     * @param {Function} func - Function to throttle
     * @param {number} wait - Milliseconds to wait between invocations
     * @returns {Function} Throttled function
     */
    const throttle = (func, wait = 300) => {
        let timeout = null;
        let lastCall = 0;
        
        return function(...args) {
            const context = this;
            const now = Date.now();
            const remaining = wait - (now - lastCall);
            
            if (remaining <= 0) {
                // Execute immediately
                lastCall = now;
                func.apply(context, args);
            } else if (!timeout) {
                // Schedule execution
                timeout = setTimeout(() => {
                    timeout = null;
                    lastCall = Date.now();
                    func.apply(context, args);
                }, remaining);
            }
        };
    };
    
    /**
     * Format a number as a CR string
     * @param {number} cr - Challenge rating as a number
     * @returns {string} Formatted CR string
     */
    const formatCR = (cr) => {
        if (cr === 0.125) return '1/8';
        if (cr === 0.25) return '1/4';
        if (cr === 0.5) return '1/2';
        return cr.toString();
    };
    
    /**
     * Format a spell component string with descriptions
     * @param {string} components - Component string (e.g., "V, S, M (a bit of fur)")
     * @returns {Object} Formatted components object
     */
    const formatSpellComponents = (components) => {
        if (!components) {
            return { verbal: false, somatic: false, material: false, materialDescription: '' };
        }
        
        const result = {
            verbal: components.includes('V'),
            somatic: components.includes('S'),
            material: components.includes('M'),
            materialDescription: ''
        };
        
        // Extract material description
        const materialMatch = components.match(/M \(([^)]+)\)/);
        if (materialMatch) {
            result.materialDescription = materialMatch[1].trim();
        }
        
        return result;
    };
    
    // Public API
    return {
        // DOM manipulation
        createElement,
        appendTo,
        removeElement,
        toggleClass,
        getData,
        setData,
        
        // Templates
        renderTemplate,
        createFromTemplate,
        
        // Forms
        getFormData,
        setFormData,
        validateForm,
        
        // Notifications
        showNotification,
        clearNotifications,
        
        // Modals
        showModal,
        closeModal,
        
        // Loading indicators
        showLoading,
        hideLoading,
        
        // Utility functions
        debounce,
        throttle,
        formatCR,
        formatSpellComponents
    };
})();
