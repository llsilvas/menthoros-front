# Menthoros Frontend Instructions

## Scope

This file applies to `apps/menthoros-front`.
Use it as the frontend execution guide for coding tasks.

## Instruction Priority

When instructions conflict, follow this order:

1. Repository root `AGENTS.md`.
2. Repository root `CLAUDE.md`.
3. This file (`apps/menthoros-front/CLAUDE.md`).
4. Active OpenSpec change instructions.
5. Existing code conventions in this module.

## Frontend Context

- Stack: React, TypeScript, Vite.
- UI: Tailwind/design-system patterns used in project.
- Quality gates: unit/integration tests, build, and e2e when relevant.

## Mandatory Workflow (OpenSpec-first)

Never start implementation directly in code.

1. Identify active change in `menthoros-product/openspec/changes/<change-id>`.
2. Read in order:
   - `proposal.md`
   - `design.md` (if present)
   - `tasks.md`
   - affected `specs/**/spec.md`
3. Execute one `tasks.md` item at a time.
4. If behavior changes, update OpenSpec in the same work.
5. Keep changes minimal and in-scope.

## Coding Rules (Frontend)

- Keep components small, focused, and strongly typed.
- Keep business logic in hooks/services; avoid domain logic in presentational components.
- Use explicit types for API contracts.
- Avoid duplicate domain types when shared types already exist.
- Preserve consistency with existing design-system patterns.
- Handle loading, empty, and error states for affected flows.

## API Contract and Integration Guardrails

- Do not silently change request/response assumptions.
- If backend contract changed, reflect it explicitly in frontend types and usage.
- If endpoint behavior changed, ensure OpenSpec and impacted docs are updated.

## Testing and Validation

Run from `apps/menthoros-front`.

Required before delivery:

```bash
npm run test
npm run build
```

Run e2e when the task affects critical user flows:

```bash
npm run test:e2e
```

## Definition of Done (Frontend Task)

A frontend task is done only if:

1. Implementation matches active OpenSpec change scope.
2. Corresponding `tasks.md` item is updated.
3. UI behavior and API usage align with current contracts.
4. `npm run test` and `npm run build` pass.
5. No intentional out-of-scope modifications were introduced.

## Delivery Checklist

When finishing a frontend task, report:

1. Change-id and completed task.
2. Files changed in frontend.
3. Validation commands executed and results.
4. Risks, assumptions, or follow-up items.

Last reviewed on: 2026-04-30
