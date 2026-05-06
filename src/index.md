# Índice — src/

## Arquivos raiz

- **[App.tsx](./App.tsx)** - Tema MUI, roteamento hash e declaração de todas as rotas
- **[App.css](./App.css)** - Estilos globais da aplicação
- **[index.css](./index.css)** - CSS global base (reset, fontes)
- **[main.tsx](./main.tsx)** - Ponto de entrada: inicializa React e configura URL base da API
- **[vite-env.d.ts](./vite-env.d.ts)** - Tipagens de variáveis de ambiente Vite

## api/

### api/core/

- **[ApiError.ts](./api/core/ApiError.ts)** - Tipo de erro retornado pelo cliente OpenAPI
- **[ApiRequestOptions.ts](./api/core/ApiRequestOptions.ts)** - Opções configuráveis por requisição
- **[ApiResult.ts](./api/core/ApiResult.ts)** - Wrapper genérico de resultado de requisição
- **[CancelablePromise.ts](./api/core/CancelablePromise.ts)** - Promise com suporte a cancelamento
- **[OpenAPI.ts](./api/core/OpenAPI.ts)** - Configuração global do cliente (BASE URL, headers)
- **[request.ts](./api/core/request.ts)** - Dispatcher HTTP central das requisições
- **[index.ts](./api/index.ts)** - Barrel export de todo o cliente OpenAPI gerado

### api/services/

- **[AtletasService.ts](./api/services/AtletasService.ts)** - CRUD de atletas gerado do OpenAPI
- **[PlanoSemanalService.ts](./api/services/PlanoSemanalService.ts)** - Operações de plano semanal geradas do OpenAPI
- **[ProvaService.ts](./api/services/ProvaService.ts)** - CRUD de provas de atletas gerado do OpenAPI
- **[TreinoService.ts](./api/services/TreinoService.ts)** - Treinos realizados e planejados gerados do OpenAPI

## assets/

### assets/icons/

- **[logo_menthoros.svg](./assets/icons/logo_menthoros.svg)** - Logo SVG vetorial da marca
- **[menthoros_icon.png](./assets/icons/menthoros_icon.png)** - Ícone da aplicação
- **[menthoros_navbar.png](./assets/icons/menthoros_navbar.png)** - Logo exibido na barra de navegação

## components/

### components/common/

- **[index.ts](./components/common/index.ts)** - Barrel export de componentes comuns reutilizáveis

### components/dashboard/

- **[DashboardLayout.tsx](./components/dashboard/DashboardLayout.tsx)** - Layout raiz responsivo: sidebar + header + outlet
- **[DashboardHeader.tsx](./components/dashboard/DashboardHeader.tsx)** - AppBar com toggle de menu, título e avatar
- **[DashboardSidebar.tsx](./components/dashboard/DashboardSidebar.tsx)** - Drawer de navegação expandível/mini com itens de menu
- **[DashboardSidebarDividerItem.tsx](./components/dashboard/DashboardSidebarDividerItem.tsx)** - Separador visual entre seções do sidebar
- **[DashboardSidebarHeaderItem.tsx](./components/dashboard/DashboardSidebarHeaderItem.tsx)** - Cabeçalho de seção no sidebar
- **[DashboardSidebarPageItem.tsx](./components/dashboard/DashboardSidebarPageItem.tsx)** - Item de navegação clicável no sidebar
- **[ThemeSwitcher.tsx](./components/dashboard/ThemeSwitcher.tsx)** - Botão de alternância light/dark mode

### components/features/

- **[TreinoRealizadoDialog.tsx](./components/features/TreinoRealizadoDialog.tsx)** - Modal para registrar execução de treino

#### components/features/atleta/

- **[AtletaDialog.tsx](./components/features/atleta/AtletaDialog.tsx)** - Formulário modal de criação e edição de atleta

#### components/features/planos/

- **[TreinoCard.tsx](./components/features/planos/TreinoCard.tsx)** - Card de treino com status, zona, distância e ações
- **[DetalheTreinoDialog.tsx](./components/features/planos/DetalheTreinoDialog.tsx)** - Modal com detalhes completos de treino planejado
- **[planosDialog.tsx](./components/features/planos/planosDialog.tsx)** - Modal de gerenciamento de planos semanais

#### components/features/planos/WorkoutTimelineChart/

- **[WorkoutTimelineChart.tsx](./components/features/planos/WorkoutTimelineChart/WorkoutTimelineChart.tsx)** - Gráfico de linha do tempo de treino por zonas e blocos
- **[toWorkoutBlocks.ts](./components/features/planos/WorkoutTimelineChart/toWorkoutBlocks.ts)** - Converte dados de treino em blocos visuais do gráfico
- **[types.ts](./components/features/planos/WorkoutTimelineChart/types.ts)** - Tipos WorkoutBlock e BlockType do gráfico
- **[index.ts](./components/features/planos/WorkoutTimelineChart/index.ts)** - Export público do componente WorkoutTimelineChart

#### components/features/provas/

- **[ProvasDialog.tsx](./components/features/provas/ProvasDialog.tsx)** - Modal de listagem e gerenciamento de provas do atleta
- **[ProvaFormDialog.tsx](./components/features/provas/ProvaFormDialog.tsx)** - Formulário modal de criação e edição de prova

## config/

- **[env.ts](./config/env.ts)** - URL base da API com fallback: runtime → env var → localhost

## constants/

- **[constants.ts](./constants/constants.ts)** - Larguras do drawer expandido (240px) e mini (90px)
- **[routes.ts](./constants/routes.ts)** - Constantes de rotas da aplicação (HOME, ATLETAS, PLANOS…)

## context/

- **[DashboardSidebarContext.ts](./context/DashboardSidebarContext.ts)** - Context do estado de expansão e interação da sidebar
- **[auth/AuthContext.tsx](./context/auth/AuthContext.tsx)** - Context de autenticação: login/logout com localStorage

## hooks/

- **[useAtletas.ts](./hooks/useAtletas.ts)** - Hook simples de listagem de atletas via API
- **[usePlanoSemanal.ts](./hooks/usePlanoSemanal.ts)** - Fetch, geração e deleção de planos semanais
- **[useProvas.ts](./hooks/useProvas.ts)** - CRUD completo de provas do atleta
- **[useTreinoRealizado.ts](./hooks/useTreinoRealizado.ts)** - Fetch e registro de treinos realizados

### hooks/features/

- **[useCrud.ts](./hooks/features/useCrud.ts)** - Hook CRUD de atletas com filtros, paginação e ordenação client-side

## pages/

### pages/atletas/

- **[AtletasList.tsx](./pages/atletas/AtletasList.tsx)** - Listagem de atletas com DataGrid, filtros e ações CRUD

### pages/home/

- **[HomePage.tsx](./pages/home/HomePage.tsx)** - Página inicial de boas-vindas do dashboard

## theme/

- **[tokens.ts](./theme/tokens.ts)** - Design tokens: paleta, glassmorphism, zonas Z1–Z5, helpers `sx`

## types/

- **[Atleta.ts](./types/Atleta.ts)** - Tipos do atleta: Atleta, CreateAtleta, UpdateAtleta, enums
- **[PlanoSemanal.ts](./types/PlanoSemanal.ts)** - Tipos do plano semanal: status, método de geração, estrutura
- **[Prova.ts](./types/Prova.ts)** - Tipos de prova: Prova, CreateProva, UpdateProva
- **[TreinoPlanejado.ts](./types/TreinoPlanejado.ts)** - Treino planejado com etapas, FC alvo, ritmo e esforço
- **[TreinoRealizado.ts](./types/TreinoRealizado.ts)** - Tipos de registro de treino realizado

## utils/

- **[formatting.ts](./utils/formatting.ts)** - Formata datas (pt-BR) e duração em horas/minutos
- **[mixins.ts](./utils/mixins.ts)** - Helpers de transição CSS para animação do drawer MUI
- **[safeValues.ts](./utils/safeValues.ts)** - Normaliza valores enum do backend (string simples ou objeto)
