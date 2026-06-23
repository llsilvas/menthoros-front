import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OpenAPI } from './api/core/OpenAPI'
import { runtimeConfig } from './config/env'
import { AuthProvider } from './context/auth/AuthProvider'
import { decodeJwtPayload, extractTenantId } from './context/auth/jwt'

// Sobrescreve o BASE gerado pelo openapi-typescript-codegen ANTES do React renderizar.
// OpenAPI é um objeto mutável — compatível com regeneração via npm run generate:api.
OpenAPI.BASE = runtimeConfig.apiBaseUrl
OpenAPI.TOKEN = async () => localStorage.getItem('@Menthoros:token') ?? ''

// Wire X-Tenant-ID header from JWT token (Keycloak claim extraction)
OpenAPI.HEADERS = async (): Promise<Record<string, string>> => {
  const token = localStorage.getItem('@Menthoros:token') ?? ''
  if (!token) return {}

  const payload = decodeJwtPayload(token)
  const tenantId = payload ? extractTenantId(payload) : undefined
  if (tenantId) {
    return { 'X-Tenant-ID': tenantId }
  }

  return {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
