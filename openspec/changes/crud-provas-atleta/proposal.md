## Why

O backend implementou o CRUD completo de Provas (`/atleta/{atletaId}/provas`) como parte da change `2026-03-29-crud-provas-atleta`. A entidade `Prova` é central para a Feature 6 do roadmap (Macrociclo Auto-gerado por Prova) — sem interface para cadastrar provas, o usuário não consegue registrar a prova alvo que dispara a geração do macrociclo.

## What Changes

- Criar `src/types/Prova.ts` com interfaces `Prova`, `CreateProva`, `UpdateProva` e enums `TipoProva`, `DistanciaProva`, `ProvaStatus`
- Criar `src/api/services/ProvaService.ts` mapeando os 5 endpoints REST do backend
- Criar `src/hooks/useProvas.ts` para gerenciar o estado de listagem, criação, atualização e deleção
- Criar `src/components/features/provas/ProvaFormDialog.tsx` — dialog de formulário para criar/editar uma prova
- Criar `src/components/features/provas/ProvasDialog.tsx` — dialog principal que lista as provas do atleta e abre o formulário
- Integrar botão "Provas" na coluna de ações de `src/pages/atletas/AtletasList.tsx`

## Capabilities

### New Capabilities

- `prova-crud-frontend`: CRUD de provas de um atleta via interface, consumindo os endpoints REST do backend

### Modified Capabilities

- `atletas-list`: Adiciona botão de acesso às provas na linha do atleta (sem quebrar funcionalidades existentes)

## Impact

- **Novos arquivos:** `Prova.ts`, `ProvaService.ts`, `useProvas.ts`, `ProvaFormDialog.tsx`, `ProvasDialog.tsx`
- **Arquivos modificados:** `AtletasList.tsx` (adição de um botão de ação e estado de dialog)
- **Sem quebra de contrato:** nenhuma API existente é alterada
- **Design:** segue 100% o design system existente (glassmorphism, tokens MUI, padrão Dialog/DataGrid)
