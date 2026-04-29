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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
