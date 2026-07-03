import type { AthleteAderencia } from '../../../types/AthleteProgress';

export interface AderenciaResumo {
  totalRealizado: number;
  totalPlanejado: number;
}

/**
 * Soma `totalRealizado`/`totalPlanejado` de todas as semanas retornadas.
 * Retorna `null` para lista vazia — o backend já filtra semanas sem plano (`totalPlanejado > 0`);
 * lista vazia significa "sem dados de aderência no período", não "0 de 0".
 */
export function buildAderenciaResumo(semanas: AthleteAderencia[]): AderenciaResumo | null {
  if (semanas.length === 0) {
    return null;
  }

  return semanas.reduce(
    (acc, s) => ({
      totalRealizado: acc.totalRealizado + s.totalRealizado,
      totalPlanejado: acc.totalPlanejado + s.totalPlanejado,
    }),
    { totalRealizado: 0, totalPlanejado: 0 },
  );
}
