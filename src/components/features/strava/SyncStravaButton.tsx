import React from 'react';
import {
  Button,
  CircularProgress,
  Alert,
  Typography,
  Stack,
} from '@mui/material';
import { useStravaSync } from '../../../hooks/features/useStravaSync';
import { StravaService } from '../../../api/services/StravaService';

interface SyncStravaButtonProps {
  atletaId: string;
  connected: boolean;
  onSyncComplete?: () => void;
}

export default function SyncStravaButton({
  atletaId,
  connected: connectedProp,
  onSyncComplete,
}: SyncStravaButtonProps) {
  const { connected, syncing, imported, error, triggerSync } = useStravaSync(atletaId);
  const [connecting, setConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!syncing && imported > 0 && onSyncComplete) {
      onSyncComplete();
    }
  }, [syncing, imported, onSyncComplete]);

  const isConnected = connectedProp && connected;

  const handleSync = async () => {
    await triggerSync();
  };

  const handleConnect = async () => {
    try {
      setConnectError(null);
      setConnecting(true);
      const response = await StravaService.getAuthorizationUrl(atletaId);
      window.location.href = response.authorizationUrl;
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Erro ao iniciar conexão com Strava');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {!isConnected && (
        <Button
          variant="outlined"
          onClick={handleConnect}
          disabled={connecting}
          size="small"
        >
          {connecting ? 'Conectando...' : 'Conectar Strava'}
        </Button>
      )}

      {syncing && (
        <>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Sincronizando ({imported}/90)...
          </Typography>
        </>
      )}

      {isConnected && (
        <Button
          variant="contained"
          onClick={handleSync}
          disabled={syncing}
          size="small"
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar 90 Dias'}
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ flex: 1, py: 0.5 }}>
          {error}
        </Alert>
      )}

      {connectError && (
        <Alert severity="error" sx={{ flex: 1, py: 0.5 }}>
          {connectError}
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
