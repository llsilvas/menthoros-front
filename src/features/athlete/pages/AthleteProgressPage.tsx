import { Box, Typography } from '@mui/material';
import { TrendingUp as ProgressIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec refine-athlete-shell-ux):
//   Tabs: Visão Geral | Forma | Volume | Provas
//   Visão Geral — MetricCards com tooltips (TSS→"Carga", CTL→"Condicionamento", etc.)
//   Forma       — PMCChart (toggle simples/avançado: TSS diário vs CTL/ATL/TSB)
//   Volume      — ZoneDistributionInsight (donut + interpretação qualitativa SQL-driven)
//   Provas      — PRs + próximas provas + simulações baseadas em métricas atuais
export default function AthleteProgressPage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ProgressIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Progresso
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Forma, volume e evolução
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${surface[700]}`, borderRadius: 1 }}>
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — tabs Visão Geral | Forma (PMCChart) | Volume (ZoneDistributionInsight) | Provas
        </Typography>
      </Box>
    </Box>
  );
}
