import { Box, Button, FormControl, MenuItem, Select, Slider, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import { primary, surface } from '../../../../theme/tokens';
import { CurrentWeekPlan } from '../CurrentWeekPlan';
import { DetailMetric } from '../DetailMetric';
import { SectionCard } from '../SectionCard';
import { TrendCard } from '../TrendCard';
import { ACTION_BTN_START_ICON_SX } from '../actionButtonSx';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { AtletaPerfilCoachDto } from '../../../../types/AtletaPerfilCoach';

interface PlanTabPanelProps {
  selectedProfile: AtletaPerfilCoachDto | null;
  selected: CoachAthleteRow;
  draftIntensity: string;
  setDraftIntensity: (value: string) => void;
  draftDistance: number;
  setDraftDistance: (value: number) => void;
  draftDuration: number;
  setDraftDuration: (value: number) => void;
  saveAdjustment: () => void;
  reloadDashboard: () => void;
  fetchSelectedProfile: () => void | Promise<void>;
  onOpenRevisao: () => void;
}

export function PlanTabPanel({
  selectedProfile,
  selected,
  draftIntensity,
  setDraftIntensity,
  draftDistance,
  setDraftDistance,
  draftDuration,
  setDraftDuration,
  saveAdjustment,
  reloadDashboard,
  fetchSelectedProfile,
  onOpenRevisao,
}: PlanTabPanelProps) {
  if (selectedProfile?.planoVigente) {
    return (
      <SectionCard
        title="Plano real do atleta"
        action={
          <Button size="small" sx={{ textTransform: 'none' }} onClick={onOpenRevisao}>
            Abrir revisão
          </Button>
        }
      >
        <CurrentWeekPlan
          plano={selectedProfile.planoVigente}
          onGerarPlano={onOpenRevisao}
          onRevisarPlano={onOpenRevisao}
          onTreinoEditado={() => {
            reloadDashboard();
            void fetchSelectedProfile();
          }}
        />
      </SectionCard>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
      <SectionCard title="Ajuste rápido">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.85, sm: 0.95, lg: 1.05, xl: 2 } }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Intensidade</Typography>
            <FormControl fullWidth size="small">
              <Select value={draftIntensity} onChange={(event) => setDraftIntensity(event.target.value)}>
                <MenuItem value="Geral">Geral</MenuItem>
                <MenuItem value="Z1">Z1</MenuItem>
                <MenuItem value="Z2">Z2</MenuItem>
                <MenuItem value="Z3">Z3</MenuItem>
                <MenuItem value="Z4">Z4</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Distância</Typography>
            <Slider
              value={draftDistance}
              onChange={(_, value) => {
                if (!Array.isArray(value)) setDraftDistance(value);
              }}
              min={8}
              max={34}
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Duração estimada</Typography>
            <Slider
              value={draftDuration}
              onChange={(_, value) => {
                if (!Array.isArray(value)) setDraftDuration(value);
              }}
              min={45}
              max={220}
              step={5}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 0.65 }}>
            <Button size="small" variant="outlined" startIcon={<SwapHorizIcon />} sx={{ ...ACTION_BTN_START_ICON_SX, px: { xs: 0.75, xl: 1.25 } }}>
              Mover
            </Button>
            <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} sx={{ ...ACTION_BTN_START_ICON_SX, px: { xs: 0.75, xl: 1.25 } }}>
              Duplicar
            </Button>
            <Button size="small" variant="outlined" startIcon={<TuneIcon />} sx={{ ...ACTION_BTN_START_ICON_SX, px: { xs: 0.75, xl: 1.25 } }}>
              Substituir
            </Button>
          </Box>

          <Button
            size="small"
            variant="contained"
            onClick={saveAdjustment}
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.74rem', xl: '0.8125rem' },
              bgcolor: primary[500],
              color: surface[900],
              '&:hover': { bgcolor: primary[400] },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </SectionCard>

      <SectionCard title="Impacto da alteração">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
          <DetailMetric label="Carga semanal" value={`${draftDistance * 4} km`} subtitle={`Impacto estimado para ${draftIntensity}`} tone="success" />
          <DetailMetric label="Fadiga projetada" value={draftDistance > 28 ? 'Alta' : draftIntensity === 'Z4' ? 'Média' : 'Baixa'} subtitle="Estimativa visual do ajuste" tone={draftDistance > 28 ? 'warning' : 'neutral'} />
          <DetailMetric label="Recuperação" value={draftDuration > 150 ? '72%' : '84%'} subtitle="Baseado na duração do bloco" tone={draftDuration > 150 ? 'warning' : 'success'} />
          <TrendCard data={selected.loadTrend.map((value, index) => value + (index === selected.loadTrend.length - 1 ? Math.max(-6, Math.min(10, draftDistance - 28)) * 2 : 0))} />
        </Box>
      </SectionCard>
    </Box>
  );
}
