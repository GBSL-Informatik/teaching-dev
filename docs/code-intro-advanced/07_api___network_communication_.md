---
page_id: 1c1934b1-60ab-4368-aefc-301098b47a28
---
# Chapter 7: API & Network Communication

Having established the foundational data structures and relationships within the database in [Chapter 6: Database Schema](06_database_schema_.md), we now turn our attention to how the client and server communicate to exchange and persist this data. The **API & Network Communication** layer is the bridge enabling the frontend application running in the browser to interact with the server-side domain logic and the database.

Consider the fundamental interaction of a user logging in and fetching their profile information. The frontend needs to initiate a request to the server, the server must authenticate the request, retrieve the relevant `User` record from the database based on the authenticated identity, and return that data to the frontend for display and state management. This entire process is facilitated by the API layer.

## Concept

The core role of the API layer is to expose the server's capabilities (primarily CRUD operations on entities like [User](01_user_.md), [Document](02_document_.md), [Document Root](03_document_root_.md), [Student Group](04_student_group_.md), [Access Policy & Permissions](05_access_policy___permissions_.md)) via a well-defined network interface, and for the frontend to consume this interface.

Key responsibilities:

*   **Endpoint Definition:** The backend defines RESTful endpoints (paths and HTTP methods) corresponding to actions on resources (e.g., `GET /users/:id`, `POST /documents`).
*   **Request Handling:** The backend (using Express) receives incoming HTTP requests, extracts data (from URL params, query strings, body), and delegates to appropriate controllers and domain models.
*   **Authentication:** Verifies the identity of the caller (via session cookies or Azure AD tokens) for protected routes.
*   **Authorization:** Often overlaps with backend model logic (as discussed in [Chapter 5: Access Policy & Permissions](05_access_policy___permissions_.md)), but general route access control can also reside here.
*   **Response Formatting:** Structures the data returned to the client (typically JSON) and sets appropriate HTTP status codes.
*   **Frontend Consumption:** The frontend uses a utility library (Axios) to make HTTP requests to these endpoints via specialized API client modules.
*   **Client-side Abstraction:** Frontend API modules encapsulate endpoint details, providing clean function interfaces for stores and components.

## Backend: Express & Routing

The backend utilizes Express to define routes and handle requests. The main router is configured in `teaching-api/src/routes/router.ts`.

```typescript
// teaching-api\src\routes\router.ts (Simplified)
import express from 'express';
import { user, all as allUsers, find as findUser } from '../controllers/users';
import { find as findDocument, update as updateDocument } from '../controllers/documents';
// ... other controller imports

const router = express.Router();

// User endpoints
router.get('/user', user);         // Get current user
router.get('/users', allUsers);    // Get all users (admin only)
router.get('/users/:id', findUser); // Get specific user by ID
// ... put/delete user endpoints ...

// Document endpoints
router.get('/documents/:id', findDocument);    // Get specific document by ID
router.put('/documents/:id', updateDocument); // Update specific document by ID
// ... post/delete/all documents endpoints ...

// ... other resource endpoints (studentGroups, documentRoots, permissions, etc.)

export default router;
```
This excerpt shows typical REST resource routing: `GET` for retrieval, `PUT` for updates, parameterized paths (`/:id`) for specific resource instances. These routes are mounted under the `/api/v1` prefix in `app.ts`.

## Frontend: Axios & API Client Modules

On the frontend, Axios is used to make HTTP requests. To maintain a clean separation of concerns and provide type safety, API calls are encapsulated within specific modules (e.g., `teaching-dev/src/api/user.ts`, `teaching-dev/src/api/document.ts`). These modules use a pre-configured Axios instance (`teaching-dev/src/api/base.ts`).

```typescript
// teaching-dev\src\api\base.ts (Simplified)
import axios from 'axios';
import { BACKEND_URL } from '../authConfig';
// ... other imports

export namespace Api {
    export const BASE_API_URL = `${BACKEND_URL}/api/v1/`;
}

const api = axios.create({
    baseURL: Api.BASE_API_URL,
    withCredentials: true, // Include cookies for session auth
    headers: {}
});

export const setupMsalAxios = () => {
    // Interceptor for adding Azure AD tokens
    api.interceptors.request.use( async (config) => {
        // ... logic to acquire token silently using MSAL ...
        const accessToken = '... obtained token ...'; // Simplified
        if (config.headers && accessToken) {
            config.headers['Authorization'] = 'Bearer ' + accessToken;
        }
        return config;
    }, (error) => Promise.reject(error));
};

export const setupDefaultAxios = () => {
     // Interceptor clears token header for cookie/session auth
     api.interceptors.request.use(async (config) => {
          if (config.headers['Authorization']) {
             delete config.headers['Authorization'];
         }
         return config;
     }, (error) => Promise.reject(error));
}

// Default setup (e.g., for cookie auth initially)
setupDefaultAxios();

export default api;
```
The `base.ts` file configures the Axios instance with the backend base URL and `withCredentials: true` to send cookies for session-based authentication. Request interceptors (`setupMsalAxios`, `setupDefaultAxios`) are used conditionally based on the authentication method to attach Azure AD bearer tokens or rely solely on cookies.

API client modules then simply import and use this configured `api` instance:

```typescript
// teaching-dev\src\api\user.ts (Simplified)
import api from './base';
import { AxiosPromise } from 'axios';
import { User as UserType } from '@prisma/client'; // Import type from Prisma or define locally

export type User = UserType; // Frontend representation of User

export function currentUser(signal: AbortSignal): AxiosPromise<User> {
    // Uses the configured axios instance to make a GET request
    return api.get('/user', { signal }); // Includes abort signal for request cancellation
}

export function all(signal: AbortSignal): AxiosPromise<User[]> {
    return api.get('/users', { signal });
}

// ... create, find, update, destroy functions using api.post, api.put, api.delete
```
Each API module function maps a logical action (e.g., `currentUser`, `update`) to an HTTP request on a specific endpoint, handling request data (body, params) and response typing. `AxiosPromise` provides type hints for the async response. Abort signals are passed to allow cancelling requests, useful in debounced operations or component cleanup.

## Authentication Flow with API Calls

 Authentication is handled by middleware on the backend *before* the request reaches the main controller logic.

```typescript
// teaching-api\src\app.ts (Relevant snippet)
import passport from 'passport';
// ... other imports

// Session middleware for cookie-based authentication
app.use(sessionMiddleware);

// Passport initialization and session support
app.use(passport.initialize());
app.use(passport.session()); // Uses the sessionMiddleware

// Configure Passport strategies (e.g., OAuth Bearer for Azure AD or local mocks)
passport.use(strategyForEnvironment());

// --- Main API guard ---
// This middleware applies to routes under /api/v1
_app.use(
    `${API_URL}`,
    (req, res, next) => {
        // 1. Basic authentication check: is user already authenticated via session?
        if (req.isAuthenticated()) {
            return next(); // User object already attached by passport.session()
        }

        // 2. If not authenticated via session, try OAuth Bearer strategy (e.g., from Authorization header)
        //    If successful, passport's authenticate middleware will attach user to req.user
        passport.authenticate('oauth-bearer', { session: true }, (err: Error, user: User, info: any) => {
            if (err) { return res.status(401).json({ error: err.message }); } // Auth failed

            // 3. If no user found via session or bearer, check if route is public GET
            if (!user && !([...public routes check...])) { // Simplified public route check
                return res.status(401).json({ error: 'Unauthorized' }); // Not authenticated for non-public route
            }
            req.user = user; // Attach user for downstream middleware/controllers
            if (info) { req.authInfo = info; } // Attach token info if available
            return next(); // Proceed to next middleware (routeGuard)
        })(req, res, next); // Execute the passport middleware
    },
    routeGuard(AccessRules), // Coarse-grained authorization (Chapter 5)
    router // Main API router
);
```
This snippet from `app.ts` shows the core backend authentication flow for API requests. The `sessionMiddleware` and `passport.session()` handle cookie-based authentication, populating `req.user` if a valid session exists. If not, `passport.authenticate('oauth-bearer', ...)` attempts to authenticate using an `Authorization: Bearer <token>` header (used for Azure AD). If *either* succeeds, `req.user` is populated. The middleware chain proceeds only if authentication is successful *or* if the requested route is explicitly public (`GET` on specific paths allowed by `public routes check`). This ensures that any subsequent middleware (like `routeGuard`) or controller logic can rely on `req.user` being present for authenticated requests.

## Walkthrough: Frontend Fetches Current User

Here is a simplified sequence diagram illustrating the API and network communication when the frontend fetches the current user's data after authentication.

```mermaid
sequenceDiagram
    participant Frontend App as Frontend (MobX)
    participant UserStore as UserStore
    participant Frontend API as Frontend API (user.ts)
    participant Backend API as Backend (app.ts, users.ts)
    participant Auth Mid as Auth Middleware (Passport)
    participant Database as Database (Prisma)

    Frontend App->>UserStore: Init/Load current user
    UserStore->>Frontend API: currentUser()
    Frontend API->>Backend API: Axios GET /api/v1/user<br>(Includes Cookie / Auth Header)
    Backend API->>Auth Mid: Middleware checks auth state
    alt Using Session Cookie
        Auth Mid->>Database: Lookup session (via cookie)
        Database-->>Auth Mid: User ID from Session
        Auth Mid-->>Backend API: req.user populated
    else Using Azure AD Token
        Auth Mid->>Auth Mid: Validate token (via header)
        Auth Mid->>Database: Lookup user by token info (e.g., email)
        Database-->>Auth Mid: User data
        Auth Mid-->>Backend API: req.user populated
    end
    Note over Backend API: Auth successful, req.user available
    Backend API->>Backend API: Route matched (/user) -> User controller
    Backend API->>Backend API: User controller gets req.user
    Backend API-->>Frontend API: 200 OK, JSON User Data
    Frontend API-->>UserStore: Axios Promise resolves
    UserStore->>UserStore: Process data (update observable state)
    UserStore-->>Frontend App: UI updates reactively
```
This diagram shows how the frontend initiative triggers an API call. The backend middleware intercepts the request first to establish the user identity (`req.user`) before the controller handles the specific request logic (returning `req.user`).

## Internal Implementation Spotlights

### Backend Controller Leveraging `req.user`

Controllers receive requests *after* the authentication middleware has run on protected routes. Any authenticated requests will have `req.user` populated by Passport.

```typescript
// teaching-api\src\controllers\users.ts (Snippet)
import { RequestHandler } from 'express';
// ... other imports

export const user: RequestHandler = async (req, res) => {
    // req.user is populated by the authentication middleware
    // It contains the authenticated User object from the database
    res.json(req.user); // Simply return the current user's data
};
// ... other user controllers ...
```
The `/user` endpoint controller is perhaps the simplest example. It relies entirely on the authentication middleware populating `req.user`. This pattern is fundamental: controllers handle the *what* (endpoint, method), while authentication middleware handles the *who* (`req.user`). Subsequent model logic then gates access typically based on this `req.user` object (as seen in [Chapter 5: Access Policy & Permissions](05_access_policy___permissions_.md)).

Similarly, the `updateDocument` controller passes the `req.user` (the `actor` performing the update) to the backend model:

```typescript
// teaching-api\src\controllers\documents.ts (Snippet)
import { RequestHandler } from 'express';
import Document from '../models/Document';

export const update: RequestHandler<{ id: string }, any, { data: any }, { onBehalfOf?: 'true' }> =
    async (req, res, next) => {
        try {
            const { onBehalfOf } = req.query;
            const model = await Document.updateModel(
                req.user!, // Pass the authenticated user to the model
                req.params.id,
                req.body.data,
                onBehalfOf === 'true'
            );
            // ... notification logic ...
            res.status(204).send();
        } catch (error) {
            next(error); // Errors (including auth errors from model) passed to error handler
        }
    };
// ... other document controllers ...
```
This demonstrates the controller delegating the core business logic (including permission checks handled *inside* `Document.updateModel`) to the backend model layer, passing the `actor` (`req.user`) needed for those checks.

## Conclusion

The API & Network Communication layer is the essential conduit for data exchange in the `teaching-project`. Leveraging Express on the backend and Axios on the frontend, it provides a structured RESTful interface for client-server interaction. Critically, backend middleware ensures that authenticated requests are properly identified (`req.user` populated by Passport) *before* reaching controller logic, allowing domain models to enforce permissions authoritatively based on the requesting user's identity. Frontend API client modules abstract the HTTP details, offering type-safe functions consumed by state management layers and components. This pattern creates a clear separation of concerns and a robust foundation for the application's data flow.

The data retrieved and managed via this API layer is then consumed by the application's state management. The next chapter explores the pattern used on the frontend to manage complex application state: the [MobX Store Pattern](08_mobx_store_pattern_.md).

[Next Chapter: MobX Store Pattern](08_mobx_store_pattern_.md)

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)
