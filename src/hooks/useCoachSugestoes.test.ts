import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachSugestoes } from './useCoachSugestoes';
import { SugestaoService } from '../api/services/SugestaoService';
import type { SugestaoCoachOutputDto } from '../types/SugestaoCoach';

vi.mock('../api/services/SugestaoService');

const STUB: SugestaoCoachOutputDto = {
    id: 'uuid-1',
    atletaId: 'a1',
    athleteName: 'Ana Silva',
    tipo: 'RECOVERY',
    status: 'PENDING',
    confidence: 'HIGH',
    summary: 'Revisar carga: reduzir volume.',
    createdAt: '2026-06-19T12:00:00Z',
};

describe('useCoachSugestoes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula sugestoes no sucesso', async () => {
        vi.mocked(SugestaoService.listar).mockResolvedValue([STUB]);

        const { result } = renderHook(() => useCoachSugestoes());
        await act(async () => { await result.current.fetchSugestoes(); });

        expect(result.current.sugestoes).toHaveLength(1);
        expect(result.current.sugestoes[0].athleteName).toBe('Ana Silva');
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('retorna lista vazia quando não há pendentes', async () => {
        vi.mocked(SugestaoService.listar).mockResolvedValue([]);

        const { result } = renderHook(() => useCoachSugestoes());
        await act(async () => { await result.current.fetchSugestoes(); });

        expect(result.current.sugestoes).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(SugestaoService.listar).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachSugestoes());
        await act(async () => { await result.current.fetchSugestoes(); });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.sugestoes).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('mantém loading=true durante a busca e false ao concluir', async () => {
        vi.mocked(SugestaoService.listar).mockResolvedValue([]);

        const { result } = renderHook(() => useCoachSugestoes());
        let pending!: Promise<void>;
        act(() => { pending = result.current.fetchSugestoes(); });
        expect(result.current.loading).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.loading).toBe(false);
    });
});
