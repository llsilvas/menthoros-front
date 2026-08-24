declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      apiBaseUrl?: string;
      keycloakUrl?: string;
    };
  }
}

// Ignora o placeholder não substituído (Dockerfile.local não executa docker-entrypoint.sh)
const injectedUrl = window.__RUNTIME_CONFIG__?.apiBaseUrl;
const runtimeApiUrl = injectedUrl?.includes('PLACEHOLDER') ? undefined : injectedUrl;

const injectedKcUrl = window.__RUNTIME_CONFIG__?.keycloakUrl;
const runtimeKcUrl = injectedKcUrl?.includes('PLACEHOLDER') ? undefined : injectedKcUrl;

// Cadeia de fallback para a URL base da API:
// 1. window.__RUNTIME_CONFIG__.apiBaseUrl → injetado pelo container em runtime (Dockerfile.cloud)
// 2. import.meta.env.VITE_API_BASE_URL   → definido no docker-compose / CI-CD
// 3. '/api'                              → dev local via proxy do Vite (evita CORS no browser)
export const runtimeConfig = {
  apiBaseUrl:
    runtimeApiUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    '',
  keycloakUrl:
    runtimeKcUrl ??
    import.meta.env.VITE_KEYCLOAK_URL ??
    '/auth',
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'menthoros',
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'menthoros-web',
} as const;
