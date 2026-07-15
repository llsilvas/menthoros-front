import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIntervalsIcuConnection } from './useIntervalsIcuConnection';
import { ApiError } from '../../api/core/ApiError';
import type { ApiRequestOptions } from '../../api/core/ApiRequestOptions';
import type { ApiResult } from '../../api/core/ApiResult';
import { IntervalsIcuService } from '../../api/services/IntervalsIcuService';
import type { IntervalsIcuConnectionStatus } from '../../api/services/IntervalsIcuService';

vi.mock('../../api/services/IntervalsIcuService');

const CONECTADO: IntervalsIcuConnectionStatus = {
  conectado: true,
  externalAthleteId: 'i641775',
  conectadoEm: '2026-07-14T12:00:00Z',
};

function apiError(status: number, body: unknown): ApiError {
  return new ApiError(
    { method: 'POST', url: '/api/v1/integracoes/me/intervals-icu' } as ApiRequestOptions,
    { url: '/api/v1/integracoes/me/intervals-icu', ok: false, status, statusText: '', body } as ApiResult,
    'Generic Error',
  );
}

describe('useIntervalsIcuConnection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega status=null sem erro quando o atleta nunca conectou (404)', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);

    const { result } = renderHook(() => useIntervalsIcuConnection());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('connect com sucesso atualiza status.conectado e retorna true', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);
    vi.mocked(IntervalsIcuService.connect).mockResolvedValue(CONECTADO);

    const { result } = renderHook(() => useIntervalsIcuConnection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let retorno: boolean | undefined;
    await act(async () => {
      retorno = await result.current.connect('chave-valida');
    });

    expect(retorno).toBe(true);
    expect(result.current.status?.conectado).toBe(true);
    expect(result.current.error).toBeNull();
    expect(IntervalsIcuService.connect).toHaveBeenCalledWith('chave-valida');
  });

  it('connect com 422 popula error com a mensagem curada do backend e retorna false', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);
    const mensagemCurada = 'API key inválida — verifique em Settings → Developer no intervals.icu';
    vi.mocked(IntervalsIcuService.connect).mockRejectedValue(
      apiError(422, { status: 422, error: 'Unprocessable Entity', message: mensagemCurada }),
    );

    const { result } = renderHook(() => useIntervalsIcuConnection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let retorno: boolean | undefined;
    await act(async () => {
      retorno = await result.current.connect('chave-invalida');
    });

    expect(retorno).toBe(false);
    expect(result.current.error).toBe(mensagemCurada);
    expect(result.current.status).toBeNull();
  });

  it('disconnect zera o status para desconectado', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(CONECTADO);
    vi.mocked(IntervalsIcuService.disconnect).mockResolvedValue(undefined);

    const { result } = renderHook(() => useIntervalsIcuConnection());
    await waitFor(() => expect(result.current.status?.conectado).toBe(true));

    await act(async () => {
      await result.current.disconnect();
    });

    expect(IntervalsIcuService.disconnect).toHaveBeenCalled();
    expect(result.current.status?.conectado).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
