import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAttentionQueue } from './useAttentionQueue';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachAttentionItem } from '../types/Coach';

vi.mock('../api/services/CoachDashboardService');

const ITEM_STUB: CoachAttentionItem = {
    atletaId: 'a1',
    athleteName: 'Ana Silva',
    severity: 'CRITICA',
    priorityScore: 350,
    primaryReason: 'FADIGA',
    suggestedAction: 'Revisar carga: reduzir volume/intensidade.',
    generatedAt: '2026-06-19T12:00:00Z',
    evidence: [{ label: 'TSB', value: '-40.0 (Fadiga excessiva)' }],
    explanation: {
        rationale: 'TSB em -40.0 situa-se na zona FADIGA_EXCESSIVA.',
        sourceRules: ['CoachAttentionSignalEvaluator.avaliarFadiga'],
        confidence: 'HIGH',
    },
};

describe('useAttentionQueue', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula queue no sucesso', async () => {
        vi.mocked(CoachDashboardService.getAttentionQueue).mockResolvedValue([ITEM_STUB]);

        const { result } = renderHook(() => useAttentionQueue());
        await act(async () => { await result.current.fetchQueue(); });

        expect(result.current.queue).toHaveLength(1);
        expect(result.current.queue[0].athleteName).toBe('Ana Silva');
        expect(result.current.queue[0].explanation?.rationale).toContain('FADIGA_EXCESSIVA');
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('retorna lista vazia quando fila está limpa', async () => {
        vi.mocked(CoachDashboardService.getAttentionQueue).mockResolvedValue([]);

        const { result } = renderHook(() => useAttentionQueue());
        await act(async () => { await result.current.fetchQueue(); });

        expect(result.current.queue).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(CoachDashboardService.getAttentionQueue).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAttentionQueue());
        await act(async () => { await result.current.fetchQueue(); });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.queue).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('mantém loading=true durante a busca e false ao concluir', async () => {
        vi.mocked(CoachDashboardService.getAttentionQueue).mockResolvedValue([]);

        const { result } = renderHook(() => useAttentionQueue());
        let pending!: Promise<void>;
        act(() => { pending = result.current.fetchQueue(); });
        expect(result.current.loading).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.loading).toBe(false);
    });
});
