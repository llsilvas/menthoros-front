import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteReadiness } from './useAthleteReadiness';
import { AthleteHomeService } from '../api/services/AthleteHomeService';
import type { AthleteReadiness } from '../types/AthleteHome';

vi.mock('../api/services/AthleteHomeService');

const READINESS_STUB: AthleteReadiness = {
    score: 72,
    classificacao: 'BOM',
    fatores: { tsbProntidao: 8.5, ctl: 52.3, atl: 44.0, ultimoRpe: 7 },
    nota: 'Provisório: sem check-in subjetivo.',
};

describe('useAthleteReadiness', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula readiness no sucesso', async () => {
        vi.mocked(AthleteHomeService.getReadiness).mockResolvedValue(READINESS_STUB);

        const { result } = renderHook(() => useAthleteReadiness());
        await act(async () => {
            await result.current.fetchReadiness();
        });

        expect(result.current.readiness).toEqual(READINESS_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteHomeService.getReadiness).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteReadiness());
        await act(async () => {
            await result.current.fetchReadiness();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.readiness).toBeNull();
        expect(result.current.loading).toBe(false);
    });
});
