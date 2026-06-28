import { describe, expect, it } from 'vitest';
import { mapPmcHistoricoToDataPoints } from './pmcAdapter';
import type { PmcHistoricoPonto } from '../../../types/MetricasPmc';

describe('mapPmcHistoricoToDataPoints', () => {
    it('converte data ISO em Date e mantém métricas 1:1', () => {
        const pontos: PmcHistoricoPonto[] = [
            { data: '2026-06-17', ctl: 52.3, atl: 60.1, tsb: -7.8, tss: 85, statusForma: 'FATIGADO' },
        ];

        const [pt] = mapPmcHistoricoToDataPoints(pontos);

        expect(pt.date).toBeInstanceOf(Date);
        expect(pt.date.getFullYear()).toBe(2026);
        expect(pt.date.getMonth()).toBe(5); // junho (0-based)
        expect(pt.date.getDate()).toBe(17);
        expect(pt.ctl).toBe(52.3);
        expect(pt.atl).toBe(60.1);
        expect(pt.tsb).toBe(-7.8);
        expect(pt.tss).toBe(85);
    });

    it('preenche métricas ausentes com 0 (dia sem dados)', () => {
        const [pt] = mapPmcHistoricoToDataPoints([{ data: '2026-06-18' }]);

        expect(pt.ctl).toBe(0);
        expect(pt.atl).toBe(0);
        expect(pt.tsb).toBe(0);
        expect(pt.tss).toBe(0);
    });

    it('retorna lista vazia para entrada vazia', () => {
        expect(mapPmcHistoricoToDataPoints([])).toEqual([]);
    });
});
