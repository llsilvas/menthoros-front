import { primary, surface, semantic, categorical } from '../../../theme/tokens';

/**
 * Fonte única de cor do domínio de treino. Três taxonomias distintas:
 * - tipo de treino (FACIL, LONGO, TEMPO, ...)
 * - status de execução (REALIZADO, PENDENTE, ...)
 * - etapa/bloco dentro do treino (aquecimento, principal, ...)
 *
 * Centralizar evita os mapas paralelos que existiam por componente e mantém a
 * mesma cor para o mesmo conceito em todo o fluxo de plano.
 */

// ── Tipo de treino ────────────────────────────────────────────────────────────
export const WORKOUT_TYPE_COLORS: Record<string, string> = {
  FACIL:        surface[400],
  LONGO:        categorical.cat1,
  TEMPO:        semantic.warning[500],
  INTERVALADO:  semantic.danger[500],
  REGENERATIVO: semantic.success[500],
  FARTLEK:      categorical.cat4,
  CONTINUO:     semantic.warning[400],
  DEFAULT:      surface[500],
};

export function workoutTypeColor(tipo?: string): string {
  return WORKOUT_TYPE_COLORS[(tipo ?? '').toUpperCase()] ?? WORKOUT_TYPE_COLORS.DEFAULT;
}

// ── Status de execução ──────────────────────────────────────────────────────────
export const WORKOUT_STATUS_COLORS: Record<string, string> = {
  REALIZADO: semantic.success[500],
  CONCLUIDO: semantic.success[500],
  PENDENTE:  surface[400],
  PERDIDO:   semantic.danger[500],
  PARCIAL:   semantic.warning[400],
  LIVRE:     surface[400],
};

export function workoutStatusColor(status?: string): string {
  return WORKOUT_STATUS_COLORS[(status ?? '').toUpperCase()] ?? surface[400];
}

// ── Etapa/bloco do treino ───────────────────────────────────────────────────────
export const WORKOUT_STAGE_COLORS = {
  aquecimento:    semantic.warning[500],
  esforco:        semantic.danger[500],
  recuperacao:    semantic.success[500],
  desaquecimento: semantic.info[500],
  principal:      primary[500],
} as const;

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
