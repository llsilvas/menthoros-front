import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRegistrarCheckin } from './useRegistrarCheckin';
import { CheckinService } from '../api/services/CheckinService';
import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../types/Checkin';

vi.mock('../api/services/CheckinService');

const INPUT: CheckinProntidaoInput = {
    qualidadeSono: 8, humor: 7, doresMusculares: 2, nivelEnergia: 6, estresse: 3,
};

const OUTPUT: CheckinProntidaoOutput = {
    id: 'abc', atletaId: 'atleta-1', data: '2026-07-04',
    qualidadeSono: 8, humor: 7, doresMusculares: 2, nivelEnergia: 6, estresse: 3,
    readinessScore: 0.82, nivelProntidao: 'PRONTO',
};

describe('useRegistrarCheckin', () => {
    beforeEach(() => vi.clearAllMocks());

    it('registra com sucesso e retorna o output', async () => {
        vi.mocked(CheckinService.registrarCheckin).mockResolvedValue(OUTPUT);

        const { result } = renderHook(() => useRegistrarCheckin());
        let retorno: CheckinProntidaoOutput | undefined;
        await act(async () => {
            retorno = await result.current.registrar(INPUT);
        });

        expect(retorno).toEqual(OUTPUT);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error e relança na falha (caller decide o que fazer)', async () => {
        vi.mocked(CheckinService.registrarCheckin).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useRegistrarCheckin());
        await act(async () => {
            await expect(result.current.registrar(INPUT)).rejects.toThrow('boom');
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.loading).toBe(false);
    });
});
