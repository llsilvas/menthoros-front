/**
 * Políticas de cor do design system — enforcement real é a regra ESLint
 * `no-restricted-syntax` (`eslint.config.js`), que falha o CI em qualquer
 * hex/rgb/hsl literal fora da camada de tokens. Este arquivo documenta as
 * duas políticas que a regra do lint não cobre sozinha (allowlist de lime,
 * proibição de `info` em brand/hero) — não há mecanismo de detecção em
 * runtime aqui.
 *
 * ── Lime Discipline (CA2, refactor-color-system-premium-v2) ──────────────────
 * Lime (faixa `primary[400..600]`, `#BDDE5A` canônico) só pode aparecer em
 * tokens de brand ou primary-action. Allowlist: `primary.*` + os papéis de
 * seleção/marca da sidebar (`sidebar.selectedBg/selectedBorder/selectedIcon/
 * headerColor`). Proibido em qualquer token de `readiness`, `trainingType`,
 * `trainingStage`, `zone`, `trainingStatus`, `semantic`, `text`, `surface*`.
 * Auditado por teste em `src/theme/limeDiscipline.test.ts` (percorre
 * `premiumTokens` inteiro — falha se um token fora da allowlist resolver
 * para lime).
 *
 * ── `info` nunca em brand/hero ────────────────────────────────────────────────
 * `semantic.info` (`#3B82F6`) é exclusivamente token informativo — nunca deve
 * aparecer em superfície de marca, hero ou call-to-action (`design.md`,
 * Constraint obrigatória 5). Sem teste automatizado dedicado hoje (a
 * verificação é por revisão de diff nas telas de marca/landing); se `info`
 * aparecer em `pages/landing/**` ou em qualquer componente de identidade de
 * marca (header, hero, CTA principal), é defeito.
 */
export {};
