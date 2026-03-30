## 1. Types

- [x] 1.1 Criar `src/types/Prova.ts` com:
  - Enums: `TipoProva`, `DistanciaProva`, `ProvaStatus` com labels amigáveis exportados como mapas (`TIPO_PROVA_LABELS`, `DISTANCIA_PROVA_LABELS`, `PROVA_STATUS_LABELS`)
  - Interface `Prova` (output: id, nomeProva, dataProva, tipoProva, distancia, provaStatus)
  - Interface `CreateProva` (input: nomeProva, dataProva, tipoProva?, distancia?, provaStatus?)
  - Interface `UpdateProva` estendendo `Partial<CreateProva>` com `id: string`

## 2. API Service

- [x] 2.1 Criar `src/api/services/ProvaService.ts` com métodos estáticos:
  - `listarProvas(atletaId: string): CancelablePromise<Prova[]>` → `GET /atleta/{atletaId}/provas`
  - `criarProva(atletaId: string, body: CreateProva): CancelablePromise<Prova>` → `POST /atleta/{atletaId}/provas`
  - `buscarProvaPorId(atletaId: string, provaId: string): CancelablePromise<Prova>` → `GET /atleta/{atletaId}/provas/{provaId}`
  - `atualizarProva(atletaId: string, provaId: string, body: UpdateProva): CancelablePromise<Prova>` → `PUT /atleta/{atletaId}/provas/{provaId}`
  - `deletarProva(atletaId: string, provaId: string): CancelablePromise<void>` → `DELETE /atleta/{atletaId}/provas/{provaId}`
  - Seguir exatamente o padrão de `AtletasService.ts` (usar `__request` do core)

## 3. Hook

- [x] 3.1 Criar `src/hooks/useProvas.ts` com:
  - Estado: `provas: Prova[]`, `loading: boolean`, `error: string | null`
  - `fetchProvas(atletaId: string): Promise<void>` — carrega lista, trata erro
  - `createProva(atletaId: string, data: CreateProva): Promise<void>` — cria e recarrega lista
  - `updateProva(atletaId: string, provaId: string, data: UpdateProva): Promise<void>` — atualiza e recarrega lista
  - `deleteProva(atletaId: string, provaId: string): Promise<void>` — deleta e remove do estado local
  - `clearProvas(): void` — limpa lista (usado ao fechar dialog)
  - `clearError(): void`
  - Seguir o padrão de `usePlanoSemanal.ts` (useCallback para todas as funções)

## 4. ProvaFormDialog

- [x] 4.1 Criar `src/components/features/provas/ProvaFormDialog.tsx`:
  - Props: `open`, `onClose`, `onSave(data: CreateProva | UpdateProva): Promise<void>`, `prova?: Prova`
  - Modo criação/edição detectado por presença de `prova`
  - Campos: `nomeProva` (TextField), `dataProva` (TextField date), `tipoProva` (select), `distancia` (select), `provaStatus` (select)
  - Validação: `nomeProva` obrigatório, `dataProva` obrigatório — erros inline via `helperText`
  - Submit: desabilita botão durante loading, exibe "Salvando...", exibe `Alert` de erro em caso de falha
  - Tamanho: `maxWidth="sm" fullWidth`, todos os inputs `size="small"`

## 5. ProvasDialog

- [x] 5.1 Criar `src/components/features/provas/ProvasDialog.tsx`:
  - Props: `open`, `onClose`, `atletaId: string`, `atletaNome: string`
  - Ao abrir (`open && atletaId`): chamar `fetchProvas(atletaId)`
  - Ao fechar: chamar `clearProvas()`
  - Exibir `DataGrid` com colunas: nomeProva, dataProva, tipoProva (label), distancia (label), provaStatus (Chip colorido), ações (edit, delete)
  - Estado vazio: ícone `EmojiEventsIcon` + mensagem "Nenhuma prova cadastrada"
  - Estado de loading: `CircularProgress` centralizado
  - Estado de erro: `Alert severity="error"`
  - Botão "Nova Prova" no `DialogTitle`, abre `ProvaFormDialog` em modo criação
  - Ação editar (EditIcon): abre `ProvaFormDialog` em modo edição com a prova selecionada
  - Ação deletar (DeleteIcon): `window.confirm` → `deleteProva()` → atualiza lista
  - DataGrid: `density="compact"`, `rowHeight={44}`, sem paginação (lista completa)
  - Tamanho: `maxWidth="md" fullWidth`

## 6. Integração em AtletasList

- [x] 6.1 Modificar `src/pages/atletas/AtletasList.tsx`:
  - Adicionar estado: `provasDialogOpen: boolean`, `selectedAtletaForProvas: Atleta | null`
  - Adicionar handlers: `handleViewProvas(id: string)`, `handleCloseProvasDialog()`
  - Adicionar `GridActionsCellItem` com `EmojiEventsIcon`, label "Provas", onClick → `handleViewProvas`
    - Inserir após o botão de CalendarIcon (Planos) na coluna de ações
  - Renderizar `<ProvasDialog>` ao final do JSX, similar ao `<PlanosDialog>`
  - Importar `EmojiEventsIcon` de `@mui/icons-material`
