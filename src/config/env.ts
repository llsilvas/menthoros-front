declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      apiBaseUrl?: string;
      keycloakUrl?: string;
    };
  }
}

// Vazio e placeholder contam como "não configurado". O docker-entrypoint.sh injeta
// "${VITE_KEYCLOAK_URL-}", então sem a var o env-config.js traz "" — e "" não é nullish,
// logo `??` sozinho não cai no fallback. O placeholder fica quando o entrypoint não roda
// (Dockerfile.local).
const definedUrl = (value: string | undefined): string | undefined =>
  value && !value.includes('PLACEHOLDER') ? value : undefined;

const runtimeApiUrl = definedUrl(window.__RUNTIME_CONFIG__?.apiBaseUrl);
const runtimeKcUrl = definedUrl(window.__RUNTIME_CONFIG__?.keycloakUrl);

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
    definedUrl(import.meta.env.VITE_KEYCLOAK_URL) ??
    '/auth',
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'menthoros',
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'menthoros-web',
} as const;
