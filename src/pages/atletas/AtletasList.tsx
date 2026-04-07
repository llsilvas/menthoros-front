import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  EmojiEvents as EmojiEventsIcon,
  EventOutlined as CalendarIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useCrud } from '../../hooks/features/useCrud';
import AtletaDialog from '../../components/features/atleta/AtletaDialog';
import type { Atleta, CreateAtleta, UpdateAtleta } from '../../types/Atleta';
import PlanosDialog from '../../components/features/planos/planosDialog';
import ProvasDialog from '../../components/features/provas/ProvasDialog';

type NivelExperienciaKey = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

const nivelLabels: Record<NivelExperienciaKey, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

const nivelStyles: Record<NivelExperienciaKey, { bg: string; color: string; rowBg: string; rowBorder: string }> = {
  INICIANTE: {
    bg: 'rgba(52, 152, 219, 0.12)',
    color: '#1a5f8a',
    rowBg: 'rgba(52, 152, 219, 0.06)',
    rowBorder: '#3498db',
  },
  INTERMEDIARIO: {
    bg: 'rgba(179, 255, 0, 0.14)',
    color: '#486500',
    rowBg: 'rgba(179, 255, 0, 0.10)',
    rowBorder: '#9fcf21',
  },
  AVANCADO: {
    bg: 'rgba(243, 156, 18, 0.12)',
    color: '#8a5a00',
    rowBg: 'rgba(243, 156, 18, 0.08)',
    rowBorder: '#e0a12b',
  },
};

const diasFormatados = {
  DOMINGO: 'Dom',
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sab',
} as const;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getExperienceKey = (nivel: Atleta['nivelExperiencia']): NivelExperienciaKey => {
  if (typeof nivel === 'string' && nivel in nivelLabels) {
    return nivel as NivelExperienciaKey;
  }

  if (
    nivel &&
    typeof nivel === 'object' &&
    'value' in nivel &&
    typeof nivel.value === 'string' &&
    nivel.value in nivelLabels
  ) {
    return nivel.value as NivelExperienciaKey;
  }

  return 'INICIANTE';
};

const getObjetivoLabel = (objetivo: string) => {
  const normalized = normalizeText(objetivo);

  if (normalized.includes('marat')) return 'Maratona';
  if (normalized.includes('meia')) return 'Meia';
  if (normalized.includes('10k') || normalized.includes('10 km')) return '10K';
  if (normalized.includes('5k') || normalized.includes('5 km')) return '5K';
  if (normalized.includes('trail')) return 'Trail';

  return objetivo || 'Objetivo';
};

const formatDiasDisponiveis = (dias: Atleta['diasDisponiveis']) => {
  if (!Array.isArray(dias) || dias.length === 0) return 'Sem rotina definida';

  return dias
    .map((dia) => {
      if (dia && typeof dia === 'object' && 'short' in dia && typeof dia.short === 'string') {
        return dia.short;
      }

      if (dia && typeof dia === 'object' && 'value' in dia && typeof dia.value === 'string') {
        return diasFormatados[dia.value as keyof typeof diasFormatados] || dia.value;
      }

      return diasFormatados[dia as keyof typeof diasFormatados] || String(dia);
    })
    .join('');
};

const AtletasList: React.FC = () => {
  const {
    atletas,
    loading,
    error,
    selectedAtleta,
    createAtleta,
    updateAtleta,
    deleteAtleta,
    selectAtleta,
    clearError,
  } = useCrud();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [planosDialogOpen, setPlanosDialogOpen] = useState(false);
  const [selectedAtletaForPlanos, setSelectedAtletaForPlanos] = useState<Atleta | null>(null);
  const [provasDialogOpen, setProvasDialogOpen] = useState(false);
  const [selectedAtletaForProvas, setSelectedAtletaForProvas] = useState<Atleta | null>(null);
  const [query, setQuery] = useState('');

  const handleOpenDialog = (atleta?: Atleta) => {
    selectAtleta(atleta || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    selectAtleta(null);
  };

  const handleSave = async (data: CreateAtleta | UpdateAtleta) => {
    if (selectedAtleta) {
      await updateAtleta(selectedAtleta.id, data as UpdateAtleta);
    } else {
      await createAtleta(data as CreateAtleta);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este atleta?')) {
      await deleteAtleta(id);
    }
  };

  const handleViewPlanos = (id: string) => {
    setSelectedAtletaForPlanos(atletas.find((a) => a.id === id) || null);
    setPlanosDialogOpen(true);
  };

  const handleClosePlanosDialog = () => {
    setPlanosDialogOpen(false);
    setSelectedAtletaForPlanos(null);
  };

  const handleViewProvas = (id: string) => {
    setSelectedAtletaForProvas(atletas.find((a) => a.id === id) || null);
    setProvasDialogOpen(true);
  };

  const handleCloseProvasDialog = () => {
    setProvasDialogOpen(false);
    setSelectedAtletaForProvas(null);
  };

  const filteredAtletas = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return atletas;

    return atletas.filter((atleta) => {
      const nivel = nivelLabels[getExperienceKey(atleta.nivelExperiencia)];
      const haystack = [
        atleta.nome,
        atleta.objetivo,
        nivel,
        formatDiasDisponiveis(atleta.diasDisponiveis),
      ]
        .join(' ')
        .toLowerCase();

      return normalizeText(haystack).includes(normalizedQuery);
    });
  }, [atletas, query]);

  return (
    <Box
      sx={{
        minHeight: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          color: 'inherit',
          borderRadius: 1,
          borderColor: '#d1d5db',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1.1 }}
              >
                Atletas
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(232, 234, 237, 0.72)' }}>
                Gerencie cadastro, planos e provas a partir de uma visualização unificada.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="small"
              sx={{
                bgcolor: '#b3ff00',
                color: '#082130',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#c8ff4d',
                },
              }}
            >
              Novo Atleta
            </Button>
          </Box>
        </Box>

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ flex: 1, p: { xs: 1.5, md: 2 } }}>
          <Box
            sx={{
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.7)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)',
              p: { xs: 1.25, md: 1.5 },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.25 }}>
              <TextField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar atleta..."
                size="small"
                sx={{
                  minWidth: { xs: '100%', sm: 280 },
                  '& .MuiInputBase-root': {
                    height: 38,
                    bgcolor: '#fff',
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: '#6b7a8d', mr: 1, fontSize: 18 }} />,
                  },
                }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                <CircularProgress size={44} />
              </Box>
            ) : filteredAtletas.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum atleta encontrado.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredAtletas.map((atleta) => {
                  const initials = getInitials(atleta.nome);
                  const nivelKey = getExperienceKey(atleta.nivelExperiencia);
                  const nivelStyle = nivelStyles[nivelKey];
                  const diasResumo = formatDiasDisponiveis(atleta.diasDisponiveis);
                  const meta = `${getObjetivoLabel(atleta.objetivo)} · ${diasResumo}`;
                  const rowTone = atleta.temLesao
                    ? {
                        bg: 'rgba(231, 76, 60, 0.07)',
                        border: '#d96b5f',
                        chipBg: 'rgba(231, 76, 60, 0.12)',
                        chipColor: '#8a1a1a',
                        label: 'Atenção',
                      }
                    : {
                        bg: nivelStyle.rowBg,
                        border: nivelStyle.rowBorder,
                        chipBg: nivelStyle.bg,
                        chipColor: nivelStyle.color,
                        label: nivelLabels[nivelKey],
                      };

                  return (
                    <Box
                      key={atleta.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '72px minmax(0,1.5fr) 88px 88px 150px 176px' },
                        gap: 1.25,
                        alignItems: 'center',
                        border: '1px solid #dbe3ec',
                        borderLeft: `4px solid ${rowTone.border}`,
                        borderRadius: 1,
                        bgcolor: rowTone.bg,
                        px: { xs: 1.25, md: 1.5 },
                        py: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '999px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha('#0e3147', 0.1),
                          color: '#0e3147',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {initials}
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: '#1a2535' }}>
                          {atleta.nome}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7a8d', mt: 0.25 }}>
                          {meta}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#ed6c02', textAlign: { xs: 'left', md: 'center' } }}>
                          {atleta.pesoKg}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7a8d', display: 'block', textAlign: { xs: 'left', md: 'center' } }}>
                          kg
                        </Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0e3147', textAlign: { xs: 'left', md: 'center' } }}>
                          {atleta.alturaCm}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7a8d', display: 'block', textAlign: { xs: 'left', md: 'center' } }}>
                          cm
                        </Typography>
                      </Box>

                      <Box>
                        <Chip
                          label={rowTone.label}
                          size="small"
                          sx={{
                            bgcolor: rowTone.chipBg,
                            color: rowTone.chipColor,
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.75 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewPlanos(atleta.id)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid #dbe3ec',
                            borderRadius: 1,
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 17, color: '#6b7a8d' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleViewProvas(atleta.id)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid #dbe3ec',
                            borderRadius: 1,
                          }}
                        >
                          <EmojiEventsIcon sx={{ fontSize: 17, color: '#6b7a8d' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(atleta)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid #dbe3ec',
                            borderRadius: 1,
                          }}
                        >
                          <EditIcon sx={{ fontSize: 17, color: '#6b7a8d' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(atleta.id)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid #f1d1d1',
                            borderRadius: 1,
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 17, color: '#c45b5b' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Paper>

      <AtletaDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        atleta={selectedAtleta || undefined}
      />
      <PlanosDialog
        open={planosDialogOpen}
        onClose={handleClosePlanosDialog}
        atletaNome={selectedAtletaForPlanos ? selectedAtletaForPlanos.nome : ''}
        atletaId={selectedAtletaForPlanos ? selectedAtletaForPlanos.id : ''}
      />
      <ProvasDialog
        open={provasDialogOpen}
        onClose={handleCloseProvasDialog}
        atletaNome={selectedAtletaForProvas ? selectedAtletaForProvas.nome : ''}
        atletaId={selectedAtletaForProvas ? selectedAtletaForProvas.id : ''}
      />
    </Box>
  );
};

export default AtletasList;
