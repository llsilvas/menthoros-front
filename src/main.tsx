import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OpenAPI } from './api/core/OpenAPI'
import { runtimeConfig } from './config/env'
import { AuthProvider } from './context/auth/AuthProvider'
import { getAccessToken, getTenantId } from './context/auth/session'

// Sobrescreve o BASE gerado pelo openapi-typescript-codegen ANTES do React renderizar.
// OpenAPI é um objeto mutável — compatível com regeneração via npm run generate:api.
OpenAPI.BASE = runtimeConfig.apiBaseUrl
OpenAPI.TOKEN = getAccessToken

// X-Tenant-ID vem da MESMA fonte que o Authorization (ver `context/auth/session`). Eram duas
// leituras independentes do storage: numa renovação, o header podia sair sem tenant enquanto o
// Authorization já era o novo, e o backend responderia 403 sem o login parecer quebrado.
OpenAPI.HEADERS = async (): Promise<Record<string, string>> => {
  const tenantId = getTenantId()
  return tenantId ? { 'X-Tenant-ID': tenantId } : {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
