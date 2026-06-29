import { describe, expect, it } from 'vitest';
import { buildPmcDataPoints } from './pmcAdapter';
import type { PmcPontoRaw } from '../../../types/AtletaPerfilCoach';

describe('buildPmcDataPoints', () => {
    it('converte data ISO em Date e mantém métricas 1:1', () => {
        const pontos: PmcPontoRaw[] = [
            { data: '2026-06-17', ctl: 52.3, atl: 60.1, tsb: -7.8, tss: 85 },
        ];

        const [pt] = buildPmcDataPoints(pontos);

        expect(pt.date).toBeInstanceOf(Date);
        expect(pt.date.getFullYear()).toBe(2026);
        expect(pt.date.getMonth()).toBe(5); // junho (0-based)
        expect(pt.date.getDate()).toBe(17);
        expect(pt.ctl).toBe(52.3);
        expect(pt.atl).toBe(60.1);
        expect(pt.tsb).toBe(-7.8);
        expect(pt.tss).toBe(85);
    });

    it('retorna lista vazia para entrada vazia', () => {
        expect(buildPmcDataPoints([])).toEqual([]);
    });
});
