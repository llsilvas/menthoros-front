import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
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
