import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/core/ApiError';
import { IntervalsIcuService } from '../../api/services/IntervalsIcuService';
import { GarminConnectionService } from '../../api/services/GarminConnectionService';

export type ConnectionPlataforma = 'INTERVALS_ICU' | 'GARMIN';

/** Forma comum aos dois canais; cada adapter traduz o DTO do seu backend. */
export interface ConnectionStatus {
  conectado: boolean;
  externalAthleteId?: string;
  conectadoEm?: string;
  ultimoPush?: string;
  ultimoErro?: string;
  /** Só Garmin: permissões concedidas pelo atleta (D10). */
  workoutImport?: boolean;
  activityExport?: boolean;
  ultimaSincronizacao?: string;
}

interface Adapter {
  nome: string;
  getStatus: () => Promise<ConnectionStatus | null>;
  getAuthorizationUrl: () => Promise<{ authorizationUrl: string }>;
  disconnect: () => Promise<void>;
}

const ADAPTERS: Record<ConnectionPlataforma, Adapter> = {
  INTERVALS_ICU: {
    nome: 'intervals.icu',
    getStatus: () => IntervalsIcuService.getStatus(),
    getAuthorizationUrl: () => IntervalsIcuService.getAuthorizationUrl(),
    disconnect: () => IntervalsIcuService.disconnect(),
  },
  GARMIN: {
    nome: 'Garmin',
    getStatus: async () => {
      const s = await GarminConnectionService.getStatus();
      if (!s) return null;
      return {
        conectado: s.ativo,
        externalAthleteId: s.userId,
        ultimoErro: s.lastSyncError,
        workoutImport: s.workoutImport,
        activityExport: s.activityExport,
        ultimaSincronizacao: s.ultimaSincronizacao,
      };
    },
    getAuthorizationUrl: () => GarminConnectionService.getAuthorizationUrl(),
    disconnect: () => GarminConnectionService.disconnect(),
  },
};

const DESCONECTADO: ConnectionStatus = { conectado: false };

function extrairMensagemErro(err: unknown, fallback: string): string {
  if (err instanceof ApiError && typeof err.body?.message === 'string') {
    return err.body.message;
  }
  return err instanceof Error ? err.message : fallback;
}

export const useConnection = (plataforma: ConnectionPlataforma) => {
  const adapter = ADAPTERS[plataforma];
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await adapter.getStatus());
    } catch (err) {
      setError(extrairMensagemErro(err, `Erro ao buscar status da conexão ${adapter.nome}`));
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  /**
   * Busca a URL de consentimento e leva o browser ao provedor.
   *
   * Não devolve status como a versão de API key devolvia: a conexão não nasce aqui. Ela é criada
   * pelo callback do backend, depois que o atleta autoriza — e o desfecho reaparece nesta tela
   * como `?intervals-icu=…` ou `?garmin=…`.
   *
   * `loading` segue `true` no caminho feliz de propósito: a navegação já foi disparada, e
   * desligar o spinner faria o botão piscar de volta ao normal antes de a página sair.
   */
  const connect = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { authorizationUrl } = await adapter.getAuthorizationUrl();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(extrairMensagemErro(err, `Erro ao iniciar a conexão com ${adapter.nome}`));
      setLoading(false);
    }
  }, [adapter]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await adapter.disconnect();
      setStatus(DESCONECTADO);
    } catch (err) {
      setError(extrairMensagemErro(err, `Erro ao desconectar ${adapter.nome}`));
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, connect, disconnect, refresh };
};
