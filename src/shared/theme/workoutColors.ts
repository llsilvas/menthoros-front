import { surface, semantic } from '../../theme/tokens';

/**
 * Fonte única de cor do domínio de treino. Duas taxonomias:
 * - status de execução (REALIZADO, PENDENTE, ...)
 * - percepção de esforço (RPE 1-10)
 *
 * `trainingType` e `trainingStage` (categóricos dedicados, sem colisão com
 * semantic) vivem em `theme.premium.ts`, consumidos via `activeTheme` —
 * não duplicar mapas paralelos aqui.
 */

// ── Status de execução ──────────────────────────────────────────────────────────
export const WORKOUT_STATUS_COLORS: Record<string, string> = {
  REALIZADO: semantic.success[500],
  CONCLUIDO: semantic.success[500],
  PENDENTE:  surface[400],
  PERDIDO:   semantic.danger[500],
  PARCIAL:   semantic.warning[500],
  LIVRE:     surface[400],
};

// ── Percepção de esforço (RPE 1-10) ─────────────────────────────────────────────
/** Cor por nível de esforço: leve → sucesso, moderado → atenção, intenso → perigo. */
export function effortColor(value: number): string {
  if (value <= 3) return semantic.success[500];
  if (value <= 7) return semantic.warning[400];
  if (value <= 9) return semantic.warning[500];
  return semantic.danger[500];
}

/** Gradiente da trilha do slider de esforço (leve → intenso). */
export const EFFORT_GRADIENT = `linear-gradient(90deg, ${semantic.success[500]} 0%, ${semantic.warning[400]} 55%, ${semantic.danger[500]} 100%)`;
