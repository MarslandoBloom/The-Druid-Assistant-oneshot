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
