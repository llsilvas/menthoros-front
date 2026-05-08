import { useEffect, useState } from 'react';
import { Box, CircularProgress, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { MetricasService } from '../../../services/MetricasService';
import type { AdesaoSemanal } from '../../../types/Metricas';
import { glassAzulSx, glassAzulSxHover, transitions } from '../../../theme/tokens';

interface TaxaAdesaoWidgetProps {
  atletaId: string;
  atletaNome: string;
}

export default function TaxaAdesaoWidget({ atletaId, atletaNome }: TaxaAdesaoWidgetProps) {
  const [adesao, setAdesao] = useState<AdesaoSemanal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MetricasService.getAdesaoSemanal(atletaId)
      .then(setAdesao)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [atletaId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!adesao) {
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
          color: '#ffffff',
          mb: 2,
          fontSize: '1rem',
        }}
      >
        Taxa de Adesão - {atletaNome}
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Semana Atual
            </Typography>
            <Typography variant="caption" sx={{ color: '#b1e92d', fontWeight: 700 }}>
              {adesao.semanaAtual.percentualRealizacao.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={adesao.semanaAtual.percentualRealizacao}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(177, 233, 45, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#b1e92d',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              mt: 0.5,
            }}
          >
            {adesao.semanaAtual.treinosRealizados} de {adesao.semanaAtual.treinosPlanejados} treinos
          </Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Média Últimas 4 Semanas
            </Typography>
            <Typography variant="caption" sx={{ color: '#b1e92d', fontWeight: 700 }}>
              {adesao.mediaUltimas4Semanas.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(adesao.mediaUltimas4Semanas, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(177, 233, 45, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#b1e92d',
              },
            }}
          />
        </Box>

        {adesao.ultimas4Semanas.length > 0 && (
          <Stack spacing={1}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                mt: 1,
              }}
            >
              Últimas 4 Semanas
            </Typography>
            {adesao.ultimas4Semanas.map((semana) => (
              <Box key={semana.semana} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    minWidth: 50,
                    fontSize: '0.7rem',
                  }}
                >
                  {semana.semana}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={semana.percentualRealizacao}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(177, 233, 45, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#b1e92d',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b1e92d',
                    minWidth: 40,
                    textAlign: 'right',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {semana.percentualRealizacao.toFixed(0)}%
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
