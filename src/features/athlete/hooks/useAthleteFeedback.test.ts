import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteFeedback } from './useAthleteFeedback';
import { AthleteFeedbackService } from '../../../api/services/AthleteFeedbackService';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

vi.mock('../../../api/services/AthleteFeedbackService');

const REALIZADO_STUB = { id: 'r1' } as TreinoRealizadoDto;

describe('useAthleteFeedback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia o feedback e devolve o realizado atualizado', async () => {
    vi.mocked(AthleteFeedbackService.registrarFeedback).mockResolvedValue(REALIZADO_STUB);

    const { result } = renderHook(() => useAthleteFeedback());
    let devolvido;
    await act(async () => {
      devolvido = await result.current.enviar('r1', { percepcaoEsforco: 6, sensacoes: ['DOR'] });
    });

    expect(AthleteFeedbackService.registrarFeedback).toHaveBeenCalledWith('r1', { percepcaoEsforco: 6, sensacoes: ['DOR'] });
    expect(devolvido).toEqual(REALIZADO_STUB);
    expect(result.current.error).toBeNull();
    expect(result.current.enviando).toBe(false);
  });

  it('popula error na falha e propaga (o caller decide se mantém o form aberto)', async () => {
    vi.mocked(AthleteFeedbackService.registrarFeedback).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useAthleteFeedback());
    await act(async () => {
      await expect(result.current.enviar('r1', { percepcaoEsforco: 6 })).rejects.toThrow('boom');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.enviando).toBe(false);
  });
});
