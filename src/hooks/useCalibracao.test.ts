import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalibracao } from './useCalibracao';
import { OnboardingService } from '../api/services/OnboardingService';
import { UsuarioService } from '../api/services/UsuarioService';
import type { CalibrationStatus } from '../types/Calibracao';

vi.mock('../api/services/OnboardingService');
vi.mock('../api/services/UsuarioService');

const USUARIO_BASE = { id: 'usuario-1', nome: 'Atleta Teste', email: 'atleta@teste.com', role: 'ATLETA' as const, lgpdConsentGranted: true, };

const STATUS: CalibrationStatus = { phase: 'CALIBRATION', stage: 'CALIBRATION', weekNumber: 2, confidenceScore: 40 };

/**
 * jsdom neste projeto não expõe `window.localStorage` de forma confiável (falha mesmo em teste
 * isolado, alheio a este hook) — stub em memória via `vi.stubGlobal` em vez de depender do global
 * do ambiente.
 */
function createLocalStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { store = {}; },
    };
}

describe('useCalibracao', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('localStorage', createLocalStorageMock());
        vi.mocked(UsuarioService.getMe).mockResolvedValue({ ...USUARIO_BASE, atletaId: 'atleta-1' });
    });

    it('popula status quando o atleta está em calibração', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(STATUS);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.status).toEqual(STATUS);
        expect(result.current.justExited).toBe(false);
    });

    it('mantém status nulo quando o atleta não está em calibração (204)', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(undefined);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.status).toBeNull();
        expect(result.current.justExited).toBe(false);
    });

    it('detecta "acabou de sair" quando estava em calibração numa visita anterior e agora não está mais', async () => {
        localStorage.setItem('menthoros:onboarding:emCalibracao', 'true');
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(undefined);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.justExited).toBe(true);
        expect(localStorage.getItem('menthoros:onboarding:emCalibracao')).toBeNull();
    });

    it('não marca "acabou de sair" quando o atleta nunca esteve em calibração', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(undefined);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.justExited).toBe(false);
    });

    it('dismissJustExited limpa o flag', async () => {
        localStorage.setItem('menthoros:onboarding:emCalibracao', 'true');
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(undefined);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });
        expect(result.current.justExited).toBe(true);

        act(() => { result.current.dismissJustExited(); });

        expect(result.current.justExited).toBe(false);
    });

    it('popula error na falha de rede', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.error).toBeInstanceOf(Error);
    });

    it('trata usuário sem atletaId vinculado como "sem calibração", sem erro', async () => {
        vi.mocked(UsuarioService.getMe).mockResolvedValue(USUARIO_BASE);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        expect(result.current.status).toBeNull();
        expect(result.current.error).toBeNull();
        expect(OnboardingService.obterStatusCalibracao).not.toHaveBeenCalled();
    });

    it('mantém o status já obtido da API mesmo quando localStorage lança (correção QA 2026-07-22)', async () => {
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('storage bloqueado'); },
            setItem: () => { throw new Error('storage bloqueado'); },
            removeItem: () => { throw new Error('storage bloqueado'); },
        });
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(STATUS);

        const { result } = renderHook(() => useCalibracao());
        await act(async () => { await result.current.fetchStatus(); });

        // Antes da correção, a exceção de localStorage era capturada pelo try/catch externo e
        // mascarava um status já obtido com sucesso como erro genérico de rede.
        expect(result.current.status).toEqual(STATUS);
        expect(result.current.error).toBeNull();
    });
});
