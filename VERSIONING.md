# Version History

## v2.20.0 (Enhanced Binder Mode Navigation & Usability)
This release delivers a major user experience upgrade to Binder Mode, focusing on providing more intuitive, powerful, and accessible navigation options while cleaning up the UI.

### Major Changes
- **On-Screen Navigation Arrows**: Prominent left/right arrow buttons have been added directly next to the binder page for clear and easy page turning, especially on touch devices.
- **Keyboard Navigation**: Users can now use the left and right arrow keys on their keyboard to flip through binder pages.
- **Jump-to-Page Input**: A new "Page Navigation" section in the "Binder Options" panel allows users to type in a page number and jump directly to it, which is ideal for large collections.
- **Removed Redundant Pagination**: The pagination controls at the bottom of the binder view have been removed to declutter the interface.
- **Smart Zoom Levels**: Implemented distinct default and maximum zoom levels for 9-pocket (50%) and 12-pocket (65%) views to ensure the entire page is visible by default.
- **Improved Layout & Positioning**:
  - The navigation arrows are now intelligently positioned relative to the binder, providing a consistent experience regardless of screen size.
  - The entire binder page is now vertically centered for a more polished and focused presentation.
- **Bug Fixes**: Resolved several critical bugs related to prop naming (`setIsPanelOpen`) that could cause the application to crash after certain actions, such as adding a new collection.

## v2.19.0 (Redesigned Edit Collection & Bulk Language Setting)
This update significantly improves the collection management experience with a completely reorganized "Edit Collection" screen and a new bulk language-setting tool.

### Major Changes
- **Tabbed "Edit Collection" Modal**: The modal has been redesigned with a clean, tabbed interface to separate concerns. This eliminates visual clutter and nested scrollbars, making it much easier to manage all aspects of a collection. The new tabs are: "Cards", "Details & Settings", "Rarities", "Variants", and a "Danger Zone".
- **Bulk Language Setting**: A new tool has been added to the "Details & Settings" tab that allows users to apply a specific language to all cards in a collection with a single click. This is a huge time-saver for single-language sets.
- **Improved UX**: The reorganization provides a more intuitive and streamlined workflow, especially for collections with many rarities and variants.

## v2.18.0 (Flexible Per-Card Language Management)
This major update revolutionizes language handling by moving it from the collection level to the individual card level, providing ultimate flexibility for collectors of international sets.

### Major Changes
- **Per-Card Language**: The `language` property is now part of each individual `Card` object. Users can set the language (e.g., English, Japanese, Italian) for each card independently via the card editor.
- **Mixed-Language Collections**: This change allows users to create custom collections with cards from different regions within the same set (e.g., an English "Pokémon 151" set that also includes a few favorite Japanese cards).
- **Intelligent Data Fetching**: The "Fetch Info" and "Fetch All Info" features now use each card's specific language setting to retrieve the correct regional data and artwork, ensuring maximum accuracy.
- **Simplified UI**: The language selector has been removed from the "Add/Edit Collection" modals. Instead, a "MIX" badge will appear on collection books in the showcase view if they contain multiple languages.
- **Data Migration**: A seamless migration path ensures that all existing collections will have their previous language setting applied to every card within them, preserving user data.
- **Backend Simplification**: The backend worker's logic has been streamlined. The endpoint for fetching full collection "blueprints" has been removed, as the new bulk-fetch process operates more accurately on a card-by-card basis.

## v2.17.0 (Collection Language Support)
This update introduces a critical feature for accurately managing international card collections, especially for Pokémon sets.

### Major Changes
- **Language Selection**: Users can now set a specific language (e.g., English, Italian, Japanese) for each collection. This can be done when creating a new collection or by editing an existing one.
- **Language-Specific Image Fetching**: The Data Enrichment worker now uses the collection's specified language to fetch the correct, region-specific card images from external APIs. This ensures, for example, that a Japanese card from the "Pokémon 151" set will display the Japanese artwork.
- **UI Indicators**: The collection showcase screen now displays a clear language badge (e.g., "ENG", "ITA", "JPN") on each collection "book," so users can easily identify the language of their sets.
- **Data Model Update**: The core `Collection` data structure has been updated to include a `language` property, and the data migration utility has been updated to ensure backward compatibility for all existing user collections.

## v2.16.0 (Image Source Attribution)
This update enhances user clarity by displaying the source of the fetched card images directly on the card.

### Major Changes
- **Source Badge**: A small, informative badge now appears on card images that have been enriched with external data, indicating the source of the image (e.g., "CardTrader", "pokemontcg.io").
- **Backend Update**: The data enrichment worker now tracks and returns the source of the image data.
- **UI Update**: The frontend now correctly processes and displays this source information in both list and grid views.

## v2.15.0 (Refined Image Fetching Logic)
This update refines the data enrichment process to focus exclusively on fetching high-quality, expansion-specific card images.

### Major Changes
- **Expansion-Specific Images**: The data enrichment worker has been updated to guarantee that only images corresponding to the specific card from its specific expansion are fetched.
- **PokeAPI Removed**: The fallback to `pokeapi.co` for game sprites has been completely removed. This ensures that users will no longer see incorrect Pokémon sprites instead of the actual card art.
- **Focused Data Sources**: Image sources are now strictly prioritized as CardTrader first, followed by the official Pokémon TCG API for Pokémon-related sets, ensuring the highest possible accuracy for card visuals.

## v2.14.0 (PokeAPI Integration for Enhanced Image Fallbacks)

This update further improves data resilience by adding a third external data source for Pokémon collections.

### Major Changes
- **New Data Source**: The Data Enrichment worker now integrates with `pokeapi.co` to fetch card information.
- **Improved Image Fallbacks**: For Pokémon collections, if an official card image cannot be found from CardTrader or the Pokémon TCG API, the system will now attempt to fetch game sprites or official artwork from PokeAPI as a final fallback.
- **Refactored Worker Logic**: The `handleCardDetails` function in the worker has been refactored for better readability and to more cleanly orchestrate the data fetching across all three sources.

## v2.13.0 (Multi-Source Data Enrichment)

This release significantly enhances the data fetching capabilities by making the process source-agnostic, improving data resilience and coverage.

### Major Changes
- **Multi-Source Fetching**: The "Fetch Info" functionality is no longer tied exclusively to CardTrader. The backend worker now orchestrates requests to multiple APIs.
- **Pokémon TCG API Integration**: The worker will now attempt to fetch data from the official Pokémon TCG API as a secondary source if the primary source (CardTrader) fails or provides incomplete information (e.g., a missing image). This is currently active for collections identified as Pokémon sets.
- **Resilient Data Enrichment**: The system intelligently combines data from different sources. For example, it can get pricing data from CardTrader and supplement it with a high-quality card image from the Pokémon TCG API, providing the most complete information available.
- **Updated Backend**: The data enrichment worker (`data-enrichment-worker.js`) and its setup documentation have been updated to support the new multi-source logic, including the addition of an optional API key for the Pokémon TCG service.

## v2.12.1 (Documentation Maintenance)

This is a maintenance release focused on improving the quality and accuracy of the internal documentation.

### Changes
- **Documentation Verification**: Conducted a full review of `DOCUMENTATION.md` to ensure all features and technical details accurately reflect the current state of the application.
- **Minor Corrections**: Corrected minor inaccuracies in the technical architecture description for better clarity.

## v2.12.0 (Privacy Compliance & Cookie Consent)

This update introduces a robust consent management system to comply with EU and Italian privacy regulations (GDPR).

### Major Changes
- **Cookie Consent Banner**: A banner is now displayed to all new users, requesting consent for the use of non-essential storage.
- **User Control**: Users can explicitly "Accept" or "Decline" the use of `localStorage` for their preferences.
- **Detailed Cookie Policy**: A "Learn More" link opens a modal that clearly explains the difference between strictly necessary technical cookies (for login) and preference storage.
- **Consent-Aware Logic**: The application's core logic has been updated to respect the user's choice. If consent is declined, the app remains fully functional, but no preferences (like theme, view modes, etc.) will be saved between sessions.
- **Consent-Aware Hooks**: The `useLocalStorage` hook was refactored to be dependent on the consent state, centralizing the compliance logic.

## v2.11.0 (Major UI/UX Overhaul for Binder and Actions)

This update introduces a significant redesign of key interactive elements, focusing on a cleaner, more intuitive user experience for managing collections.

### Major Changes
- **Redesigned Actions Panel**: The "Actions" section in the sidebar has been streamlined.
  - **Consolidated Menu**: "Export All", "Export Missing", and "Import Status" have been unified into a single "Import / Export" dropdown menu with a clearer icon, dramatically reducing clutter.
  - **Contextual Pinning**: The "Pin/Unpin Collection" action is no longer a button, but an intuitive star icon (⭐) located directly next to the collection's name.
- **Floating Unplaced Cards Pocket**: For Binder Mode, the unplaced cards indicator is now a floating, draggable "pocket."
  - **Movable & Persistent**: You can drag the pocket anywhere on the screen, and its position is saved for future sessions.
  - **Interactive Panel**: Clicking the pocket opens a searchable list of all unplaced cards, which can then be dragged directly into binder slots.
- **Binder Mode Enhancements**: The binder view has been significantly improved.
  - **Dedicated Mode**: "Binder Mode" is now a distinct mode, separate from the main list/grid, preventing conflicts with global search and filters.
  - **Robust Drag-and-Drop**: The D&D system now fully supports swapping cards between occupied slots and placing new cards from the unplaced pocket.

## v2.10.0 (Optimized Bulk Fetch from CardTrader)

This update enhances the CardTrader integration with a "Fetch All" feature, designed to be both efficient and respectful of the CardTrader API.

### Major Changes
- **Bulk Fetch Button**: A new "Fetch All Card Info" button has been added to the sidebar's actions panel. This allows users to enrich an entire collection with a single click.
- **Optimized Blueprint Fetching**: To provide immediate feedback, clicking the button triggers a single backend call that retrieves all basic card data (including official images) for the entire collection. This updates all card images almost instantly.
- **Sequential Price Fetching**: After the initial blueprint fetch, the application sequentially requests market price data for each card, with a small delay between each call. This prevents the app from spamming the CardTrader API and avoids rate-limiting issues.
- **Intelligent Updates**: The bulk fetch process is smart enough to only retrieve data for cards that haven't been fetched before, saving time and bandwidth.

## v2.9.0 (CardTrader API Integration)

This release introduces a powerful new feature that integrates with the CardTrader marketplace API to enrich the application's card data.

### Major Changes
- **New CardTrader Backend**: A new, dedicated Cloudflare Worker (`cardtrader-worker.js`) has been created to act as a secure proxy to the CardTrader API. It uses a private API token for authentication.
- **Fetch Card Details**: A "Fetch Info" button has been added to every card in the collection list. Clicking this button contacts the new backend service.
- **Data Enrichment**: The service fetches the official card image and live marketplace data. The card's display is then updated with the high-quality image and the lowest available price from CardTrader.
- **Direct Marketplace Link**: The displayed price is a hyperlink that takes the user directly to the card's product page on the CardTrader website.
- **New Documentation**: A new setup guide (`cardtrader-worker-setup.md`) has been added to explain how to configure and deploy the new worker.

## v2.8.0 (Secure Backend Data Storage)

This release marks a significant enhancement to the backend architecture, focusing on security and industry best practices for data persistence.

### Major Changes
- **Service Account Authentication**: The Cloudflare Worker responsible for data persistence has been completely refactored. It now uses a Google Cloud Service Account to authenticate with Firestore, replacing the previous, less secure methods.
- **Enhanced Security**: This new flow utilizes short-lived OAuth2 access tokens generated from a signed JWT, which is the recommended and most secure way for server-to-server communication with Google Cloud services.
- **Updated Backend Documentation**: The `worker-setup-and-deployment.md` guide has been updated with comprehensive, step-by-step instructions for creating a service account, generating a key, and configuring the worker's secrets in the Cloudflare dashboard.
- **Improved Error Handling**: The worker now includes more robust environment checking and provides clearer, more actionable error messages if secrets are misconfigured, simplifying the deployment and debugging process.

## v2.7.0 (Offline Mode & Backend Resilience)

This update improves the application's robustness by introducing a fallback mechanism for when backend services are unavailable.

### Major Changes
- **Offline Mode**: When the backend cannot be reached, users are now presented with a screen that allows them to "Continue in Offline Mode". This provides a guest-like experience, ensuring the application remains accessible even during server outages.
- **Backend Down Screen**: A new, user-friendly screen (`BackendDownScreen`) clearly communicates when the application is temporarily offline and provides the entry point into the new Offline Mode.
- **Enhanced Auth Handling**: The authentication context (`authContext`) now gracefully handles network errors by transitioning to an `error` state, preventing the app from getting stuck and allowing it to present the offline option. This makes the application more resilient to network or server issues.

## v2.6.0 (JSX Refactor & UX Polish)

This is a major technical upgrade focused on improving code quality, maintainability, and the overall user experience by adopting modern standards.

### Major Changes
- **Full JSX Conversion**: The entire application has been refactored from `React.createElement` to JSX syntax. This makes the component code significantly cleaner, more readable, and easier for future development.
- **Non-Blocking Notifications**: Replaced all native `alert()` popups (used for data export/import success or failure) with a non-intrusive toast notification system. This provides feedback to the user without interrupting their workflow.
- **Improved Error Handling**: Utility functions now throw errors instead of alerting, allowing the UI components to handle them gracefully and provide better feedback to the user via toasts.

## v2.5.0 (Completion Fireworks)

This update adds a delightful touch to the collection tracking experience, celebrating user achievements with a visual reward.

### Major Changes
- **Completion Celebration**: Whenever a set's progress ("Standard", "Complete", or "Master") reaches 100%, a colorful fireworks animation is triggered within the circular progress bar.
- **Themed Fireworks**: The color of the fireworks dynamically matches the color of the set mode being completed (Teal, Blue, or Purple), creating a cohesive and gratifying visual effect.
- **Enhanced User Gratification**: This "gamification" feature makes the process of completing a collection more fun and rewarding.

## v2.4.0 (Set Mode Personality)

This update brings a more intuitive and visually rewarding experience to the set tracking feature by giving each mode a distinct personality, inspired by video game difficulty levels.

### Major Changes
- **Color-Coded Set Modes**: The three set modes are now color-coded to make them instantly recognizable:
  - **Standard**: Teal/Green, representing an "easy" or starting goal.
  - **Complete**: Blue, representing the "normal" or standard completion goal.
  - **Master**: Purple, representing a "hard" or "expert" goal, signifying mastery.
- **Dynamic UI**: The circular progress bar and the active set mode selector button in the sidebar now dynamically adopt the color of the selected mode. This provides strong visual feedback and enhances the user experience.
- **Improved Component Design**: The `CircularProgressBar` component has been refactored to be more flexible and reusable by accepting a color class as a prop.

## v2.3.0 (Granular Set Modes)

This update significantly refines the progress tracking system by introducing three distinct and powerful set modes, giving users more granular control over how they view their collection's completion.

### Major Changes
- **"Standard" Set Mode**: Tracks progress for only the cards that belong to rarities categorized as "Standard". This is ideal for focusing on the main set.
- **"Complete" Set Mode**: Tracks progress for all base cards in the collection, including both "Standard" and "Special" rarities, but excluding any variants.
- **"Master" Set Mode**: The ultimate tracking mode. It includes every card ("Standard" and "Special") plus all of their defined variants.
- **Smart UI**: The set mode selector in the sidebar now intelligently appears only for collections that contain "Special" rarities or variants, simplifying the interface for basic collections.
- **Accurate Exports**: The "Export Missing" functionality is now fully integrated with the new set modes, ensuring that the exported list accurately reflects what is needed to complete the Standard, Complete, or Master set.

## v2.2.0 (Rarity Categorization)

This update introduces a new layer of organization for rarities, allowing them to be grouped for clearer progress tracking and collection management.

### Major Changes
- **Rarity Categories**: Each rarity definition now includes a `category` property, which can be set to "Standard" or "Special". This allows for a logical separation between common set cards and chase/promo cards.
- **Management UI**: The "Manage Rararities" section within the Edit Collection modal now includes a simple radio button selector to assign a category to each rarity.
- **Grouped Summary View**: The "Rarity Summary" in the sidebar has been updated to visually group rarities by their assigned category, providing a much clearer overview of the collection's structure.
- **Backward Compatibility**: The app's data migration logic now automatically assigns the "Standard" category to all rarities from older collections, ensuring a seamless and error-free transition for existing user data.

## v2.1.0 (Multi-Variant System)

This version introduces a powerful, fully configurable system for card variants, moving beyond the previous single-variant implementation.

### Major Changes
- **Multi-Variant Engine**: The core data structure was refactored from a single `hasVariants` object to a `features.variants` array. Each collection can now define multiple, distinct variants (e.g., "Reverse", "Holo", "Signed").
- **Variant Management UI**: The "Edit Collection" modal now features a "Manage Variants" section. Users can add, rename, and delete variants, and precisely control which rarities each variant applies to using a checkbox interface.
- **Dynamic Card UI**: The `CardItem` component now dynamically renders a checkbox for every variant that is applicable to the card's specific rarity.
- **Backward Compatibility**: The data migration utility has been enhanced to seamlessly convert collections using the old single-variant system to the new multi-variant structure upon loading the app. This ensures no data is lost for existing users.
- **Enhanced Progress Tracking**: The "Master Set" calculation now correctly accounts for all defined variants and their specific application rules, providing a highly accurate completion percentage.

## v2.0.0 (Dynamic Rarity System & Refactor)

This major update introduces a complete overhaul of the rarity system and a significant cleanup of the application's core data structures.

### Major Changes
- **Dynamic, Per-Collection Rarities**: The static, application-wide `CardRarity` enum has been removed. Each collection now defines its own set of rarities, including custom names and styling.
- **Rarity Management UI**: The "Edit Collection" modal now includes a powerful section to add, edit, and delete rarities for the selected collection.
- **Smart Collection Import**: When creating a new collection from a file, the app now intelligently scans the file for rarity names and automatically generates a default set of rarity definitions.
- **Data Structure Upgrade**: The `Collection` and `Card` data structures have been updated. `features.hasVariants` is now more specific, and `rarityDefinitions` have been added to collections.
- **Backward Compatibility**: Implemented a robust data migration system. Data from older versions of the app (from `localStorage` or backups) is automatically and seamlessly upgraded to the new format on load, preventing crashes and data loss.

### Minor Changes & Fixes
- **Simplified Default Data**: Removed the large, complex "Cuphead" and "Pokémon" collections in favor of two new, clean, and simple example collections ("Pixel Pals" and "Cosmic Creatures") that better demonstrate the app's features.
- **Bug Fix**: Fixed a critical bug that caused the application to crash when loading older data formats.
- **Code Cleanup**: Significant refactoring across the codebase to support the new dynamic systems, improving maintainability and clarity.