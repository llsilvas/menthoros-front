import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { getSafeValue } from '../../../utils/safeValues';

/** Status operacional de um dia do plano — independente de ser hoje (isso é outro eixo). */
export type DayStatus = 'concluido' | 'pulado' | 'futuro' | 'pendente' | 'descanso';

export function statusValue(status: TreinoPlanejado['statusTreino']): string {
  return (getSafeValue(status) ?? '').toString().toUpperCase();
}

export function treinoConcluido(treino: TreinoPlanejado): boolean {
  const s = statusValue(treino.statusTreino);
  return s === 'REALIZADO' || s === 'PARCIAL';
}

/**
 * Fonte única para Home ("Sua semana") e Plano (agenda). "Hoje" NÃO é um status: um treino feito
 * hoje é `concluido` e hoje ao mesmo tempo — misturar os dois eixos escondia o check justamente no
 * dia mais importante.
 */
export function statusDoDia(treino: TreinoPlanejado | undefined, date: Date, hoje: Date): DayStatus {
  if (!treino) return 'descanso';
  if (treinoConcluido(treino)) return 'concluido';
  const s = statusValue(treino.statusTreino);
  if (s === 'PERDIDO' || s === 'CANCELADO') return 'pulado';
  return date > hoje ? 'futuro' : 'pendente';
}
