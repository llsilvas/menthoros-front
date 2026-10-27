import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConnection } from './useConnection';
import { ApiError } from '../../api/core/ApiError';
import type { ApiRequestOptions } from '../../api/core/ApiRequestOptions';
import type { ApiResult } from '../../api/core/ApiResult';
import { IntervalsIcuService } from '../../api/services/IntervalsIcuService';
import type { IntervalsIcuConnectionStatus } from '../../api/services/IntervalsIcuService';
import { GarminConnectionService } from '../../api/services/GarminConnectionService';

vi.mock('../../api/services/IntervalsIcuService');
vi.mock('../../api/services/GarminConnectionService');

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

// jsdom não implementa navegação: chamar window.location.assign de verdade emite
// "Not implemented: navigation" e não dá como assertar o destino.
const assign = vi.fn();

describe('useConnection(INTERVALS_ICU)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      writable: true,
    });
  });

  it('carrega status=null sem erro quando o atleta nunca conectou (404)', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);

    const { result } = renderHook(() => useConnection('INTERVALS_ICU'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // connect() não cria mais a conexão: busca a URL de consentimento e sai da página. Quem
  // persiste é o callback do backend, depois que o atleta autoriza no provedor.
  it('connect busca a URL de autorização e navega para ela', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);
    vi.mocked(IntervalsIcuService.getAuthorizationUrl).mockResolvedValue({
      authorizationUrl: 'https://intervals.icu/oauth/authorize?client_id=663&state=abc',
    });

    const { result } = renderHook(() => useConnection('INTERVALS_ICU'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.connect();
    });

    expect(assign).toHaveBeenCalledWith(
      'https://intervals.icu/oauth/authorize?client_id=663&state=abc',
    );
    expect(result.current.error).toBeNull();
  });

  it('connect com falha popula error e não navega', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(null);
    const mensagemCurada = 'Usuário autenticado não tem atleta vinculado';
    vi.mocked(IntervalsIcuService.getAuthorizationUrl).mockRejectedValue(
      apiError(404, { status: 404, error: 'Not Found', message: mensagemCurada }),
    );

    const { result } = renderHook(() => useConnection('INTERVALS_ICU'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.connect();
    });

    expect(assign).not.toHaveBeenCalled();
    expect(result.current.error).toBe(mensagemCurada);
    // Falhou antes de sair da página, então o botão precisa voltar a clicável.
    expect(result.current.loading).toBe(false);
  });

  it('disconnect zera o status para desconectado', async () => {
    vi.mocked(IntervalsIcuService.getStatus).mockResolvedValue(CONECTADO);
    vi.mocked(IntervalsIcuService.disconnect).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnection('INTERVALS_ICU'));
    await waitFor(() => expect(result.current.status?.conectado).toBe(true));

    await act(async () => {
      await result.current.disconnect();
    });

    expect(IntervalsIcuService.disconnect).toHaveBeenCalled();
    expect(result.current.status?.conectado).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useConnection(GARMIN)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      writable: true,
    });
  });

  it('traduz o status do Garmin para a forma comum, com permissões', async () => {
    vi.mocked(GarminConnectionService.getStatus).mockResolvedValue({
      ativo: true,
      userId: 'd331…4df8',
      workoutImport: true,
      activityExport: false,
      lastSyncError: 'token revogado',
    });

    const { result } = renderHook(() => useConnection('GARMIN'));
    await waitFor(() => expect(result.current.status?.conectado).toBe(true));

    expect(result.current.status).toMatchObject({
      externalAthleteId: 'd331…4df8',
      workoutImport: true,
      activityExport: false,
      ultimoErro: 'token revogado',
    });
    expect(IntervalsIcuService.getStatus).not.toHaveBeenCalled();
  });

  it('status=null quando o atleta nunca conectou', async () => {
    vi.mocked(GarminConnectionService.getStatus).mockResolvedValue(null);

    const { result } = renderHook(() => useConnection('GARMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('connect navega para a URL de consentimento do Garmin', async () => {
    vi.mocked(GarminConnectionService.getStatus).mockResolvedValue(null);
    vi.mocked(GarminConnectionService.getAuthorizationUrl).mockResolvedValue({
      authorizationUrl: 'https://connect.garmin.com/oauth2Confirm?state=abc',
    });

    const { result } = renderHook(() => useConnection('GARMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.connect();
    });

    expect(assign).toHaveBeenCalledWith('https://connect.garmin.com/oauth2Confirm?state=abc');
  });

  it('connect com canal desligado (503) mostra a mensagem e não navega', async () => {
    vi.mocked(GarminConnectionService.getStatus).mockResolvedValue(null);
    vi.mocked(GarminConnectionService.getAuthorizationUrl).mockRejectedValue(
      apiError(503, { message: 'Canal Garmin indisponível' }),
    );

    const { result } = renderHook(() => useConnection('GARMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.connect();
    });

    expect(assign).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Canal Garmin indisponível');
  });

  it('disconnect chama o DELETE do Garmin e zera o status', async () => {
    vi.mocked(GarminConnectionService.getStatus).mockResolvedValue({
      ativo: true, workoutImport: true, activityExport: true,
    });
    vi.mocked(GarminConnectionService.disconnect).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnection('GARMIN'));
    await waitFor(() => expect(result.current.status?.conectado).toBe(true));
    await act(async () => {
      await result.current.disconnect();
    });

    expect(GarminConnectionService.disconnect).toHaveBeenCalled();
    expect(IntervalsIcuService.disconnect).not.toHaveBeenCalled();
    expect(result.current.status?.conectado).toBe(false);
  });
});
