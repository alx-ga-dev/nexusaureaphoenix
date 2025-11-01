
# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2024-05-23

### Changed

-   **Refactored Authentication Flow:** Migrated the core login logic from client-side `fetch` calls and API routes to a modern, robust **Next.js Server Action** (`loginAndGetUser`). This centralizes authentication logic on the server, enhancing security and simplifying the client implementation.

### Fixed

-   **Resolved Re-render Loop:** Fixed a critical performance issue in `AuthProvider.tsx` that caused an infinite re-render loop upon login. The `useEffect` dependency array was corrected to ensure the effect runs only when necessary.

### Added

-   **Improved Login UX:** The login process is now handled via React's `useTransition` hook, providing a smoother, non-reloading login experience that feels more like a single-page application.
-   **Initial Session Loading Indicator:** Implemented a full-page loading spinner that is displayed while the `AuthProvider` is first establishing the user's session. This prevents the "flash" of the login page for already authenticated users, improving the perceived performance and overall user experience.

---

## [0.1.0] - 2024-05-22

### Added

-   Initial project setup.
-   Basic Next.js application structure.
-   Firebase integration and authentication.
-   Initial UI components and layout.
