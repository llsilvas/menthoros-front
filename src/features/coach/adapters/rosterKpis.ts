import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { CoachAtletaResumo } from '../../../types/Coach';

/** Dias sem treino a partir dos quais um atleta conta como "sem atividade". */
export const INACTIVITY_THRESHOLD_DAYS = 7;

/** Dias desde a última atividade; `null` quando não há `lastActivity`. */
export function daysSinceLastActivity(lastActivity: string | undefined, hoje: Date): number | null {
    return lastActivity ? differenceInCalendarDays(hoje, parseISO(lastActivity)) : null;
}

/** KPIs do topo da tela de atletas, derivados do roster. */
export interface RosterKpis {
    total: number;
    atRisk: number;
    inTaper: number;
    noActivity7d: number;
}

/**
 * Deriva os KPIs do roster usando SÓ campos que o backend já computou (R3):
 * - `atRisk`: status `warning` ou `danger`
 * - `inTaper`: fase `TAPER`
 * - `noActivity7d`: sem `lastActivity` ou ≥ 7 dias desde a última atividade
 *
 * `hoje` é injetado para tornar o cálculo determinístico/testável.
 */
export function deriveRosterKpis(roster: CoachAtletaResumo[], hoje: Date): RosterKpis {
    return {
        total: roster.length,
        atRisk: roster.filter((a) => a.status === 'danger' || a.status === 'warning').length,
        inTaper: roster.filter((a) => a.fase === 'TAPER').length,
        noActivity7d: roster.filter((a) => {
            const dias = daysSinceLastActivity(a.lastActivity, hoje);
            return dias === null || dias >= INACTIVITY_THRESHOLD_DAYS;
        }).length,
    };
}
