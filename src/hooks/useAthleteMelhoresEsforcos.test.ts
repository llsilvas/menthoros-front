import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteMelhoresEsforcos } from './useAthleteMelhoresEsforcos';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteMelhorEsforco } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const MARCAS_STUB: AthleteMelhorEsforco[] = [
    { distanciaLabel: '5k', distanciaMetros: 5000, tempoSegundos: 1796, paceLabel: '5:59/km' },
];

describe('useAthleteMelhoresEsforcos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula marcas e integracaoConectada no sucesso, com a janela default 42d', async () => {
        vi.mocked(AthleteProgressService.getMelhoresEsforcos).mockResolvedValue({
            marcas: MARCAS_STUB,
            integracaoConectada: true,
        });

        const { result } = renderHook(() => useAthleteMelhoresEsforcos());
        await act(async () => {
            await result.current.fetchMelhoresEsforcos();
        });

        expect(AthleteProgressService.getMelhoresEsforcos).toHaveBeenCalledWith('42d');
        expect(result.current.marcas).toEqual(MARCAS_STUB);
        expect(result.current.integracaoConectada).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('repassa a janela escolhida ao serviço', async () => {
        vi.mocked(AthleteProgressService.getMelhoresEsforcos).mockResolvedValue({
            marcas: [], integracaoConectada: true,
        });

        const { result } = renderHook(() => useAthleteMelhoresEsforcos());
        await act(async () => {
            await result.current.fetchMelhoresEsforcos('1y');
        });

        expect(AthleteProgressService.getMelhoresEsforcos).toHaveBeenCalledWith('1y');
    });

    it('integracaoConectada=false não é erro — error permanece null', async () => {
        vi.mocked(AthleteProgressService.getMelhoresEsforcos).mockResolvedValue({
            marcas: [], integracaoConectada: false,
        });

        const { result } = renderHook(() => useAthleteMelhoresEsforcos());
        await act(async () => {
            await result.current.fetchMelhoresEsforcos();
        });

        expect(result.current.integracaoConectada).toBe(false);
        expect(result.current.marcas).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha real (ex: 502 do intervals.icu)', async () => {
        vi.mocked(AthleteProgressService.getMelhoresEsforcos).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteMelhoresEsforcos());
        await act(async () => {
            await result.current.fetchMelhoresEsforcos();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.marcas).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
