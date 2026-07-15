import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Link, TextField, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIntervalsIcuConnection } from '../../../hooks/features/useIntervalsIcuConnection';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { primary, surface, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

const INTERVALS_ICU_SETTINGS_URL = 'https://intervals.icu/settings';

function formatDataHora(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return null;
  }
}

export function IntervalsIcuConnectionCard() {
  const { status, loading, error, connect, disconnect } = useIntervalsIcuConnection();
  const [apiKey, setApiKey] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const conectado = status?.conectado ?? false;

  const handleConnect = async () => {
    const ok = await connect(apiKey);
    if (ok) {
      setApiKey('');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setConfirmOpen(false);
  };

  return (
    <Box
      sx={{
        bgcolor: elevation.card,
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon sx={{ color: primary[500], fontSize: 20 }} />
        <Typography sx={{ color: surface[50], fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>
          Conexões — intervals.icu
        </Typography>
      </Box>

      {conectado ? (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography sx={{ color: surface[200], fontSize: '0.9rem' }}>
              Conta conectada: <strong>{status?.externalAthleteId}</strong>
            </Typography>
            {formatDataHora(status?.conectadoEm) && (
              <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                Conectado desde {formatDataHora(status?.conectadoEm)}
              </Typography>
            )}
            {formatDataHora(status?.ultimoPush) && (
              <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                Último push: {formatDataHora(status?.ultimoPush)}
              </Typography>
            )}
          </Box>

          {status?.ultimoErro && (
            <Alert severity="warning" sx={{ bgcolor: `${semantic.warning[500]}1A`, color: surface[100] }}>
              {status.ultimoErro} — gere uma nova key no intervals.icu e reconecte.
            </Alert>
          )}

          <Box>
            <Button
              variant="outlined"
              size="small"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
              sx={{ color: semantic.danger[500], borderColor: semantic.danger[500] }}
            >
              Desconectar
            </Button>
          </Box>

          <ConfirmDialog
            open={confirmOpen}
            title="Desconectar intervals.icu"
            message="Tem certeza que deseja desconectar sua conta intervals.icu? Pushes futuros de treino ficarão inativos."
            confirmLabel="Confirmar"
            severity="danger"
            loading={loading}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleDisconnect}
          />
        </>
      ) : (
        <>
          <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
            Gere sua API key em intervals.icu → Settings → Developer → API Key e cole abaixo para conectar.{' '}
            <Link
              href={INTERVALS_ICU_SETTINGS_URL}
              target="_blank"
              rel="noopener"
              sx={{ color: primary[500] }}
            >
              intervals.icu/settings
            </Link>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ bgcolor: `${semantic.danger[500]}1A`, color: surface[100] }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="API Key"
              type="password"
              size="small"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              sx={{ minWidth: 260 }}
            />
            <Button
              variant="contained"
              disabled={!apiKey || loading}
              onClick={handleConnect}
              sx={{ bgcolor: primary[500], color: elevation.base, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: elevation.base }} /> : 'Conectar'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default IntervalsIcuConnectionCard;
