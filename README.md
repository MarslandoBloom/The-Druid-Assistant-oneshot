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
