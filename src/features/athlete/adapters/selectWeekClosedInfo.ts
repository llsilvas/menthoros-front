import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import { getSafeValue } from '../../../utils/safeValues';

/** Informação de "semana encerrada" derivada do plano corrente do atleta. */
export interface WeekClosedInfo {
    /** True quando o plano corrente está CONCLUIDO (semana encerrada pelo treinador). */
    semanaEncerrada: boolean;
    /** Quantidade de treinos planejados marcados como PERDIDO no plano. */
    treinosPerdidos: number;
}

/**
 * Deriva o sinal do banner de semana encerrada a partir do plano corrente.
 *
 * Pura (sem hooks/estado). `status` e `statusTreino` chegam como object-enum
 * (`@JsonFormat(OBJECT)` no backend) — normalizados sempre com `getSafeValue`.
 * Sem plano → sinal vazio (nunca lança).
 */
export function selectWeekClosedInfo(plano: PlanoSemanal | null): WeekClosedInfo {
    if (!plano) {
        return { semanaEncerrada: false, treinosPerdidos: 0 };
    }
    const semanaEncerrada = getSafeValue(plano.status) === 'CONCLUIDO';
    const treinosPerdidos = (plano.treinosPlanejados ?? [])
        .filter((t) => getSafeValue(t.statusTreino) === 'PERDIDO')
        .length;
    return { semanaEncerrada, treinosPerdidos };
}
