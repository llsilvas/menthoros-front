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

  /**
   * Busca a URL de consentimento e leva o browser ao intervals.icu.
   *
   * Não devolve status como a versão de API key devolvia: a conexão não nasce aqui. Ela é criada
   * pelo callback do backend, depois que o atleta autoriza — e o desfecho reaparece nesta tela
   * como `?intervals-icu=success|error`.
   *
   * `loading` segue `true` no caminho feliz de propósito: a navegação já foi disparada, e
   * desligar o spinner faria o botão piscar de volta ao normal antes de a página sair.
   */
  const connect = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { authorizationUrl } = await IntervalsIcuService.getAuthorizationUrl();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(extrairMensagemErro(err, 'Erro ao iniciar a conexão com intervals.icu'));
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
