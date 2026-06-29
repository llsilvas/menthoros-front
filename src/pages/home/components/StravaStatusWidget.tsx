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
import { alpha } from '@mui/material/styles';
import { glassAzulSx, glassAzulSxHover, transitions, primary, surface, semantic } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';

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
              color: surface[0],
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
                bgcolor: alpha(semantic.success[500], 0.1),
                border: `1px solid ${alpha(semantic.success[500], 0.3)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: overlayWhite[70] }}>
                Conectados
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: semantic.success[500],
                  mt: 0.5,
                }}
              >
                {status.atletasConectados}/{status.totalAtletas}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: overlayWhite[60], mt: 0.5, display: 'block' }}
              >
                {connectionPercentage}% conectado
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(semantic.info[500], 0.1),
                border: `1px solid ${alpha(semantic.info[500], 0.3)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: overlayWhite[70] }}>
                Sincronização
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: semantic.info[500],
                  mt: 0.5,
                }}
              >
                Manual
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: overlayWhite[60], mt: 0.25, display: 'block' }}
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
                bgcolor: alpha(semantic.success[500], 0.2),
                color: semantic.success[500],
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<InfoIcon />}
              label="Sincronize na aba Atletas"
              size="small"
              sx={{
                bgcolor: alpha(semantic.info[500], 0.2),
                color: semantic.info[500],
                fontWeight: 500,
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
