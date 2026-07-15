import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/core/ApiError';
import { IntervalsIcuService } from '../../api/services/IntervalsIcuService';
import type { IntervalsIcuConnectionStatus } from '../../api/services/IntervalsIcuService';

const DESCONECTADO: IntervalsIcuConnectionStatus = { conectado: false };

function extrairMensagemErro(err: unknown, fallback: string): string {
  if (err instanceof ApiError && typeof err.body?.message === 'string') {
    return err.body.message;
  }
  return err instanceof Error ? err.message : fallback;
}

export const useIntervalsIcuConnection = () => {
  const [status, setStatus] = useState<IntervalsIcuConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await IntervalsIcuService.getStatus());
    } catch (err) {
      setError(extrairMensagemErro(err, 'Erro ao buscar status da conexão intervals.icu'));
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async (apiKey: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await IntervalsIcuService.connect(apiKey));
      return true;
    } catch (err) {
      setError(extrairMensagemErro(err, 'Erro ao conectar com intervals.icu'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await IntervalsIcuService.disconnect();
      setStatus(DESCONECTADO);
    } catch (err) {
      setError(extrairMensagemErro(err, 'Erro ao desconectar intervals.icu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, connect, disconnect, refresh };
};
