import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKudosRecentes } from './useKudosRecentes';
import { KudosService } from '../api/services/KudosService';
import type { KudosRecente } from '../types/Kudos';

vi.mock('../api/services/KudosService');

const KUDOS: KudosRecente[] = [
    { id: 'k1', motivo: 'CONSISTENCIA', createdAt: '2026-07-04T12:00:00Z' },
];

describe('useKudosRecentes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('busca e retorna os kudos recebidos', async () => {
        vi.mocked(KudosService.buscarRecentes).mockResolvedValue(KUDOS);

        const { result } = renderHook(() => useKudosRecentes());
        await act(async () => {
            await result.current.fetchKudos();
        });

        expect(result.current.kudos).toEqual(KUDOS);
        expect(result.current.error).toBeNull();
    });

    it('sem kudos retorna lista vazia (não erro)', async () => {
        vi.mocked(KudosService.buscarRecentes).mockResolvedValue([]);

        const { result } = renderHook(() => useKudosRecentes());
        await act(async () => {
            await result.current.fetchKudos();
        });

        expect(result.current.kudos).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha, sem quebrar', async () => {
        vi.mocked(KudosService.buscarRecentes).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useKudosRecentes());
        await act(async () => {
            await result.current.fetchKudos();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.kudos).toEqual([]);
    });
});
