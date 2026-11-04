import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReenviarSincronizacao } from './useReenviarSincronizacao';
import * as service from '../api/services/CoachPlanoReviewService';
import { ApiError } from '../api/core/ApiError';

vi.mock('../api/services/CoachPlanoReviewService');

function apiError(status: number, message?: string): ApiError {
    return new ApiError(
        { method: 'POST', url: '/x' },
        { url: '/x', ok: false, status, statusText: '', body: message ? { message } : undefined },
        'erro',
    );
}

describe('useReenviarSincronizacao', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sucesso: devolve a contagem e limpa o erro', async () => {
        vi.mocked(service.CoachPlanoReviewService.reenviarSincronizacao).mockResolvedValue({ resent: 4 });
        const { result } = renderHook(() => useReenviarSincronizacao());

        let resent: number | null = null;
        await act(async () => {
            resent = await result.current.reenviar('plano-1');
        });

        expect(resent).toBe(4);
        expect(result.current.erro).toBeNull();
        expect(result.current.reenviando).toBe(false);
        expect(service.CoachPlanoReviewService.reenviarSincronizacao).toHaveBeenCalledWith('plano-1');
    });

    it('409: mensagem de envio em andamento', async () => {
        vi.mocked(service.CoachPlanoReviewService.reenviarSincronizacao).mockRejectedValue(apiError(409));
        const { result } = renderHook(() => useReenviarSincronizacao());

        let resent: number | null = 0;
        await act(async () => {
            resent = await result.current.reenviar('plano-1');
        });

        expect(resent).toBeNull();
        expect(result.current.erro).toMatch(/Envio em andamento/);
    });

    it('422: usa a mensagem do backend', async () => {
        vi.mocked(service.CoachPlanoReviewService.reenviarSincronizacao)
            .mockRejectedValue(apiError(422, 'O atleta não tem canal de treinos conectado.'));
        const { result } = renderHook(() => useReenviarSincronizacao());

        await act(async () => {
            await result.current.reenviar('plano-1');
        });

        expect(result.current.erro).toBe('O atleta não tem canal de treinos conectado.');
    });

    it('erro genérico: mensagem padrão', async () => {
        vi.mocked(service.CoachPlanoReviewService.reenviarSincronizacao).mockRejectedValue(new Error('rede'));
        const { result } = renderHook(() => useReenviarSincronizacao());

        await act(async () => {
            await result.current.reenviar('plano-1');
        });

        expect(result.current.erro).toBe('Não foi possível reenviar ao relógio. Tente de novo.');
        expect(result.current.reenviando).toBe(false);
    });
});
