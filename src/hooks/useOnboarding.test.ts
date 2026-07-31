import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboarding } from './useOnboarding';
import { OnboardingService } from '../api/services/OnboardingService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { AthleteOnboardingProfile } from '../types/Onboarding';

vi.mock('../api/services/OnboardingService');
vi.mock('../api/services/UsuarioService');

const USUARIO_BASE = { id: 'usuario-1', nome: 'Atleta Teste', email: 'atleta@teste.com', role: 'ATLETA' as const, lgpdConsentGranted: true, };

function perfil(overrides: Partial<AthleteOnboardingProfile> = {}): AthleteOnboardingProfile {
    return {
        id: 'perfil-1',
        status: 'RASCUNHO',
        preenchidoPorCoach: false,
        criadoEm: '2026-07-01T10:00:00Z',
        atualizadoEm: '2026-07-01T10:00:00Z',
        objetivo: 'Correr uma maratona',
        ...overrides,
    };
}

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...USUARIO_BASE, atletaId: 'atleta-1' });
    });

    describe('fetchDraft', () => {
        it('resolve atletaId e popula o draft quando existe um rascunho salvo (retomar CA8)', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(perfil());

            const { result } = renderHook(() => useOnboarding());
            await act(async () => {
                await result.current.fetchDraft();
            });

            expect(result.current.atletaId).toBe('atleta-1');
            expect(result.current.draft.objetivo).toBe('Correr uma maratona');
            expect(result.current.profile?.status).toBe('RASCUNHO');
            expect(result.current.loading).toBe(false);
        });

        it('mantém draft vazio quando não há rascunho salvo (204)', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(undefined);

            const { result } = renderHook(() => useOnboarding());
            await act(async () => {
                await result.current.fetchDraft();
            });

            expect(result.current.draft).toEqual({});
            expect(result.current.profile).toBeNull();
        });

        it('popula error quando o usuário não tem atletaId vinculado', async () => {
            vi.mocked(UsuarioService.getMe).mockResolvedValue(USUARIO_BASE);

            const { result } = renderHook(() => useOnboarding());
            await act(async () => {
                await result.current.fetchDraft();
            });

            expect(result.current.fetchError).toBeInstanceOf(Error);
            expect(OnboardingService.buscarRascunho).not.toHaveBeenCalled();
        });

        it('popula error na falha de rede', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockRejectedValue(new Error('boom'));

            const { result } = renderHook(() => useOnboarding());
            await act(async () => {
                await result.current.fetchDraft();
            });

            expect(result.current.fetchError).toBeInstanceOf(Error);
        });
    });

    describe('fetchDraft com atletaIdParam (coach-como-proxy)', () => {
        it('usa o atletaId injetado direto, sem chamar getMe()', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(perfil());

            const { result } = renderHook(() => useOnboarding('atleta-injetado'));
            await act(async () => {
                await result.current.fetchDraft();
            });

            expect(result.current.atletaId).toBe('atleta-injetado');
            expect(UsuarioService.getMe).not.toHaveBeenCalled();
            expect(OnboardingService.buscarRascunho).toHaveBeenCalledWith('atleta-injetado');
        });

        it('saveDraft usa o atletaId injetado', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(undefined);
            vi.mocked(OnboardingService.salvarRascunho).mockResolvedValue(perfil());

            const { result } = renderHook(() => useOnboarding('atleta-injetado'));
            await act(async () => { await result.current.fetchDraft(); });
            act(() => { result.current.updateDraft({ objetivo: 'Objetivo preenchido pelo coach' }); });
            await act(async () => { await result.current.saveDraft(); });

            expect(OnboardingService.salvarRascunho).toHaveBeenCalledWith('atleta-injetado', { objetivo: 'Objetivo preenchido pelo coach' });
        });
    });

    describe('updateDraft', () => {
        it('faz merge do patch no draft existente', async () => {
            const { result } = renderHook(() => useOnboarding());

            act(() => {
                result.current.updateDraft({ objetivo: 'Correr 10km' });
            });
            act(() => {
                result.current.updateDraft({ nivelExperiencia: 'INTERMEDIARIO' });
            });

            expect(result.current.draft).toEqual({ objetivo: 'Correr 10km', nivelExperiencia: 'INTERMEDIARIO' });
        });
    });

    describe('saveDraft', () => {
        it('salva o draft atual e atualiza profile', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(undefined);
            vi.mocked(OnboardingService.salvarRascunho).mockResolvedValue(perfil({ status: 'RASCUNHO' }));

            const { result } = renderHook(() => useOnboarding());
            await act(async () => { await result.current.fetchDraft(); });
            act(() => { result.current.updateDraft({ objetivo: 'Correr uma maratona' }); });
            await act(async () => { await result.current.saveDraft(); });

            expect(OnboardingService.salvarRascunho).toHaveBeenCalledWith('atleta-1', { objetivo: 'Correr uma maratona' });
            expect(result.current.profile?.status).toBe('RASCUNHO');
        });

        it('lança erro quando o atletaId ainda não foi resolvido', async () => {
            const { result } = renderHook(() => useOnboarding());

            await expect(result.current.saveDraft()).rejects.toThrow('Atleta não resolvido');
        });
    });

    describe('concluir', () => {
        it('chama concluirOnboarding com o atletaId resolvido', async () => {
            vi.mocked(OnboardingService.buscarRascunho).mockResolvedValue(undefined);
            vi.mocked(OnboardingService.concluirOnboarding).mockResolvedValue({ status: 'COMPLETO' });

            const { result } = renderHook(() => useOnboarding());
            await act(async () => { await result.current.fetchDraft(); });
            await act(async () => {
                await result.current.concluir({ dataProva: '2026-10-12', tipoProva: 'CORRIDA_RUA', distancia: 'KM_21' });
            });

            expect(OnboardingService.concluirOnboarding).toHaveBeenCalledWith('atleta-1', {
                dataProva: '2026-10-12', tipoProva: 'CORRIDA_RUA', distancia: 'KM_21',
            });
        });
    });
});
