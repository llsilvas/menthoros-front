#!/bin/sh
# Prepara configurações em runtime antes de iniciar o nginx
# Usa /bin/sh (não bash) — imagem Alpine possui apenas sh
set -e

# 1. Injeta VITE_API_BASE_URL no env-config.js (config runtime do React)
ENV_CONFIG="/usr/share/nginx/html/env-config.js"
API_BASE_URL="${VITE_API_BASE_URL:-/api}"
echo "Configurando API base URL: ${API_BASE_URL}"
sed -i "s|__RUNTIME_API_URL_PLACEHOLDER__|${API_BASE_URL}|g" "${ENV_CONFIG}"

# 2. Processa template do nginx substituindo ${BACKEND_URL}
# Escopo restrito ('$BACKEND_URL') para não substituir variáveis nativas do nginx
# como $host, $remote_addr, $uri, etc.
BACKEND_URL="${BACKEND_URL:-http://menthoros-app:8080}"
echo "Configurando backend URL: ${BACKEND_URL}"
envsubst '$BACKEND_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"
