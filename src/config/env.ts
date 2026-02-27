declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

// Ignora o placeholder não substituído (Dockerfile.local não executa docker-entrypoint.sh)
const injectedUrl = window.__RUNTIME_CONFIG__?.apiBaseUrl;
const runtimeApiUrl = injectedUrl?.includes('PLACEHOLDER') ? undefined : injectedUrl;

// Cadeia de fallback para a URL base da API:
// 1. window.__RUNTIME_CONFIG__.apiBaseUrl → injetado pelo container em runtime (Dockerfile.cloud)
// 2. import.meta.env.VITE_API_BASE_URL   → definido no docker-compose / CI-CD
// 3. 'http://localhost:8099'             → dev local sem Docker (comportamento atual mantido)
export const runtimeConfig = {
  apiBaseUrl:
    runtimeApiUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:8099',
} as const;
