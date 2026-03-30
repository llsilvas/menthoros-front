## Context

O frontend já tem o padrão de acesso a sub-recursos de um atleta via Dialog modal:
- `AtletasList` → botão (CalendarIcon) → `PlanosDialog` → `usePlanoSemanal` → `PlanoSemanalService`

Provas seguirá exatamente o mesmo padrão:
- `AtletasList` → botão (EmojiEventsIcon) → `ProvasDialog` → `useProvas` → `ProvaService`

O backend expõe `/atleta/{atletaId}/provas` com CRUD completo e exige JWT com `tenant_id` no header `Authorization`.

## Goals / Non-Goals

**Goals:**
- Expor CRUD de provas com a mesma UX/padrão de PlanosDialog
- Reutilizar o design system (glassmorphism, tokens, MUI v7, tamanho `small` nos inputs)
- Não adicionar dependências novas ao projeto

**Non-Goals:**
- Integração com Keycloak real (auth continua com o placeholder atual de localStorage)
- Visualização de macrociclo gerado pela prova (Feature 6 do roadmap — futuro)
- Paginação na listagem (backend não pagina; lista completa)

## Decisions

### 1. Dois Dialogs: ProvasDialog + ProvaFormDialog

**ProvasDialog** — dialog principal que lista as provas do atleta em cards/tabela compacta, com botões para adicionar, editar e deletar.

**ProvaFormDialog** — dialog de formulário (create/edit), aberto a partir do ProvasDialog. Segue o mesmo padrão do `AtletaDialog`.

- **Alternativa considerada:** um único dialog com modo de listagem e formulário embutido — rejeitado por tornar o componente muito grande e dificultar o reuso do formulário.

### 2. DataGrid para listar provas dentro do ProvasDialog

Provas têm campos discretos (data, distância, status) que se encaixam bem em colunas. Usar `DataGrid` dentro do dialog, com densidade `compact`, é consistente com `AtletasList`.

- **Alternativa considerada:** cards como em `PlanosDialog` — rejeitado porque provas são dados tabulares simples, sem hierarquia (não têm treinos filhos a exibir).

### 3. Icone EmojiEventsIcon para o botão de Provas

Semântica clara (troféu = prova/competição) e disponível no `@mui/icons-material`.

### 4. Estado local no ProvasDialog (não global)

Provas são sempre carregadas no contexto de um atleta específico, abertas sob demanda. Não há necessidade de estado global. `useProvas` usa `useState` local, sem Context ou Zustand.

### 5. ProvaStatus controlado pelo usuário

O campo `provaStatus` (INSCRITA, CONFIRMADA, REALIZADA, CANCELADA) é editável manualmente. Não há automação de transição de status — consistente com o comportamento do backend (sem lógica de máquina de estados).

## Component Architecture

```
AtletasList (page)
└── ProvasDialog (modal)                      ← novo
    ├── DataGrid (lista de provas)
    └── ProvaFormDialog (modal aninhado)      ← novo
        └── formulário create/edit

Hooks:
  useProvas                                    ← novo
    └── ProvaService                           ← novo

Types:
  Prova, CreateProva, UpdateProva             ← novo
  TipoProva, DistanciaProva, ProvaStatus      ← novo (enums)
```

## API Mapping

| Operação       | Método | URL                                      | Hook method      |
|----------------|--------|------------------------------------------|------------------|
| Listar         | GET    | /atleta/{atletaId}/provas                | fetchProvas()    |
| Criar          | POST   | /atleta/{atletaId}/provas                | createProva()    |
| Buscar por ID  | GET    | /atleta/{atletaId}/provas/{provaId}      | (interno)        |
| Atualizar      | PUT    | /atleta/{atletaId}/provas/{provaId}      | updateProva()    |
| Deletar        | DELETE | /atleta/{atletaId}/provas/{provaId}      | deleteProva()    |

## Risks / Trade-offs

- **Dialog aninhado** (ProvasDialog > ProvaFormDialog): React/MUI suporta bem, mas o foco e z-index precisam de atenção. Mitigação: o ProvaFormDialog usa `maxWidth="sm"` para não sobrepor totalmente o ProvasDialog.
- **Sem confirmação de delete via backend (soft delete)**: o backend faz delete físico. O frontend deve exibir `window.confirm` antes de deletar, consistente com `deleteAtleta`.
- **Enums do backend em português**: os valores (`CINCO_KM`, `MEIA_MARATONA`, etc.) precisam de labels amigáveis no frontend. Definir mapeamentos estáticos em `Prova.ts`.

## Migration Plan

Nenhuma migration de banco. Apenas arquivos novos + modificação pontual em `AtletasList.tsx`.
