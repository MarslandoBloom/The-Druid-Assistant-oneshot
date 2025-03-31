# Statblock Renderer Tests

This folder contains test implementations of the statblock renderer component for The Druid's Assistant.

## Files

- `statblock-renderer.js` - A simple statblock renderer component
- `statblock-styles.css` - CSS styles for the statblock component
- `statblock-test.html` - A simple test page for the statblock renderer
- `statblock-component.js` - Enhanced statblock component ready for integration with the main app
- `statblock-enhanced-test.html` - Test page demonstrating the enhanced component
- `parser-test.js` - Original test script for beast data parser

## Component Overview

The statblock renderer components provide faithful implementations of D&D 5e statblocks based on the official formatting guidelines. The components take JSON beast data as input and render an appropriately styled statblock in the DOM.

### Basic StatblockRenderer

The basic `StatblockRenderer` offers a clean, minimal implementation focused only on rendering statblocks:

- `createStatblock(beast)` - Creates a statblock DOM element from beast data
- `renderStatblock(beast, container)` - Renders a beast statblock in a container element

### Enhanced EnhancedStatblockComponent

The `EnhancedStatblockComponent` is designed to integrate with the main application architecture:

- Compatible with the app's EventManager for event-based communication
- Supports action buttons (Wildshape, Conjure Animals, Favorites)
- Integrates with UserStore for favorites management
- Supports notification system
- Configurable through options

## Testing

You can test the statblock components by opening the HTML test files in a browser:

- `statblock-test.html` - Basic test with sample beast data
- `statblock-enhanced-test.html` - Enhanced test with beast list, action buttons, and favorite management

## Integration

To integrate the enhanced component into the main application, follow these steps:

1. Copy `statblock-component.js` to the `js/components/` directory
2. Update the CSS in `css/statblock.css` with the styles from `statblock-styles.css`
3. Replace the existing StatblockComponent implementation with a call to `EnhancedStatblockComponent.init('statblock-display')`

## Styling

The styles are based on the official D&D 5e 2014 rulebook formatting, with responsive design adaptations for various screen sizes.
