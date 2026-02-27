import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
        target: process.env.BACKEND_URL ?? 'http://localhost:8099',
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true,
      },
    },
  },
});
