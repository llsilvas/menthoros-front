import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteProvas } from './useAthleteProvas';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { Prova } from '../types/Prova';

vi.mock('../api/services/AthleteProgressService');

const PROVAS_STUB: Prova[] = [
    { id: '1', nomeProva: 'Maratona de SP', dataProva: '2026-08-18', tipoProva: 'MARATONA', distancia: 'KM_42', diasFaltando: 45 },
];

describe('useAthleteProvas', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula provas no sucesso', async () => {
        vi.mocked(AthleteProgressService.getProvas).mockResolvedValue(PROVAS_STUB);

        const { result } = renderHook(() => useAthleteProvas());
        await act(async () => {
            await result.current.fetchProvas();
        });

        expect(result.current.provas).toEqual(PROVAS_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula lista vazia sem erro quando o atleta ainda não tem provas', async () => {
        vi.mocked(AthleteProgressService.getProvas).mockResolvedValue([]);

        const { result } = renderHook(() => useAthleteProvas());
        await act(async () => {
            await result.current.fetchProvas();
        });

        expect(result.current.provas).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getProvas).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteProvas());
        await act(async () => {
            await result.current.fetchProvas();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.provas).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
