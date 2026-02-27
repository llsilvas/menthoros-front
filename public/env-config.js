// Configuração de runtime injetada pelo docker/docker-entrypoint.sh no startup do container
// NÃO altere os valores aqui — este arquivo é modificado automaticamente
// Em desenvolvimento local (npm run dev), o fallback em src/config/env.ts é utilizado
window.__RUNTIME_CONFIG__ = {
  apiBaseUrl: "__RUNTIME_API_URL_PLACEHOLDER__",
};
