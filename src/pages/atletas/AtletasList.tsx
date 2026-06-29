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
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useCrud } from '../../hooks/features/useCrud';
import AtletaDialog from '../../components/features/atleta/AtletaDialog';
import type { Atleta, CreateAtleta, UpdateAtleta } from '../../types/Atleta';
import PlanosDialog from '../../components/features/planos/planosDialog';
import ProvasDialog from '../../components/features/provas/ProvasDialog';
import SyncStravaButton from '../../components/features/strava/SyncStravaButton';
import GerarProjecaoDialog from '../../components/features/projecao/GerarProjecaoDialog';
import { primary, surface, semantic, categorical } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';
import { elevation } from '../../shared/design-tokens';

type NivelExperienciaKey = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

const nivelLabels: Record<NivelExperienciaKey, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

const nivelStyles: Record<NivelExperienciaKey, { bg: string; color: string; rowBg: string; rowBorder: string }> = {
  INICIANTE:    { bg: `${categorical.cat1}26`,        color: categorical.cat1,       rowBg: `${categorical.cat1}0F`,       rowBorder: categorical.cat1 },
  INTERMEDIARIO:{ bg: `${semantic.warning[500]}26`,   color: semantic.warning[300],  rowBg: `${semantic.warning[500]}0F`,  rowBorder: semantic.warning[500] },
  AVANCADO:     { bg: `${semantic.success[500]}26`,   color: semantic.success[500],  rowBg: `${semantic.success[500]}0F`,  rowBorder: semantic.success[500] },
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

const readStringProp = (value: unknown, key: 'value' | 'short'): string | null => {
  if (value && typeof value === 'object' && key in value) {
    const prop = (value as Record<string, unknown>)[key];
    return typeof prop === 'string' ? prop : null;
  }
  return null;
};

const getExperienceKey = (nivel: Atleta['nivelExperiencia']): NivelExperienciaKey => {
  if (typeof nivel === 'string' && nivel in nivelLabels) {
    return nivel as NivelExperienciaKey;
  }

  const value = readStringProp(nivel, 'value');
  if (value && value in nivelLabels) {
    return value as NivelExperienciaKey;
  }

  return 'INICIANTE';
};

const formatDiasDisponiveis = (dias: Atleta['diasDisponiveis']) => {
  if (!Array.isArray(dias) || dias.length === 0) return 'Sem rotina definida';

  return dias
    .map((dia) => {
      const shortValue = readStringProp(dia, 'short');
      if (shortValue) {
        return shortValue;
      }

      const value = readStringProp(dia, 'value');
      if (value) {
        return diasFormatados[value as keyof typeof diasFormatados] || value;
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
  const [projecaoDialogOpen, setProjecaoDialogOpen] = useState(false);
  const [selectedAtletaForProjecao, setSelectedAtletaForProjecao] = useState<Atleta | null>(null);
  const [preSelectedProvaId, setPreSelectedProvaId] = useState<string | undefined>(undefined);
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

  const handleGerarProjecao = (id: string) => {
    setSelectedAtletaForProjecao(atletas.find((a) => a.id === id) || null);
    setPreSelectedProvaId(undefined);
    setProjecaoDialogOpen(true);
  };

  const handleGerarProjecaoFromProva = (provaId: string) => {
    setSelectedAtletaForProjecao(selectedAtletaForProvas);
    setPreSelectedProvaId(provaId);
    setProvasDialogOpen(false);
    setProjecaoDialogOpen(true);
  };

  const handleCloseProjecaoDialog = () => {
    setProjecaoDialogOpen(false);
    setSelectedAtletaForProjecao(null);
    setPreSelectedProvaId(undefined);
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
        height: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        background: elevation.base,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          color: 'inherit',
          borderRadius: 1,
          borderColor: overlayWhite[10],
          overflow: 'hidden',
          background: elevation.card,
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            borderBottom: `1px solid ${overlayWhite[8]}`,
            background: elevation.panel,
            color: surface[50],
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1.1, color: surface[50] }}
              >
                Atletas
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: surface[400] }}>
                Gerencie cadastro, planos e provas a partir de uma visualização unificada.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="small"
              sx={{
                bgcolor: primary[500],
                color: surface[900],
                fontWeight: 700,
                '&:hover': {
                  bgcolor: primary[400],
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

        <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1.5, md: 2 } }}>
          <Box
            sx={{
              height: '100%',
              borderRadius: 1,
              border: `1px solid ${overlayWhite[10]}`,
              background: elevation.card,
              p: { xs: 1.25, md: 1.5 },
              overflowY: 'auto',
              overflowX: { xs: 'auto', md: 'visible' },
              WebkitOverflowScrolling: 'touch',
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
                    bgcolor: elevation.panel,
                    color: surface[50],
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: surface[400], mr: 1, fontSize: 18 }} />,
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
              <Stack spacing={0.75} sx={{ maxWidth: 980, mx: 'auto' }}>
                {filteredAtletas.map((atleta) => {
                  const initials = getInitials(atleta.nome);
                  const nivelKey = getExperienceKey(atleta.nivelExperiencia);
                  const nivelStyle = nivelStyles[nivelKey];
                  const rowTone = atleta.temLesao
                    ? {
                        bg:       `${semantic.danger[500]}14`,
                        border:    semantic.danger[500],
                        chipBg:   `${semantic.danger[500]}26`,
                        chipColor: semantic.danger[300],
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        border: `1px solid ${overlayWhite[8]}`,
                        borderLeft: `4px solid ${rowTone.border}`,
                        borderRadius: 1,
                        bgcolor: rowTone.bg,
                        px: { xs: 1, md: 1.25 },
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '42px minmax(0,1fr) auto',
                          gap: 1,
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '999px',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(surface[700], 0.8),
                            color: surface[50],
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {initials}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: surface[50], lineHeight: 1.2 }}>
                            {atleta.nome}
                          </Typography>
                        </Box>

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

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: surface[400] }}>
                          {formatDiasDisponiveis(atleta.diasDisponiveis)}
                        </Typography>
                      </Box>

                      <Box sx={{ py: 0.5 }}>
                        <SyncStravaButton
                          atletaId={atleta.id}
                          connected={true}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 0.75,
                          pt: 0.1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleViewPlanos(atleta.id)}
                          sx={{
                            width: 32, height: 32,
                            border: `1px solid ${overlayWhite[12]}`,
                            borderRadius: 1,
                            bgcolor: overlayWhite[5],
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 17, color: surface[400] }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleViewProvas(atleta.id)}
                          sx={{
                            width: 32, height: 32,
                            border: `1px solid ${overlayWhite[12]}`,
                            borderRadius: 1,
                            bgcolor: overlayWhite[5],
                          }}
                        >
                          <EmojiEventsIcon sx={{ fontSize: 17, color: surface[400] }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Gerar Projeção de Prova"
                          onClick={() => handleGerarProjecao(atleta.id)}
                          sx={{
                            width: 32, height: 32,
                            border: `1px solid ${primary[700]}`,
                            borderRadius: 1,
                            bgcolor: `${primary[500]}14`,
                            '&:hover': { bgcolor: `${primary[500]}26` },
                          }}
                        >
                          <TrendingUpIcon sx={{ fontSize: 17, color: primary[500] }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(atleta)}
                          sx={{
                            width: 32, height: 32,
                            border: `1px solid ${overlayWhite[12]}`,
                            borderRadius: 1,
                            bgcolor: overlayWhite[5],
                          }}
                        >
                          <EditIcon sx={{ fontSize: 17, color: surface[400] }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(atleta.id)}
                          sx={{
                            width: 32, height: 32,
                            border: `1px solid ${semantic.danger[500]}4D`,
                            borderRadius: 1,
                            bgcolor: `${semantic.danger[500]}0D`,
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 17, color: semantic.danger[500] }} />
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
        onGerarProjecao={handleGerarProjecaoFromProva}
      />
      <GerarProjecaoDialog
        open={projecaoDialogOpen}
        onClose={handleCloseProjecaoDialog}
        atletaId={selectedAtletaForProjecao ? selectedAtletaForProjecao.id : ''}
        atletaNome={selectedAtletaForProjecao ? selectedAtletaForProjecao.nome : ''}
        preSelectedProvaId={preSelectedProvaId}
      />
    </Box>
  );
};

export default AtletasList;
