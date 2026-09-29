import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { CoachAtletaResumo } from '../../../types/Coach';
import type { KpiView } from './athleteKpiAdapters';

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

export type RosterKpiKey = 'total' | 'atRisk' | 'inTaper' | 'noActivity';

export interface RosterKpiView extends KpiView {
    key: RosterKpiKey;
}

/**
 * Células da faixa de KPIs da tela de atletas, no mesmo formato da faixa do Inbox. Os valores são
 * contagens, não medições boas ou ruins: ficam neutros, e o ícone de cada célula (na página) dá a cor.
 */
export function buildRosterKpiViews(kpis: RosterKpis): RosterKpiView[] {
    const comTreino = kpis.total - kpis.noActivity7d;
    const base = { tone: 'neutral' as const, badge: null };
    return [
        { ...base, key: 'total', label: 'Atletas', qualifier: null, value: String(kpis.total), detail: `${comTreino} com treino nos últimos ${INACTIVITY_THRESHOLD_DAYS} dias` },
        {
            ...base,
            key: 'atRisk',
            label: 'Em risco',
            qualifier: null,
            value: String(kpis.atRisk),
            detail: kpis.atRisk > 0 ? 'Status atenção ou alerta' : 'Nenhum atleta em atenção',
        },
        {
            ...base,
            key: 'inTaper',
            label: 'Em taper',
            qualifier: null,
            value: String(kpis.inTaper),
            detail: kpis.inTaper > 0 ? 'Na fase de taper antes da prova' : 'Nenhum atleta na fase de taper',
        },
        {
            ...base,
            key: 'noActivity',
            label: 'Sem atividade',
            qualifier: `${INACTIVITY_THRESHOLD_DAYS} dias`,
            value: String(kpis.noActivity7d),
            detail: `Sem treino há ${INACTIVITY_THRESHOLD_DAYS} dias ou mais`,
        },
    ];
}
