import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OpenAPI } from './api/core/OpenAPI'
import { runtimeConfig } from './config/env'
import { AuthProvider } from './context/auth/AuthContext'

// Sobrescreve o BASE gerado pelo openapi-typescript-codegen ANTES do React renderizar.
// OpenAPI é um objeto mutável — compatível com regeneração via npm run generate:api.
OpenAPI.BASE = runtimeConfig.apiBaseUrl

// Wire X-Tenant-ID header from JWT token (Keycloak claim extraction)
OpenAPI.HEADERS = async (): Promise<Record<string, string>> => {
  const token = localStorage.getItem('@Menthoros:token') ?? ''
  if (!token) return {}
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))

    let tenantId: string | null = null

    // Try direct claims first
    if (payload.tenantId) tenantId = payload.tenantId
    else if (payload.tenant_id) tenantId = payload.tenant_id
    else if (payload.organizationId) tenantId = payload.organizationId
    // Try nested organization structure (Keycloak protocol mapper)
    else if (payload.organization && typeof payload.organization === 'object') {
      const org = Object.values(payload.organization)[0] as any
      if (org && Array.isArray(org.tenant_id) && org.tenant_id.length > 0) {
        tenantId = org.tenant_id[0]
      }
    }

    if (tenantId) {
      return { 'X-Tenant-ID': String(tenantId) }
    }
  } catch {
    // ignore JWT parse errors
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
