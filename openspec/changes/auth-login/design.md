## Context

Menthoros is a React + TypeScript frontend built with Vite, MUI, and a dashboard-oriented visual system. The current application shell always renders authenticated dashboard flows, and authentication state exists only as a minimal `AuthContext` with `login(token)` and `logout()`.

The login change introduces the first public entrypoint into the app. It must feel like part of the same product, but it must not render the authenticated dashboard chrome (`DashboardLayout`, sidebar, header, private sections).

The current frontend already provides:

- `AuthContext` with token persistence key `@Menthoros:token`
- `ROUTES.LOGIN` constant pointing to `/auth/login`
- HTTP request layer support for `Authorization: Bearer <token>`

This change defines the UX and application structure needed to make those pieces work together.

## Goals / Non-Goals

**Goals**

- Provide a dedicated login screen for unauthenticated users
- Authenticate against the backend and receive a token in the response body
- Persist the token and hydrate the authenticated state on refresh
- Protect dashboard routes from unauthenticated access
- Redirect authenticated users away from the login page
- Support desktop and mobile layouts with the same Menthoros visual language

**Non-Goals**

- Registration flow
- Forgot-password flow
- Refresh token / silent re-auth
- Role-based access control
- JWT claims decoding/expiration handling beyond the presence of a token

## UX Structure

### 1. Public login page

**Decision:** The login experience lives on its own public route (`/auth/login`) and does not render inside `DashboardLayout`.

**Rationale:** The login page is an unauthenticated gateway, not part of the private dashboard navigation model.

### 2. Login card layout

The page should render:

- a centered login card over a Menthoros-branded background
- Menthoros brand/title
- page title such as `Entrar`
- short explanatory subtitle
- identifier field labeled for `email ou usuário`
- password field
- primary CTA `Entrar`
- inline error message area

The visual direction should reuse the current app identity:

- dark Menthoros gradient/background shell
- light card surface with subtle border
- Syne for headings where appropriate
- standard body typography consistent with the rest of the app
- responsive spacing and full-width primary button on mobile

### 3. Interaction states

The screen must support these states:

- **Idle**: fields enabled, no error visible
- **Submitting**: CTA disabled, loading indicator or loading label shown
- **Authentication error**: inline alert/message shown, form remains editable
- **Authenticated redirect**: authenticated user entering `/auth/login` is redirected to `/`

### 4. Mobile behavior

On small screens:

- the login view may occupy the full viewport height
- the card width must shrink cleanly with comfortable padding
- buttons should be full width
- font sizes and spacing should remain legible without crowding

## Application Flow Decisions

### Authentication request contract

The frontend will assume a backend contract shaped like:

```ts
type LoginRequest = {
  identifier: string;
  password: string;
};

type LoginResponse = {
  token: string;
};
```

`identifier` is the UI-level abstraction and can map to whatever the backend expects (`email`, `username`, or equivalent) inside the service layer if needed.

### Post-login behavior

On successful login:

1. submit credentials to backend
2. receive `token`
3. persist token in `localStorage` under `@Menthoros:token`
4. update `AuthContext`
5. redirect to `/`

### Hydration behavior

On app startup:

- if `@Menthoros:token` exists and is non-empty, the frontend should initialize the user as authenticated
- if no token exists, protected routes must redirect to `/auth/login`

### Logout behavior

Logout removes the persisted token, clears authenticated state, and redirects to the login route.

## Risks / Trade-offs

- **Minimal auth state only**: Without refresh token support, expired tokens will surface later as backend 401s. This is acceptable for the first iteration.
- **Identifier ambiguity**: Product copy should say `email ou usuário`, while the service layer can adapt request shape if backend naming differs.
- **Route protection refactor**: Splitting public and private routing affects `App.tsx`, so the spec must explicitly define the protected-route wrapper behavior.

## Migration Plan

1. Add auth login OpenSpec capability and scenarios
2. Create authentication request/response types and service
3. Update `AuthContext` hydration
4. Introduce protected route wrapper
5. Separate public `/auth/login` from private dashboard routes
6. Add login screen and connect submit flow
7. Validate login, refresh, redirect, and logout behaviors

## Open Questions Resolved

- **Post-login destination**: `/`
- **Backend response shape**: `{ token: string }`
