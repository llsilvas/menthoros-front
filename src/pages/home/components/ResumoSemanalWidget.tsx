import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { MetricasService } from '../../../services/MetricasService';
import type { ResumoSemanalTreino } from '../../../types/Metricas';
import { glassAzulSx, glassAzulSxHover, transitions, primary, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';

interface ResumoSemanalWidgetProps {
  atletaId: string;
  atletaNome: string;
}

export default function ResumoSemanalWidget({ atletaId, atletaNome }: ResumoSemanalWidgetProps) {
  const [resumo, setResumo] = useState<ResumoSemanalTreino | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MetricasService.getResumoSemanal(atletaId)
      .then(setResumo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [atletaId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!resumo) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 1,
        ...glassAzulSx,
        '&:hover': glassAzulSxHover,
        transition: transitions.default,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: surface[0],
          mb: 2,
          fontSize: '1rem',
        }}
      >
        Resumo Semanal - {atletaNome}
      </Typography>

      <Stack spacing={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: primary[500],
                mb: 0.5,
              }}
            >
              {resumo.resumo.totalTreinos}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: overlayWhite[70],
                fontSize: '0.75rem',
              }}
            >
              Treinos
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: primary[500],
                mb: 0.5,
              }}
            >
              {resumo.resumo.volumeTotalKm.toFixed(1)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: overlayWhite[70],
                fontSize: '0.75rem',
              }}
            >
              KM
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: primary[500],
                mb: 0.5,
              }}
            >
              {resumo.resumo.tssTotalSemana.toFixed(0)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: overlayWhite[70],
                fontSize: '0.75rem',
              }}
            >
              TSS
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: primary[500],
                mb: 0.5,
              }}
            >
              {Math.round(resumo.resumo.tempoTotalMinutos / 60)}h
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: overlayWhite[70],
                fontSize: '0.75rem',
              }}
            >
              Horas
            </Typography>
          </Box>
        </Box>

        {resumo.resumo.ultimoTreino && (
          <Box sx={{ pt: 1, borderTop: `1px solid ${overlayWhite[10]}` }}>
            <Typography
              variant="caption"
              sx={{
                color: overlayWhite[60],
                fontSize: '0.75rem',
              }}
            >
              Último treino: {resumo.resumo.ultimoTreino}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
