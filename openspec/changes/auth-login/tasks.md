## 1. Configuração de Ambiente Keycloak

- [x] 1.1 Adicionar `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` em `src/config/env.ts` com fallbacks locais
- [x] 1.2 Documentar as três variáveis no `.env.example` (ou equivalente) com os valores padrão de desenvolvimento

## 2. Tipos e Serviço de Autenticação

- [x] 2.1 Definir os tipos `LoginRequest`, `KeycloakTokenResponse` e `LoginResult` para o fluxo de autenticação
- [x] 2.2 Criar um serviço de autenticação que chame o endpoint de token do Keycloak via Direct Grant (`grant_type=password`, `Content-Type: application/x-www-form-urlencoded`) e retorne `{ accessToken: string }`
- [x] 2.3 Mapear HTTP 401 do Keycloak para erro de credenciais inválidas e outros erros para mensagem genérica

## 3. Estado de Auth e Hidratação do Token

- [x] 3.1 Atualizar `AuthContext` para hidratar o token persistido de `@Menthoros:token` na inicialização da aplicação
- [x] 3.2 Na inicialização, configurar `OpenAPI.TOKEN` como uma função resolver que lê `localStorage.getItem('@Menthoros:token')`
- [x] 3.3 Manter `login(token)` responsável por persistir o token, atualizar o estado de autenticação e redirecionar para `/`
- [x] 3.4 Atualizar `logout()` para remover o token, limpar `OpenAPI.TOKEN` e redirecionar para `/auth/login`

## 4. Roteamento e Controle de Acesso

- [x] 4.1 Adicionar uma rota pública para `/auth/login`
- [x] 4.2 Criar um componente `ProtectedRoute` que redirecione usuários não autenticados para `/auth/login`
- [x] 4.3 Envolver todas as rotas do dashboard com `ProtectedRoute`
- [x] 4.4 Redirecionar usuários autenticados que tentarem acessar `/auth/login` para `/`

## 5. Tela de Login

- [x] 5.1 Criar uma página de login autônoma fora do `DashboardLayout`
- [x] 5.2 Implementar o formulário de login com campos de usuário/email e senha
- [x] 5.3 Implementar os estados: idle, submitting (campos e botão desabilitados), erro de autenticação
- [x] 5.4 Garantir layout responsivo para mobile e desktop

## 6. Integração Authorization Bearer

- [x] 6.1 Verificar que `OpenAPI.TOKEN` está configurado como resolver antes da primeira chamada de serviço
- [x] 6.2 Confirmar que todas as requisições ao backend enviam `Authorization: Bearer <access_token>`

## 7. Validação e Aceite

- [x] 7.1 Login com sucesso: armazena o token, redireciona para `/`
- [x] 7.2 Login com credenciais inválidas: exibe erro, não navega, não persiste token
- [x] 7.3 Refresh com token armazenado: usuário permanece autenticado
- [x] 7.4 Logout: remove token, redireciona para `/auth/login`
- [x] 7.5 Rota protegida sem token: redireciona para `/auth/login`
- [x] 7.6 Usuário autenticado acessa `/auth/login`: redireciona para `/`
