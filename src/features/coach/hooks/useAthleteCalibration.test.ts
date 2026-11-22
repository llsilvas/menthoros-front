import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteCalibration } from './useAthleteCalibration';
import { OnboardingService } from '../../../api/services/OnboardingService';
import type { CalibrationStatus } from '../../../types/Calibracao';

vi.mock('../../../api/services/OnboardingService');

const STATUS: CalibrationStatus = { phase: 'CALIBRATION', stage: 'CALIBRATION', weekNumber: 2, confidenceScore: 40 };

describe('useAthleteCalibration', () => {
    beforeEach(() => vi.clearAllMocks());

    it('200 expõe o status do atleta selecionado', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(STATUS);
        const { result } = renderHook(() => useAthleteCalibration('a1'));

        await waitFor(() => expect(result.current).toEqual(STATUS));
        expect(OnboardingService.obterStatusCalibracao).toHaveBeenCalledWith('a1');
    });

    it('204 = fora de calibração', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockResolvedValue(undefined);
        const { result } = renderHook(() => useAthleteCalibration('a1'));

        await waitFor(() => expect(OnboardingService.obterStatusCalibracao).toHaveBeenCalled());
        expect(result.current).toBeNull();
    });

    it('erro trata como fora de calibração: o backend responde 422 se for o caso', async () => {
        vi.mocked(OnboardingService.obterStatusCalibracao).mockRejectedValue(new Error('falhou'));
        const { result } = renderHook(() => useAthleteCalibration('a1'));

        await waitFor(() => expect(OnboardingService.obterStatusCalibracao).toHaveBeenCalled());
        expect(result.current).toBeNull();
    });

    it('sem atleta não consulta', () => {
        const { result } = renderHook(() => useAthleteCalibration(undefined));

        expect(result.current).toBeNull();
        expect(OnboardingService.obterStatusCalibracao).not.toHaveBeenCalled();
    });

    it('resposta do atleta anterior chegando depois da troca é descartada', async () => {
        let resolverA: (s: CalibrationStatus) => void = () => {};
        vi.mocked(OnboardingService.obterStatusCalibracao)
            .mockImplementationOnce(() => new Promise((r) => { resolverA = r; }) as never)
            .mockResolvedValueOnce(undefined);
        const { result, rerender } = renderHook(({ id }) => useAthleteCalibration(id), { initialProps: { id: 'a1' } });

        rerender({ id: 'a2' });
        await waitFor(() => expect(OnboardingService.obterStatusCalibracao).toHaveBeenCalledWith('a2'));
        resolverA(STATUS);
        await new Promise((r) => setTimeout(r, 0));

        expect(result.current).toBeNull();
    });
});
