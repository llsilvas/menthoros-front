## 1. Auth Service & Types

- [ ] 1.1 Define `LoginRequest` and `LoginResponse` types for frontend authentication
- [ ] 1.2 Create an authentication service that submits credentials to the backend and returns `{ token: string }`
- [ ] 1.3 Ensure the service integrates cleanly with the existing API client/request layer

## 2. Auth State & Token Hydration

- [ ] 2.1 Update `AuthContext` to hydrate the persisted token from `@Menthoros:token` on app initialization
- [ ] 2.2 Keep `login(token)` responsible for persisting the token and marking the app as authenticated
- [ ] 2.3 Keep `logout()` responsible for removing the token and clearing authenticated state

## 3. Routing & Access Control

- [ ] 3.1 Add a public login route at `/auth/login`
- [ ] 3.2 Add a protected-route wrapper for dashboard pages
- [ ] 3.3 Redirect unauthenticated users from private routes to `/auth/login`
- [ ] 3.4 Redirect authenticated users away from `/auth/login` to `/`

## 4. Login Screen UI

- [ ] 4.1 Create a standalone login page/screen outside `DashboardLayout`
- [ ] 4.2 Implement the login form with identifier and password fields
- [ ] 4.3 Implement loading, disabled-submit, and authentication error states
- [ ] 4.4 Ensure the layout is responsive for mobile and desktop

## 5. HTTP Authorization Integration

- [ ] 5.1 Ensure authenticated requests continue to send `Authorization: Bearer <token>`
- [ ] 5.2 Reuse the persisted token source already consumed by the request layer

## 6. Validation & Acceptance

- [ ] 6.1 Verify successful login stores the token and redirects to `/`
- [ ] 6.2 Verify invalid login shows an error and does not navigate
- [ ] 6.3 Verify refresh with a stored token keeps the user authenticated
- [ ] 6.4 Verify logout removes the token and redirects to `/auth/login`
- [ ] 6.5 Verify protected routes cannot be accessed without authentication
