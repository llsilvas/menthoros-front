import { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import {
  EventOutlined as CalendarIcon,
  EmojiEvents as EmojiEventsIcon,
  EditOutlined as EditIcon,
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { semantic, categorical } from '../../../theme/tokens';
import type { Atleta } from '../../../types/Atleta';
import PlanosDialog from '../../../components/features/planos/planosDialog';
import ProvasDialog from '../../../components/features/provas/ProvasDialog';
import SyncStravaButton from '../../../components/features/strava/SyncStravaButton';

type NivelExperienciaKey = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

const nivelLabels: Record<NivelExperienciaKey, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

const nivelStyles: Record<NivelExperienciaKey, { bg: string; color: string; chipColor: string }> = {
  INICIANTE:    { bg: `${categorical.cat1}26`,        color: categorical.cat1,        chipColor: categorical.cat1 },
  INTERMEDIARIO:{ bg: `${semantic.warning[500]}26`,   color: semantic.warning[300],   chipColor: semantic.warning[500] },
  AVANCADO:     { bg: `${semantic.success[500]}26`,   color: semantic.success[500],   chipColor: semantic.success[500] },
};

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
  if (typeof nivel === 'object' && nivel && 'value' in nivel) {
    const value = (nivel as Record<string, unknown>).value;
    if (typeof value === 'string' && value in nivelLabels) {
      return value as NivelExperienciaKey;
    }
  }
  return 'INICIANTE';
};

const countDiasDisponiveis = (dias: Atleta['diasDisponiveis']): number => {
  if (!Array.isArray(dias)) return 0;
  return dias.length;
};

type AtletaStatus = 'EM_DIA' | 'ATENCAO' | 'SEM_ROTINA';

const calcularStatus = (atleta: Atleta): AtletaStatus => {
  if (atleta.temLesao) return 'ATENCAO';
  if (!atleta.diasDisponiveis || atleta.diasDisponiveis.length === 0) return 'SEM_ROTINA';
  return 'EM_DIA';
};

const statusStyles: Record<AtletaStatus, { bg: string; border: string; badgeBg: string; badgeColor: string; label: string }> = {
  EM_DIA: {
    bg:         `${semantic.success[500]}14`,
    border:      semantic.success[500],
    badgeBg:    `${semantic.success[500]}26`,
    badgeColor:  semantic.success[700],
    label: 'Em Dia',
  },
  ATENCAO: {
    bg:         `${semantic.danger[500]}14`,
    border:      semantic.danger[500],
    badgeBg:    `${semantic.danger[500]}26`,
    badgeColor:  semantic.danger[700],
    label: 'Atenção',
  },
  SEM_ROTINA: {
    bg:         `${categorical.cat1}14`,
    border:      categorical.cat1,
    badgeBg:    `${categorical.cat1}26`,
    badgeColor:  semantic.info[700],
    label: 'Sem Rotina',
  },
};

interface AtletaStatusRowProps {
  atleta: Atleta;
  onEditAtleta?: (atleta: Atleta) => void;
}

export default function AtletaStatusRow({ atleta, onEditAtleta }: AtletaStatusRowProps) {
  const [planosDialogOpen, setPlanosDialogOpen] = useState(false);
  const [provasDialogOpen, setProvasDialogOpen] = useState(false);

  const initials = getInitials(atleta.nome);
  const nivelKey = getExperienceKey(atleta.nivelExperiencia);
  const nivelStyle = nivelStyles[nivelKey];
  const status = calcularStatus(atleta);
  const statusStyle = statusStyles[status];
  const diasCount = countDiasDisponiveis(atleta.diasDisponiveis);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          border: `1px solid rgba(255,255,255,0.15)`,
          borderLeft: `4px solid ${statusStyle.border}`,
          borderRadius: 1,
          bgcolor: statusStyle.bg,
          p: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: statusStyle.bg,
            borderColor: 'rgba(255,255,255,0.25)',
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '44px minmax(0,1fr) auto',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '999px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(nivelStyle.color, 0.2),
              color: nivelStyle.color,
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
            }}
          >
            {initials}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
              }}
            >
              {atleta.nome}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                mt: 0.25,
                display: 'block',
              }}
            >
              {diasCount} dia{diasCount !== 1 ? 's' : ''} disponível{diasCount !== 1 ? 's' : ''} por semana
            </Typography>
          </Box>

          <Chip
            label={statusStyle.label}
            size="small"
            sx={{
              bgcolor: statusStyle.badgeBg,
              color: statusStyle.badgeColor,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Chip
            label={nivelLabels[nivelKey]}
            size="small"
            sx={{
              bgcolor: nivelStyle.bg,
              color: nivelStyle.color,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />

          {atleta.temLesao && (
            <Chip
              label="Lesão"
              size="small"
              sx={{
                bgcolor: `${semantic.danger[500]}33`,
                color: semantic.danger[500],
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenterIcon
              sx={{
                fontSize: 18,
                color: '#D4FF3A',
                opacity: 0.8,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Sincronização Strava
            </Typography>
          </Box>

          <Box sx={{ pl: 3.5 }}>
            <SyncStravaButton
              atletaId={atleta.id}
              connected={true}
            />
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.5,
            pt: 0.5,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setPlanosDialogOpen(true)}
            title="Planos e Treinos"
            sx={{
              width: 32,
              height: 32,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#D4FF3A',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <CalendarIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setProvasDialogOpen(true)}
            title="Provas"
            sx={{
              width: 32,
              height: 32,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#D4FF3A',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {onEditAtleta && (
            <IconButton
              size="small"
              onClick={() => onEditAtleta(atleta)}
              title="Editar"
              sx={{
                width: 32,
                height: 32,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <PlanosDialog
        open={planosDialogOpen}
        onClose={() => setPlanosDialogOpen(false)}
        atletaNome={atleta.nome}
        atletaId={atleta.id}
      />
      <ProvasDialog
        open={provasDialogOpen}
        onClose={() => setProvasDialogOpen(false)}
        atletaNome={atleta.nome}
        atletaId={atleta.id}
      />
    </>
  );
}
