import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteRecordes } from './useAthleteRecordes';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteRecord } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const RECORDES_STUB: AthleteRecord[] = [
    { distancia: '10k', tempoSegundos: 2730, data: '2026-05-08', treinoRealizadoId: 'abc' },
];

describe('useAthleteRecordes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula recordes no sucesso', async () => {
        vi.mocked(AthleteProgressService.getRecordes).mockResolvedValue(RECORDES_STUB);

        const { result } = renderHook(() => useAthleteRecordes());
        await act(async () => {
            await result.current.fetchRecordes();
        });

        expect(result.current.recordes).toEqual(RECORDES_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula lista vazia sem erro quando o atleta ainda não tem PRs', async () => {
        vi.mocked(AthleteProgressService.getRecordes).mockResolvedValue([]);

        const { result } = renderHook(() => useAthleteRecordes());
        await act(async () => {
            await result.current.fetchRecordes();
        });

        expect(result.current.recordes).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getRecordes).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteRecordes());
        await act(async () => {
            await result.current.fetchRecordes();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.recordes).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
