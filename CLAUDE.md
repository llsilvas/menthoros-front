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
- **Routing:** `react-router-dom` 7, via **`createHashRouter`** (`App.tsx`) — routes live after the `#` (`/#/privacidade`). See **Routing Standards**.
- **HTTP:** `axios`, consumed through an **OpenAPI-generated client** in `src/api` (no React Query / SWR).
- **State:** React Context + custom hooks. **No Redux / Zustand** — do not introduce a global state library without an explicit change scope.
- **Charts/Dates:** `recharts`, `date-fns`.
- **i18n:** none — UI copy is **PT-BR hardcoded**. Do not add an i18n framework without an explicit change.
- **Auth:** Keycloak via Authorization Code + PKCE (`oidc-client-ts`); the access token is held
  **in memory**, never in `localStorage`. Tenant propagated via `X-Tenant-ID` header. See
  **Auth & Multi-tenancy**.

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
    <role>/
      adapters/         ← pure transform functions: ApiType → ViewModelType (no hooks, no state)
      components/       ← presentational components scoped to this role
      hooks/            ← data/logic hooks scoped to this role
      pages/            ← route-level page components
      types/            ← view model types local to this feature (assembled by adapters)
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

## Routing Standards

The app uses **`createHashRouter`** (`App.tsx`). Every route is addressed after the `#`, so a bare
path is *not* a valid internal link.

- **Never write an absolute `href` for an internal route.** `href="/privacidade"` asks the server
  for `/privacidade`; the hash router never sees it. Under a dev server that falls back to
  `index.html`, the app reloads at the root and the URL degrades to
  `http://localhost:5174/privacidade#/privacidade` — it "looks routed" but reloaded the whole SPA.
- **Use `RouterLink`** (`import { Link as RouterLink } from 'react-router'`) and let the router
  build the URL. With MUI, keep the styling component and swap the element:
  ```tsx
  <Link component={RouterLink} to={ROUTES.PRIVACIDADE}>Política de Privacidade</Link>
  ```
- **Test links with a real router, never `MemoryRouter`.** `MemoryRouter` resolves `to` against an
  in-memory history and renders `href="/privacidade"` — so an assertion like
  `toHaveAttribute('href', '/privacidade')` passes on code that is broken in the browser. Mount
  `createHashRouter` + `RouterProvider` and assert the hash form:
  ```tsx
  const router = createHashRouter([{ path: '/', element: <MyPage /> }]);
  render(<RouterProvider router={router} />);
  expect(screen.getByRole('link', { name: /política/i })).toHaveAttribute('href', '#/privacidade');
  ```
  Reference: `src/features/coach/pages/CoachSettingsPage.test.tsx`.

## Component Standards

- **Presentational vs. container:** components that fetch data, hold server state, or call the API must delegate that to a hook (`useXxx`). The component renders state and forwards callbacks. A component doing `useState` + `axios`/service calls + multiple dialogs inline is too big — extract a `useXxx` hook.
- **Props:** declare an explicit `interface XxxProps`. No implicit `any`, no untyped `...rest` spreads onto DOM nodes.
- **States:** always render `loading`, `error`, and `empty` explicitly — never leave a data view blank while pending.
- **MUI:** style via the `sx` prop / `styled()` and theme tokens; do not inline hex colors (see Design System).
- **No interactive content inside a `FormControlLabel` label.** The label is a `<label>` bound to the
  control, so the browser forwards *any* click inside it to the checkbox/radio — a nested link or
  button toggles the control instead of firing its own action. `onClick={e => e.stopPropagation()}`
  does **not** fix it: label-to-control forwarding is native browser behavior, not React bubbling.
  Move the interactive element **out** of the label and render it as a sibling:
  ```tsx
  {/* ❌ o link nunca navega — o clique vira toggle do checkbox */}
  <FormControlLabel control={<Checkbox />} label={<>Li a <Link to="/privacidade">Política</Link></>} />

  {/* ✅ label só com texto; o link fora dela */}
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <FormControlLabel control={<Checkbox />} label="Li e aceito a" />
    <Link component={RouterLink} to={ROUTES.PRIVACIDADE}>Política de Privacidade</Link>
  </Box>
  ```
  Reference: `src/features/coach/components/CoachConsentDialog.tsx`.

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

## Adapter Pattern (feature shells)

Adapters são funções puras em `features/<role>/adapters/` que transformam tipos de API em view models locais. Regras:

- **Sem estado, sem hooks, sem side effects** — adapter é transformação pura, testável com `*.test.ts` simples.
- **Tipos de API** (`src/api`, `src/types`) entram; **view model types** (`features/<role>/types/`) saem.
- Antes de computar um valor derivado num componente ou hook, checar se já existe uma função helper em `adapters/`, `types/` ou `components/` da feature — evita duplicação e divergência de lógica (ex.: `formFromTSB()` em `types/AthleteForm.ts` existia mas não era usada).
- Nomes de função no padrão `buildXxxFromYyy` (ex.: `buildSelectedAthleteFromDashboard`, `buildRaceCalendarFromProfile`).

## Vocabulário de métricas PMC (obrigatório para features de treinamento)

Os três campos do `PmcPontoDto` têm semântica distinta — confundi-los gera bugs silenciosos:

| Campo | Nome completo | O que representa | Sobe quando |
|---|---|---|---|
| `ctl` | Chronic Training Load | **Fitness** — média exponencial de TSS (~42 dias) | Atleta treina consistentemente por semanas |
| `atl` | Acute Training Load | **Fadiga aguda** — média exponencial de TSS (~7 dias) | Atleta treina muito nos últimos dias |
| `tsb` | Training Stress Balance | **Forma** = CTL − ATL | Atleta descansa (CTL > ATL) |
| `tss` | Training Stress Score | Carga de um treino individual | Treino mais intenso/longo |

Regras de uso:
- `acuteLoad` em view models deve usar `atl`, nunca `ctl`.
- "Fadiga" e "Forma" são derivados de `tsb` (via `formFromTSB()`), não de `atl` diretamente.
- Monotonia = `mean(TSS_7d) / stddev(TSS_7d)` — requer pelo menos 3 pontos de `tss` no array PMC.

## Design System Standards

- Colors, typography, zones (Z1–Z5), and glass effects live in `src/theme/tokens.ts` and `src/shared/design-tokens`. The MUI theme is overridden centrally in `App.tsx`.
- **Never hardcode hex colors** in components — consume tokens (`colors`, `text`, `zones`, `glass`/`glassSx`).
- New visual components must reuse existing tokens and the dark-first palette; do not introduce a parallel styling scheme.

## Auth & Multi-tenancy

- **The access token lives in memory only — never in `localStorage` or `sessionStorage`.** Login is
  Authorization Code + PKCE via `oidc-client-ts`, with `userStore` backed by `InMemoryWebStorage`
  (`src/context/auth/oidcConfig.ts`). Read the current token through `getAccessTokenSync()` /
  `getAccessToken()` in `src/context/auth/session.ts` — never from a storage API.
  - `@Menthoros:token` (`TOKEN_STORAGE_KEY`) is a **legacy key from the ROPC era, and nothing
    writes to it**. It survives only so `limparTokenLegado` can clear sessions left over from the
    migration. Looking for a token there finds nothing.
  - `sessionStorage` holds the PKCE `code_verifier` and redirect bookkeeping — never a token.
  - Practical consequence: to get a token for a manual `curl`, copy the `Authorization` header from
    a real request in DevTools, or enable the `menthoros-test` Keycloak client (direct grant, ships
    disabled on purpose — see `menthoros-infra/keycloak/README.md`).
- Tenant is derived from Keycloak claims and sent as `X-Tenant-ID`. Do not bypass the central config.
- Route protection goes through the existing `ProtectedRoute` / `AuthContext` — do not reimplement auth checks per page.
- Prefer a typed JWT payload over `as any`; do not add new `as any` casts when reading claims.

## Imports

- Prefer the `@/` path aliases over deep relative paths (`../../../`). Available aliases: `@/`, `@/components`, `@/hooks`, `@/services`, `@/utils`, `@/types`, `@/config` (see the `@/features` gotcha above).
- Keep import groups ordered: external (react, mui) → internal (`@/...`) → types.

## Convenção de nomenclatura

| Camada | Idioma | Exemplos |
|---|---|---|
| Arquivos, componentes, hooks, tipos TS, funções | **inglês** | `ReviewTabPanel`, `useCoachDashboard`, `CoachAthleteRow`, `formFromTSB` |
| Strings de valor — domínio de negócio | **PT-BR** | `'ATRASADO'`, `'ALVO'`, `'AGUARDANDO_REVISAO'` |
| Strings de valor — estados técnicos | **inglês** | `'PENDING'`, `'APPROVED'`, `'REJECTED'` |
| Labels e copy na UI | **PT-BR** | `"Aderência"`, `"Fila de revisão"` |
| Campos de DTO vindos do backend | **inglês** | `sufficientData`, `completionRate`, `nextWeekFocus` |

Não renomear arquivos/componentes existentes por esta regra — aplicar apenas em código novo.

**Campo de DTO em português (decisão 2026-07-25):** o backend padronizou identificadores novos em
inglês (ver `apps/menthoros-backend/CLAUDE.md`, "Identifier Language"). Campo legado em PT no
contrato é renomeado **junto com a change de backend que já está mexendo naquela entidade**, em PR
coordenado nos dois repos — nunca isoladamente no front, que quebraria o consumo. Enquanto a
renomeação não acontece, o campo PT continua válido; o adapter da feature (ver "Adapter Pattern") é
o lugar de absorver a divergência se ela precisar coexistir.

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

### E2E is mandatory on critical flows (not optional)

```bash
npm run test:e2e        # playwright test
npm run test:e2e:ui     # interactive
```

A task that touches any of the flows below is **not done** until it has E2E coverage — either a new
spec or an existing one that genuinely exercises the change:

- **Authentication and session** — login, logout, token renewal, route guards, role-based redirect
  (coach vs. athlete).
- **Consent and legal gates** — anything that can block the coach from operating (LGPD consent).
- **Coach-in-the-loop decisions** — plan review/approval/rejection, editing a planned workout,
  closing the week. These write to the athlete's plan; a silent failure here reaches a real person's
  training.
- **Data entry that feeds the engine** — manual workout log, `.fit` upload, check-in.
- **Anything crossing a repo/system boundary** — Keycloak, the API contract, Strava/intervals.icu.

**Why this is a rule and not a suggestion.** The repo has repeated evidence that a green unit suite
says nothing about these paths:

- `add-coach-lgpd-consent` shipped with **762 passing tests** and two real bugs that only appeared in
  the browser: a link inside a `<label>` that ticked the consent checkbox instead of opening the
  policy (recording consent to a text the user *tried* to read), and an absolute `href` that never
  resolved under `createHashRouter`. **The test that "covered" the second one passed for both the
  correct and the broken form.**
- `athlete-onboarding-baseline` passed its whole suite and a real click-through found three bugs that
  no mocked test could have caught.

The pattern is always the same: mocks agree with the code because the same author wrote both. E2E is
the only layer here that runs the real router, the real storage and the real network.

**What E2E does not replace.** Business rules, adapters and edge cases stay in unit/component tests —
they are faster and pinpoint the failure. E2E covers *the flow holding together*, not every branch;
a suite that pushes rule coverage into E2E becomes slow and flaky, and gets ignored.

**If E2E cannot be written** for a critical flow (missing environment, external dependency), say so
explicitly in the change's `tasks.md` as a deferred item with a reason — the same treatment given to
any other pending validation. Silence is what let a broken flow ship before.

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
4. `npm run lint`, `npm run build` and `npm run test:run` pass.
5. **If the task touches a critical flow** (see "E2E is mandatory on critical flows"), `npm run test:e2e`
   passes **and** the flow is actually exercised by a spec — a green E2E run that never visits the
   changed path is not coverage. If it could not be written, the reason is recorded in `tasks.md`.
6. No leftover `MOCK_*` in delivered screens (or documented as a follow-up).
7. No intentional out-of-scope modifications were introduced.

## Delivery Checklist

When finishing a frontend task, report:

1. Change-id and completed task.
2. Files changed in frontend.
3. Validation commands executed and results.
4. Risks, assumptions, or follow-up items (including remaining mocks).

Last reviewed on: 2026-06-26

## Agent skills

A configuração dos skills de engenharia (`to-tickets`, `to-spec`, `triage`, `qa`, `wayfinder`,
`grill-with-docs`) é **transversal e vive na raiz do workspace** — `CLAUDE.md` da raiz, seção
"Agent skills", e `docs/agents/*.md` versionados em `menthoros-infra/workspace/`. O rastreador é
o **OpenSpec** em `menthoros-product/openspec/changes/`, não o GitHub Issues; os ADRs ficam em
`menthoros-product/adr/`. Não duplicar aqui: a cópia que existia neste repo apontava para GitHub
Issues e `docs/adr/` na raiz, e divergiu da configuração real em silêncio.
