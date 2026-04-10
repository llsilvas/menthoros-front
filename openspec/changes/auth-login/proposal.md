## Why

The Menthoros frontend currently opens directly into the dashboard experience with no authentication gate. That makes it impossible to protect athlete, plan, and workout data, and it prevents the application from establishing a consistent session model with the backend.

The product needs a first authentication step: a dedicated login screen that exchanges user credentials for a backend-generated token, persists that token locally, and uses it to unlock the private dashboard routes.

## What Changes

- Introduce a new public login route at `/auth/login`
- Add a login screen in the Menthoros visual style, separate from `DashboardLayout`
- Call a backend authentication service that returns a `token`
- Persist the token in `localStorage` using the existing Menthoros auth key
- Hydrate authentication state on app bootstrap from the persisted token
- Protect internal dashboard routes and redirect unauthenticated users to login
- Redirect authenticated users away from the login page back to `/`

## Capabilities

### New Capabilities

- `auth-login`: Authenticate a user with backend credentials, persist the returned token, and gate access to protected Menthoros routes

### Modified Capabilities

- Dashboard routing: Existing routes become protected and require authentication before rendering

## Impact

- **Context**: `AuthContext` must hydrate persisted token state and continue to expose login/logout actions
- **Routing**: `src/App.tsx` must split public auth routes from protected dashboard routes
- **API**: A dedicated authentication service must call the backend login endpoint and return `{ token: string }`
- **HTTP client**: Existing bearer token injection must reuse the persisted token
- **UI**: A new login page/screen must be added in the frontend design system

## Assumptions

- The backend login endpoint accepts credentials and returns a JSON body with `token: string`
- The initial authentication iteration does not include refresh tokens, password recovery, registration, or permission roles
- The default redirect after successful login will be `/`
