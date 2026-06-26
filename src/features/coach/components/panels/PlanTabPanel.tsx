import { Box, Button, Typography } from '@mui/material';
import { surface } from '../../../../theme/tokens';
import { CurrentWeekPlan } from '../CurrentWeekPlan';
import { SectionCard } from '../SectionCard';
import type { AtletaPerfilCoachDto } from '../../../../types/AtletaPerfilCoach';

interface PlanTabPanelProps {
  selectedProfile: AtletaPerfilCoachDto | null;
  reloadDashboard: () => void;
  fetchSelectedProfile: () => Promise<void>;
  onOpenRevisao: () => void;
}

export function PlanTabPanel({ selectedProfile, reloadDashboard, fetchSelectedProfile, onOpenRevisao }: PlanTabPanelProps) {
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
    <SectionCard title="Plano do atleta">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5, py: { xs: 1.5, xl: 2.5 } }}>
        <Typography sx={{ fontSize: { xs: '0.85rem', xl: '0.95rem' }, fontWeight: 700, color: surface[50] }}>
          Nenhum plano vigente
        </Typography>
        <Typography sx={{ fontSize: { xs: '0.78rem', xl: '0.85rem' }, color: surface[400], lineHeight: 1.5, maxWidth: 520 }}>
          Este atleta ainda não tem um plano da semana para revisar. Gere ou revise um plano para liberar o
          acompanhamento e as sugestões.
        </Typography>
        <Button variant="contained" size="small" sx={{ textTransform: 'none' }} onClick={onOpenRevisao}>
          Gerar / revisar plano
        </Button>
      </Box>
    </SectionCard>
  );
}
