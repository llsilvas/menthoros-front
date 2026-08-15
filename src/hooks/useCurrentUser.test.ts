import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from './useCurrentUser';
import { UsuarioService } from '../api/services/UsuarioService';
import type { UsuarioMeOutputDto } from '../types/Usuario';

vi.mock('../api/services/UsuarioService');

const ME_STUB: UsuarioMeOutputDto = {
    id: 'u1',
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    role: 'TECNICO', lgpdConsentGranted: true, onboardingConcluido: true, lgpdCurrentPolicyVersion: '2026-06-30', lgpdCurrentTermsVersion: '2026-06-30',
    assessoria: { id: 't1', nome: 'Corridas Serra', dominio: 'corridasserra' },
};

describe('useCurrentUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('mapeia nome → coach.name e assessoria → tenant', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(ME_STUB);

        const { result } = renderHook(() => useCurrentUser());
        await act(async () => { await result.current.fetchCurrentUser(); });

        expect(result.current.coach.id).toBe('u1');
        expect(result.current.coach.name).toBe('João Silva');
        expect(result.current.tenant.id).toBe('t1');
        expect(result.current.tenant.name).toBe('Corridas Serra');
        expect(result.current.tenant.athleteCount).toBe(0);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('usa fallback quando assessoria está ausente', async () => {
        const semAssessoria: UsuarioMeOutputDto = { ...ME_STUB, assessoria: undefined };
        vi.mocked(UsuarioService.getMe).mockResolvedValue(semAssessoria);

        const { result } = renderHook(() => useCurrentUser());
        await act(async () => { await result.current.fetchCurrentUser(); });

        expect(result.current.tenant.id).toBe('');
        expect(result.current.tenant.name).toBe('');
        expect(result.current.error).toBeNull();
    });

    it('popula error e mantém fallbacks na falha', async () => {
        vi.mocked(UsuarioService.getMe).mockRejectedValue(new Error('network error'));

        const { result } = renderHook(() => useCurrentUser());
        await act(async () => { await result.current.fetchCurrentUser(); });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.coach.name).toBe('');
        expect(result.current.tenant.name).toBe('');
        expect(result.current.loading).toBe(false);
    });

    it('mantém loading=true durante a busca e false ao concluir', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(ME_STUB);

        const { result } = renderHook(() => useCurrentUser());
        let pending!: Promise<void>;
        act(() => { pending = result.current.fetchCurrentUser(); });
        expect(result.current.loading).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.loading).toBe(false);
    });
});
