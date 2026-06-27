# Tasks — migrate-premium-color-tokens-v2

> Spec-only change. Tarefas listadas para execução futura; nenhuma marcada como feita.

## Phase 1 — Mecânico (baixo risco)
- [ ] Regenerar escala `primary` em `src/shared/design-tokens/colors.ts` com anchor `#BDDE5A`
- [ ] Atualizar lime de `sidebar` e `glass` em `src/theme/tokens.ts` (mantêm referência a `primary[500]`)
- [ ] Canonizar `WORKOUT_STATUS_COLORS` para tokens semânticos (`semantic.*` / `text.secondary`)
- [ ] Atualizar `forbidden-uses.ts`: `#D4FF3A → #BDDE5A` e remover `cat`-hexes obsoletos
- [ ] Validar: `npm run lint && npm run build && npm run test:run`

## Phase 2 — Correção de colisões (médio)
- [ ] Introduzir `categorical` nomeada (slate/teal/cyan/violet/magenta/coral/gold/sage/injuryResponse) em `colors.ts`
- [ ] Reescrever `WORKOUT_TYPE_COLORS` para `categorical` (ver remap table §2.3)
- [ ] Reescrever `WORKOUT_STAGE_COLORS` para `categorical` (ver §2.4); `principal` lime→teal
- [ ] Renomear bandas `readiness` (`low/medium/high/peak` → `critical/caution/good/optimal`); `good` lime→`#2DD4BF`
- [ ] Trocar `zones.Z2` lime → `#34D399` (manter estrutura `{color,fill,border,label}`)
- [ ] Codemod nos consumidores de `categorical.catN` e bandas de readiness
- [ ] Teste de unidade: sem hex compartilhado categorical↔semantic (exceto `injuryResponse`)
- [ ] Teste de unidade: `zones.Z2.color !== primary[500]`; `readiness.good === '#2DD4BF'`

## Phase 3 — Premium polish (médio-alto)
- [ ] Auditar 25 consumidores de `glass*`; substituir blur por material+hairline no cockpit denso
- [ ] Revisar densidade e espaço negativo no cockpit coach
- [ ] Visual diff: cockpit dashboard, athlete plan view, workout detail
- [ ] Manter alias `glassSx` retrocompatível para rollback por componente

## Lint gate (CI)
- [ ] Adicionar override `no-restricted-syntax` anti-hex/rgba em `eslint.config.js` (allowlist: `design-tokens/**`, `theme/tokens.ts`)
- [ ] Promover `auditRawColors()` a teste de unidade sobre glob de componentes
- [ ] Grep negativo anti-lime em readiness/zone/type/stage no pipeline

## Mocks / follow-up
- [ ] `AthleteHomePage` consome `MOCK_TODAY.readiness` — substituir por hook real é follow-up fora deste escopo (documentado).
