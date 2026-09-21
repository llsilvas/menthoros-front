import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { surface } from './src/shared/design-tokens/colors';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      /**
       * PWA instalável do atleta (add-athlete-pwa-installable). O service worker precacheia SÓ o
       * app-shell; três decisões aqui são guardrails, não otimização:
       *
       * - `navigateFallbackDenylist`: o Keycloak é proxyado em `/auth/` no MESMO origin do SPA
       *   (nginx em prod, `server.proxy` em dev). Um fallback genérico responderia o `index.html`
       *   precacheado à navegação de login — a tela do IdP nunca carregaria. `/api/` entra pela
       *   mesma razão. O callback OIDC cai na raiz (`redirect_uri`) e É o shell: fallback correto.
       * - Sem `runtimeCaching`: uma rota `NetworkOnly` ainda responde pelo `fetch` handler do SW.
       *   Sem rota, o SW não chama `respondWith` e o browser vai direto à rede — nada de `/api`,
       *   `/auth` ou `env-config.js` passa pelo SW (multi-tenant/LGPD), e o E2E consegue provar
       *   isso com `response.fromServiceWorker() === false`.
       * - `env-config.js` fora do precache: é config de runtime, reescrita a cada startup do
       *   container (nginx serve com `no-store`). Precacheado, serviria URL de backend/IdP
       *   obsoleta depois de um redeploy.
       * - `registerType: 'prompt'`: nunca `autoUpdate` — um reload automático no meio do fluxo
       *   PKCE perderia o `state`. Versão nova ativa no próximo cold start (custo aceito).
       */
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          name: 'Menthoros',
          short_name: 'Menthoros',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          theme_color: surface[900],
          background_color: surface[900],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          globIgnores: ['**/env-config.js'],
          // O bundle principal tem ~2,2 MB (chunk único, aviso pré-existente do Vite) e o limite
          // padrão do Workbox é 2 MiB — sem isto o build falha e, pior, o shell não entraria no
          // precache, matando a promessa "abre offline". Code-split é outra change.
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/auth\//, /^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      /**
       * Porta fixa, e falha alto se estiver ocupada.
       *
       * O default do Vite é 5173 **com fallback silencioso para a próxima livre** — e a porta faz
       * parte da identidade da aplicação para o Keycloak: o `redirect_uri` sai de
       * `window.location.origin`, e o client `menthoros-web` só registra `http://localhost:5174/*`.
       * Numa porta diferente, o login falha com "Invalid parameter: redirect_uri", erro que não
       * sugere a causa.
       *
       * `strictPort` transforma "a porta está ocupada" num erro imediato em vez de um login que
       * quebra dez minutos depois.
       */
      port: 5174,
      strictPort: true,

      // Proxy para /api → backend (usado pelo Vite dev server no Docker local)
      // BACKEND_URL vem do environment do container; fallback para dev sem Docker
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://localhost:8099',
          changeOrigin: true,
        },
        '/auth': {
          target: env.KEYCLOAK_URL || 'http://localhost:8080',
          rewrite: (path) => path.replace(/^\/auth/, ''),
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // e2e (Playwright) não roda sob vitest — só specs unitários/componente
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    },
  };
});
