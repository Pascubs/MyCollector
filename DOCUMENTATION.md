# My Collector - Application Documentation

This document provides a comprehensive overview of the My Collector application, its architecture, features, and guidelines for future development.

## 1. Overview

My Collector is a web application designed for enthusiasts to track their trading card collections. It provides a user-friendly interface to manage multiple collections, view individual cards, track ownership status, and monitor completion progress. The application is built with modern web technologies, emphasizing a clean user experience, mobile-first responsiveness, scalability, and ease of maintenance.

## 2. Core Features

- **Mobile-First Responsive Design**: The entire application is fully responsive. On mobile devices, the interface adapts for a seamless experience with an off-canvas sidebar, a streamlined header menu, collapsible filter controls, and "load more" navigation instead of traditional pagination.
- **Authentication**: Users can sign in with a Google account to have their collections and preferences saved across sessions. A "Guest Mode" is also available for temporary use.
- **Offline Functionality**: The application is resilient to backend service outages. If the server cannot be reached, users are presented with an option to continue in an "Offline Mode," which provides a guest-like experience, ensuring the app remains accessible.
- **Multi-Collection Management**: Users can switch between different pre-loaded or user-created collections.
- **Pinning Collections**: Prioritize favorite collections by pinning them. Pinned collections are marked with a star icon (⭐) directly next to the collection's name in the sidebar and are sorted to the top of the selection dropdown for quick access.
- **Dynamic Collection Creation**: Users can add new custom collections by uploading a spreadsheet file (`.xlsx`, `.xls`, `.csv`). A downloadable template is provided to ensure correct formatting.
- **Advanced Collection Editing**: The "Edit Collection" modal features a clean, tabbed interface to manage every aspect of a collection:
  - **Cards**: View the entire card list and add, edit, or delete individual cards.
  - **Details & Settings**: Edit the collection's name and description.
  - **Bulk Language Setting**: Apply a language to all cards in the collection at once, which is perfect for managing single-language sets.
  - **Rarities & Variants**: Use dedicated tabs to fully manage a collection's rarities (names, styles, categories) and variants (names and which rarities they apply to).
  - **Danger Zone**: A dedicated tab for the "Delete Collection" action to prevent mistakes.
  - **Custom Card Images**: Personalize the collection by uploading a custom image for any card (up to 2MB). An edit icon appears on hover over the card image.
- **Light & Dark Mode**: The application supports both light and dark themes, automatically detecting the user's system preference on first visit. The theme can be manually toggled from the actions menu in the header and is persisted for future sessions.
- **State Persistence & Backward Compatibility**: For authenticated users, all collections, view modes, and filters are saved. The app includes a migration system to seamlessly update data from older versions, preventing crashes.
- **Advanced Progress Tracking**:
  - A circular progress bar visualizes the overall completion percentage of the selected collection.
  - Users can toggle between three granular set modes for precise tracking. The active mode is highlighted with a distinct color for clarity (**Teal** for Standard, **Blue** for Complete, and **Purple** for Master).
    - **Standard Set**: Tracks only cards belonging to rarities categorized as "Standard".
    - **Complete Set**: Tracks all base cards, including both "Standard" and "Special" rarities.
    - **Master Set**: Tracks everything—all base cards plus all defined variants.
  - **Completion Reward**: Reaching 100% in any set mode triggers a rewarding fireworks animation.
- **Multi-Variant System**:
  - Collections can define multiple, custom special variants (e.g., "Holo", "Reverse", "Concept").
  - For each variant, users can configure exactly which rarities it applies to.
  - The UI dynamically renders checkboxes for each applicable variant on a card-by-card basis.
- **Search and Filter**:
  - A prominent, always-visible search bar for full-text search across card names, IDs, and descriptions.
  - A collapsible "Filters & Sort" panel to keep the interface clean, containing:
    - Filtering by collected status (All, Collected, Uncollected).
    - Advanced sorting by ID, name, rarity, or any custom field, in ascending or descending order.
    - View mode toggles for a compact **List View** or a more visual **Grid View**.
    - A button to reset the selected collection's progress.
  - Filter cards by clicking on a specific rarity in the summary panel. The summary panel now groups rarities by their **Standard** or **Special** category.
- **Interactive Binder Mode**:
  - **Dedicated Mode**: A "Binder Mode" button provides a dedicated interface for visually organizing your collection, separate from the standard list/grid views and their filters. The binder page is always vertically centered for a polished presentation.
  - **Custom Sorting**: Within binder mode, "Custom Sort" allows you to freely arrange your cards by dragging and dropping them into binder slots. You can even swap cards by dropping one onto another.
  - **Unplaced Cards Pocket**: A "pocket" icon appears next to the options button when in custom sort mode, showing the count of cards not yet placed in the binder.
  - **Interactive Panel**: Clicking the pocket opens a searchable panel listing all unplaced cards. You can drag cards directly from this panel and drop them into any binder slot.
  - **Binder Controls & Navigation**: A comprehensive set of controls makes browsing easy:
    - **Page Layout**: Switch between 9 or 12-pocket pages.
    - **Smart Zoom**: The zoom level automatically adjusts to a smart default (50% for 9-pocket, 65% for 12-pocket) to ensure the entire page is visible. The slider is capped at these practical maximums.
    - **On-Screen Arrows**: Large, intuitive arrows are positioned directly next to the binder page for easy navigation.
    - **Keyboard Navigation**: Use the left and right arrow keys to flip through pages.
    - **Jump to Page**: A dedicated input in the "Options" panel allows you to jump directly to any page number.
- **External Data Enrichment**:
  - To provide the richest data possible, the application integrates with external APIs to fetch official card images and market data.
  - **Per-Card Language Fetching**: Language is now managed on a per-card basis, giving users the freedom to create mixed-language collections. The "Fetch Info" action for each card uses that card's specific language to retrieve the correct regional artwork and data.
  - **Multi-Source Fetching**: The "Fetch Info" button on each card queries a backend service that intelligently fetches data from the best available sources in a specific order, ensuring expansion-specific accuracy.
  - **Primary Source (CardTrader)**: The system prioritizes the CardTrader API for comprehensive market pricing data and official card images.
  - **Secondary Source (Pokémon TCG API)**: For Pokémon collections, if CardTrader data is incomplete (e.g., missing an image), the service automatically queries the official Pokémon TCG API to fill in the gaps with the correct card image for that set.
  - **Combined Data**: The system intelligently combines the results, for instance, using pricing from CardTrader and an official TCG card image from the Pokémon TCG API, to present the most complete view to the user.
  - **Data Display**: The card's image is updated to the best available version, and pricing data (when available) is displayed with a direct link to the source marketplace. A small badge on the image indicates the source of the artwork (e.g., CardTrader, Pokémon TCG API).
- **Bulk Fetch**: A "Fetch All Info" button in the sidebar initiates an optimized process to enrich the entire collection. It sequentially fetches data for each card that needs it, respecting each card's individual language setting and including a delay between requests to respect API rate limits.
- **Intelligent Data Import/Export**:
  - All file-based actions are consolidated into a single "Import / Export" dropdown menu in the sidebar's actions panel.
  - **Export Full Collection**: Download the entire collection data to an `.xlsx` file, including status for all defined variants.
  - **Export Missing Cards**: Download a list of only the items needed to complete the set, respecting the currently selected set mode (Standard, Complete, or Master).
  - **Import Card Status**: Update the "collected" status of cards (and their variants) by uploading a file.
  - **Full Backup/Restore**: Export all collections and settings to a single `.json` file and restore from it using the "Data Management" option in the main header menu.
- **Administrator Features & Catalog Management**: For users with administrative privileges, a dedicated "Admin Panel" provides comprehensive tools for managing the public catalog.
  - **Import Sets**: Admins can seed the application's public catalog by importing entire card sets directly from external sources like CardTrader, the Pokémon TCG API, or TCGdex (which supports multiple languages). The TCGdex importer now automatically includes high-resolution card images, ensuring that new collections are visually complete right from the start.
  - **Manage Catalog**: A dedicated tab within the Admin Panel allows administrators to view the entire list of public collections and remove any that are outdated or no longer needed, ensuring the catalog remains curated and relevant.
- **Cookie Policy & Compliance**:
  - **Consent Banner**: In compliance with EU and Italian regulations (GDPR), the application presents a cookie consent banner to all new users.
  - **User Control**: Users have the clear choice to "Accept" or "Decline" the use of non-essential storage for their preferences.
  - **Technical vs. Preference Storage**:
    - **Technical Cookies**: A strictly necessary cookie is used for authentication when a user logs in with Google. This is essential for functionality and does not require prior consent.
    - **Preference Storage (`localStorage`)**: User preferences (like theme, view modes, and element positions) are saved in the browser's `localStorage`. This requires explicit user consent.
  - **Consent-Aware Logic**: If a user declines consent, the application remains fully functional, but no preferences will be saved to their device between sessions.

## 3. Technical Architecture

The application is a single-page application (SPA) built with React.

- **Framework**: React 19
- **Language**: JavaScript
- **Syntax**: JSX. The entire codebase is written using JSX for improved readability and maintainability.
- **Styling**: TailwindCSS for utility-first styling.
- **State Management**: React Context API for global state management.
- **File Parsing**: `sheetjs/xlsx` library is used for all client-side Excel and CSV file operations.

### 3.1. Project Structure

The codebase is organized into a modular, collection-centric structure.

```
/
├── src/
│   ├── collections/
│   │   ├── pixel-pals/          # Module for the Pixel Pals collection
│   │   │   ├── ...
│   │   └── index.js             # Central registry for all collections
│   │
│   ├── components/
│   │   ├── AddCollectionModal.js
│   │   ├── EditCollectionModal.js # Modal for editing collections, cards, rarities, and variants.
│   │   ├── LoginScreen.js       # The initial login/guest screen.
│   │   └── ... (other UI components)
│   │
│   ├── App.js                     # Main application component.
│   ├── authContext.js             # Authentication state management.
│   ├── context.js                 # Global collection state management.
│   ├── cookieContext.js           # Manages user consent for preference storage.
│   ├── hooks.js                   # Custom React hooks.
│   ├── index.js                   # Application entry point.
│   └── utils.js                   # Utility functions (file parsing, data migration).
│
├── index.html                      # Main HTML file.
├── DOCUMENTATION.md                # This file.
└── ... (config files)
```

### 3.2. Dynamic Collection Features

A key aspect of the app is its dynamic, per-collection feature system.
- **`Card.language`**: Each `Card` has a `language` property (e.g., 'en', 'it', 'ja') that influences how external data is fetched for that specific card.
- **`rarityDefinitions`**: Each `Collection` object contains a `rarityDefinitions` array. Each definition specifies a `name` (e.g., "Legendary"), a `style` object containing TailwindCSS classes, and a `category` ('Standard' or 'Special').
- **`features.variants`**: Each `Collection` can contain an array of `VariantDefinition` object. Each variant has an `id`, a display `name` (e.g., "Holo"), and an `appliesTo` array specifying which rarity names it affects.
- **UI Management**: The `EditCollectionModal` provides a full UI for users to manage these definitions, allowing for complete customization of a collection's rarity and variant scheme.
- **Data Migration**: To support this, a migration function in `utils.js` runs on app load, automatically creating `rarityDefinitions`, adding the `category` to them, and converting old data structures.

### 3.3. State Management (`context.js`, `authContext.js`, `cookieContext.js`)

Global state is managed via React Context.
- **`AuthProvider`**: Manages the user's authentication status (`unauthenticated`, `authenticated`, `guest`, `error`) and controls the initial application flow.
- **`CollectionsProvider`**: Manages all collections and the currently selected collection. It uses the `authStatus` to determine whether to persist data to the backend or keep it in-memory (for guests). It exposes memoized functions to modify the state (e.g., `addNewCollection`, `toggleCardCollected`, `updateCardDetails`).
- **`CookieConsentProvider`**: Manages the user's consent for using `localStorage` for preferences. It provides a simple `consent` state ('accepted', 'declined', or `null`).
- **Custom Hooks**: `useAuth`, `useCollections`, and `useCookieConsent` provide easy access to the contexts' values.

## 4. Backend Architecture, Authentication, and Data Persistence

My Collector utilizes a decoupled backend architecture to separate concerns and enhance security. It consists of three primary services: an **Auth Service**, a **Data Service**, and a **Data Enrichment Service**.

### 4.1. Backend Services

- **Auth Service (Login Worker)**: A dedicated worker responsible for handling user authentication via Google OAuth 2.0. It manages user sessions via secure JWT cookies and provides the frontend with a stable User ID (`uid`). Its setup and API are documented in [`aa-worker/login-worker-setup.md`](./aa-worker/login-worker-setup.md).
- **Cloudflare Workers**: The application uses a set of serverless workers to handle specific backend tasks like data storage and external API communication. For a detailed overview of the worker architecture and links to individual setup guides, please see the [**Backend Workers Documentation (`aa-worker/README.md`)**](./aa-worker/README.md).
  - **Data Service (Collections Worker)**: A worker responsible for securely persisting user collection data to a Google Firestore database. It authenticates to Google Cloud using a secure Service Account. Its setup is documented in [`aa-worker/collections-worker-setup.md`](./aa-worker/collections-worker-setup.md).
  - **Data Enrichment Service**: A versatile worker that acts as a secure proxy to external card information APIs. It has two primary roles:
    1.  **For Users**: It orchestrates requests to multiple sources (e.g., CardTrader, Pokémon TCG API) to fetch rich card details like images and market prices for individual cards or entire collections.
    2.  **For Administrators**: It powers the "Import Set" feature in the Admin Panel, handling the logic to pull full set data from various sources, including the multi-language TCGdex API. The service is optimized to use the most efficient API endpoints, such as fetching a full TCGdex set and its cards in a single call.
    Its setup is documented in [`aa-worker/data-enrichment-worker-setup.md`](./aa-worker/data-enrichment-worker-setup.md).

### 4.2. Authentication Flow

The `AuthProvider` manages the user's session state, which can be one of the following:
- **`loading`**: The initial state while the app checks for an active session with the Auth Service.
- **`authenticated`**: The user is signed in. The `useAuth` hook provides the user's details, including the crucial `uid`.
- **`unauthenticated`**: The user is not signed in. The `LoginScreen` is displayed.
- **`guest`**: The user has chosen to bypass login. The session state is tracked locally in `sessionStorage`.
- **`error`**: The application cannot communicate with the Auth Service.

### 4.3. Offline Mode

When the application detects that the Auth Service is unavailable (`error` state), it displays a `BackendDownScreen`. This screen informs the user of the connectivity issue and provides an option to **"Continue in Offline Mode."** Selecting this transitions the app to a `guest` state, allowing continued use without backend services.

### 4.4. Data Persistence Strategy

Data persistence is directly tied to the authentication status:
- **Authenticated Users**: All collection data is persisted to a Firestore database via the secure Data Service worker. The `useDataSync` hook automatically debounces changes and sends them to the backend, providing a seamless "save-on-change" experience. User preferences (like theme and view mode) are persisted in the browser's `localStorage` for quick access, **if the user has provided consent**.
- **Guest & Offline Mode Users**: All data is held in-memory and is **not** persisted. A prominent `GuestWarningModal` appears when entering guest mode to inform the user that their progress will be lost on page reload or tab closure. The Data Management modal (`.json` backup) is the recommended way for guests to save their work.

## 5. How to Contribute

### Adding a New Pre-loaded Collection

The process for adding new, pre-loaded collections to the public catalog has been centralized and is now managed through the application's **Admin Panel**.

-   **Admin Users**: If you have administrative privileges, you can access the Admin Panel from the main header menu. From there, you can directly import card sets from supported external APIs (e.g., CardTrader, Pokémon TCG API, TCGdex).
-   **Standard Users**: To suggest a new collection for the catalog, please contact an administrator.

This system ensures data consistency and allows for rapid expansion of the available collections without requiring code changes or deployments.