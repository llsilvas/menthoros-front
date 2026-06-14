/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
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
    },
  };
});
