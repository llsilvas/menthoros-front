# Menthoros Frontend Instructions

## Scope

This file applies to `apps/menthoros-front`.
Use it as the frontend execution guide for coding tasks.

## Instruction Priority

When instructions conflict, follow this order:

1. Repository root `AGENTS.md`.
2. Workspace `CLAUDE.md` (transversal).
3. This file (`apps/menthoros-front/CLAUDE.md`).
4. Active OpenSpec change instructions.
5. Existing code conventions in this module.

## Frontend Context

- **Language/Build:** TypeScript ~5.8, Vite 7, ESLint 9 (flat config).
- **UI:** React 19 + MUI 7 (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`) with Emotion (`@emotion/react`, `@emotion/styled`). **There is no Tailwind** — never add Tailwind classes or utilities.
- **Routing:** `react-router-dom` 7.
- **HTTP:** `axios`, consumed through an **OpenAPI-generated client** in `src/api` (no React Query / SWR).
- **State:** React Context + custom hooks. **No Redux / Zustand** — do not introduce a global state library without an explicit change scope.
- **Charts/Dates:** `recharts`, `date-fns`.
- **i18n:** none — UI copy is **PT-BR hardcoded**. Do not add an i18n framework without an explicit change.
- **Auth:** Keycloak JWT (token in `localStorage`), tenant propagated via `X-Tenant-ID` header.

## Mandatory Workflow

Segue o fluxo **OpenSpec-first** e as diretrizes de **branch/commit** definidos no
`CLAUDE.md` da raiz (seções "Mandatory Workflow (OpenSpec-first)" e "Diretrizes de
Git"). A raiz é a fonte canônica — não duplicar o fluxo aqui.

Específico deste módulo:
- Branch no repo `apps/menthoros-front`.
- Validar antes de entregar: `npm run lint` + `npm run build` (e `npm run test:e2e` em fluxos críticos).

## Project Structure

```
src/
  api/                  ← OpenAPI-GENERATED client + types (do NOT hand-edit)
    core/  services/
  components/           ← shared/presentational components
    auth/  common/  dashboard/  features/
  context/              ← React Context providers (auth/, ...)
  features/             ← feature shells (NEW model): coach/, athlete/
  hooks/                ← data/logic hooks (useAtletas, usePlanoSemanal, ...)
  pages/                ← legacy shell (home/, auth/, atletas/, reconciliacao/, landing/)
  services/             ← non-generated API wrappers (Metricas, Strava, auth)
  shared/               ← design-tokens/, components/, hooks/
  theme/                ← MUI theme + tokens.ts
  types/                ← manual domain types
  utils/  config/  constants/
```

### Migration in progress (read before adding screens)

The app is migrating from the **legacy shell in `pages/`** to **feature shells in `features/coach` and `features/athlete`**. For new screens, prefer the `features/<role>/` model. Do not expand the legacy `pages/` shell unless the active change explicitly targets it.

### Known gotcha — path alias

`tsconfig.json` maps `@/features/*` to `./src/components/features/*` (NOT `./src/features/*`). The newer role shells live in `src/features/`. Until this is reconciled, import role-shell code with an explicit relative path or `@/` to `src/...`, and do not assume `@/features` resolves to the new shells. Flag this when touching either location.

## Coding Rules (Frontend)

- Keep components small, focused, and strongly typed. No `any` (the JWT-parsing `as any` is legacy debt — do not add more; prefer a typed payload).
- Keep business/data logic in **hooks or services**; presentational components receive data and callbacks via props.
- Use explicit types for all API contracts.
- Do not duplicate a domain type that already exists in `src/types` or the generated `src/api`.
- Preserve consistency with the existing design system (see **Design System Standards**).
- Handle **loading, empty, and error** states for every data-driven flow.

## Component Standards

- **Presentational vs. container:** components that fetch data, hold server state, or call the API must delegate that to a hook (`useXxx`). The component renders state and forwards callbacks. A component doing `useState` + `axios`/service calls + multiple dialogs inline is too big — extract a `useXxx` hook.
- **Props:** declare an explicit `interface XxxProps`. No implicit `any`, no untyped `...rest` spreads onto DOM nodes.
- **States:** always render `loading`, `error`, and `empty` explicitly — never leave a data view blank while pending.
- **MUI:** style via the `sx` prop / `styled()` and theme tokens; do not inline hex colors (see Design System).

## Hooks & Data Fetching Standards

Data access uses **custom hooks over the generated client** (there is no React Query). Follow the established shape (reference: `src/hooks/useAtletas.ts`):

```ts
// ✅ one hook per resource, exposes data + loading + error + an action
export function useAtletas() {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAtletas = useCallback(async (filters?: AtletaFilters) => {
    setLoading(true);
    setError(null);
    try {
      setAtletas(await AtletasService.listarAtletas(filters?.nome));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { atletas, loading, error, fetchAtletas };
}
```

- Always expose `loading` and `error`; never swallow errors silently.
- Wrap async actions in `useCallback` with correct deps.
- Do not call the generated services directly from a presentational component — go through a hook.

## API Client & Types Standards

- O cliente em `src/api` é um **cliente curado à mão sobre o OpenAPI** (não saída crua do gerador).
  `npm run generate:api` (`openapi-typescript-codegen --client axios --useUnionTypes`, backend em
  `http://localhost:8099`) é a **base/referência** — mas o cliente versionado é mantido como uma
  **fachada** que corrige limitações do OpenAPI do backend e melhora a ergonomia. Por isso a regen
  **não** deve sobrescrever cegamente `src/api`.
- **Por que curado (não cru):** o gerado (a) tipa endpoints de coleção como **objeto único** quando o
  `@ApiResponse` omite `array` (ver convenção no `CLAUDE.md` backend); (b) gera **todos os campos
  opcionais** (DTOs sem `required`); (c) deriva **nomes de método** do operationId, menos ergonômicos;
  (d) pode expor operações que o front não consome. A fachada curada endereça (a)–(d).
- **Fluxo quando o contrato muda:** gere para um diretório *scratch* como referência
  (`generate:api`), e **porte à mão** as mudanças necessárias para o cliente curado — preservando
  nomes de método, tipos estreitados (ex.: arrays de lista, unions de status) e a remoção de
  operações não usadas. **Não** commitar a saída crua por cima.
- `--useUnionTypes` é obrigatório no `generate:api` (gera union types em vez de `enum`/`namespace`,
  que violam `erasableSyntaxOnly` do tsconfig).
- `src/types` guarda tipos de domínio/UI (ex.: refinamentos de union, view-models) — pode estreitar
  um tipo do contrato quando agrega valor de UI (ex.: `status: 'active'|'warning'|...`).
- Auth/tenant headers são configurados central em `main.tsx` via `OpenAPI.HEADERS` (injeta
  `Authorization` + `X-Tenant-ID`) — não setar por chamada.

> Adoção do cliente cru-gerado em todas as features (eliminar a fachada) foi avaliada na change
> `fix-openapi-client-generation` e **adiada**: degrada a tipagem (campos all-optional) e esbarra em
> endpoints curados que não existem mais no backend. Migrar, se desejado, é incremental por-feature
> com testes.

## Design System Standards

- Colors, typography, zones (Z1–Z5), and glass effects live in `src/theme/tokens.ts` and `src/shared/design-tokens`. The MUI theme is overridden centrally in `App.tsx`.
- **Never hardcode hex colors** in components — consume tokens (`colors`, `text`, `zones`, `glass`/`glassSx`).
- New visual components must reuse existing tokens and the dark-first palette; do not introduce a parallel styling scheme.

## Auth & Multi-tenancy

- JWT is read from `localStorage` (`@Menthoros:token`); expiration is checked periodically.
- Tenant is derived from Keycloak claims and sent as `X-Tenant-ID`. Do not bypass the central config.
- Route protection goes through the existing `ProtectedRoute` / `AuthContext` — do not reimplement auth checks per page.
- Prefer a typed JWT payload over `as any`; do not add new `as any` casts when reading claims.

## Imports

- Prefer the `@/` path aliases over deep relative paths (`../../../`). Available aliases: `@/`, `@/components`, `@/hooks`, `@/services`, `@/utils`, `@/types`, `@/config` (see the `@/features` gotcha above).
- Keep import groups ordered: external (react, mui) → internal (`@/...`) → types.

## Mock Data

The new shells contain placeholder mock data (e.g. `MOCK_TODAY`, ~40 occurrences across `features/`). Mock constants are temporary:

- Clearly name them `MOCK_*` and keep them isolated (not interleaved with real logic).
- Before a screen is considered done, its mocks must be replaced by a real hook/service, or the remaining mocks documented as a follow-up in the change's `tasks.md`.

## Testing & Validation

Run from `apps/menthoros-front`. Required before delivery:

```bash
npm run lint        # eslint .
npm run build       # tsc -b && vite build  (type-check + build)
npm run test:run    # vitest run (unit/component)
```

Run E2E when the task affects critical user flows (auth, listings, dashboards):

```bash
npm run test:e2e        # playwright test
npm run test:e2e:ui     # interactive
```

### Unit/component tests (Vitest + Testing Library)

Vitest **is configured** — `vite.config.ts` has a `test` block (jsdom env, globals, setup in `src/test/setup.ts`). After pulling the new deps, run `npm install` once.

- **Pure util/hook:** plain Vitest (`*.test.ts`) — reference: `src/utils/safeValues.test.ts`.
- **Component:** `@testing-library/react` (`render`, `screen`, `userEvent`) in `*.test.tsx`; test observable behavior (what the user sees/does), not implementation details.
- **Critical end-to-end flow:** Playwright (`tests/e2e/`).
- Commands: `npm run test` (watch), `npm run test:run` (CI/one-shot), `npm run coverage`.

## Definition of Done (Frontend Task)

A frontend task is done only if:

1. Implementation matches the active OpenSpec change scope.
2. The corresponding `tasks.md` item is updated.
3. UI behavior and API usage align with current contracts (generated client regenerated if the backend changed).
4. `npm run lint`, `npm run build` and `npm run test:run` pass; `npm run test:e2e` passes when the task touches a critical flow.
5. No leftover `MOCK_*` in delivered screens (or documented as a follow-up).
6. No intentional out-of-scope modifications were introduced.

## Delivery Checklist

When finishing a frontend task, report:

1. Change-id and completed task.
2. Files changed in frontend.
3. Validation commands executed and results.
4. Risks, assumptions, or follow-up items (including remaining mocks).

Last reviewed on: 2026-06-13
