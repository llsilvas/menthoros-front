import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OpenAPI } from './api/core/OpenAPI'
import { runtimeConfig } from './config/env'

// Sobrescreve o BASE gerado pelo openapi-typescript-codegen ANTES do React renderizar.
// OpenAPI é um objeto mutável — compatível com regeneração via npm run generate:api.
OpenAPI.BASE = runtimeConfig.apiBaseUrl

// Resolver do bearer token: lê o access token persistido no localStorage a cada requisição.
OpenAPI.TOKEN = () => Promise.resolve(localStorage.getItem('@Menthoros:token') ?? '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
