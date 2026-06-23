import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { ProvaService } from '../../../api/services/ProvaService';
import type { ProvaProxima } from '../../../types/Metricas';
import { glassAzulSx, glassAzulSxHover, transitions, primary } from '../../../theme/tokens';

export default function ProvasProximasWidget() {
  const [provas, setProvas] = useState<ProvaProxima[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProvaService.listarProximas(15)
      .then((response) => setProvas(response.provas))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (provas.length === 0) {
    return (
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 1,
          ...glassAzulSx,
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
          Próximas Provas
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Nenhuma prova nos próximos 15 dias
        </Typography>
      </Paper>
    );
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
        Próximas Provas ({provas.length})
      </Typography>

      <Stack spacing={1.5}>
        {provas.map((prova) => (
          <Box
            key={prova.id}
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: `${primary[500]}0D`,
              borderLeft: `3px solid ${primary[500]}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    mb: 0.5,
                  }}
                >
                  {prova.nomeProva}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {prova.nomeAtleta}
                </Typography>
                {prova.distanciaKm && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {prova.distanciaKm} km
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: primary[500],
                    mb: 0.5,
                  }}
                >
                  {prova.diasFaltando}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.7rem',
                  }}
                >
                  dias
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
