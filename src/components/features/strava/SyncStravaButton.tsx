import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Stack,
} from '@mui/material';
import { useStravaSync } from '../../../hooks/features/useStravaSync';

interface SyncStravaButtonProps {
  atletaId: string;
  connected: boolean;
  onSyncComplete?: () => void;
}

export default function SyncStravaButton({
  atletaId,
  connected,
  onSyncComplete,
}: SyncStravaButtonProps) {
  const { syncing, imported, error, triggerSync } = useStravaSync(atletaId);

  React.useEffect(() => {
    if (!syncing && imported > 0 && onSyncComplete) {
      onSyncComplete();
    }
  }, [syncing, imported, onSyncComplete]);

  if (!connected) {
    return null;
  }

  const handleSync = async () => {
    await triggerSync();
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {syncing && (
        <>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Sincronizando ({imported}/90)...
          </Typography>
        </>
      )}

      <Button
        variant="contained"
        onClick={handleSync}
        disabled={syncing}
        size="small"
      >
        {syncing ? 'Sincronizando...' : 'Sincronizar 90 Dias'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ flex: 1, py: 0.5 }}>
          {error}
        </Alert>
      )}

      {!syncing && imported > 0 && (
        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
          ✅ {imported} atividades importadas
        </Typography>
      )}
    </Stack>
  );
}
