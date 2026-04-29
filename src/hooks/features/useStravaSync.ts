import { useCallback, useEffect, useState } from 'react';
import { StravaService } from '../../api/services/StravaService';
import type { SyncStatus } from '../../types/Strava';

interface UseStravasyncState {
  syncing: boolean;
  imported: number;
  error: string | null;
  lastSync: string | null;
}

export const useStravaSync = (atletaId: string) => {
  const [state, setState] = useState<UseStravasyncState>({
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
