import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';
import { useTreinoRealizadoDetalhe } from './useTreinoRealizadoDetalhe';

vi.mock('../../../api/services/TreinoService');

const DETALHE: TreinoRealizadoDetalhe = { id: 'tr-1', distanciaKm: 15 };

describe('useTreinoRealizadoDetalhe', () => {
    beforeEach(() => vi.clearAllMocks());

    it('carrega o detalhe ao montar', async () => {
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue(DETALHE);
        const { result } = renderHook(() => useTreinoRealizadoDetalhe('tr-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual(DETALHE);
        expect(result.current.error).toBeNull();
        expect(TreinoService.obterRealizado).toHaveBeenCalledWith('tr-1');
    });

    it('falha expõe error; refetch tenta de novo', async () => {
        vi.mocked(TreinoService.obterRealizado).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useTreinoRealizadoDetalhe('tr-1'));
        await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
        vi.mocked(TreinoService.obterRealizado).mockResolvedValue(DETALHE);

        act(() => result.current.refetch());

        await waitFor(() => expect(result.current.data).toEqual(DETALHE));
        expect(result.current.error).toBeNull();
    });

    it('sem id não chama o backend', () => {
        renderHook(() => useTreinoRealizadoDetalhe(undefined));
        expect(TreinoService.obterRealizado).not.toHaveBeenCalled();
    });
});
