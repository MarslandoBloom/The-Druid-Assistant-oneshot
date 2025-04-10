# The Druid's Wildshape and Conjure Animals Assistant

A web-based assistant that helps D&D 5e Druid players manage their Wildshape transformations and Conjure Animals spell usage by providing statblocks, automating dice rolls, and tracking summoned creatures.

## Project Summary

This application helps Druid players with:
- Viewing beast statblocks
- Managing Wildshape transformations
- Handling Conjure Animals spells
- Tracking prepared spells
- Rolling dice for various actions

## Development Log

### Stage 1: Project Setup & Base HTML/CSS (March 29, 2025)
- Created basic HTML structure with tab navigation
- Implemented responsive CSS layout with mobile-first approach
- Set up app initialization script with module pattern
- Created tab navigation functionality with URL hash support
- Added data import/export UI elements

### Stage 2: Database & Parser (March 29, 2025)
- Implemented IndexedDB storage for beast and spell data
- Created database module with CRUD operations and versioning
- Added beast and spell data stores with appropriate indices
- Implemented user preferences storage system
- Created markdown parser for beast data from 5etools format
- Added spell parser for standardized spell entries
- Implemented event management system for component communication
- Created UI utilities for DOM manipulation and notifications
- Updated app.js to integrate with database and parser modules
- Added automatic sample data loading on first run

### Stage 3: Data Management (March 29, 2025)
- Added robust data management system with dedicated DataManager module
- Enhanced UI utilities with improved notifications and drag-and-drop support
- Extended event management system with additional data events
- Implemented comprehensive file import/export functionality including:
  - Markdown file import for beasts and spells
  - JSON file import/export for all application data
  - Proper error handling and user feedback
- Added sample data loading with fetch API
- Implemented data reset functionality with user confirmation
- Created data statistics collection for monitoring database contents
- Refactored app.js to use the new DataManager for all data operations
- Improved drag and drop file uploads with validation and feedback

### Stage 4: Statblock Components (March 29, 2025)
- Created statblock.css with styling based on D&D 5e 2014 rulebook format
- Implemented statblock.js component for rendering beast statblocks
- Added searchBar.js for real-time beast name searching with debouncing
- Created filters.js for filtering beasts by CR, size, and environment
- Implemented statblock.js module with the following features:
  - Virtual scrolling for beast list with performance optimization
  - Beast selection and favorites system with local storage persistence
  - Integration of search and filters with event-based communication
  - URL hash-based navigation for direct linking to beasts
  - Responsive statblock layout with proper typography and spacing
- Updated the main HTML to include new components and CSS

### Stage 5: Bug Fixes and Improvements (March 29, 2025)
- Fixed event management system references (changed EventSystem to EventManager throughout code)
- Fixed CORS issues with sample data loading by embedding sample beasts and spells directly in code
- Added hardcoded sample beasts (Giant Elk, Brown Bear, Wolf) for development/testing
- Added hardcoded sample spells (Shillelagh, Cure Wounds, Moonbeam) for development/testing
- Improved event handling between components for better reliability
- Fixed browser console errors and warnings

### Stage 5.1: Critical Bug Fixes (March 29, 2025)
- Fixed `Database.isReady is not a function` error by updating to use `Database.isConnected()` method
- Fixed `EventSystem is not defined` error in searchBar.js by replacing with correct `EventManager` reference
- Fixed type error in search functionality to handle both string and object query formats
- Standardized search event data format across all components for consistency
- Improved robustness of event handling across components
- Enhanced backwards compatibility between different event publishing methods
- Updated error handling to provide better feedback during search operations

### Stage 5.2: Beast Data Parser Fix (March 30, 2025)
- Fixed critical bug in beast markdown parser that was only identifying some of the beasts
- Replaced logic that assumed each beast was exactly 2 blocks of text with a more robust regex-based approach
- Updated parser to properly handle the variable structure of the markdown format
- Fixed issue with the number of beasts being imported showing incorrectly
- Improved validation of parsed beast data to ensure required fields are present
- Removed dependency on hardcoded sample data which is no longer needed

### Stage 5.3: Beast List Display Fix (March 30, 2025)
- Fixed critical bug where beast list wasn't updating after data import
- Added proper subscription to DATA_IMPORTED event in StatblockModule
- Enhanced renderBeastList() function to be more robust with error handling
- Improved applyFilters() to handle cases when FiltersComponent isn't fully initialized
- Added parseCR utility function to handle challenge rating string conversion
- Added extensive debug logging to help diagnose data flow issues
- Created fallback filter implementation for greater stability

### Stage 5.4: Infinite Loop and Database Error Fixes (March 30, 2025)
- Fixed critical infinite event loop between loadBeasts() and DATA_LOAD_COMPLETE events
- Added debouncing to prevent multiple simultaneous beast list loads
- Fixed database constraint errors in UserStore when accessing favorites
- Implemented more robust error handling throughout the application
- Enhanced getFavorites() to handle race condition when setting up initial favorites
- Fixed renderBeastList() to handle errors in component initialization
- Made createBeastItem() more resilient to database errors
- Updated updateFavoritesList() with proper error boundaries

### Stage 5.5: Beast List Rendering Fix (March 30, 2025)
- Fixed critical issue with beast list items not being displayed after import
- Replaced virtual list implementation with standard list for better reliability
- Added extensive debug logging to track beast rendering process
- Fixed result count positioning and visibility issues
- Enhanced beast item styling with better shadows and sizing
- Implemented relative positioning for beast items instead of absolute positioning
- Improved error handling throughout the beast list rendering process
- Added validation in createBeastItem() to handle edge cases
- Enhanced the UI with more consistent spacing and visual hierarchy
- Fixed multiple DOM structure and styling issues affecting list visibility

### Stage 5.6: Statblock Display Reset (March 30, 2025)
- Removed statblock display functionality to address critical rendering bug
- Created clean slate for statblock component implementation
- Maintained beast selection functionality while removing statblock display code
- Updated StatblockComponent to show placeholder when beasts are selected
- Modified event handling to maintain favoriting and tab switching functionality
- Retained all beast list functionality while removing problematic statblock code
- Prepared codebase for reimplementation of statblock display feature
- This reset affects the following functions: all statblock rendering in StatblockComponent and related code in statblock.js

### Stage 6: New Statblock Renderer Implementation (March 30, 2025)
- Created comprehensive statblock renderer component with faithful D&D 5e styling
- Implemented proper statblock layout based on official D&D format
- Created CSS styling with responsive design for various screen sizes
- Built modular component architecture with separate render functions for each section
- Added special handling for attacks, actions, and traits formatting
- Included support for all beast statblock features including:
  - Ability scores with modifiers
  - Attributes (AC, HP, Speed)
  - Skills, senses, languages, and challenge rating
  - Traits with proper formatting
  - Actions with attack and damage handling
  - Environment information
- Created both basic and enhanced versions of the component:
  - Basic StatblockRenderer for simple rendering
  - Enhanced EnhancedStatblockComponent for full app integration
- Implemented action button integration (Wildshape, Conjure Animals, Favorites)
- Added event system compatibility for seamless integration with existing codebase
- Included user store integration for favorites management
- Added comprehensive test files to demonstrate functionality
- Prepared component for direct integration into main application
- Placed all new code in tests folder for isolated testing before integration

### Stage 7: Bug Fix - Statblock Selection Issue (April 1, 2025)
- Fixed critical bug causing statblock display to go blank when selecting beasts
- Removed history/recently viewed feature which was causing double selection events
- Removed URL hash navigation system that was triggering duplicate beast selections
- Simplified beast selection code to prevent race conditions
- Eliminated problematic history tracking code that was triggering multiple selection attempts
- Removed keyboard shortcut handlers for history navigation (Alt+Left/Right/Backspace)
- Eliminated localStorage persistence for recently viewed beasts
- Removed URL hash update and hashchange event listener
- Removed UI components for displaying recently viewed beasts
- Streamlined beast selection process to be more reliable
- Enhanced codebase maintainability by removing unnecessary features

### Stage 8: Statblock Tab Improvements (April 2, 2025)
- Removed environment filtering from the statblock tab to simplify the interface
- Added collapsible filter menu to save screen space when needed
- Implemented toggle button for filters with persistent state using localStorage
- Added visual indicator to show when filters are collapsed or expanded
- Updated FiltersComponent to handle collapsed state and persist user preference
- Improved filter UI by adding a header section with toggle controls
- Simplified beast filtering logic by removing environment-based filtering
- Added transition effects for smooth filter collapse/expand animation
- Fixed styling for improved visual consistency with rest of the application

### Stage 9: Beast List Organization and Favorites Enhancement (April 2, 2025)
- Redesigned beast list to use collapsible CR groupings
- Created seven CR groups: CR 0-1/8, CR 1/4, CR 1/2, CR 1, CR 2, CR 3-4, CR 5-6
- Added expand/collapse all buttons for easy navigation
- Enhanced favorite functionality with dedicated purpose-based favorites:
  - Added "Wildshape Favourites" button to filter beasts suitable for wildshape (CR <= 1)
  - Added "Conjure Favourites" button to filter beasts suitable for conjuring (CR <= 2)
- Implemented "Return to Beasts" button when viewing favorites lists
- Added proper collapsible group interface with toggle controls
- Updated UserStore with typed favorites for better organization
- Improved the visual styling of beast list with clearer grouping
- Enhanced beast presentation with alphabetic sort within each CR group
- Updated statblock component to work with the new organization
- Improved keyboard navigation within the collapsible groups
- Replaced standard favorite button with purpose-specific favorites buttons
- Retained star icon markers for favorite beasts in the main list

### Stage 10: Statblock Tab UI Enhancements (April 2, 2025)
- Improved favorites system with separate type-specific favorites:
  - Replaced single "Add to Favourites" button with separate buttons for Wildshape and Conjure favorites
  - Added popup menu to star icon in beast list for choosing favorite type
  - Updated context menu with separate options for adding/removing from each favorite type
- Enhanced "Return to Beasts" button styling to match other navigation buttons
- Added CR group expansion state memory:
  - System now remembers which CR groups were expanded or collapsed
  - State is preserved when switching between beast list and favorites views
  - Added persistence using UserStore for preferences
- Reduced vertical spacing of elements on the left side of the tab:
  - Decreased padding in beast list items
  - Reduced margins between CR groups
  - Optimized spacing in group headers
  - Made the overall interface more compact while maintaining usability
- Enhanced favorite star functionality to show popup with type options
- Updated keyboard shortcut (Alt+F) to show favorite options menu
- Improved design consistency throughout the interface

### Stage 11: UI Styling Improvements (April 2, 2025)
- Improved visual hierarchy for better UI clarity:
  - Made CR group headings less prominent with smaller font and neutral styling
  - Removed beast counts from CR group headings for cleaner appearance
- Enhanced color scheme while maintaining cream/dark green theme:
  - Added subtle green backgrounds to group headers and containers
  - Made CR badges more prominent with white text on dark green background
  - Created consistent light green backgrounds for different UI sections
  - Added soft shadows for improved depth perception
- Standardized button styling throughout the application:
  - Created consistent styling for action buttons with uppercase text and shadows
  - Made favorite category buttons more prominent
  - Improved "Return to Beasts" button with stronger color and better contrast
  - Enhanced filter buttons with consistent styling and hover effects
  - Made expand/collapse buttons visually consistent with other primary actions
- Improved selected beast highlighting with more subtle but clear indication
- Enhanced hover states and interactive elements with consistent feedback

### Stage 12: Favorite Icon Improvements (April 2, 2025)
- Fixed issues with the favorite star icons in the beast list:
  - Removed duplicate stars that appeared in some cases
  - Made star icons purely visual indicators (non-interactive)
  - Ensured stars update properly when favorites are added or removed
  - Removed click functionality from star icons as dedicated buttons now handle this
- Improved favorite status synchronization:
  - Added event handler for favorite status changes to update UI
  - Modified favorite status updates to use actual database state
  - Implemented consistent star display across different views
  - Fixed edge cases with favorite status not being properly reflected in UI
- Enhanced the visual styling:
  - Made favorite star color more consistent
  - Improved visual indication of favorite status

### Stage 13: Removed Star from Beast List (April 2, 2025)
- Completely removed the favorite star icon from the beast list items:
  - Removed the star element creation in the createBeastItem function
  - Removed associated star styling from CSS
  - Maintained all favorite functionality through the favorite class
  - Simplified the UI by removing unnecessary visual indicators
- Improved code efficiency by removing redundant code
- Maintained all favorite functionality through the existing system

### Stage 14: Removed CR Badge from Beast List (April 2, 2025)
- Completely removed the CR badge from the beast list items:
  - Removed the CR badge element creation in the createBeastItem function
  - Removed associated CR badge styling from CSS
  - Adjusted layout to give more space to the beast name and type
  - Made the UI cleaner by removing redundant information (CR is already shown in group headers)
- Adjusted the width proportions for beast item elements:
  - Increased the left side (name/type) from 70% to 90%
  - Decreased the right side from 30% to 10%
- Improved visual consistency and reduced clutter in the beast list

### Stage 15: Fixed Favorites System Database Errors (April 3, 2025)
- Fixed critical bug causing database constraint errors when using favorites:
  - Completely restructured the favorites storage system to properly separate read and initialization operations
  - Created dedicated initialization functions for favorites and type-specific favorites
  - Removed attempt to create favorites entries during data retrieval that was causing constraint errors
  - Added explicit favorites system initialization during application startup
  - Created separate functions for getting, initializing, and managing favorites
- Improved error handling in the favorites system:
  - Enhanced error messages with better context for debugging
  - Made the system more resilient to database errors
  - Improved error recovery to maintain application functionality
- Added initialization sequence for all favorites types at database creation time:
  - General favorites
  - Wildshape favorites
  - Conjure favorites
- Created comprehensive initializeAllFavourites function to centralize initialization
- Updated database initialization sequence to properly initialize user preferences

### Stage 16: Fixed Data Management Button Issues (April 3, 2025)
- Fixed critical bug with data management buttons (import, export, reset) becoming unresponsive after use:
  - Changed approach from using global loading overlay to simpler button state management
  - Modified import, export, and reset functions to properly preserve button event handlers
  - Ensured buttons are always restored to original state even after errors
  - Fixed import button partially working issue (only responding when clicking left edge)
- Enhanced error handling in data operations:
  - Added explicit error recovery for all data management functions
  - Improved user feedback during data operations with text changes
  - Ensured consistent button state during all operations
- Added direct confirmation handling for reset operation to eliminate redundant confirmation dialogs

### Stage 17: Fixed Data Management Buttons and Notifications (April 10, 2025)
- Fixed critical issues with data management buttons getting stuck:
  - Restructured the import, export, and reset functions with proper try/finally blocks
  - Ensured button states are always restored regardless of success or error
  - Fixed import button staying in 'Importing...' state after operation completes
  - Made button event handlers properly preserve original button text
- Improved notification system reliability:
  - Fixed notification display issues with improved CSS transitions
  - Enhanced notification creation to avoid text content being overwritten
  - Added proper event propagation control for notification close buttons
  - Improved notification cleanup to prevent memory leaks
  - Added small delay before showing notifications to ensure proper CSS animation
- Added more robust error handling in all data operations:
  - Implemented proper null/undefined checking for operation results
  - Added optional chaining for error message access
  - Improved error handling consistency across all data management functions

### Stage 18: Fixed Reset Data Functionality (April 10, 2025)
- Fixed critical issue with Reset Data button not updating UI after database reset:
  - Added proper implementation of the handleDataReset function in app.js
  - Made StatblockModule subscribe to the DATA_RESET event
  - Added UI cleanup in loadBeasts function to handle empty database state properly
  - Implemented proper reset of UI components when data is cleared
  - Added delay to ensure database operations complete before UI updates
- Enhanced user experience after reset:
  - Reset buttons are properly disabled when no beasts are loaded
  - Statblock display shows placeholder message after reset
  - Beast list shows appropriate empty state message
  - Result count is updated to show zero results