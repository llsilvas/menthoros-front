import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteProfile } from './useAthleteProfile';
import { CoachAthleteProfileService } from '../api/services/CoachAthleteProfileService';
import { ApiError } from '../api/core/ApiError';
import type { ApiRequestOptions } from '../api/core/ApiRequestOptions';
import type { ApiResult } from '../api/core/ApiResult';
import type { AtletaPerfilCoachDto } from '../types/AtletaPerfilCoach';

vi.mock('../api/services/CoachAthleteProfileService');

const STUB: AtletaPerfilCoachDto = {
    atletaId: 'uuid-1',
    nomeAtleta: 'Ana Silva',
    objetivo: 'Correr maratona',
    proximaProva: null,
    nivelExperiencia: 'INTERMEDIARIO',
    pmc: [],
    aderenciaSemanal: [],
    planoVigente: null,
    sinaisRecentes: [],
    sugestoesRecentes: [],
    recordes: [],
    melhoresEsforcos: [],
    melhoresEsforcosIntegracaoConectada: true,
    geradoEm: '2026-06-20T12:00:00Z',
    avisos: null,
};

function makeApiError(status: number): ApiError {
    const req: ApiRequestOptions = { method: 'GET', url: '/api/v1/coach/atletas/uuid-1/perfil' };
    const res: ApiResult = { url: '/api/v1/coach/atletas/uuid-1/perfil', ok: false, status, statusText: 'Error', body: null };
    return new ApiError(req, res, `HTTP ${status}`);
}

describe('useAthleteProfile', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula profile no sucesso e isLoading false', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockResolvedValue(STUB);

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});

        expect(result.current.profile).toEqual(STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('reflete dados de cobrança do perfil sem invalidação extra (fetch-on-mount, critério de aceite 5)', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockResolvedValue({
            ...STUB,
            nextDueDate: '2026-08-15',
            billingStatus: 'DUE_SOON',
        });

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});

        expect(result.current.profile?.nextDueDate).toBe('2026-08-15');
        expect(result.current.profile?.billingStatus).toBe('DUE_SOON');
    });

    it('não dispara fetch quando atletaId é undefined', () => {
        const { result } = renderHook(() => useAthleteProfile(undefined));

        expect(result.current.profile).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
        expect(vi.mocked(CoachAthleteProfileService.getProfile)).not.toHaveBeenCalled();
    });

    it('não dispara fetch quando atletaId é string vazia', () => {
        const { result } = renderHook(() => useAthleteProfile(''));

        expect(result.current.profile).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
        expect(vi.mocked(CoachAthleteProfileService.getProfile)).not.toHaveBeenCalled();
    });

    it('errorKind é "timeout" em HTTP 504', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockRejectedValue(makeApiError(504));

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});

        expect(result.current.errorKind).toBe('timeout');
        expect(result.current.error?.message).toContain('timeout');
        expect(result.current.profile).toBeNull();
    });

    it('errorKind é "timeout" em HTTP 408', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockRejectedValue(makeApiError(408));

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});

        expect(result.current.errorKind).toBe('timeout');
        expect(result.current.error?.message).toContain('timeout');
    });

    it('errorKind é "server_error" em falha genérica de rede', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockRejectedValue(new Error('network'));

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});

        expect(result.current.errorKind).toBe('server_error');
        expect(result.current.error).toBeInstanceOf(Error);
    });

    it('refetch atualiza profile ao chamar fetchProfile manualmente', async () => {
        const perfil2: AtletaPerfilCoachDto = { ...STUB, nomeAtleta: 'Carlos' };
        vi.mocked(CoachAthleteProfileService.getProfile)
            .mockResolvedValueOnce(STUB)
            .mockResolvedValueOnce(perfil2);

        const { result } = renderHook(() => useAthleteProfile('uuid-1'));
        await act(async () => {});
        expect(result.current.profile?.nomeAtleta).toBe('Ana Silva');

        await act(async () => { await result.current.fetchProfile(); });
        expect(result.current.profile?.nomeAtleta).toBe('Carlos');
    });

    it('dispara nova busca quando atletaId muda', async () => {
        vi.mocked(CoachAthleteProfileService.getProfile).mockResolvedValue(STUB);

        const { rerender } = renderHook(({ id }) => useAthleteProfile(id), {
            initialProps: { id: 'uuid-1' },
        });
        await act(async () => {});
        expect(vi.mocked(CoachAthleteProfileService.getProfile)).toHaveBeenCalledWith('uuid-1');

        rerender({ id: 'uuid-2' });
        await act(async () => {});
        expect(vi.mocked(CoachAthleteProfileService.getProfile)).toHaveBeenCalledWith('uuid-2');
    });

    describe('respostas obsoletas (troca de atleta)', () => {
        const PERFIL_A: AtletaPerfilCoachDto = { ...STUB, atletaId: 'a', nomeAtleta: 'Atleta A' };
        const PERFIL_B: AtletaPerfilCoachDto = { ...STUB, atletaId: 'b', nomeAtleta: 'Atleta B' };

        function deferred<T>() {
            let resolve!: (value: T) => void;
            let reject!: (reason: unknown) => void;
            const promise = new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        }

        it('resposta de A chegando depois da de B não sobrescreve B', async () => {
            const a = deferred<AtletaPerfilCoachDto>();
            const b = deferred<AtletaPerfilCoachDto>();
            vi.mocked(CoachAthleteProfileService.getProfile)
                .mockReturnValueOnce(a.promise as never)
                .mockReturnValueOnce(b.promise as never);

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' },
            });
            rerender({ id: 'b' });

            await act(async () => b.resolve(PERFIL_B));
            await act(async () => a.resolve(PERFIL_A));

            expect(result.current.profile?.nomeAtleta).toBe('Atleta B');
        });

        it('erro tardio de A não apaga o perfil nem seta erro em B', async () => {
            const a = deferred<AtletaPerfilCoachDto>();
            vi.mocked(CoachAthleteProfileService.getProfile)
                .mockReturnValueOnce(a.promise as never)
                .mockResolvedValueOnce(PERFIL_B);

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' },
            });
            rerender({ id: 'b' });
            await act(async () => {});
            await act(async () => a.reject(new Error('network')));

            expect(result.current.profile?.nomeAtleta).toBe('Atleta B');
            expect(result.current.error).toBeNull();
            expect(result.current.errorKind).toBeNull();
        });

        it('fim da busca de A não desliga o carregamento de B', async () => {
            const a = deferred<AtletaPerfilCoachDto>();
            const b = deferred<AtletaPerfilCoachDto>();
            vi.mocked(CoachAthleteProfileService.getProfile)
                .mockReturnValueOnce(a.promise as never)
                .mockReturnValueOnce(b.promise as never);

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' },
            });
            rerender({ id: 'b' });
            await act(async () => a.resolve(PERFIL_A));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.profile).toBeNull();
        });

        it('fetchProfile capturado em A, chamado depois da troca, não sobrescreve B', async () => {
            vi.mocked(CoachAthleteProfileService.getProfile)
                .mockResolvedValueOnce(PERFIL_A)
                .mockResolvedValueOnce(PERFIL_B)
                .mockResolvedValue(PERFIL_A);

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' },
            });
            await act(async () => {});
            const fetchDeA = result.current.fetchProfile;

            rerender({ id: 'b' });
            await act(async () => {});
            await act(async () => { await fetchDeA(); });

            expect(result.current.profile?.nomeAtleta).toBe('Atleta B');
        });

        it('ao trocar de atleta, o perfil anterior deixa de ser exposto na hora', async () => {
            const b = deferred<AtletaPerfilCoachDto>();
            vi.mocked(CoachAthleteProfileService.getProfile)
                .mockResolvedValueOnce(PERFIL_A)
                .mockReturnValueOnce(b.promise as never);

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' as string | undefined },
            });
            await act(async () => {});
            expect(result.current.profile?.nomeAtleta).toBe('Atleta A');

            rerender({ id: 'b' });
            expect(result.current.profile).toBeNull();
            expect(result.current.isLoading).toBe(true);

            rerender({ id: undefined });
            expect(result.current.profile).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });

        it('ao trocar de atleta, o erro do anterior deixa de ser exposto', async () => {
            vi.mocked(CoachAthleteProfileService.getProfile).mockRejectedValueOnce(new Error('network'));

            const { result, rerender } = renderHook(({ id }) => useAthleteProfile(id), {
                initialProps: { id: 'a' as string | undefined },
            });
            await act(async () => {});
            expect(result.current.errorKind).toBe('server_error');

            rerender({ id: undefined });
            expect(result.current.error).toBeNull();
            expect(result.current.errorKind).toBeNull();
        });
    });
});
