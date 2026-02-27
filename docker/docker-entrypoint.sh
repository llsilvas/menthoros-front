#!/bin/sh
# Prepara configurações em runtime antes de iniciar o nginx
# Usa /bin/sh (não bash) — imagem Alpine possui apenas sh
set -e

# 1. Injeta VITE_API_BASE_URL no env-config.js (config runtime do React)
ENV_CONFIG="/usr/share/nginx/html/env-config.js"
API_BASE_URL="${VITE_API_BASE_URL:-/api}"
echo "Configurando API base URL: ${API_BASE_URL}"
sed -i "s|__RUNTIME_API_URL_PLACEHOLDER__|${API_BASE_URL}|g" "${ENV_CONFIG}"

# 2. Extrai nameserver de /etc/resolv.conf para o resolver do nginx
# gsub(/\r/,"") trata CRLF (comum em imagens Windows-built)
# IPv6 precisa de colchetes na diretiva resolver do nginx: [::1]
DNS_RESOLVER=$(awk '/^nameserver/{gsub(/\r/,""); print $2; exit}' /etc/resolv.conf 2>/dev/null | tr -d '[:space:]' || true)
case "$DNS_RESOLVER" in
    *:*) DNS_RESOLVER="[$DNS_RESOLVER]" ;;
esac
# Fallback para DNS público caso /etc/resolv.conf esteja ausente ou sem nameserver
[ -z "$DNS_RESOLVER" ] && DNS_RESOLVER="1.1.1.1"
echo "DNS resolver: ${DNS_RESOLVER}"

# 3. Processa template do nginx via sed (substitui __BACKEND_URL__ e __DNS_RESOLVER__)
# Usando placeholders __STYLE__ para não conflitar com variáveis nativas do nginx ($host, $uri, etc.)
BACKEND_URL="${BACKEND_URL:-http://menthoros-app:8080}"
echo "Configurando backend URL: ${BACKEND_URL}"
sed \
    -e "s|__BACKEND_URL__|${BACKEND_URL}|g" \
    -e "s|__DNS_RESOLVER__|${DNS_RESOLVER}|g" \
    /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Valida a configuração gerada antes de passar o controle ao nginx
echo "Validando nginx.conf gerado..."
nginx -t

exec "$@"
