import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthletePmc } from './useAthletePmc';
import { AtletaProgressService } from '../api/services/AtletaProgressService';
import type { PmcHistoricoPonto } from '../types/MetricasPmc';

vi.mock('../api/services/AtletaProgressService');

const SERIE: PmcHistoricoPonto[] = [
    { data: '2026-06-17', ctl: 52, atl: 60, tsb: -8, tss: 85, statusForma: 'FATIGADO' },
    { data: '2026-06-18', ctl: 53, atl: 58, tsb: -5, tss: 0, statusForma: 'NEUTRO' },
];

describe('useAthletePmc', () => {
    beforeEach(() => vi.clearAllMocks());

    it('mapeia a série PMC para PMCDataPoint no sucesso', async () => {
        vi.mocked(AtletaProgressService.getHistoricoPmc).mockResolvedValue(SERIE);

        const { result } = renderHook(() => useAthletePmc('uuid-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0].date).toBeInstanceOf(Date);
        expect(result.current.data[0].tsb).toBe(-8);
        expect(result.current.error).toBeNull();
    });

    it('usa exclusivamente o endpoint coach-scoped por atletaId (nunca /me/*)', async () => {
        vi.mocked(AtletaProgressService.getHistoricoPmc).mockResolvedValue(SERIE);

        renderHook(() => useAthletePmc('uuid-1'));
        await waitFor(() =>
            expect(AtletaProgressService.getHistoricoPmc).toHaveBeenCalledWith('uuid-1', undefined, undefined),
        );
    });

    it('não dispara busca quando atletaId é undefined (lazy)', () => {
        const { result } = renderHook(() => useAthletePmc(undefined));

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(AtletaProgressService.getHistoricoPmc).not.toHaveBeenCalled();
    });

    it('expõe erro e zera os dados em falha', async () => {
        vi.mocked(AtletaProgressService.getHistoricoPmc).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthletePmc('uuid-1'));
        await waitFor(() => expect(result.current.error).not.toBeNull());

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBeInstanceOf(Error);
    });

    it('resulta em série vazia quando o atleta não tem PMC', async () => {
        vi.mocked(AtletaProgressService.getHistoricoPmc).mockResolvedValue([]);

        const { result } = renderHook(() => useAthletePmc('uuid-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('ignora resposta obsoleta ao trocar de atleta durante a busca', async () => {
        // Promessas controladas: a do atleta 1 resolve DEPOIS da troca para o atleta 2.
        let resolve1!: (v: PmcHistoricoPonto[]) => void;
        let resolve2!: (v: PmcHistoricoPonto[]) => void;
        const serie1: PmcHistoricoPonto[] = [{ data: '2026-01-01', ctl: 10, atl: 10, tsb: 0, tss: 0 }];
        const serie2: PmcHistoricoPonto[] = [
            { data: '2026-02-01', ctl: 20, atl: 20, tsb: 0, tss: 0 },
            { data: '2026-02-02', ctl: 21, atl: 19, tsb: 2, tss: 0 },
        ];
        vi.mocked(AtletaProgressService.getHistoricoPmc)
            .mockImplementationOnce(() => new Promise((r) => { resolve1 = r; }) as never)
            .mockImplementationOnce(() => new Promise((r) => { resolve2 = r; }) as never);

        const { result, rerender } = renderHook(({ id }) => useAthletePmc(id), {
            initialProps: { id: 'uuid-1' },
        });
        rerender({ id: 'uuid-2' });

        // Resolve a busca obsoleta (atleta 1) por último — deve ser descartada.
        await act(async () => {
            resolve2(serie2);
            resolve1(serie1);
        });

        await waitFor(() => expect(result.current.data).toHaveLength(2));
        expect(result.current.data[0].ctl).toBe(20); // dados do atleta 2, não do 1
    });
});
