import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthletePlan } from './useAthletePlan';
import { ApiError } from '../api/core/ApiError';
import type { ApiRequestOptions } from '../api/core/ApiRequestOptions';
import type { ApiResult } from '../api/core/ApiResult';
import { PlanoSemanalService } from '../api/services/PlanoSemanalService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { PlanoSemanal } from '../types/PlanoSemanal';
import type { UsuarioMeOutputDto } from '../types/Usuario';

vi.mock('../api/services/PlanoSemanalService');
vi.mock('../api/services/UsuarioService');

const ME: UsuarioMeOutputDto = { id: 'u1', nome: 'Carlos', email: 'c@x.com', role: 'ATLETA', lgpdConsentGranted: true, atletaId: 'a1' };

const PLANO: PlanoSemanal = {
    id: 'p1',
    atletaId: 'a1',
    semanaInicio: '2026-06-29',
    semanaFim: '2026-07-05',
    volumePlanejadoKm: 40,
    volumeRealizadoKm: 20,
    volumeAlvoKm: 45,
    status: 'ATIVO',
};

function apiError(status: number): ApiError {
    return new ApiError(
        { method: 'GET', url: '/x' } as ApiRequestOptions,
        { url: '/x', ok: false, status, statusText: '', body: null } as ApiResult,
        'erro',
    );
}

describe('useAthletePlan', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resolve atletaId e popula o plano da semana no sucesso', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(ME);
        // contrato real: objeto único (o service tipa como lista, normalizamos no adapter)
        vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockResolvedValue(
            PLANO as unknown as PlanoSemanal[],
        );

        const { result } = renderHook(() => useAthletePlan());
        await act(async () => {
            await result.current.fetchPlano();
        });

        expect(result.current.plano?.id).toBe('p1');
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('plano = null (sem erro) quando usuário não tem atletaId vinculado', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...ME, atletaId: undefined });

        const { result } = renderHook(() => useAthletePlan());
        await act(async () => {
            await result.current.fetchPlano();
        });

        expect(result.current.plano).toBeNull();
        expect(result.current.error).toBeNull();
        expect(PlanoSemanalService.listarPlanosPorAtleta).not.toHaveBeenCalled();
    });

    it('404 (sem plano aprovado) vira estado vazio, não erro', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(ME);
        vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockRejectedValue(apiError(404));

        const { result } = renderHook(() => useAthletePlan());
        await act(async () => {
            await result.current.fetchPlano();
        });

        expect(result.current.plano).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('erro não-404 popula error', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(ME);
        vi.mocked(PlanoSemanalService.listarPlanosPorAtleta).mockRejectedValue(apiError(500));

        const { result } = renderHook(() => useAthletePlan());
        await act(async () => {
            await result.current.fetchPlano();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.plano).toBeNull();
    });
});
