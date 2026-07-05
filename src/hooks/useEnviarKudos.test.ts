import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnviarKudos } from './useEnviarKudos';
import { KudosService } from '../api/services/KudosService';
import type { KudosOutput } from '../types/Kudos';

vi.mock('../api/services/KudosService');

const OUTPUT: KudosOutput = {
    id: 'k1', atletaId: 'atleta-1', coachId: 'coach-1', motivo: 'CONSISTENCIA', createdAt: '2026-07-04T12:00:00Z',
};

describe('useEnviarKudos', () => {
    beforeEach(() => vi.clearAllMocks());

    it('envia com sucesso e retorna o output', async () => {
        vi.mocked(KudosService.registrarKudo).mockResolvedValue(OUTPUT);

        const { result } = renderHook(() => useEnviarKudos());
        let retorno: KudosOutput | undefined;
        await act(async () => {
            retorno = await result.current.enviar('atleta-1', { motivo: 'CONSISTENCIA' });
        });

        expect(retorno).toEqual(OUTPUT);
        expect(KudosService.registrarKudo).toHaveBeenCalledWith('atleta-1', { motivo: 'CONSISTENCIA' });
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error e relança na falha (ex.: 409 de duplicata) — caller decide o que fazer', async () => {
        vi.mocked(KudosService.registrarKudo).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useEnviarKudos());
        await act(async () => {
            await expect(result.current.enviar('atleta-1', { motivo: 'CONSISTENCIA' })).rejects.toThrow('boom');
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.loading).toBe(false);
    });
});
