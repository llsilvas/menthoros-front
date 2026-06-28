import { parseISO } from 'date-fns';
import type { PMCDataPoint } from '../components/PMCChart';
import type { PmcHistoricoPonto } from '../../../types/MetricasPmc';

/**
 * Converte a série PMC crua do backend (`data: string` ISO) no formato consumido
 * pelo `PMCChart` (`date: Date`). Campos numéricos ausentes viram `0` (dia sem métrica).
 */
export function mapPmcHistoricoToDataPoints(pontos: PmcHistoricoPonto[]): PMCDataPoint[] {
    return pontos.map((p) => ({
        date: parseISO(p.data),
        ctl: p.ctl ?? 0,
        atl: p.atl ?? 0,
        tsb: p.tsb ?? 0,
        tss: p.tss ?? 0,
    }));
}
