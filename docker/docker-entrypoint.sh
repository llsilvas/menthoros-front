#!/bin/sh
# Injeta variáveis de ambiente no env-config.js antes de iniciar o nginx
# Usa /bin/sh (não bash) — imagem Alpine possui apenas sh
set -e

ENV_CONFIG="/usr/share/nginx/html/env-config.js"
API_BASE_URL="${VITE_API_BASE_URL:-/api}"

echo "Configurando API base URL: ${API_BASE_URL}"
sed -i "s|__RUNTIME_API_URL_PLACEHOLDER__|${API_BASE_URL}|g" "${ENV_CONFIG}"
exec "$@"
