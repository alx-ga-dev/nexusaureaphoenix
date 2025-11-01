### **Product Requirements Document: NexusAurae**

**Version:** 1.3 **Date:** October 29, 2025 

#### **1\. Overview**

NexusAurae is a webapp designed to facilitate a community-based gift exchange program. It enables users to browse a catalog of gifts, manage personal wish lists, and conduct secure, in-person gift exchanges using NFC or QR code technology. The application also includes a comprehensive administrative backend for managing all aspects of the ecosystem, from the gift catalog to user profiles and transaction processing. The application is multi-language enabled, showing the same language as the browser.

#### **2\. User Roles & Personas**

* **Standard User:** A participant in the gift exchange. They can be of type "Blue" or "Pink," which may determine gift eligibility. They can view the gift catalog, manage their wish list, and exchange gifts with other users.
* **Manager:** A staff member that can manage the status of transactions.  
* **Administrator:** A super-user with full access to the administrative dashboard. They are responsible for managing the application's data, overseeing transactions, and maintaining the integrity of the system.

#### **3\. Functional Requirements**

##### **3.1. Core User Experience**

* **User Login:**  
  * Users shall log in to the application using either an NFC tag or a QR code associated with their profile.
  * Authentication will rely only on the user id as read from the NFC tag or QR code, no email nor password will be required.
  * The system will use anonymous Firebase Authentication as a base layer.  
  * For development and testing purposes, manual login is also available (user will be able to type the user Id).  
* **Dashboard:**  
  * Upon login, the user is presented with a personalized dashboard.  
  * For standard users, the dashboard shall display a card with pending gift offers that the user can accept or decline. Additionally, the dashboard shall display a card with the summary of the user's most recent transactions (both sent and received). When there are no pending transactions, the dashboard may feature a card with a random "legendary" or high-value gift to encourage engagement.
  * For manager and administrator users, the dashboard should display a card with a list of all pending transactions filterable by user and action type (Deliver, Settle, Cancel).  
  * The left side of the dashboard should display a menu with the options available to the user. 
    - For standard users, options should be "Dashboard", "Gift Catalog", "Users", "Wish List", and "Pending Transactions". This options should not be available for managers.
    - For managers and administrators, only one option should be available: "Payment & Delivery".
    - For administrators, all options for both standard and manager users should be avialable with the addition of an extra sub-menu labeled "Administration" with the following options: "Users", "Gifts", "Collections", and "Rarities".
* **Gift Catalog:**  
    * Users shall be able to browse a complete catalog of all available gifts.  
    * The catalog shall be filterable by gift name (partial), `collection` and `rarity`.  
    * Each gift will be displayed on a card showing its image, name, collection, and rarity.
    * Each gift card should have three buttons: "Add to Wishlist", "Gift Now" and "Send Gift"
        - "Add to Wishlist" should add the gift to the user's wishlist
        - "Gift Now" and "Send Gift" should follow the **Gift Exchange & Transaction Flow** as described later.
* **Users:**
    * Users can browse a directory of other participants.
    *-* The directory will be displayed using cards for each user, with a generic logo using the color of the user type (blue or pink) and displaying the number of gifts still available for exchange on their wishlist (that is, how many gifts of their wishlist list they haven't received yet).  
    * This directory shall be filterable by user type ("Blue", "Pink") and searchable by name with type-ahead functionality.  
    * Clicking on another user's card should open the user's public wish list.  
* **Wish List:**
    * Users shall have a personal wish list.  
    * Users can add any gift from the catalog to their wish list.  
    * The wish list page shall display all gifts the user has added and will be displayed just as the gift catalog "filtered" by the user's wishlist.  
    * Gifts on a user's wish list that have already been received will be visually marked as "gifted".
* **Pending Transactions:**
    * "Pending Transactions" should display a table with the following columns: User ("User:"), transaction type ("Type:"), process type ("Process:"), status ("Status:"), and actions ("Actions"). A filter should be available to filter by user (with type-ahead functionality), transaction type (dropdown, "Any", "Gift", "Send"), process type (dropdown, "Any", "Payment", "Deliver") and status value (dropdown, "Any", "Pending", "Complete", "Canceled").
    * When available, the actions column should contain a link that opens a menu with the following options: "Payment", "Deliver", "Cancel". Selecting any of the options should redirect the user to the "Payment & Delivery" page with the transaction id and selected action as parameters.
    * For standard users, the actions column and the filter should not be visible and the table should be pre-filtered to show only the user's pending transactions: "Blue" users pending transactions are type "Payment" and status "Pending" while "Ping" users pending transactions are type "Deliver" and status "Pending".
    * For managers and administrators, both the action and filter should be visible and the table should be pre-filtered to show all transactions type with status "Pending" for all users. 

##### **3\.2\. Management Functions**

* This page should be available for Managers (roleLevel = 1) and Administrators (roleLevel = 2).
* The APIs and database permissions required for this page should be accesible and allowed for both roles. 
* **Payment & Delivery:**
    * This page should display a form to request "From/To" value (dropdown), user name (text, with type-ahead functionality) and action type (dropdown, "Payment", "Deliver" and "Cancel"). The status value should be assumed to be "Pending".
    * When the form is submitted a table with the same columns as the "Pending Transactions" page should be displayed but without the "Actions" column. Instead, a checkbox should be displayed to be able to select the transactions to be processed.
    * When the transaction id and action are received as parameter, following actions should be taken:
        - The form should be filled in automatically, using the transaction id to get the user name and "To/From" values of the form and the action parameter to get the action type value
        - The for should be "submitted" so that the table is displayed in the page.
        - The record corresponding to the transaction id received as paramter should be pre-selected
    * When the table is displayed, a button should also be displayed with the label "{process_action} {NN} selected transaction(s)" where process_action is "Payment", "Deliver" or "Cancel" depending on the value of the action field on the form and NN is the number of selected rows in the table.
    * When the button is processed, the status of the selected transaction(s) should be updated.

##### **3\.3\. Administrative Functions**

* The following pages are only available for Administrators (roleLevel = 2)
* **Users (CRUD):**  
    * This page should display a table with all of the users with the following columns: user id ("Id"), user name ("Name"), type ("Type"), roleLevel ("Role") and action ("Action").
    * The page should also feature a form with a text box for the user name and drop-downs for type (values "Blue" and "Pink") and role (values "0 - Standard", "1 - Manager", "2 - Administrator") that would allow the admin to filter the table according to any of the columns.
    * The form to filter should update in real time as the user types in the "User" field, or select values in the dropdowns.  
    * Clicking on the action column should open a menu with the following options: "NFC Tag", "QR Code", "Edit", "Delete".
    * Selecting the "NFC Tag" option should open a dialog to wait for the user to prepare a NFC tag and, when detected, write the user id corresponding to the row to the tag. (is this possible using the nfc api?)
    * Selecting the "QR Code" option should open a modal window with the QR code image corresponding to the user id from the corresponding row. The modal window should have a button to allow the user to copy the QR code to their clipboard and another button to allow the user to download the image to their device or computer.  
    * Selecting the "Delete" option should open a confirmation dialog and, if confirmed, delete the user record.  
    * Clicking on the "Edit" option should open a modal window with the user details in a form to be able to edit the values. When the form is submitted, the user record should be updated.
    * An "Add" button should be available to be able to create a new user. A modal window should open with the form to create a new user. When the form is submitted, the user record should be created.  
* **Gifts (CRUD):**  
    * Similar to the users page, this page should display a table with all of the gifts with the following columns: gift id ("Id"), gift name ("Name"), collection ("Collection"), rarity ("Rarity") and image url ("Image").
    * The page should also feature a form to filter the table according to any of the columns.
    * For this table, the "Action" menu should display the following options: "Edit", "Delete".  
    * Similar to the users page, an "Add" button should be available to add new gifts.  
* **Collections (CRUD):**  
  * Similar to the gifts page, this page should contain the filter form, a button to add new records and display a table with all of the collection's properties as columns, with actions to edit and delete records.  
* **Rarities (CRUD):**  
  * Similar to the gifts page, this page should contain the filter form, a button to add new records and display a table with all of the collection's properties as columns, with actions to edit and delete records.  


##### **3\.4\. Gift Exchange & Transaction Flow**

* **Initiate an Exchange:** From the gift catalog, a user can initiate a "Gift Now" (in-person) or "Send Gift" (virtual) transaction.  
* **In-Person Exchange ("Gift Now"):**  
    * The system prompts the giver to scan the recipient's NFC tag or QR code to identify them.  
    * A confirmation screen appears, showing the giver, recipient, and the gift being exchanged.  
    * Upon confirmation, a new transaction record will be created for the user, with process "Payment" and status "Pending". Additionally, another transaction record should be created for the receiver with process "Deliver" and status "Pending". Once both records are created their ids should be stored in the exchange table with the first record being the fromId and the second record being the toId, with current date as date, "Gift" as type, gift id as giftId and "Complete" as status.
    * Every time a exchange record status is set as "Complete", Administrators should be notified to be able to take action on the pending transactions from the exchange.
* **Virtual Gifting ("Send Gift"):**  
    * The system prompts the giver to select a recipient from a list of all users. To make it easier to select from the list, it should be filterable via type-ahead.
    * Upon confirmation, a new transaction record will be created for the user, with process "Payment" and status "Pending". Additionally, another transaction record should be created for the receiver with process "Deliver" and status "Pending". Once both records are created their ids should be stored in the exchange table with the first record being the fromId and the second record being the toId, with current date as date, "Send" as type, gift id as giftId and "Pending" as status.
    * The recipient will see this pending gift on their dashboard and can choose to accept or decline it via a dialog box.
    * If the recipient chooses to accept the gift, the corresponding exchange record status should be updated to "Complete". Administrators should be notified to be able to take action on the pending transactions from the exchange.
    * If the recipient chooses to decline the gift, the corresponding exchange record status should be updated to "Canceled".

#### **4\. Data Models & Persistence**

All application data is stored and managed in a Google Firestore database. The structure is as follows:

* `/users/{userId}`: Stores `User` documents.  
    * **User Schema:** `id`, `name`, `type` ('Blue' or 'Pink'), `roleLevel` (integer).  
* `/gifts/{giftId}`: Stores `Gift` documents.  
    * **Gift Schema:** `id`, `name` (localized object), `collection` (string), `rarity` (string), `imageUrl`.  
* `/collections/{collectionId}`: Stores `Collection` documents.  
    * **Collection Schema:** `id`, `name` (localized object).  
* `/rarities/{rarityId}`: Stores `Rarity` documents.  
    * **Rarity Schema:** `id`, `name` (localized object), `color` (hex string).  
* `/transactions/{transactionId}`: Stores `Transaction` documents.  
    * **Transaction Schema:** `id`, `userId`, `process`, `processStatus`.
* `/exchanges/{exchangeId}`: Stores `Exchange` documents.  
    * **Exchange Schema:** `id`, `giftId`, `fromId`, `toId`, `participants` (array with user IDs from toId and fromId documents in transaction collection), `date`, `type`, `status`.

#### **5\. Non-Functional Requirements**

*   **Technology Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, ShadCN UI Components, Genkit (for AI), Firebase (Auth & Firestore).  
    The application will leverage Next.js Server Components for initial page loads and data fetching, ensuring performance. Client Components are used for interactive UIs, which in turn call Server Actions for secure, server-only logic.
*   **Internationalization:** The UI shall have multi-language support, starting with English and Spanish. A translation hook will manage language strings based on browser preferences (which can be different from OS settings).  
*   **Responsiveness:** The application must be fully responsive and functional on both desktop and mobile devices.  
*   **UI/UX:** The application will maintain a modern, clean, and professional aesthetic, using the ShadCN component library and a consistent color scheme defined in \`globals.css\`.

#### **6\. Implementation Details**

##### **6.1. Centralized Authentication via Server Actions**

The authentication process is designed to be secure, efficient, and robust, leveraging the modern features of the Next.js App Router.

*   **Server Actions as the Core:** Instead of traditional API routes, the application uses a **Server Action** (`loginAndGetUser`) as the single, centralized entry point for all login logic. This action is executed only on the server, ensuring that sensitive processes like custom token creation and user data retrieval are never exposed to the client.
*   **Simplified Client:** The login page (`CustomLoginPage.tsx`) is a Client Component responsible only for capturing the user ID (via QR code, NFC simulation, or manual input) and invoking the Server Action. It does not contain any core business logic.
*   **Efficient State Management:** The `AuthProvider` component efficiently manages the user's session state. An initial loading state prevents the "flashing" of the login page for authenticated users, providing a smoother user experience.
*   **Greater Flexibility**: This centralized approach allows us to easily modify or expand our authentication methods in the future without requiring changes to the client-side application.

##### **6\.2\. Custom Claims for Access Control**

Roles will be identified using the `roleLevel` value which will be a custom claim embedded in the user's authentication token. This approach allows for fast and efficient verification of administrative privileges without requiring additional database lookups. The custom claim is set and managed by the server-side secure API endpoints, ensuring its integrity.

##### **6\.3\. Firestore Security Rules**

Firestore security rules should leverage the `roleLevel` custom claim. This provides a more streamlined and secure method for controlling access to the `users` collection and other sensitive data. The rules should grant full access to administrators while restricting managers to read only and regular users to their own data.

##### **6\.4\. Detailed Authentication and Data Flow:**

The application should leverage Next.js Server Components for initial page loads and data fetching, significantly improving performance and simplifying client-side state management. Client Components are used for interactive parts.

    1. **Client-Side Firebase Initialization:** The client-side Firebase SDK is initialized once when the application loads. This provides the `firebaseAuth` instance for client-side authentication operations.

    2. **Authentication Provider:** A server-side component should be the central hub for managing client-side authentication state. It is a Client Component that uses:
        - `onIdTokenChanged` from `firebaseAuth` to get the current Firebase `User` object (exposed as `userAuth` in the context).
        - A hook to fetch the corresponding user profile data from Firestore (exposed as `userData` in the context) via a server side endpoint.
        - A consolidated `loading` state (`loading`) to indicate when both Firebase Auth state and Firestore `userData` are fully resolved.
        - **Key Distinction:**
            - `userAuth`: The actual Firebase Authentication `User` object. Use this for client-side actions like `getIdToken()`, `signOut()`, or checking `isAnonymous`. **Do NOT** expect custom profile fields (like `name`, `roleLevel`) on this object.
            - `userData`: The user's profile document fetched from Firestore. Use this for displaying user details in the UI (e.g., `userData.name`) and for checking application-specific roles (e.g., `userData.roleLevel`).

    3. **Login Process:** The login process should prioritize server-side authentication for optimal performance and security.
        - **Server Component:**
            - This is an `async` Server Component.
            - On initial request, it reads the `session` cookie.
            - If a valid session cookie exists, it uses firebase auth's `verifySessionCookie()` to authenticate the user on the server.
            - It fetches the `userData` directly from Firestore using firebase API.
            - If the user is authenticated and `userData` is found, it performs a **server-side redirect** to the user's dashboard page.
            - If no session, or authentication/data fetching fails, it renders the `Login Page` component.
        - **Client Component:**
            - This is a Client Component.
            - It receives any server-side authentication errors as `serverAuthError` props.
            - It contains all interactive login elements (NFC, QR scanning, manual login form).
            - Client-side login establishes the Firebase session on the client and trigger a navigation to the root (`/`) to re-evaluate the session server-side.

    4. **Dashboard and Other Authenticated Pages:** These pages should follow a consistent Server Component pattern for initial data fetching.
        - **Server Component (e.g., `page.tsx`):**
            - This is an `async` Server Component.
            - On initial request, it performs server-side authentication using the `session` cookie (similar to the login page). If authentication or user data fetching fails, it performs a **server-side redirect** to `/`.
            - It fetches all initial data required for the page (e.g., gifts, users, transactions for the dashboard) directly from Firestore. These fetches should occur once on the server.
            - It renders a corresponding **Client Component** passing all the fetched data as stable props.
        - **Client Component (e.g., `aaaaaaa-page-client.tsx`):**
            - This is a Client Component (`'use client'`).
            - It receives its initial data as **stable props** from the Server Component, eliminating client-side calls for initial data.
            - It uses a hook to obtain the 'userAuth' object from the client-side context (e.g., `token` for authenticated client-side actions).
            - It handles interactive elements, filtering, and any client-initiated data updates (which typically use `fetch` calls to server-side api and `router.refresh()` to revalidate server data).

    5. **Server-Side Token Verification:** The backend APIs that require authentication verify the client's `ID Token`.
        - Client-side `AuthProvider` makes authenticated requests by sending the Firebase `ID Token` in the `Authorization: Bearer <token>` header.
        - On the server, `getUserIdAndProviderFromToken`  uses firebase api `verifyIdToken(idToken)` to securely validate the token.
        - This verification confirms the user's identity and checks custom claims like `roleLevel`, ensuring only authorized requests are processed.

    6. **"User Record Not Found" Scenario:** This specific display is rendered by the `AppShell` (or sometimes implicitly handled by server redirects) when:
        - A user successfully authenticates with Firebase (i.e., `userAuth` exists).
        - However, no corresponding user profile document is found in the Firestore database (i.e., `userData` is null).
        - Since database initialization and user seeding are now handled via command-line, the application gracefully guides the user back to the main login page (`/`).

#### **7\. Data Fetching and Performance**

The application should primarily leverages Next.js Server Components for initial data fetching, ensuring optimal performance, reduced client-side JavaScript bundles, and simplified data synchronization.

##### **7\.1\. Server Components for Initial Data Fetching**

- Top-level page components should be `async` Server Components as much as possible.
- All necessary initial data should be fetched directly on the server using the Firebase Admin SDK or internal API routes.
- This data is then passed as stable props to their respective Client Components, which handle interactivity.
- Server-side data fetching ensures:
    - **Faster Initial Page Load:** Data is available before the client-side JavaScript loads.
    - **Reduced Client-Side Bundle:** Less data fetching logic is shipped to the browser.
    - **Simplified Data Synchronization:** Eliminates complex `useEffect` and `useState` patterns for initial data loading on the client.

##### **7\.2\. Client Components for Interactivity and Dynamic Data**

    - Dedicated Client Components receive initial data as props.
    - They manage client-side state, user interactions, and any dynamic or user-initiated data fetching.
    - Client-side data fetching for dynamic actions should use custom hooks which route through the secure server-side endpoints.

##### **7\.3\. Built-in Caching**

Hooks used in Client Components for dynamic data should feature a built-in, in-memory caching layer. This helps minimize redundant client-side API calls once data has been fetched, even during subsequent component re-renders (assuming stable query parameters).

##### **7\.4\. On-Demand Data Loading**

Client-side data fetching is not allowed. Purpose specific entry points can be created on the server-side API to provide for dynamic filtering based on user input or other specific features like the "Send Gift" flow.

#### **8\. Style Guidelines**

##### **8.1. Definitions**
    - Primary color: Muted rose (#E0B7C1) to represent the exchange of gifts, while being gender-neutral.
    - Background color: Very light rose (#F8F1F3), of the same hue as the primary, is non-distracting as a background.
    - Accent color: Light periwinkle (#B7BCE0), a calming, and gender-neutral hue that is far enough from the primary to provide useful contrast.
    - Body font: 'Inter', sans-serif. Headline font: 'Space Grotesk', sans-serif. Paired to achieve a balance of modern readability and a slightly techy, contemporary feel, complementing the app's NFC technology focus.
    - Use clear, minimalist icons to represent gift categories, levels, and status indicators. Consider using a consistent style for all icons to maintain a unified visual experience.
    - Employ a responsive grid layout to ensure optimal viewing across devices. Prioritize key information and use clear visual hierarchies to guide user attention. Implement intuitive navigation patterns for easy access to all features.
    - Use subtle transitions and animations to enhance user interactions, such as smooth card transitions and loading indicators. Avoid overly distracting animations and focus on enhancing the overall user experience.

##### **8.2. User Interface (UI)**
    - Employ a responsive grid layout to ensure optimal viewing across devices. Prioritize key information and use clear visual hierarchies to guide user attention. Implement intuitive navigation patterns for easy access to all features.
    - Use subtle transitions and animations to enhance user interactions. The login process leverages React's `useTransition` hook to provide a seamless, non-reloading login experience. A full-page loading indicator is displayed during session restoration to provide clear feedback to the user and prevent UI layout shifts. Avoid overly distracting animations and focus on enhancing the overall user experience.

#### **9\. Command-Line Administration and Initialization**

To ensure a secure and reliable setup process, all database initialization and administrative tasks should be centralized into a single command-line script. This script avoids the security risks of UI-based seeding and ensures that the database state is always consistent with the application's requirements.

##### **9\.1\. Admin & Initialization Script

The script should be located at `scripts/admin-tool.ts`. It requires `ts-node` to be installed.

**Installation:**
If you don't have `ts-node`, you can add it as a dev dependency to the project's package.json for better version consistency across development environments.

Alterntatively, it can be installed globally, not recommended, with the following command:
```bash
npm install -g ts-node
```

**Usage:**

The script is the single source of truth for preparing the application's backend.

- **To initialize the entire database:**
  This is the primary command for setting up a new environment. It seeds the database with all required data (`users`, `collections`, `rarities`, `gifts`) from `src/lib/data.ts`. Critically, it creates users in **both** Firebase Authentication and Firestore, ensuring they are perfectly synchronized.
  ```bash
  ts-node -O '{"module": "commonjs"}' scripts/admin-tool.ts init
  ```

- **To grant admin rights to an existing user:**
  This command grants admin privileges to the specified user. **The user must log out and log back in** for the new permissions to take effect.
  ```bash
  ts-node -O '{"module": "commonjs"}' scripts/admin-tool.ts set-admin YOUR_USER_ID
  ```

- **To check a user's current status:**
  This command displays the current custom claims (from Firebase Auth) and Firestore data for a given user, allowing you to verify their admin status and other details.
  ```bash
  ts-node -O '{"module": "commonjs"}' scripts/admin-tool.ts check-user YOUR_USER_ID
  ```

This script-based approach provides a secure, auditable, and repeatable process for managing the application's data and administrative roles.
