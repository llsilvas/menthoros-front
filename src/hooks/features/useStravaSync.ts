import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/core/ApiError';
import { StravaService } from '../../api/services/StravaService';

interface UseStravasyncState {
  connected: boolean;
  syncing: boolean;
  imported: number;
  error: string | null;
  lastSync: string | null;
}

export const useStravaSync = (atletaId: string) => {
  const [state, setState] = useState<UseStravasyncState>({
    connected: false,
    syncing: false,
    imported: 0,
    error: null,
    lastSync: null,
  });

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    const timer = setInterval(async () => {
      try {
        const status = await StravaService.getSyncStatus(atletaId);
        setState(prev => ({
          ...prev,
          connected: status.connected,
          syncing: status.syncing,
          imported: status.imported,
          error: status.lastError || null,
          lastSync: status.lastSync || null,
        }));

        if (!status.syncing) {
          clearInterval(timer);
          setPollingInterval(null);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setState(prev => ({
            ...prev,
            connected: false,
            syncing: false,
            imported: 0,
            error: null,
            lastSync: null,
          }));
          clearInterval(timer);
          setPollingInterval(null);
          return;
        }

        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erro ao obter status de sincronização',
        }));
      }
    }, 2000);

    setPollingInterval(timer);
  }, [atletaId]);

  const triggerSync = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, syncing: true, error: null }));
      await StravaService.triggerSync(atletaId);
      startPolling();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar sincronização';
      setState(prev => ({
        ...prev,
        syncing: false,
        error: errorMessage,
      }));
    }
  }, [atletaId, startPolling]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await StravaService.getSyncStatus(atletaId);
        setState(prev => ({
          ...prev,
          connected: status.connected,
          syncing: status.syncing,
          imported: status.imported,
          error: status.lastError || null,
          lastSync: status.lastSync || null,
        }));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setState(prev => ({
            ...prev,
            connected: false,
            syncing: false,
            imported: 0,
            error: null,
            lastSync: null,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erro ao obter status de sincronização',
        }));
      }
    };

    void loadStatus();
  }, [atletaId]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    ...state,
    triggerSync,
  };
};
