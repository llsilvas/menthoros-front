import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachAthleteZonesService } from '../../../api/services/CoachAthleteZonesService';
import * as zonasHook from '../../../hooks/useAthleteTrainingZones';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { DEBOUNCE_SIMULACAO_MS, useAthleteZoneAnchorsEditor } from './useAthleteZoneAnchorsEditor';

vi.mock('../../../api/services/CoachAthleteZonesService');

const ZONAS: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { fcLimiar: 160, fcLimiarEstimada: true },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 186, estimada: true },
    disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
    zonas: [],
};
const PREVIA = { ...ZONAS, modelo: 'PREVIA' };

const avancar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('useAthleteZoneAnchorsEditor', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.mocked(CoachAthleteZonesService.simular).mockResolvedValue(PREVIA);
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockResolvedValue(PREVIA);
    });
    afterEach(() => vi.useRealTimers());

    const monta = (eixo: 'fc' | 'pace' = 'pace') =>
        renderHook(() => useAthleteZoneAnchorsEditor('a1', ZONAS, eixo));

    it('FC estimada começa com limiar e máxima vazios; sem alteração não salva', () => {
        const { result } = monta('fc');
        expect(result.current.fc.limiar).toBe('');
        expect(result.current.fc.maxima).toBe('');
        expect(result.current.podeSalvar).toBe(false);
    });

    it('ritmo válido dispara uma simulação só após o debounce, com o eixo ativo', async () => {
        const { result } = monta('pace');
        act(() => result.current.setPace((p) => ({ ...p, limiar: '4:50' })));

        await avancar(DEBOUNCE_SIMULACAO_MS - 1);
        expect(CoachAthleteZonesService.simular).not.toHaveBeenCalled();
        await avancar(1);

        expect(CoachAthleteZonesService.simular).toHaveBeenCalledTimes(1);
        const [id, corpo] = vi.mocked(CoachAthleteZonesService.simular).mock.calls[0];
        expect(id).toBe('a1');
        expect(corpo.pace?.limiarSegKm).toBe(290);
        expect(corpo.fc).toBeUndefined();
        expect(result.current.previa?.modelo).toBe('PREVIA');
    });

    it('âncora inválida não simula, esconde a prévia e bloqueia salvar; erro só após o blur', async () => {
        const { result } = monta('pace');
        act(() => result.current.setPace((p) => ({ ...p, limiar: '1:00' })));
        await avancar(DEBOUNCE_SIMULACAO_MS);

        expect(CoachAthleteZonesService.simular).not.toHaveBeenCalled();
        expect(result.current.previa).toBeNull();
        expect(result.current.podeSalvar).toBe(false);
        expect(result.current.errosPace.limiarSegKm).toBeUndefined();

        act(() => result.current.tocar('pace.limiarSegKm'));
        expect(result.current.errosPace.limiarSegKm).toBeDefined();
    });

    it('resposta de simulação ultrapassada é descartada', async () => {
        let resolverVelha!: (z: AthleteTrainingZonesDto) => void;
        vi.mocked(CoachAthleteZonesService.simular)
            .mockImplementationOnce(() => new Promise<AthleteTrainingZonesDto>((r) => (resolverVelha = r)) as never)
            .mockResolvedValueOnce({ ...ZONAS, modelo: 'NOVA' });
        const { result } = monta('pace');

        act(() => result.current.setPace((p) => ({ ...p, limiar: '4:50' })));
        await avancar(DEBOUNCE_SIMULACAO_MS);
        act(() => result.current.setPace((p) => ({ ...p, limiar: '4:40' })));
        await avancar(DEBOUNCE_SIMULACAO_MS);
        await act(async () => resolverVelha({ ...ZONAS, modelo: 'VELHA' }));

        expect(result.current.previa?.modelo).toBe('NOVA');
    });

    it('salvar envia só o eixo alterado e invalida as zonas do atleta', async () => {
        const invalidar = vi.spyOn(zonasHook, 'invalidarZonasDoAtleta');
        const { result } = monta('pace');
        act(() => result.current.setPace((p) => ({ ...p, limiar: '4:50', origem: 'TESTE_CAMPO' })));
        expect(result.current.podeSalvar).toBe(true);

        let ok = false;
        await act(async () => {
            ok = await result.current.salvar();
        });

        expect(ok).toBe(true);
        const corpo = vi.mocked(CoachAthleteZonesService.salvarAncoras).mock.calls[0][1];
        expect(corpo.pace).toMatchObject({ limiarSegKm: 290, origem: 'TESTE_CAMPO' });
        expect(corpo.fc).toBeUndefined();
        expect(invalidar).toHaveBeenCalledWith('a1');
    });

    it('erro no PUT devolve false, guarda a mensagem e não invalida', async () => {
        const invalidar = vi.spyOn(zonasHook, 'invalidarZonasDoAtleta');
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockRejectedValue(new Error('boom'));
        const { result } = monta('pace');
        act(() => result.current.setPace((p) => ({ ...p, limiar: '4:50' })));

        let ok = true;
        await act(async () => {
            ok = await result.current.salvar();
        });

        expect(ok).toBe(false);
        expect(result.current.error).toBe('boom');
        expect(invalidar).not.toHaveBeenCalled();
    });
});
