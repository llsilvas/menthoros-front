## ADDED Requirements

### Requirement: Provide a public login route
The system SHALL expose a public login route at `/auth/login` that is accessible without prior authentication and does not render the authenticated dashboard layout.

#### Scenario: Login route is public
- **WHEN** an unauthenticated user navigates to `/auth/login`
- **THEN** the frontend MUST render the login screen
- **AND** it MUST NOT require a token to access that route

#### Scenario: Login screen is outside dashboard chrome
- **WHEN** the login screen is rendered
- **THEN** the frontend MUST NOT render the authenticated dashboard sidebar or dashboard header shell

---

### Requirement: Authenticate against the backend and persist the returned token
The system SHALL submit user credentials to the backend authentication endpoint and persist the returned token in local storage under `@Menthoros:token`.

#### Scenario: Login succeeds
- **GIVEN** the user is on `/auth/login`
- **WHEN** the user submits valid credentials
- **THEN** the frontend MUST call the backend authentication service
- **AND** it MUST store the returned `token`
- **AND** it MUST mark the user as authenticated
- **AND** it MUST redirect the user to `/`

#### Scenario: Login fails
- **GIVEN** the user is on `/auth/login`
- **WHEN** the user submits invalid credentials
- **THEN** the frontend MUST display an authentication error
- **AND** it MUST NOT redirect the user
- **AND** it MUST NOT mark the user as authenticated

---

### Requirement: Hydrate authentication state from persisted token
The system SHALL initialize frontend authentication state from the persisted Menthoros token when the application starts.

#### Scenario: Existing token restores session state
- **GIVEN** a non-empty token exists in `localStorage` under `@Menthoros:token`
- **WHEN** the application initializes
- **THEN** the frontend MUST consider the user authenticated

#### Scenario: Missing token leaves user unauthenticated
- **GIVEN** no token exists in `localStorage`
- **WHEN** the application initializes
- **THEN** the frontend MUST consider the user unauthenticated

---

### Requirement: Protect dashboard routes
The system SHALL require authentication before rendering private dashboard routes.

#### Scenario: Unauthenticated user accesses private route
- **GIVEN** the user is not authenticated
- **WHEN** the user navigates to a protected route such as `/`, `/atletas`, `/planos`, or `/treinos`
- **THEN** the frontend MUST redirect the user to `/auth/login`

#### Scenario: Authenticated user accesses private route
- **GIVEN** the user is authenticated
- **WHEN** the user navigates to a protected dashboard route
- **THEN** the frontend MUST allow the route to render

---

### Requirement: Redirect authenticated users away from the login route
The system SHALL prevent authenticated users from staying on the login screen.

#### Scenario: Authenticated user opens login page
- **GIVEN** the user is authenticated
- **WHEN** the user navigates to `/auth/login`
- **THEN** the frontend MUST redirect the user to `/`

---

### Requirement: Send bearer token on authenticated requests
The system SHALL use the persisted authentication token when issuing authenticated API requests.

#### Scenario: Authenticated request includes bearer token
- **GIVEN** a token is stored under `@Menthoros:token`
- **WHEN** the frontend performs an authenticated backend request
- **THEN** the request MUST include `Authorization: Bearer <token>`

---

### Requirement: Support explicit logout
The system SHALL remove the persisted token and return the user to the login entrypoint when logout is executed.

#### Scenario: Logout clears session
- **GIVEN** the user is authenticated
- **WHEN** the user executes logout
- **THEN** the frontend MUST remove `@Menthoros:token` from local storage
- **AND** it MUST mark the user as unauthenticated
- **AND** it MUST redirect the user to `/auth/login`

---

### Requirement: Render a responsive login UI
The system SHALL render the login screen in a layout that remains usable on both mobile and desktop.

#### Scenario: Mobile login remains usable
- **WHEN** the login screen is rendered on a mobile viewport
- **THEN** the form fields MUST remain vertically readable
- **AND** the primary action MUST remain easily tappable

#### Scenario: Login screen exposes loading state
- **WHEN** the user submits credentials and the request is pending
- **THEN** the login UI MUST show a loading state
- **AND** the submit button MUST be disabled until the request resolves
