import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import type { Atleta } from '../../../types/Atleta';
import type { Prova, DistanciaProvaObj } from '../../../types/Prova';
import { DISTANCIA_PROVA_LABELS } from '../../../types/Prova';
import { ProvaService } from '../../../api/services/ProvaService';
import { glassAzulSx, glassAzulSxHover, transitions } from '../../../theme/tokens';

interface ProvaProximasWidgetProps {
  atletas: Atleta[];
}

export default function ProvasProximasWidget({ atletas }: ProvaProximasWidgetProps) {
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProvas = async () => {
      try {
        setLoading(true);
        setError(null);

        const todasAsProvas: Prova[] = [];
        for (const atleta of atletas) {
          try {
            const provasAtleta = await ProvaService.listarProvas(atleta.id);
            if (Array.isArray(provasAtleta)) {
              todasAsProvas.push(...provasAtleta);
            }
          } catch {
            // Ignora erros individuais de atletas
          }
        }

        setProvas(todasAsProvas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar próximas provas');
      } finally {
        setLoading(false);
      }
    };

    if (atletas.length > 0) {
      carregarProvas();
    } else {
      setLoading(false);
    }
  }, [atletas]);

  const provasProximas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return provas
      .filter((prova) => {
        if (!prova.dataProva) return false;
        const dataProva = new Date(prova.dataProva);
        dataProva.setHours(0, 0, 0, 0);
        return dataProva >= hoje && dataProva <= new Date(hoje.getTime() + 14 * 24 * 60 * 60 * 1000);
      })
      .sort((a, b) => new Date(a.dataProva!).getTime() - new Date(b.dataProva!).getTime())
      .slice(0, 5);
  }, [provas]);

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDistanciaLabel = (distancia: Prova['distancia']): string => {
    if (!distancia) return '';
    if (typeof distancia === 'string') {
      return DISTANCIA_PROVA_LABELS[distancia] || distancia;
    }
    if (typeof distancia === 'object' && 'label' in distancia) {
      return (distancia as DistanciaProvaObj).label;
    }
    return '';
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 24, color: '#b1e92d' }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              fontSize: '1rem',
            }}
          >
            Próximas Provas (14 dias)
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={32} />
          </Box>
        ) : provasProximas.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              py: 2,
            }}
          >
            Nenhuma prova agendada nos próximos 14 dias
          </Typography>
        ) : (
          <Stack spacing={1}>
            {provasProximas.map((prova) => (
              <Box
                key={prova.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(243, 156, 18, 0.08)',
                  border: '1px solid rgba(243, 156, 18, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {prova.nomeProva}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.25,
                    }}
                  >
                    <EventIcon sx={{ fontSize: 14, color: '#f39c12' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {formatarData(prova.dataProva!)}
                    </Typography>
                  </Box>
                </Box>

                {prova.distancia && (
                  <Chip
                    label={getDistanciaLabel(prova.distancia)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(243, 156, 18, 0.2)',
                      color: '#f39c12',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
