# Code Review: Coach Shell — feature/standardize-coach-shell-ux

**Reviewed**: 2026-06-01
**Branch**: feature/standardize-coach-shell-ux → develop
**Decision**: APPROVE ✅

## Summary

Coach shell construído do zero com 17 arquivos novos: 8 primitivos compartilhados
(Layer 2), CoachSidebar, AthleteRow, 4 páginas e hooks utilitários. Build limpo,
zero `any`, zero `console.log`. Os 3 issues MEDIUM encontrados foram corrigidos
na mesma sessão antes do merge.

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM — todos corrigidos ✅

| # | Arquivo | Problema | Fix aplicado |
|---|---------|----------|--------------|
| 1 | `CoachSidebar.tsx:260` | `bgcolor: '#1A2940'` hardcoded em vez de token | Substituído por `elevation.highest` |
| 2 | `CoachSidebar.tsx:450` | Nav items `component="button"` sem `onKeyDown` (Enter/Space) | Adicionado handler de teclado |
| 3 | `CoachAthletesPage.tsx:194` | Debounce inline com `useRef+setTimeout` em vez de hook reutilizável | Extraído `useDebounce<T>` para `shared/hooks/useDebounce.ts` |

### LOW — registrados, não bloqueantes

| # | Arquivo | Observação |
|---|---------|------------|
| 1 | `CoachInboxPage.tsx` (673 linhas) | Próximo ao threshold de 800 — fragmentar sub-componentes quando crescer |
| 2 | `CoachCalendarPage.tsx` (622 linhas) | Idem |
| 3 | `CoachInsightsPage.tsx` (605 linhas) | Idem |
| 4 | `CoachCalendarPage.tsx:84` | `WORKOUT_COLORS` / `WORKOUT_LABEL` exportados junto com componente — viola `react-refresh/only-export-components`. Mover para arquivo de constantes quando houver reutilização |

## Validation Results

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ Pass — zero erros |
| Lint (novos arquivos) | ✅ Pass — zero errors nos arquivos criados |
| Lint (arquivos pré-existentes) | ⚠️ Errors pré-existentes não relacionados ao coach shell |
| Build (`npm run build`) | ✅ Pass — 3.27s |

## Files Reviewed

| Arquivo | Tipo |
|---------|------|
| `src/App.tsx` | Modified — rotas /coach/* adicionadas |
| `src/constants/routes.ts` | Modified — COACH_* constants + CoachRoute type |
| `src/features/coach/layout/CoachLayout.tsx` | Added |
| `src/features/coach/layout/CoachSidebar.tsx` | Added |
| `src/features/coach/components/CoachAthleteAvatar.tsx` | Added |
| `src/features/coach/components/AthleteRow.tsx` | Added |
| `src/features/coach/pages/CoachInboxPage.tsx` | Added |
| `src/features/coach/pages/CoachAthletesPage.tsx` | Added |
| `src/features/coach/pages/CoachCalendarPage.tsx` | Added |
| `src/features/coach/pages/CoachInsightsPage.tsx` | Added |
| `src/shared/components/MetricCell.tsx` | Added |
| `src/shared/components/StatusBadge.tsx` | Added |
| `src/shared/components/Sparkline.tsx` | Added |
| `src/shared/components/ConfidenceBar.tsx` | Added |
| `src/shared/components/PhaseIndicator.tsx` | Added |
| `src/shared/components/SuggestionTypeBadge.tsx` | Added |
| `src/shared/components/KPICard.tsx` | Added |
| `src/shared/hooks/useDebounce.ts` | Added (fix #3) |

## Pontos positivos

- Zero `any` em todos os novos arquivos
- Zero `console.log`
- `CoachAthleteAvatar` tem `role`, `tabIndex` e `onKeyDown` corretos
- `AthleteRow` tem `aria-selected`
- `Sparkline` usa `isAnimationActive={false}` para suportar 50+ instâncias
- Todos os tokens usados corretamente — sem cores hardcoded nos primitivos
- `useDebounce` agora reutilizável em `src/shared/hooks/`

## Próximos passos

- Integrar páginas com API real (substituir mock data)
- Mover `WORKOUT_COLORS` / `WORKOUT_LABEL` para arquivo de constantes (LOW #4)
- Fragmentar páginas > 600 linhas quando novos sub-componentes forem extraídos
