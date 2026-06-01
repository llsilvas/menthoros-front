import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { StravaStatusGlobal } from '../../../types/Metricas';
import { StravaService } from '../../../services/StravaService';
import { glassAzulSx, glassAzulSxHover, transitions, primary } from '../../../theme/tokens';

export default function StravaStatusWidget() {
  const [status, setStatus] = useState<StravaStatusGlobal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StravaService.getStatusGlobal()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (!status) {
    return null;
  }

  const connectionPercentage = Math.round(status.percentualConectado);

  return (
    <Paper
      sx={{
        p: 2.5,
        transition: transitions.default,
        ...glassAzulSx,
        '&:hover': glassAzulSxHover,
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <SyncIcon sx={{ fontSize: 24, color: primary[500] }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              fontSize: '1rem',
            }}
          >
            Integração Strava
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 1,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(52, 192, 100, 0.1)',
                border: '1px solid rgba(52, 192, 100, 0.3)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Conectados
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#34c064',
                  mt: 0.5,
                }}
              >
                {status.atletasConectados}/{status.totalAtletas}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block' }}
              >
                {connectionPercentage}% conectado
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(100, 150, 200, 0.1)',
                border: '1px solid rgba(100, 150, 200, 0.3)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Sincronização
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#a4d9ff',
                  mt: 0.5,
                }}
              >
                Manual
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.25, display: 'block' }}
              >
                Por atleta
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${status.atletasConectados} conectados`}
              size="small"
              sx={{
                bgcolor: 'rgba(52, 192, 100, 0.2)',
                color: '#34c064',
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<InfoIcon />}
              label="Sincronize na aba Atletas"
              size="small"
              sx={{
                bgcolor: 'rgba(52, 152, 219, 0.2)',
                color: '#3498db',
                fontWeight: 500,
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
